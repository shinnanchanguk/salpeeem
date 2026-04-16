import type { Student, StudentIdPattern } from '@/types';

// ─── Student ID Pattern Parsing ─────────────────────────────────────

interface ParsedStudentId {
  grade: number;
  classNum: number;
  studentNo: number;
}

/**
 * 학번 패턴별 자릿수 정의
 * G1C1N2: 학년1 + 반1 + 번호2 = 4자리 (예: 1502)
 * G1C2N2: 학년1 + 반2 + 번호2 = 5자리 (예: 10502)
 */
const PATTERN_DEFS: Record<StudentIdPattern, { gradeLen: number; classLen: number; numLen: number }> = {
  G1C1N2: { gradeLen: 1, classLen: 1, numLen: 2 },
  G1C2N2: { gradeLen: 1, classLen: 2, numLen: 2 },
};

/** 학번 패턴 설명 텍스트 */
export const PATTERN_LABELS: Record<StudentIdPattern, string> = {
  G1C1N2: '학년(1자리) + 반(1자리) + 번호(2자리) — 예: 1502',
  G1C2N2: '학년(1자리) + 반(2자리) + 번호(2자리) — 예: 10502',
};

/** 학번 패턴에 따른 총 자릿수 */
export function getPatternLength(pattern: StudentIdPattern): number {
  const def = PATTERN_DEFS[pattern];
  return def.gradeLen + def.classLen + def.numLen;
}

/** 학번 문자열을 파싱 */
export function parseStudentId(raw: string, pattern: StudentIdPattern): ParsedStudentId | null {
  const def = PATTERN_DEFS[pattern];
  const totalLen = def.gradeLen + def.classLen + def.numLen;

  // 숫자만 추출
  const digits = raw.replace(/\D/g, '');
  if (digits.length < totalLen) return null;

  // 앞에서부터 자릿수대로 추출
  let pos = 0;
  const grade = parseInt(digits.slice(pos, pos + def.gradeLen), 10);
  pos += def.gradeLen;
  const classNum = parseInt(digits.slice(pos, pos + def.classLen), 10);
  pos += def.classLen;
  const studentNo = parseInt(digits.slice(pos, pos + def.numLen), 10);

  if (isNaN(grade) || isNaN(classNum) || isNaN(studentNo)) return null;
  if (grade < 1 || classNum < 1 || studentNo < 1) return null;

  return { grade, classNum, studentNo };
}

/** 학번 미리보기 포맷 */
export function formatStudentIdPreview(pattern: StudentIdPattern, example?: string): string {
  const def = PATTERN_DEFS[pattern];
  const totalLen = def.gradeLen + def.classLen + def.numLen;

  if (example) {
    const parsed = parseStudentId(example, pattern);
    if (parsed) {
      return `${parsed.grade}학년 ${parsed.classNum}반 ${parsed.studentNo}번`;
    }
  }

  // 기본 예시
  if (pattern === 'G1C1N2') return `예: 1502 → 1학년 5반 02번 (${totalLen}자리)`;
  if (pattern === 'G1C2N2') return `예: 10502 → 1학년 05반 02번 (${totalLen}자리)`;
  return '';
}

// ─── Filename Student Matching ──────────────────────────────────────

/** 파일명에서 학번 패턴 추출 시도 */
export function extractStudentIdFromFilename(filename: string, pattern: StudentIdPattern): ParsedStudentId | null {
  const def = PATTERN_DEFS[pattern];
  const totalLen = def.gradeLen + def.classLen + def.numLen;

  // 파일 확장자 제거
  const nameOnly = filename.replace(/\.[^.]+$/, '');

  // 연속된 숫자 중 패턴 길이에 맞는 것을 찾기
  const digitGroups = nameOnly.match(/\d+/g);
  if (!digitGroups) return null;

  for (const group of digitGroups) {
    if (group.length === totalLen) {
      const parsed = parseStudentId(group, pattern);
      if (parsed) return parsed;
    }
  }

  // 총 자릿수보다 긴 숫자가 있으면 앞부분으로 시도
  for (const group of digitGroups) {
    if (group.length > totalLen) {
      const parsed = parseStudentId(group.slice(0, totalLen), pattern);
      if (parsed) return parsed;
    }
  }

  return null;
}

/** 파일명에서 이름 추출 (기존 로직 보강) */
export function extractNameFromFilename(filename: string): string {
  const nameOnly = filename.replace(/\.[^.]+$/, '');
  // 숫자, 언더스코어, 하이픈, 공백으로 분리 후 한글 부분 추출
  const parts = nameOnly.split(/[\d_\-\s]+/).filter(Boolean);
  // 한글이 포함된 부분 중 가장 이름 같은 것
  const koreanParts = parts.filter((p) => /[가-힣]{2,}/.test(p));
  return koreanParts[0]?.trim() || nameOnly.trim();
}

