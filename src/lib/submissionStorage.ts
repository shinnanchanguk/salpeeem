import { join, dirname, sep } from '@tauri-apps/api/path';
import {
  mkdir,
  writeFile,
  remove,
  rename,
  exists,
} from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import type { Student, StudentIdPattern, AssignmentFolder } from '@/types';

/** OS 금지 문자 치환 (Windows 기준으로 엄격하게) */
export function sanitizeSegment(raw: string): string {
  const trimmed = raw.replace(/[\/\\:*?"<>|]/g, '_').trim();
  return trimmed.length > 0 ? trimmed : '_';
}

/** settings.student_id_pattern에 맞춰 학번 4 or 5자리 문자열 생성 */
export function formatStudentIdForPattern(
  student: Pick<Student, 'grade' | 'class_name' | 'student_no'>,
  pattern: StudentIdPattern,
): string {
  const gradeNum = parseInt(String(student.grade).replace(/[^0-9]/g, ''), 10);
  const classNum = parseInt(String(student.class_name).replace(/[^0-9]/g, ''), 10);
  const no = student.student_no;
  if (!Number.isFinite(gradeNum) || !Number.isFinite(classNum)) return '';
  if (pattern === 'G1C1N2') {
    return `${gradeNum}${classNum}${String(no).padStart(2, '0')}`;
  }
  return `${gradeNum}${String(classNum).padStart(2, '0')}${String(no).padStart(2, '0')}`;
}

/** 매칭된 학생용 정규화 파일명: 2315_홍길동.docx */
export function buildStudentFilename(
  student: Pick<Student, 'name' | 'grade' | 'class_name' | 'student_no'>,
  pattern: StudentIdPattern,
  originalName: string,
): string {
  const dot = originalName.lastIndexOf('.');
  const ext = dot >= 0 ? originalName.slice(dot) : '';
  const id = formatStudentIdForPattern(student, pattern);
  const safeName = sanitizeSegment(student.name);
  const base = id ? `${id}_${safeName}` : safeName;
  return `${base}${ext}`.trim();
}

/** 폴더 트리에서 절대경로 조각 조립 — 상위 폴더를 path sep으로 join */
export function buildFolderSegment(
  folder: AssignmentFolder,
  allFolders: AssignmentFolder[],
): string {
  const segs: string[] = [];
  let cur: AssignmentFolder | undefined = folder;
  const guard = new Set<number>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    segs.unshift(sanitizeSegment(cur.name));
    cur = cur.parent_id ? allFolders.find((f) => f.id === cur!.parent_id) : undefined;
  }
  return segs.join(sep());
}

/** 폴더+파일명 기준 저장 절대경로 */
export async function buildStoredPath(
  root: string,
  folder: AssignmentFolder,
  allFolders: AssignmentFolder[],
  filename: string,
): Promise<string> {
  const segment = buildFolderSegment(folder, allFolders);
  return await join(root, segment, filename);
}

/** 미매칭 파일 전용 경로: <root>/<folder>/_미매칭/<원본파일명> */
export async function buildUnmatchedPath(
  root: string,
  folder: AssignmentFolder,
  allFolders: AssignmentFolder[],
  originalName: string,
): Promise<string> {
  const segment = buildFolderSegment(folder, allFolders);
  return await join(root, segment, '_미매칭', sanitizeSegment(originalName));
}

/** 설문 공용 응답 파일 경로 */
export async function buildSurveyResponsePath(
  root: string,
  folder: AssignmentFolder,
  allFolders: AssignmentFolder[],
  originalExt: string,
): Promise<string> {
  const segment = buildFolderSegment(folder, allFolders);
  const ext = originalExt.startsWith('.') ? originalExt : `.${originalExt || 'xlsx'}`;
  return await join(root, segment, `_전체응답${ext}`);
}

/** 저장 — 대상 디렉토리가 없으면 만들고 파일을 쓴다. 덮어쓰기 허용. */
export async function saveFileTo(absolutePath: string, data: Uint8Array): Promise<void> {
  const dir = await dirname(absolutePath);
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(absolutePath, data);
}

/** 브라우저 File → Uint8Array */
export async function fileToBytes(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

/** rename (대상 상위 디렉토리 없으면 만든다) */
export async function renamePath(from: string, to: string): Promise<void> {
  const toDir = await dirname(to);
  if (!(await exists(toDir))) {
    await mkdir(toDir, { recursive: true });
  }
  await rename(from, to);
}

/** 단일 파일 삭제 (없으면 무시) */
export async function removeFileSilent(path: string): Promise<void> {
  try {
    if (await exists(path)) await remove(path);
  } catch {
    /* ignore */
  }
}

/** 폴더 전체 재귀 삭제 */
export async function removeDirRecursive(path: string): Promise<void> {
  try {
    if (await exists(path)) {
      await remove(path, { recursive: true });
    }
  } catch {
    /* ignore */
  }
}

/** OS 기본 앱으로 파일/폴더 열기 */
export async function openInOS(path: string): Promise<void> {
  await openPath(path);
}

export async function directoryExists(path: string): Promise<boolean> {
  try {
    return await exists(path);
  } catch {
    return false;
  }
}
