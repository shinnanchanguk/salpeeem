import { join, dirname } from '@tauri-apps/api/path';
import { exists, mkdir, rename, readDir, remove } from '@tauri-apps/plugin-fs';
import {
  getAllSubmissions,
  updateSubmissionPath,
  getAssignmentFolders,
} from '@/lib/database';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStudentStore } from '@/stores/useStudentStore';
import { buildStudentFilename } from '@/lib/submissionStorage';

/** 루트 이동 — 구 경로의 하위 엔트리를 새 경로로 rename + submissions.stored_path prefix 일괄 교체 */
export async function moveRoot(oldRoot: string, newRoot: string): Promise<void> {
  if (!oldRoot || !newRoot || oldRoot === newRoot) return;
  if (!(await exists(oldRoot))) return;

  if (!(await exists(newRoot))) {
    await mkdir(newRoot, { recursive: true });
  }

  const entries = await readDir(oldRoot);
  for (const entry of entries) {
    const from = await join(oldRoot, entry.name);
    const to = await join(newRoot, entry.name);
    try {
      await rename(from, to);
    } catch {
      /* 일부 실패해도 나머지 진행 */
    }
  }

  try {
    await remove(oldRoot, { recursive: true });
  } catch {
    /* 구 루트가 비어있지 않거나 권한 이슈 — 무시 */
  }

  const subs = await getAllSubmissions();
  for (const s of subs) {
    if (s.stored_path.startsWith(oldRoot)) {
      const newPath = newRoot + s.stored_path.slice(oldRoot.length);
      await updateSubmissionPath(s.id, newPath);
    }
  }
}

/** 학번 패턴을 따라 모든 매칭된 submissions 파일명 정규화. 바뀐 파일 수 반환. */
export async function renameAllToPattern(): Promise<number> {
  const settings = useSettingsStore.getState().settings;
  const students = useStudentStore.getState().students;
  const folders = await getAssignmentFolders();
  const subs = await getAllSubmissions();

  let changed = 0;
  for (const sub of subs) {
    if (sub.student_id === null) continue;
    const student = students.find((s) => s.id === sub.student_id);
    const folder = folders.find((f) => f.id === sub.assignment_folder_id);
    if (!student || !folder) continue;

    const desiredName = buildStudentFilename(student, settings.student_id_pattern, sub.original_filename);
    const currentBase =
      sub.stored_path.split('/').pop()?.split('\\').pop() ?? '';
    if (currentBase === desiredName) continue;

    const dir = await dirname(sub.stored_path);
    const newPath = await join(dir, desiredName);
    try {
      if (await exists(sub.stored_path)) {
        await rename(sub.stored_path, newPath);
      }
      await updateSubmissionPath(sub.id, newPath);
      changed++;
    } catch {
      /* 이 파일은 스킵하고 다음 진행 */
    }
  }
  return changed;
}
