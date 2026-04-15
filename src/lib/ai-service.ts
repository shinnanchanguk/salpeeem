const DEFAULT_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY ?? '';
const DEFAULT_MODEL =
  import.meta.env.VITE_OPENROUTER_MODEL ?? 'google/gemini-2.5-flash';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

let customApiKey: string | null = null;
let customModel: string | null = null;

function getApiKey(): string {
  return customApiKey ?? DEFAULT_API_KEY;
}

function getModel(): string {
  return customModel ?? DEFAULT_MODEL;
}

/**
 * Override the default API key and model at runtime.
 */
export function setAIConfig(apiKey: string, model: string): void {
  customApiKey = apiKey || null;
  customModel = model || null;
}

// ── internal helpers ──

interface MessageContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContentPart[];
}

async function callOpenRouter(messages: ChatMessage[]): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://salpeem.app',
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      detail = errBody.error?.message ?? JSON.stringify(errBody);
    } catch {
      detail = await res.text();
    }
    throw new Error(`AI 요청 실패 (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error('AI 응답에서 유효한 텍스트를 받지 못했습니다.');
  }
  return content.trim();
}

function stripTags(input: string): string {
  return input.replace(/@\S+/g, '').replace(/\/\S+/g, '').trim();
}

// ── 공통 생기부 기재 규칙 ──

const SEUNGGIBOO_RULES = `
## 어미 규칙 (필수)
- 모든 문장은 명사형 어미로 종결: ~함, ~음, ~임, ~됨, ~봄
- 모든 문장은 반드시 마침표(.)로 끝남
- 금지 어미: ~했어요, ~했습니다, ~했다, ~했음, ~다, ~요, ~시킴, ~보여줌

## 금지 표현 (관찰 불가능 표현) — 절대 준수
교사가 직접 관찰할 수 없는 내면 상태 표현은 절대 사용하지 않습니다.
아래 단어가 문장에 포함되면 무조건 대체 표현으로 바꾸세요: 이해, 인식, 깨달, 느끼, 자신감, 함양, 배움
| 금지 | 대체 |
|------|------|
| 이해함, 이해하였음, 이해를 보여줌 | 분석함, 설명함, 정리하여 발표함 |
| 인식함, 인식하고, 인식하여 | 확인함, 분석함, 정리함 |
| 파악함 | 분석하여 발표함, 보고서로 정리함 |
| 학습함 | 조사하여 발표함, 정리함 |
| 깨달음 | 분석함, 정리하여 제시함, 발견함 |
| 알게 됨 | 조사하여 정리함, 확인함 |
| 함양함 | 발휘함, 보임 |
| 넓힘 | 확장함, 탐구함, 사고력을 보임 |
| 배움 | ~태도를 보임 |
| 느낌 | 표현함, 발표함 |
| 자신감을 얻음, 자신감을 가지고, 자신감을 형성함 | 적극적인 참여 태도를 보임, 적극적으로 활동에 임함 |
| 흥미를 가짐 | 적극적으로 탐구함 |
| 호기심을 발휘함 | 사례를 조사함, 탐구함 |
| 공감함, 성찰함 | 토의함, 발표함, 질문함 |
맥락 없는 "적극적 참여", "탐구 자세", "사고력" 등 추상적 역량 나열도 금지합니다.

## 구어체·학생 이름 처리
- 구어체 감탄사 제거: 엄청, 진짜, 꽤, 좀, 완전, 되게 등 → 삭제
- 학생 이름이 포함되어 있으면 제거 (이미 시스템에서 학생과 연결됨)
- "다율이가 ~함" → "~함", "민수가 ~했다" → "~함"

## 영어 사용 지양
- 브랜드명(ChatGPT, AWS, Google, YouTube 등) → 반드시 삭제 또는 일반 명칭으로 대체
- 영어 약어(LLM, OD600, AI 등) → 한글 풀어쓰기 (대규모 언어 모델, 광학밀도, 인공지능)
- 절대 금지: 한글 뒤에 괄호로 영문 약어 병기 (❌ "대규모 언어 모델(LLM)" → ✅ "대규모 언어 모델")
- Python → 프로그래밍 언어, TensorFlow/PyTorch → 기계학습 프레임워크, Excel → 스프레드시트
- 외래어로 굳어진 표현(데이터, 알고리즘, 프로젝트 등)은 한글 표기 사용
- 학술 고유명사(트랜스포머, 시그모이드) → 한글 음차 허용

## 부정적 표현 변환
부정적 표현은 조건부 기대로 순화합니다.
- "부족함" → "~한다면 더 발전할 것으로 기대됨"
- "협력적이지 못했음" → "협력하는 자세를 기른다면 더욱 발전할 것으로 기대됨"
- "발표를 못함" → "발표에 적극적으로 참여한다면 더욱 성장할 것으로 기대됨"

## 기재 금지 내용
- 공인어학시험(TOEIC, TOEFL 등) 참여·성적
- 교내/외 인증시험, 자격증(자격증 항목 외 기재 불가)
- 모의고사·전국연합학력평가 성적
- 논문 투고/학회 발표, 도서 출간
- 특허·실용신안 등 지식재산권
- 해외연수/해외봉사 등 해외활동 실적
- 장학금/장학생 관련 내용
- 부모 직업·직위 등 사회·경제적 지위 암시
- 학교명·축제명·학교 별칭 등 학교 특정 정보
- 방과후학교 활동
- 교외 기관·단체 수상(표창, 감사장, 공로상 등)
- 사교육 관련 내용, 구체적 기관명(학원, 외부 기관)

## 문장 구조 패턴
[활동/맥락] → [구체적 탐구/행동] → [발견/분석] → [역량 표현]
역량 표현 시 구체적 분야를 명시합니다.
- 좋은 예: "수학과 생명과학의 융합적 사고력을 발휘함"
- 나쁜 예: "융합적 사고력을 발휘함" (분야 없음)

## 활동명 표기
- 따옴표 사용 금지 (❌ "OO 활동"에서 → ✅ OO 활동에서)
- 자연스러운 조사 연결

## 핵심 원칙
- 교사가 직접 관찰할 수 있는 행동만 기술 (학생 내면 상태 배제)
- 제공된 데이터에 있는 사실만 서술, 지어내거나 추측하여 추가하지 않음
- 학생 작성물을 그대로 가져오지 않고, 교사 관찰·평가 근거로 재서술
- 과장·과해석 절대 금지, 증빙 범위 내 서술
- 응답 끝에 "(총 XXX bytes)" 같은 바이트 수 표기를 절대 포함하지 않음. 순수 생기부 문장만 출력

## 바이트 초과 시 압축 전략 (순서대로 적용)
1. 불필요한 수식어 제거: "직접 창작함"→"창작함", "적극적으로 참여하여"→"참여하여"
2. 조사·어미 축약: "~에서는"→"~에서", "~하였으며"→"~하며"
3. 유사 표현 통합: "교과 융합 역량과 의사소통 역량을 발휘함"→"교과 융합 및 의사소통 역량을 발휘함"
4. 명사구 간결화: "정보 교과에 대한 역량을 바탕으로"→"정보 역량을 바탕으로"
5. 복수 표현 단수화: "학생들"→"학생", "어르신들"→"어르신"
6. 활동 통합 또는 낮은 중요도 활동 축약

## Few-shot 예시

### 예시 1: 교통 시뮬레이션 (620B)
교통 시뮬레이션을 주제로 한 연구 초안과 계획을 발표함. 공공 데이터를 수집·분석해 도로 링크 데이터셋을 구축, 길이·속도 기반 가중치 모델로 누락 교통량을 추정함. 해외 사례를 참고해 세대수-교통량 함수를 산정, 브라에스 역설 함수를 직접 유도해 초기 변수 설계 근거를 마련하며 도로 확장이 오히려 효율을 떨어뜨릴 수도 있다는 논의를 주도함. 객관적 자료와 수치를 공유해 팀 합의를 이끌며 발표 초안을 작성해 전문성·창의성·공동체 기여 역량을 입증함.

### 예시 2: 구분구적법·흑체복사 (622B)
함수 정의에서 일가성 조건이 빠질 때 구분구적법 구간 세분 과정이 일의적으로 정해지지 않아 면적 합이 정의되지 않는 문제를 친구와 반례 분석·토론으로 검증하고, 탐구 전 과정을 학습 일지에 체계적으로 기록해 논리적 비판 사고와 자기주도 학습 태도를 보임. 온도 상승을 선형 함수로 두어 흑체 복사 에너지 밀도 변화를 시간 함수로 재해석, 초기 다항적 증가 후 지수적 감소가 나타나 역함수가 부재함을 설득력 있게 논증하며 물리·수학 융합적 사고력을 발휘함.

### 예시 3: 슈테판-볼츠만 (501B)
나의 함수 소개하기 활동에서 슈테판-볼츠만 함수를 선택해 흑체 반지름을 합성한 합성함수를 도출함. 그래프 해석 중 절대온도 민감도를 확인하기 위해 직접 변수별 도함수를 구함. 광도 공식의 물리적 의미를 교사에게 질문하고 동료들과 토의하며 수리·과학 융합 통찰을 확장함. 발표 이후 에너지 보존 관점 심화 자료를 조사해 친구들과 질의-응답형 멘토링을 운영함.

### 예시 4: 세포 생장 곡선 (487B)
세포 생장 곡선 분석 활동에서 광학밀도 측정값을 시간에 따른 함수로 나타내고 평균변화율과 순간변화율의 의미 차이를 탐구함. 대수기에서의 세포 성장 속도를 지수함수로 모델링하고 특정 시점에서의 순간 성장률을 구하는 문제를 설계함. 증감표를 활용해 함수의 개형을 파악하는 것이 문제 해결에 중요함을 설명하며 수학과 생명과학의 융합적 사고력을 발휘함.

### 예시 5: 서버 오토스케일링 (489B)
서버 시스템의 오토스케일링에서 순간변화율이 적용되는 사례를 탐구함. 서버 부하량을 시간에 따른 함수로 나타내고 순간변화율을 기준으로 서버 자원을 자동 조절하는 원리를 분석함. 특정 시점에서의 부하 변화율을 계산하는 문제를 설계하고 서비스 다운을 방지하는 임계값 설정 원리를 설명하며 수학 개념이 정보통신 기술에 적용되는 사례를 구체적으로 정리함.

### 예시 6: 생성형 인공지능 (453B)
생성형 인공지능의 작동 원리에서 순간변화율의 의미를 탐구함. 대규모 언어 모델의 학습 과정에서 손실 함수의 변화율이 가중치 조정에 활용됨을 분석하고, 시그모이드 형태의 함수에서 순간변화율을 계산하는 문제를 설계함. 역탄젠트 함수를 활용해 트랜스포머 모델의 특성을 반영하며 인공지능 기술의 수학적 기반을 구체적으로 분석함.
`.trim();

// ── public API ──

/**
 * Convert a raw classroom observation into a formal 생기부 sentence.
 */
export async function convertToFormalSentence(rawInput: string): Promise<string> {
  const cleaned = stripTags(rawInput);

  const systemPrompt =
    '당신은 한국 중·고등학교 생활기록부 작성 전문가입니다. ' +
    '교사가 수업 중 관찰한 내용을 생활기록부에 적합한 공식적인 문장으로 변환해주세요.\n\n' +
    SEUNGGIBOO_RULES + '\n\n' +
    '## 변환 예시 (before → after)\n' +
    '- "다율이가 OD600으로 성장곡선 분석하면서 순간변화율이랑 평균변화율 차이를 엄청 잘 설명했음" → "세포 생장 곡선 분석 활동에서 광학밀도 측정값을 시간에 따른 함수로 나타내고 평균변화율과 순간변화율의 의미 차이를 분석하여 설명함."\n' +
    '- "대원이 AWS 서버 스케일링 문제 만들었는데 꽤 괜찮았어요" → "서버 시스템의 오토스케일링에서 순간변화율이 적용되는 사례를 탐구하고 문제를 설계함."\n' +
    '- "준희가 chatgpt transformer 관련해서 arctan 활용한 문제 냄" → "생성형 인공지능의 작동 원리에서 역탄젠트 함수를 활용하여 트랜스포머 모델의 특성을 반영한 문제를 설계함."\n' +
    '- "수업시간에 발표를 잘 못하고 소극적이었음" → "발표에 적극적으로 참여한다면 더욱 성장할 것으로 기대됨."\n\n' +
    '## 추가 지침\n' +
    '- 오타와 줄임말은 자연스럽게 교정합니다.\n' +
    '- 학생의 긍정적인 면을 부각하되 사실에 기반한 표현을 사용하세요.\n' +
    '- 한 문장에서 세 문장 이내로 작성하세요.\n' +
    '- 변환된 문장만 출력하세요.';

  const result = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: cleaned },
  ]);

  return result;
}

/**
 * Generate formal 생기부 sentences for assignment submissions.
 * Student names are replaced with generic identifiers before sending to AI.
 */
export async function generateAssignmentSentences(
  instructions: string,
  studentSubmissions: Array<{ studentName: string; content: string }>,
): Promise<Array<{ studentName: string; sentence: string }>> {
  const indexMap = studentSubmissions.map((s, i) => ({
    id: `학생${i + 1}`,
    originalName: s.studentName,
    content: s.content,
  }));

  const systemPrompt =
    '당신은 한국 중·고등학교 생활기록부 작성 전문가입니다.\n\n' +
    '## 핵심 원칙\n' +
    '1. 먼저 "과제 안내사항"을 꼼꼼히 읽고, 이 과제의 목적·주제·맥락을 정확히 파악하세요.\n' +
    '2. 각 학생의 제출물을 과제 안내사항의 맥락 안에서 해석하세요. 단순 요약이 아니라, 해당 과제에서 학생이 보여준 역량·태도·성취를 서술해야 합니다.\n' +
    '3. 과제 주제와 연결하여 학생의 구체적인 활동 내용과 그 의미를 생활기록부에 적합한 공식적 문장으로 작성하세요.\n' +
    '4. 학생 제출물을 그대로 가져오지 말고, 교사 관찰·평가 근거로 재서술하세요.\n\n' +
    SEUNGGIBOO_RULES + '\n\n' +
    '## 추가 지침\n' +
    '- 오타와 줄임말은 자연스럽게 교정합니다.\n' +
    '- 학생의 긍정적인 면을 부각하되, 사실에 기반한 표현을 사용합니다.\n' +
    '- 한 문장에서 세 문장 이내로 작성합니다.\n' +
    '- 결과를 반드시 다음 JSON 배열 형식으로만 출력하세요: [{"studentName": "학생1", "sentence": "..."}]';

  const submissionsText = indexMap
    .map((s) => `[${s.id}] ${s.content}`)
    .join('\n');

  const userMessage =
    `## 과제 안내사항 (이 맥락을 반드시 반영하세요)\n${instructions}\n\n` +
    `## 학생 제출물\n${submissionsText}`;

  const raw = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  const parsed = parseJsonArray<{ studentName: string; sentence: string }>(raw);

  return parsed.map((item) => {
    const mapped = indexMap.find((m) => m.id === item.studentName);
    return {
      studentName: mapped ? mapped.originalName : item.studentName,
      sentence: item.sentence,
    };
  });
}

