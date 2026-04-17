/**
 * Dev-only seed data.
 *
 * Populates a fresh SQLite DB with realistic-looking sample content so the
 * dev server shows meaningful data for every feature (groups, inbox, assignment
 * folders, completed drafts, etc.) without forcing the developer to click
 * through manual setup.
 *
 * All student names, activity titles, and sentence wordings here are
 * fabricated — no real student data is included.
 *
 * Only runs when `existing rows === 0` so it never clobbers an in-progress
 * dev DB.
 */
import {
  addStudent,
  getStudents,
  addGroup,
  getGroups,
  addRecord,
  addAssignmentFolder,
  getAssignmentFolders,
  upsertCompletedRecord,
} from './database';
import { getByteLength } from '@/types';

const SEED_STUDENTS: Array<{ name: string; grade: string; class_name: string; student_no: number }> = [
  { name: '김민준', grade: '1학년', class_name: '1반', student_no: 1 },
  { name: '이서윤', grade: '1학년', class_name: '1반', student_no: 2 },
  { name: '박지호', grade: '1학년', class_name: '1반', student_no: 3 },
  { name: '최예서', grade: '1학년', class_name: '1반', student_no: 4 },
  { name: '정하준', grade: '1학년', class_name: '1반', student_no: 5 },
  { name: '강수아', grade: '1학년', class_name: '1반', student_no: 6 },
  { name: '조유준', grade: '1학년', class_name: '1반', student_no: 7 },
  { name: '윤다은', grade: '1학년', class_name: '1반', student_no: 8 },
  { name: '장건우', grade: '1학년', class_name: '1반', student_no: 9 },
  { name: '임채원', grade: '1학년', class_name: '1반', student_no: 10 },
];

interface SeedGroup {
  name: string;
  parent: string | null;
  byteLimit: number;
}

const SEED_GROUPS: SeedGroup[] = [
  { name: '수학', parent: null, byteLimit: 1500 },
  { name: '미적분', parent: '수학', byteLimit: 500 },
  { name: '대수', parent: '수학', byteLimit: 500 },
  { name: '진로', parent: null, byteLimit: 2100 },
  { name: '행동특성', parent: null, byteLimit: 2100 },
];

interface SeedFolder {
  name: string;
  folder_type: 'assignment' | 'survey';
  groupName: string;
  instructions: string;
}

const SEED_FOLDERS: SeedFolder[] = [
  {
    name: '2학기 미적분 탐구 과제',
    folder_type: 'assignment',
    groupName: '미적분',
    instructions:
      '자신이 선택한 함수 한 가지를 정해, 평균변화율과 순간변화율의 차이를 실생활 사례(또는 자신의 진로와 연결된 주제)로 설명하는 짧은 탐구 보고서를 제출하세요. 제출물에는 함수 정의, 도함수 유도 과정, 변화율의 물리적·실제적 의미 해석이 포함되어야 합니다.',
  },
  {
    name: '진로 설문: 전공 탐색',
    folder_type: 'survey',
    groupName: '진로',
    instructions:
      '관심 있는 전공·진로 분야를 3가지 이내로 적고, 각 분야에 끌린 구체적 계기(수업/책/활동)와 그로 인해 앞으로 해보고 싶은 활동을 자유롭게 서술하세요. 정답은 없으며, 생각이 변화한 과정 자체가 중요합니다.',
  },
];

interface SeedRecord {
  studentIdx: number; // index into SEED_STUDENTS
  groupName: string;
  source: '기록' | '과제' | '설문';
  importance: '높음' | '보통' | '낮음';
  raw_input: string;
  generated_sentence: string;
  folderName?: string;
}

/**
 * IMPORTANT: 이 샘플들은 실제 OpenRouter 호출로 만들어진 게 아니라
 * 수동 작성된 고정 샘플이다. 그래서 raw_input에 **없는** 사실이
 * generated_sentence에 추가되지 않도록 주의해서 적었다 —
 * 실제 프롬프트(SEUNGGIBOO_RULES + convertToFormalSentence)의
 * "입력에 없는 내용 추가 금지" 원칙을 준수하는 관계로 보이도록.
 *
 * 즉 generated_sentence는 raw_input의 **문체 변환·어미 정리·압축** 수준이다.
 * 만약 "뻥튀기된" 결과가 필요한 E2E 테스트를 하고 싶으면 실제 API를 호출하면 된다.
 */