export interface MatchResult {
  student: Student | null;
  matchMethod: 'student_id' | 'name' | 'none';
  parsedId?: ParsedStudentId;
}

/** 학생 목록에서 학번으로 매칭 */
export function matchStudentById(
  parsed: ParsedStudentId,
  students: Student[]
): Student | null {
  return students.find((s) => {
    const gradeNum = parseInt(s.grade.replace(/\D/g, ''), 10);
    const classNum = parseInt(s.class_name.replace(/\D/g, ''), 10);
    return gradeNum === parsed.grade && classNum === parsed.classNum && s.student_no === parsed.studentNo;
  }) ?? null;
}

/** 학생 목록에서 이름으로 매칭 */
export function matchStudentByName(name: string, students: Student[]): Student | null {
  // 완전 일치
  const exact = students.find((s) => s.name === name);
  if (exact) return exact;

  // 부분 일치
  const partial = students.find(
    (s) => s.name.includes(name) || name.includes(s.name)
  );
  return partial ?? null;
}

/** 파일명에서 학생 매칭 (학번 우선 → 이름 폴백) */
export function matchStudentFromFilename(
  filename: string,
  students: Student[],
  pattern: StudentIdPattern
): MatchResult {
  // 1. 학번 매칭 시도
  const parsedId = extractStudentIdFromFilename(filename, pattern);
  if (parsedId) {
    const student = matchStudentById(parsedId, students);
    if (student) {
      return { student, matchMethod: 'student_id', parsedId };
    }
  }

  // 2. 이름 매칭 시도
  const name = extractNameFromFilename(filename);
  if (name) {
    const student = matchStudentByName(name, students);
    if (student) {
      return { student, matchMethod: 'name' };
    }
  }

  // 3. 매칭 실패
  return { student: null, matchMethod: 'none', parsedId: parsedId ?? undefined };
}

// ─── Survey CSV Column Recognition ─────────────────────────────────

const STUDENT_NO_HEADERS = ['학번', '번호', 'student_id', 'student_no', '출석번호', '학생번호'];
const NAME_HEADERS = ['이름', '성명', 'name', '학생명', '성함', '학생이름'];
const SKIP_HEADERS = ['타임스탬프', 'timestamp', '제출시간', '이메일', 'email', '응답시간'];

export interface ColumnMapping {
  studentNoCol: number | null;
  nameCol: number | null;
  questionCols: number[];
  headers: string[];
}

/** CSV/Excel 헤더에서 컬럼 역할 자동 인식 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  let studentNoCol: number | null = null;
  let nameCol: number | null = null;
  const questionCols: number[] = [];

  headers.forEach((header, idx) => {
    const h = header.trim().toLowerCase();

    if (SKIP_HEADERS.some((s) => h.includes(s.toLowerCase()))) {
      return; // skip this column
    }

    if (studentNoCol === null && STUDENT_NO_HEADERS.some((s) => h.includes(s.toLowerCase()))) {
      studentNoCol = idx;
      return;
    }

    if (nameCol === null && NAME_HEADERS.some((s) => h.includes(s.toLowerCase()))) {
      nameCol = idx;
      return;
    }

    questionCols.push(idx);
  });

  return { studentNoCol, nameCol, questionCols, headers };
}

export interface SurveyStudentData {
  student: Student | null;
  matchMethod: 'student_id' | 'name' | 'none';
  rawStudentNo?: string;
  rawName?: string;
  responses: Array<{ question: string; answer: string }>;
  rowIndex: number;
}

/** CSV 행 데이터를 학생별로 정리 */
export function parseSurveyRows(
  rows: string[][],
  mapping: ColumnMapping,
  students: Student[],
  pattern: StudentIdPattern
): SurveyStudentData[] {
  return rows.map((row, rowIndex) => {
    const rawStudentNo = mapping.studentNoCol !== null ? row[mapping.studentNoCol]?.trim() : undefined;
    const rawName = mapping.nameCol !== null ? row[mapping.nameCol]?.trim() : undefined;

    // 질문-답변 쌍
    const responses = mapping.questionCols
      .filter((col) => col < row.length && row[col]?.trim())
      .map((col) => ({
        question: mapping.headers[col],
        answer: row[col].trim(),
      }));

    // 학생 매칭
    let student: Student | null = null;
    let matchMethod: 'student_id' | 'name' | 'none' = 'none';

    // 학번으로 매칭
    if (rawStudentNo) {
      const parsed = parseStudentId(rawStudentNo, pattern);
      if (parsed) {
        student = matchStudentById(parsed, students);
        if (student) matchMethod = 'student_id';
      }
    }

    // 이름으로 매칭 (학번 실패 시)
    if (!student && rawName) {
      student = matchStudentByName(rawName, students);
      if (student) matchMethod = 'name';
    }

    return { student, matchMethod, rawStudentNo, rawName, responses, rowIndex };
  });
}
