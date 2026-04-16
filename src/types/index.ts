/** 학생 */
export interface Student {
  id: number;
  name: string;
  grade: string;
  class_name: string;
  student_no: number;
}

/** 그룹 (영역 대체, 중첩 가능) */
export interface Group {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  byte_limit: number;
  created_at: string;
  children?: Group[];
}

/** 기록 소스 */
export type RecordSource = '기록' | '과제' | '설문';

/** 중요도 */
export type Importance = '높음' | '보통' | '낮음';

/** 기록 */
export interface Record {
  id: number;
  raw_input: string;
  generated_sentence: string;
  student_id: number | null;
  group_id: number | null;
  source: RecordSource;
  importance: Importance;
  assignment_folder_id: number | null;
  is_edited: boolean;
  created_at: string;
  /** Joined fields (optional) */
  student_name?: string;
  group_name?: string;
}

/** 과제 */
export interface Assignment {
  id: number;
  title: string;
  group_id: number;
  instructions: string;
  created_at: string;
  student_count?: number;
}

/** 설문 */
export interface Survey {
  id: number;
  title: string;
  instructions: string;
  created_at: string;
  student_count?: number;
}

/** 완성된 생기부 */
export interface CompletedRecord {
  id: number;
  student_id: number;
  group_id: number;
  final_text: string;
  byte_count: number;
  status: '미완성' | '완성됨';
  confirmed_at: string | null;
  student_name?: string;
  group_name?: string;
}

/** AI 채팅 메시지 */
export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

/** 과제·설문 폴더 */
export interface AssignmentFolder {
  id: number;
  name: string;
  parent_id: number | null;
  folder_type: 'assignment' | 'survey';
  group_id: number | null;
  instructions: string;
  created_at: string;
  children?: AssignmentFolder[];
}

/** 학번 패턴 — G=학년자릿수, C=반자릿수, N=번호자릿수 */
export type StudentIdPattern = 'G1C1N2' | 'G1C2N2';

/** 앱 설정 */
export interface AppSettings {
  openrouter_api_key: string;
  openrouter_model: string;
  use_custom_key: boolean;
  shortcut_full: string;
  shortcut_side: string;
  shortcut_bar: string;
  shortcut_focus: string;
  student_id_pattern: StudentIdPattern;
}

/** 바이트 계산 — 나이스(NEIS) 기준
 *  영문/숫자/특수문자/공백 = 1바이트, 엔터(\n) = 2바이트, 한글 = 3바이트
 *  참고: https://hjh010501.github.io/neis-counter/ */
export function getByteLength(str: string): number {
  // NEIS 카운터와 동일하게 마지막 줄바꿈 제거
  let s = str;
  if (s !== '\n' && s.endsWith('\n')) {
    s = s.slice(0, -1);
  }
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const code = s.charCodeAt(i);
    if (c === '\n') {
      bytes += 2;
    } else if (c === '\r') {
      // \r은 카운트하지 않음 (textarea에서 \n만 사용)
      continue;
    } else if (code <= 0x7f) {
      // ASCII: 영문, 숫자, 특수문자, 공백, 탭 등
      bytes += 1;
    } else if (
      (code >= 0x3131 && code <= 0x318e) || // ㄱ-ㅎ, ㅏ-ㅣ
      (code >= 0xac00 && code <= 0xd7a3)    // 가-힣
    ) {
      bytes += 3;
    } else {
      // 기타 유니코드 (수학기호, 그리스문자, 중점·, 따옴표 등)
      // NEIS 카운터는 이들을 1바이트로 계산
      bytes += 1;
    }
  }
  return bytes;
}