const SEED_RECORDS: SeedRecord[] = [
  {
    studentIdx: 0,
    groupName: '미적분',
    source: '과제',
    importance: '높음',
    raw_input:
      '세포 생장 곡선 분석 활동에서 광학밀도 측정값을 시간에 따른 함수로 나타내고, 평균변화율과 순간변화율의 의미 차이를 자기 말로 설명함. 대수기에서 세포 성장 속도가 어떻게 변하는지 그래프로 보여주며 특정 시점의 순간 성장률을 구하는 문제를 만들어 제출함.',
    generated_sentence:
      '세포 생장 곡선 분석 활동에서 광학밀도 측정값을 시간에 따른 함수로 나타내고 평균변화율과 순간변화율의 의미 차이를 설명함. 대수기의 세포 성장 속도 변화를 그래프로 제시하고 특정 시점의 순간 성장률을 구하는 문제를 직접 설계하여 제출함.',
    folderName: '2학기 미적분 탐구 과제',
  },
  {
    studentIdx: 1,
    groupName: '미적분',
    source: '과제',
    importance: '높음',
    raw_input:
      '서버 오토스케일링에서 순간변화율이 적용되는 사례를 탐구함. 서버 부하량을 시간 함수로 그리고, 순간변화율을 기준으로 서버 자원이 자동으로 늘어나는 원리를 서술함. 특정 시점의 부하 변화율을 계산하는 문제를 설계하고, 서비스 다운을 막는 임계값 설정 원리를 본인 언어로 정리함.',
    generated_sentence:
      '서버 오토스케일링에서 순간변화율이 적용되는 사례를 탐구함. 서버 부하량을 시간에 따른 함수로 표현하고 순간변화율에 따라 자원이 자동 확장되는 원리를 서술함. 특정 시점의 부하 변화율을 계산하는 문제를 설계하고 서비스 다운을 방지하는 임계값 설정 원리를 정리함.',
    folderName: '2학기 미적분 탐구 과제',
  },
  {
    studentIdx: 2,
    groupName: '미적분',
    source: '과제',
    importance: '보통',
    raw_input:
      '역탄젠트 함수를 활용하여 문제를 설계했는데, 주제가 트랜스포머 모델의 특성을 반영하고 싶다고 써둠. 시그모이드 형태 함수에서 순간변화율을 계산하는 문제를 만들어 제출함.',
    generated_sentence:
      '역탄젠트 함수를 활용하여 트랜스포머 모델의 특성을 반영한 문제를 설계함. 시그모이드 형태 함수에서 순간변화율을 계산하는 문제를 제출함.',
    folderName: '2학기 미적분 탐구 과제',
  },
  {
    studentIdx: 3,
    groupName: '대수',
    source: '기록',
    importance: '높음',
    raw_input:
      '함수 일가성 조건이 빠지면 구분구적법의 구간 세분이 일의적으로 정해지지 않아 면적 합이 정의되지 않음을 친구와 반례 만들며 토론함. 탐구 과정을 학습 일지에 단계별로 정리해서 교사에게 제출함.',
    generated_sentence:
      '함수의 일가성 조건이 빠질 때 구분구적법 구간 세분이 일의적으로 정해지지 않아 면적 합이 정의되지 않음을 친구와 반례를 만들며 토론함. 탐구 과정을 학습 일지에 단계별로 정리하여 제출함.',
  },
  {
    studentIdx: 4,
    groupName: '대수',
    source: '기록',
    importance: '보통',
    raw_input:
      '흑체복사 단원에서 온도 상승을 선형 함수로 놓고 에너지 밀도 변화를 시간 함수로 재해석함. 초기에는 다항적으로 증가하다가 이후 지수적으로 감소하는 형태가 나와서 역함수가 존재하지 않는다는 결론을 발표함.',
    generated_sentence:
      '흑체복사 단원에서 온도 상승을 선형 함수로 두어 에너지 밀도 변화를 시간 함수로 재해석함. 초기 다항적 증가 후 지수적 감소 형태가 나타나 역함수가 존재하지 않는다는 결론을 발표함.',
  },
  {
    studentIdx: 0,
    groupName: '대수',
    source: '기록',
    importance: '보통',
    raw_input:
      '나의 함수 소개하기 활동에서 슈테판-볼츠만 함수를 선택함. 흑체 반지름을 변수로 둔 합성함수를 도출하고, 그래프 해석 중 절대온도에 민감함을 확인하려고 변수별 도함수를 직접 구해 옴.',
    generated_sentence:
      '나의 함수 소개하기 활동에서 슈테판-볼츠만 함수를 선택하여 흑체 반지름을 변수로 둔 합성함수를 도출함. 절대온도 민감도를 확인하기 위해 변수별 도함수를 직접 구해 제출함.',
  },
  // 진로 설문 응답 샘플
  {
    studentIdx: 0,
    groupName: '진로',
    source: '설문',
    importance: '높음',
    raw_input:
      '인공지능 연구자가 되고 싶다고 적음. 수업에서 배운 수학 개념이 모델 학습 과정에 어떻게 쓰이는지 평소에도 연결지어 생각한다고 씀. 생명정보학 분야 책을 읽고 독후감을 제출함.',
    generated_sentence:
      '인공지능 연구자를 진로 희망으로 적고, 수업에서 배운 수학 개념이 모델 학습 과정에 쓰이는 방식을 연결지어 생각한다고 서술함. 생명정보학 분야 도서를 읽고 독후감을 제출함.',
    folderName: '진로 설문: 전공 탐색',
  },
  {
    studentIdx: 5,
    groupName: '진로',
    source: '설문',
    importance: '보통',
    raw_input:
      '기후 변화 대응에 관심이 있어서 환경 공학 분야를 적음. 기초 데이터 분석 공부를 혼자 시작했다고 썼고, 공공 데이터를 그래프로 요약한 자료를 첨부함.',
    generated_sentence:
      '기후 변화 대응에 관심을 두고 환경 공학 분야를 진로 탐색 대상으로 서술함. 기초 데이터 분석 공부를 스스로 시작하여 공공 데이터를 그래프로 요약한 자료를 첨부함.',
    folderName: '진로 설문: 전공 탐색',
  },
  // 인박스 (학생·그룹 미지정)
  {
    studentIdx: -1,
    groupName: '',
    source: '기록',
    importance: '보통',
    raw_input:
      '오늘 4반 발표 수업에서 두 명이 브라에스 역설 설명하다가 논의를 주도함. 누군지 기억나면 나중에 학생·그룹 지정하여 기록 정리 필요.',
    generated_sentence:
      '4반 발표 수업에서 두 명이 브라에스 역설 설명을 주도함. 학생·그룹 지정 후 기록 정리 필요.',
  },
  {
    studentIdx: -1,
    groupName: '',
    source: '기록',
    importance: '낮음',
    raw_input:
      '청소 시간에 맡은 구역 외에도 주변을 정리하며 친구들과 협력하는 모습을 보였다고 메모해둠. 나중에 대상 학생 지정 필요.',
    generated_sentence:
      '청소 시간에 맡은 구역 외에도 주변을 정리하며 친구들과 협력하는 모습을 보임. 학생 지정 필요.',
  },
];

