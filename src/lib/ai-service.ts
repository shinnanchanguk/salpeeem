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

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

// ── public API ──

/**
 * Convert a raw classroom observation into a formal 생기부 sentence.
 */
export async function convertToFormalSentence(rawInput: string): Promise<string> {
  const cleaned = stripTags(rawInput);

  const systemPrompt =
    '당신은 한국 중·고등학교 생활기록부 작성 전문가입니다. ' +
    '교사가 수업 중 관찰한 내용을 생활기록부에 적합한 공식적인 문장으로 변환해주세요. ' +
    '오타와 줄임말은 자연스럽게 교정하고, 학생의 긍정적인 면을 부각하되 사실에 기반한 표현을 사용하세요. ' +
    '부정적인 관찰도 성장 가능성과 격려의 관점에서 서술하세요. ' +
    '한 문장에서 세 문장 이내로 작성하세요. 변환된 문장만 출력하세요.';

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
    '당신은 한국 중·고등학교 생활기록부 작성 전문가입니다. ' +
    '아래는 과제에 대한 학생들의 제출물입니다. ' +
    '과제 지시사항과 각 학생의 제출 내용을 바탕으로 생활기록부에 적합한 공식적인 문장을 학생별로 작성해주세요. ' +
    '오타와 줄임말은 자연스럽게 교정하고, 학생의 긍정적인 면을 부각하되 사실에 기반한 표현을 사용하세요. ' +
    '한 문장에서 세 문장 이내로 작성하세요. ' +
    '결과를 반드시 다음 JSON 배열 형식으로만 출력하세요: [{"studentName": "학생1", "sentence": "..."}]';

  const submissionsText = indexMap
    .map((s) => `[${s.id}] ${s.content}`)
    .join('\n');

  const userMessage = `과제 지시사항:\n${instructions}\n\n학생 제출물:\n${submissionsText}`;

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
    '당신은 한국 중·고등학교 생활기록부 작성 전문가입니다. ' +
    '아래는 설문에 대한 학생들의 응답입니다. ' +
    '설문 지시사항과 각 학생의 응답 내용을 바탕으로 생활기록부에 적합한 공식적인 문장을 학생별로 작성해주세요. ' +
    '오타와 줄임말은 자연스럽게 교정하고, 학생의 긍정적인 면을 부각하되 사실에 기반한 표현을 사용하세요. ' +
    '한 문장에서 세 문장 이내로 작성하세요. ' +
    '결과를 반드시 다음 JSON 배열 형식으로만 출력하세요: [{"studentName": "학생1", "sentence": "..."}]';

  const responsesText = indexMap
    .map((s) => `[${s.id}] ${s.response}`)
    .join('\n');

  const userMessage = `설문 지시사항:\n${instructions}\n\n학생 응답:\n${responsesText}`;

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
    `중요도 기준:\n` +
    `- '높음': 반드시 포함하고 강조하세요.\n` +
    `- '보통': 자연스럽게 포함하세요.\n` +
    `- '낮음': 축약하거나 생략할 수 있습니다.\n\n` +
    `바이트 제한: ${byteLimit}바이트 이내 (한글 1자 = 3바이트).\n` +
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
    `현재 초안:\n${currentDraft}\n\n` +
    `바이트 제한: ${byteLimit}바이트 이내 (한글 1자 = 3바이트).\n` +
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
