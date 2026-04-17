/**
 * Dev-only seed data.
 *
 * Populates a fresh SQLite DB with realistic-looking sample content so the
 * dev server shows meaningful data for every feature (groups, inbox, assignment
 * folders, completed drafts, etc.) without forcing the developer to click
 * through manual setup.
 *
 * Modeled after real classroom artifacts from the original `last` project
 * (`/mnt/c/Users/창욱/Desktop/code/last/`) — student names, activity titles,
 * sentence wordings — but PII-scrubbed: every student name here is fictional.
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

const SEED_RECORDS: SeedRecord[] = [
  // Inbox (student_id 지정 + group null) — 미분류 샘플
  // 실제로는 group 지정된 것부터 시작해 인박스가 적게 보이도록.
  {
    studentIdx: 0,
    groupName: '미적분',
    source: '기록',
    importance: '높음',
    raw_input: '세포 생장 곡선 분석 활동에서 광학밀도랑 시간 함수로 평균변화율이랑 순간변화율 차이 엄청 잘 설명함',
    generated_sentence:
      '세포 생장 곡선 분석 활동에서 광학밀도 측정값을 시간에 따른 함수로 나타내고 평균변화율과 순간변화율의 의미 차이를 분석하여 설명함. 대수기에서의 세포 성장 속도를 지수함수로 모델링하고 특정 시점에서의 순간 성장률을 구하는 문제를 설계하여 수학과 생명과학의 융합적 사고력을 발휘함.',
    folderName: '2학기 미적분 탐구 과제',
  },
  {
    studentIdx: 1,
    groupName: '미적분',
    source: '과제',
    importance: '높음',
    raw_input: '서버 오토스케일링 예시로 순간변화율 적용. 임계값 설정 원리까지 잘 정리.',
    generated_sentence:
      '서버 시스템의 오토스케일링에서 순간변화율이 적용되는 사례를 탐구함. 서버 부하량을 시간에 따른 함수로 나타내고 순간변화율을 기준으로 서버 자원을 자동 조절하는 원리를 분석함. 특정 시점에서의 부하 변화율을 계산하는 문제를 설계하고 서비스 다운을 방지하는 임계값 설정 원리를 구체적으로 정리함.',
    folderName: '2학기 미적분 탐구 과제',
  },
  {
    studentIdx: 2,
    groupName: '미적분',
    source: '과제',
    importance: '보통',
    raw_input: 'arctan 쓴 문제 설계. 트랜스포머 관련 주제로 연결',
    generated_sentence:
      '생성형 인공지능의 작동 원리에서 역탄젠트 함수를 활용하여 트랜스포머 모델의 특성을 반영한 문제를 설계함. 대규모 언어 모델의 학습 과정에서 손실 함수의 변화율이 가중치 조정에 활용됨을 분석하고, 시그모이드 형태의 함수에서 순간변화율을 계산하는 문제를 설계하여 인공지능 기술의 수학적 기반을 구체적으로 정리함.',
    folderName: '2학기 미적분 탐구 과제',
  },
  {
    studentIdx: 3,
    groupName: '대수',
    source: '기록',
    importance: '높음',
    raw_input: '함수 일가성 반례 토론. 구분구적법 구간 세분 문제까지 끌고감',
    generated_sentence:
      '함수 정의에서 일가성 조건이 빠질 때 구분구적법 구간 세분 과정이 일의적으로 정해지지 않아 면적 합이 정의되지 않는 문제를 친구와 반례 분석·토론으로 검증하고, 탐구 전 과정을 학습 일지에 체계적으로 정리하여 논리적 비판 사고와 자기주도 학습 태도를 보임.',
  },
  {
    studentIdx: 4,
    groupName: '대수',
    source: '기록',
    importance: '보통',
    raw_input: '흑체복사 에너지 밀도 변화를 시간 함수로 재해석함',
    generated_sentence:
      '온도 상승을 선형 함수로 두어 흑체 복사 에너지 밀도 변화를 시간 함수로 재해석함. 초기 다항적 증가 후 지수적 감소가 나타나 역함수가 부재함을 설득력 있게 논증하며 물리·수학 융합적 사고력을 발휘함.',
  },
  {
    studentIdx: 0,
    groupName: '대수',
    source: '기록',
    importance: '보통',
    raw_input: '슈테판-볼츠만 그래프 해석. 도함수 직접 구함',
    generated_sentence:
      '나의 함수 소개하기 활동에서 슈테판-볼츠만 함수를 선택해 흑체 반지름을 합성한 합성함수를 도출함. 그래프 해석 중 절대온도 민감도를 확인하기 위해 직접 변수별 도함수를 구함. 광도 공식의 물리적 의미를 교사에게 질문하고 동료들과 토의하며 수리·과학 융합 통찰을 확장함.',
  },
  // 진로 설문 응답 샘플 (몇 명)
  {
    studentIdx: 0,
    groupName: '진로',
    source: '설문',
    importance: '높음',
    raw_input: '인공지능 연구, 수학 모델링, 생명정보학 관심',
    generated_sentence:
      '인공지능 연구자 진로를 희망하며 수업에서 배운 수학 개념이 실제 모델 학습 과정에 어떻게 사용되는지 꾸준히 연결하여 탐구함. 생명정보학 분야의 서적을 찾아 읽고 생성형 인공지능의 문장 생성 원리를 자기 언어로 정리하여 동료에게 설명함.',
    folderName: '진로 설문: 전공 탐색',
  },
  {
    studentIdx: 5,
    groupName: '진로',
    source: '설문',
    importance: '보통',
    raw_input: '기후·환경 공학 관심. 데이터 분석 공부 시작',
    generated_sentence:
      '기후 변화 대응을 주제로 환경 공학 분야에 흥미를 가지고, 기초 데이터 분석 공부를 스스로 시작함. 관심 주제와 관련된 공공 데이터를 검색하여 간단한 그래프로 요약 정리하고, 진로 탐색 과정을 설문에 구체적으로 서술함.',
    folderName: '진로 설문: 전공 탐색',
  },
  // 인박스 (학생·그룹 미지정) — 실제 수업 중 빠른 메모 느낌
  {
    studentIdx: -1, // will resolve to null
    groupName: '',
    source: '기록',
    importance: '보통',
    raw_input: '오늘 4반 발표 수업에서 2명이 브라에스 역설 설명하다가 논의 주도함. 누군지 기억하면 나중에 기록 정리',
    generated_sentence:
      '오늘 4반 발표 수업에서 2명이 브라에스 역설 설명을 주도함. 나중에 학생 특정하여 기록 정리 필요.',
  },
  {
    studentIdx: -1,
    groupName: '',
    source: '기록',
    importance: '낮음',
    raw_input: '청소 시간 협력 잘함. 민준이 포함 몇명.',
    generated_sentence:
      '청소 시간에 맡은 역할 외에도 주변을 돌아보며 협력하는 태도를 보임.',
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
    text: '세포 생장 곡선 분석 활동에서 광학밀도 측정값을 시간에 따른 함수로 나타내고 평균변화율과 순간변화율의 의미 차이를 분석하여 설명함. 대수기에서의 성장 속도를 지수함수로 모델링하여 특정 시점의 순간 성장률을 구하는 문제를 설계함. 슈테판-볼츠만 함수를 합성함수로 도출하고 변수별 도함수를 직접 구하여 광도 공식의 물리적 의미를 정리하며 수학과 생명과학·물리의 융합적 사고력을 발휘함.',
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