/**
 * Generate formal 생기부 sentences for survey responses.
 * Student names are replaced with generic identifiers before sending to AI.
 */
export async function generateSurveySentences(
  instructions: string,
  studentResponses: Array<{ studentName: string; response: string }>,
): Promise<Array<{ studentName: string; sentence: string }>> {
  const indexMap = studentResponses.map((s, i) => ({
    id: `학생${i + 1}`,
    originalName: s.studentName,
    response: s.response,
  }));

  const systemPrompt =
    '당신은 한국 중·고등학교 생활기록부 작성 전문가입니다.\n\n' +
    '## 핵심 원칙\n' +
    '1. 먼저 "설문 안내사항"을 꼼꼼히 읽고, 이 설문의 목적·주제·맥락을 정확히 파악하세요.\n' +
    '2. 각 학생의 응답을 설문 안내사항의 맥락 안에서 해석하세요. 단순 요약이 아니라, 해당 설문에서 학생이 보여준 생각·태도·성찰을 서술해야 합니다.\n' +
    '3. 설문 주제와 연결하여 학생의 구체적인 응답 내용과 그 의미를 생활기록부에 적합한 공식적 문장으로 작성하세요.\n' +
    '4. 학생 응답을 그대로 옮기지 말고, 교사 관찰·평가 시점에서 재서술하세요.\n\n' +
    SEUNGGIBOO_RULES + '\n\n' +
    '## 추가 지침\n' +
    '- 오타와 줄임말은 자연스럽게 교정합니다.\n' +
    '- 학생의 긍정적인 면을 부각하되, 사실에 기반한 표현을 사용합니다.\n' +
    '- 한 문장에서 세 문장 이내로 작성합니다.\n' +
    '- 결과를 반드시 다음 JSON 배열 형식으로만 출력하세요: [{"studentName": "학생1", "sentence": "..."}]';

  const responsesText = indexMap
    .map((s) => `[${s.id}] ${s.response}`)
    .join('\n');

  const userMessage =
    `## 설문 안내사항 (이 맥락을 반드시 반영하세요)\n${instructions}\n\n` +
    `## 학생 응답\n${responsesText}`;

  const raw = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  const parsed = parseJsonArray<{ studentName: string; sentence: string }>(raw);

  return parsed.map((item) => {
    const mapped = indexMap.find((m) => m.id === item.studentName);
    return {
      studentName: mapped ? mapped.originalName : item.studentName,
      sentence: item.sentence,
    };
  });
}

