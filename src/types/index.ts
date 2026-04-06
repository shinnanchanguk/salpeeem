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

/** 앱 설정 */
export interface AppSettings {
  openrouter_api_key: string;
  openrouter_model: string;
  use_custom_key: boolean;
  shortcut_full: string;
  shortcut_side: string;
  shortcut_bar: string;
  shortcut_focus: string;
}

/** 바이트 계산 (한글 = 3바이트) */
export function getByteLength(str: string): number {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) len += 1;
    else if (code <= 0x7ff) len += 2;
    else len += 3;
  }
  return len;
}