interface SeedCompleted {
  studentIdx: number;
  groupName: string;
  text: string;
  status: '미완성' | '완성됨';
}

const SEED_COMPLETED: SeedCompleted[] = [
  {
    studentIdx: 0,
    groupName: '미적분',
    // 위 SEED_RECORDS 중 김민준(studentIdx 0)의 미적분/대수 기록을 근거 범위 안에서
    // 묶어 요약한 형태. 입력에 없는 활동(예: 지수함수 모델링, 광도 공식 정리 등)을
    // 새로 끼워넣지 않는다.
    text: '세포 생장 곡선 분석 활동에서 광학밀도 측정값을 시간 함수로 나타내고 평균변화율과 순간변화율의 의미 차이를 설명함. 나의 함수 소개하기 활동에서 슈테판-볼츠만 함수를 택해 흑체 반지름을 변수로 한 합성함수를 도출하고 변수별 도함수를 직접 구함.',
    status: '미완성',
  },
];

export async function seedDevData(): Promise<void> {
  const existing = await getStudents();
  if (existing.length > 0) return;

  // Students
  const studentIds: number[] = [];
  for (const s of SEED_STUDENTS) {
    const r = await addStudent(s.name, s.grade, s.class_name, s.student_no);
    studentIds.push(r.lastInsertId);
  }

  // Groups (two passes so parents exist first)
  const groupIdByName = new Map<string, number>();
  for (const g of SEED_GROUPS.filter((x) => x.parent === null)) {
    const r = await addGroup(g.name, null, 0, g.byteLimit);
    groupIdByName.set(g.name, r.lastInsertId);
  }
  for (const g of SEED_GROUPS.filter((x) => x.parent !== null)) {
    const parentId = groupIdByName.get(g.parent!);
    const r = await addGroup(g.name, parentId ?? null, 0, g.byteLimit);
    groupIdByName.set(g.name, r.lastInsertId);
  }

  // Assignment folders
  const folderIdByName = new Map<string, number>();
  const folders = await getAssignmentFolders();
  if (folders.length === 0) {
    for (const f of SEED_FOLDERS) {
      const groupId = groupIdByName.get(f.groupName) ?? null;
      const r = await addAssignmentFolder(f.name, null, f.folder_type, groupId, f.instructions);
      folderIdByName.set(f.name, r.lastInsertId);
    }
  }

  // Records
  for (const rec of SEED_RECORDS) {
    const studentId = rec.studentIdx >= 0 ? studentIds[rec.studentIdx] ?? null : null;
    const groupId = rec.groupName ? groupIdByName.get(rec.groupName) ?? null : null;
    const folderId = rec.folderName ? folderIdByName.get(rec.folderName) ?? null : null;
    await addRecord(
      rec.raw_input,
      rec.generated_sentence,
      studentId,
      groupId,
      rec.source,
      rec.importance,
      folderId,
    );
  }

  // Completed drafts
  const groupsAfter = await getGroups();
  for (const c of SEED_COMPLETED) {
    const studentId = studentIds[c.studentIdx];
    const group = groupsAfter.find((g) => g.name === c.groupName);
    if (!studentId || !group) continue;
    await upsertCompletedRecord(
      studentId,
      group.id,
      c.text,
      getByteLength(c.text),
      c.status,
    );
  }
}