/**
 * Generate a complete area draft from accumulated sentences for a student.
 */
export async function generateAreaDraft(
  _studentName: string,
  areaName: string,
  sentences: Array<{ content: string; importance: string; source: string }>,
  byteLimit: number,
): Promise<string> {
  const sentencesText = sentences
    .map(
      (s) =>
        `- [중요도: ${s.importance}, 출처: ${s.source}] ${s.content}`,
    )
    .join('\n');

  const systemPrompt =
    `당신은 한국 중·고등학교 생활기록부 작성 전문가입니다. ` +
    `해당 학생의 "${areaName}" 영역에 대한 생활기록부 문단을 작성해주세요. ` +
    `아래 수집된 문장들을 종합하여 하나의 완성된 문단으로 작성합니다.\n\n` +
    SEUNGGIBOO_RULES + `\n\n` +
    `## 중요도 기준\n` +
    `- '높음': 반드시 포함하고 강조하세요.\n` +
    `- '보통': 자연스럽게 포함하세요.\n` +
    `- '낮음': 축약하거나 생략할 수 있습니다.\n\n` +
    `## 바이트 제한 (절대 준수)\n` +
    `- 상한: ${byteLimit}바이트 (한글 1자 = 3바이트, 영문/숫자/공백 = 1바이트)\n` +
    `- 목표: 상한의 80~100% 범위 (${Math.floor(byteLimit * 0.8)}~${byteLimit}B)\n` +
    `- 상한을 초과하면 안 됩니다. 수식어를 줄이고, 유사 표현을 통합하여 바이트 제한 내에서 작성하세요.\n\n` +
    `## 데이터 부족 시 처리\n` +
    `- 수집된 문장이 적더라도 반드시 해당 내용을 바탕으로 문단을 작성합니다.\n` +
    `- "데이터가 부족합니다" 등의 거부 메시지를 절대 출력하지 않습니다.\n\n` +
    `## 품질 체크리스트\n` +
    `1. 바이트 제한을 준수하는가?\n` +
    `2. 마침표(.)로 끝나는가?\n` +
    `3. 관찰 불가능한 표현이 없는가?\n` +
    `4. 영어 표현이 한글로 변환되었는가?\n` +
    `5. 학생의 실제 활동 내용만 반영되었는가?\n` +
    `6. 지어낸 내용이 없는가?\n` +
    `7. 명사형 어미로 종결되는가?\n` +
    `8. 역량 표현에 구체적 분야가 명시되었는가?\n` +
    `9. 맥락 없는 패딩 문장이 없는가?\n` +
    `10. 기재 금지 항목이 포함되지 않았는가?\n\n` +
    `완성된 문단만 출력하세요.`;

  const userMessage = `수집된 문장들:\n${sentencesText}`;

  const result = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  return result;
}

/**
 * Refine an existing draft via a chat-style conversation.
 */
export async function refineDraft(
  _studentName: string,
  areaName: string,
  currentDraft: string,
  chatHistory: Array<{ role: string; text: string }>,
  userRequest: string,
  byteLimit: number,
): Promise<string> {
  const systemPrompt =
    `당신은 한국 중·고등학교 생활기록부 작성 전문가입니다. ` +
    `해당 학생의 "${areaName}" 영역 생활기록부를 수정하고 있습니다.\n\n` +
    SEUNGGIBOO_RULES + `\n\n` +
    `## 현재 초안\n${currentDraft}\n\n` +
    `## 바이트 제한 (절대 준수)\n` +
    `- 상한: ${byteLimit}바이트 (한글 1자 = 3바이트, 영문/숫자/공백 = 1바이트)\n` +
    `- 목표: 상한의 80~100% 범위 (${Math.floor(byteLimit * 0.8)}~${byteLimit}B)\n` +
    `- 상한을 초과하면 안 됩니다.\n\n` +
    `사용자의 요청에 따라 초안을 수정하고, 수정된 문단만 출력하세요.`;

  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  for (const msg of chatHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  }

  messages.push({ role: 'user', content: userRequest });

  const result = await callOpenRouter(messages);
  return result;
}

/**
 * Extract text from images using Vision API (multimodal).
 * Sends images to Gemini Vision and returns structured markdown text.
 */
export async function extractTextFromImages(
  imageDataUrls: string[],
  instructions?: string,
): Promise<string> {
  const systemPrompt =
    '당신은 문서 텍스트 추출 전문가입니다. ' +
    '이미지에서 모든 텍스트를 정확히 추출하여 마크다운 형식으로 출력하세요. ' +
    '수학 공식은 LaTeX로 변환하고, 표는 마크다운 테이블로 변환하세요. ' +
    '불확실한 글자는 [?]로 표시하세요. ' +
    '추출된 텍스트만 출력하세요.';

  const contentParts: MessageContentPart[] = [];

  if (instructions) {
    contentParts.push({ type: 'text', text: instructions });
  }

  contentParts.push({
    type: 'text',
    text: '아래 이미지에서 모든 텍스트, 수식, 표를 추출해주세요.',
  });

  for (const dataUrl of imageDataUrls) {
    contentParts.push({
      type: 'image_url',
      image_url: { url: dataUrl },
    });
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: contentParts },
  ];

  return await callOpenRouter(messages);
}

// ── JSON parsing helper ──

function parseJsonArray<T>(raw: string): T[] {
  // The model may wrap JSON in a markdown code block; strip it.
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error('AI 응답이 JSON 배열 형식이 아닙니다.');
    }
    return parsed as T[];
  } catch (e) {
    throw new Error(
      `AI 응답을 JSON으로 파싱할 수 없습니다: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
