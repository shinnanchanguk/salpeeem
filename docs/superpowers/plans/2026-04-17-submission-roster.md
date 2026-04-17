# 제출물 트래커 + 학년·반 명렬 뷰 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 과제·설문 폴더에 올라온 파일을 교사 PC에 영구 저장하고, 학년·반·번호순 학생 명렬로 제출 현황을 관리·원본 열기까지 가능하게 한다.

**Architecture:**
- `submissions` 테이블(DB) + `submission_root_path` 설정으로 파일을 `~/Documents/살핌/제출물/[폴더]/정규화이름.ext`에 영구 저장.
- `src/lib/submissionStorage.ts`가 파일 I/O·정규화·rename 일원 담당. Tauri `plugin-fs`·`plugin-opener`를 얇게 감싼다.
- `AssignmentView`는 업로드 즉시 저장 + 기존 AI 플로우와 독립. 우측 3번째 패널 `SubmissionRosterPanel`이 학년·반 필터와 미매칭 풀 제공.

**Tech Stack:** Tauri v2 (플러그인 fs/dialog/opener — 이미 설치됨), TypeScript, React, Zustand, SQLite. 테스트 프레임워크 없음 → `tsc --noEmit`과 Tauri dev 수동 검증으로 각 태스크 마무리.

**Spec 참조:** `docs/superpowers/specs/2026-04-17-submission-roster-design.md`

---

## 파일 맵

| 구분 | 경로 | 책임 |
|------|------|------|
| 신규 | `src/lib/submissionStorage.ts` | 파일명 정규화, 저장 경로 계산, 파일 save/rename/delete, 미매칭 풀 이동 |
| 신규 | `src/stores/useSubmissionStore.ts` | 선택한 폴더의 submissions 캐시·fetch·갱신 |
| 신규 | `src/components/SubmissionRosterPanel.tsx` | 우측 360px 명렬 패널 (필터·학생 행·미매칭) |
| 수정 | `src/lib/database.ts` | `submissions` 테이블 DDL + CRUD + in-memory 스텁 + `submission_root_path` 기본값 |
| 수정 | `src/stores/useSettingsStore.ts` | `submission_root_path` 기본값 주입 |
| 수정 | `src/types/index.ts` | `Submission` 타입 + `AppSettings.submission_root_path` + 설문 파싱 결과 타입 |
| 수정 | `src/views/SettingsView.tsx` | 사이드바에 "제출물 저장" 섹션 + 경로 변경 + 일괄 리네이밍 |
| 수정 | `src/views/AssignmentView.tsx` | 업로드 즉시 저장 연결 + 우측 패널 통합 + 폴더 rename/delete 훅 |
| 수정 | `src/lib/studentMatcher.ts` | 엑셀 응답 행을 학생별로 쪼갤 유틸 추가 (설문용) |

---

## Task 1: `submissions` 테이블 DDL + `submission_root_path` 기본값 주입

**Files:**
- Modify: `src/lib/database.ts` (CREATE_TABLES 문자열 + 첫 실행 시 기본값 삽입)
- Modify: `src/types/index.ts`

- [ ] **Step 1: 타입 정의 추가**

`src/types/index.ts` 하단(`export type StudentIdPattern` 선언 바로 위)에 추가:

```ts
/** 제출물 (과제·설문 폴더에 학생별로 저장되는 원본 파일 레코드) */
export interface Submission {
  id: number;
  assignment_folder_id: number;
  student_id: number | null;           // NULL이면 미매칭 풀
  original_filename: string;
  stored_path: string;                 // 절대 경로
  uploaded_at: string;
  /** JOIN된 필드 */
  student_name?: string;
  grade?: string;
  class_name?: string;
  student_no?: number;
}
```

그리고 `AppSettings`에 한 줄 추가:

```ts
export interface AppSettings {
  // ... 기존 필드들 ...
  student_id_pattern: StudentIdPattern;
  submission_root_path: string;        // 추가
}
```

- [ ] **Step 2: `CREATE_TABLES`에 submissions 추가**

`src/lib/database.ts`의 `CREATE_TABLES` 템플릿 리터럴 끝(`)` 직전)에 추가:

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_folder_id INTEGER NOT NULL,
  student_id INTEGER,
  original_filename TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  uploaded_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(assignment_folder_id) REFERENCES assignment_folders(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_folder_student
  ON submissions(assignment_folder_id, student_id)
  WHERE student_id IS NOT NULL;
```

- [ ] **Step 3: in-memory 스텁에 submissions 지원 추가**

`createInMemoryDb` 내 `tables` 객체와 `autoIncrements` 객체에 `submissions: []` / `submissions: 0` 추가. `select`·`execute`에서 `FROM SUBMISSIONS` 분기를 간단한 find/filter/push로 처리(참고: 기존 `FROM ASSIGNMENT_FOLDERS` 패턴과 동일). 최소한 아래 쿼리를 지원해야 한다:

- `SELECT ... FROM submissions WHERE assignment_folder_id = $1`
- `INSERT INTO submissions (...) VALUES (...)`
- `UPDATE submissions SET student_id = $1, stored_path = $2, original_filename = $3 WHERE id = $4`
- `UPDATE submissions SET stored_path = $1 WHERE id = $2`
- `DELETE FROM submissions WHERE id = $1`
- `DELETE FROM submissions WHERE assignment_folder_id = $1`

`FROM SUBMISSIONS` 쿼리 처리 예시:

```ts
if (q.includes('FROM SUBMISSIONS')) {
  if (q.includes('WHERE ASSIGNMENT_FOLDER_ID')) {
    const fid = bindValues[0];
    return (tables.submissions as any[]).filter((s: any) => s.assignment_folder_id === fid) as unknown as T;
  }
  return tables.submissions as unknown as T;
}
```

- [ ] **Step 4: `tsc --noEmit` 실행**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음 (또는 `submission_root_path`를 아직 default에 안 넣어서 발생하는 에러가 있을 수 있음 → Task 2에서 해결).

- [ ] **Step 5: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/types/index.ts src/lib/database.ts && git commit -m "feat(db): add submissions table schema and Submission type"
```

---

## Task 2: `submissions` CRUD + `submission_root_path` 기본값 유틸

**Files:**
- Modify: `src/lib/database.ts` (CRUD 함수 추가)
- Modify: `src/stores/useSettingsStore.ts`

- [ ] **Step 1: Tauri documentDir 기반 기본 경로 헬퍼 추가**

`src/lib/database.ts` 상단 import 옆에 다음 함수 추가(Tauri가 없으면 빈 문자열):

```ts
import { documentDir, join } from '@tauri-apps/api/path';

export async function getDefaultSubmissionRoot(): Promise<string> {
  try {
    const docs = await documentDir();
    return await join(docs, '살핌', '제출물');
  } catch {
    return '';
  }
}
```

- [ ] **Step 2: CRUD 함수 추가**

`src/lib/database.ts` 맨 아래(seedTestStudents 다음)에 추가:

```ts
// ─── Submissions ──────────────────────────────────────────────────────
export async function getSubmissionsByFolder(folderId: number): Promise<Submission[]> {
  const d = await getDb();
  return d.select<Submission[]>(
    `SELECT sub.*, s.name AS student_name, s.grade, s.class_name, s.student_no
     FROM submissions sub
     LEFT JOIN students s ON sub.student_id = s.id
     WHERE sub.assignment_folder_id = $1
     ORDER BY s.grade, s.class_name, s.student_no, sub.uploaded_at DESC`,
    [folderId]
  );
}

export async function addSubmission(
  assignmentFolderId: number,
  studentId: number | null,
  originalFilename: string,
  storedPath: string
): Promise<{ lastInsertId: number }> {
  const d = await getDb();
  return d.execute(
    `INSERT INTO submissions (assignment_folder_id, student_id, original_filename, stored_path)
     VALUES ($1, $2, $3, $4)`,
    [assignmentFolderId, studentId, originalFilename, storedPath]
  );
}

export async function updateSubmissionStudent(
  id: number,
  studentId: number | null,
  storedPath: string,
  originalFilename: string
): Promise<void> {
  const d = await getDb();
  await d.execute(
    `UPDATE submissions SET student_id = $1, stored_path = $2, original_filename = $3 WHERE id = $4`,
    [studentId, storedPath, originalFilename, id]
  );
}

export async function updateSubmissionPath(id: number, storedPath: string): Promise<void> {
  const d = await getDb();
  await d.execute(`UPDATE submissions SET stored_path = $1 WHERE id = $2`, [storedPath, id]);
}

export async function deleteSubmission(id: number): Promise<void> {
  const d = await getDb();
  await d.execute(`DELETE FROM submissions WHERE id = $1`, [id]);
}

export async function deleteSubmissionsByFolder(folderId: number): Promise<void> {
  const d = await getDb();
  await d.execute(`DELETE FROM submissions WHERE assignment_folder_id = $1`, [folderId]);
}

export async function findSubmissionByFolderAndStudent(
  folderId: number,
  studentId: number
): Promise<Submission | null> {
  const d = await getDb();
  const rows = await d.select<Submission[]>(
    `SELECT * FROM submissions WHERE assignment_folder_id = $1 AND student_id = $2 LIMIT 1`,
    [folderId, studentId]
  );
  return rows[0] ?? null;
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const d = await getDb();
  return d.select<Submission[]>(`SELECT * FROM submissions`);
}
```

파일 상단 import에 `Submission`을 추가한다:

```ts
import type {
  // ... 기존 ...
  AssignmentFolder,
  Submission,
} from '../types';
```

- [ ] **Step 3: 설정 스토어에 기본값 주입**

`src/stores/useSettingsStore.ts` 수정:

```ts
import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { getAllSettings, setSetting, getDefaultSubmissionRoot } from '@/lib/database';
import { setAIConfig } from '@/lib/ai-service';

const defaultSettings: AppSettings = {
  openrouter_api_key: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  openrouter_model: import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.5-flash',
  use_custom_key: false,
  shortcut_full: 'Ctrl+Shift+F',
  shortcut_side: 'Ctrl+Shift+S',
  shortcut_bar: 'Ctrl+Shift+B',
  shortcut_focus: 'Ctrl+Shift+R',
  student_id_pattern: 'G1C1N2',
  submission_root_path: '',   // fetchSettings에서 비어있으면 documentDir 기반으로 채운다
};
```

`fetchSettings` 안에서 `merged` 계산 직후에 기본 경로 보정:

```ts
if (!merged.submission_root_path) {
  merged.submission_root_path = await getDefaultSubmissionRoot();
  // 첫 실행 시 DB에도 저장해둔다
  await setSetting('submission_root_path', merged.submission_root_path);
}
```

- [ ] **Step 4: `tsc --noEmit` 통과 확인**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 5: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/lib/database.ts src/stores/useSettingsStore.ts && git commit -m "feat(db): submissions CRUD and default submission root path"
```

---

## Task 3: 파일명 정규화 + 경로 빌더 유틸 (`submissionStorage.ts`)

**Files:**
- Create: `src/lib/submissionStorage.ts`

- [ ] **Step 1: 파일 생성**

`src/lib/submissionStorage.ts`:

```ts
import { join, dirname, basename, extname, sep } from '@tauri-apps/api/path';
import {
  mkdir,
  writeFile,
  readFile,
  remove,
  rename,
  exists,
  readDir,
  BaseDirectory,
} from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import type { Student, StudentIdPattern, AssignmentFolder } from '@/types';

/** OS별 금지 문자 치환 */
export function sanitizeSegment(raw: string): string {
  return raw.replace(/[\/\\:*?"<>|]/g, '_').trim() || '_';
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
  // G1C2N2
  return `${gradeNum}${String(classNum).padStart(2, '0')}${String(no).padStart(2, '0')}`;
}

/** 매칭된 학생용 정규화 파일명: 2315_홍길동.docx */
export function buildStudentFilename(
  student: Pick<Student, 'name' | 'grade' | 'class_name' | 'student_no'>,
  pattern: StudentIdPattern,
  originalName: string,
): string {
  const ext = originalName.lastIndexOf('.') >= 0 ? originalName.slice(originalName.lastIndexOf('.')) : '';
  const id = formatStudentIdForPattern(student, pattern);
  const safeName = sanitizeSegment(student.name);
  return `${id}_${safeName}${ext}`.trim();
}

/** 폴더 트리에서 절대경로 조각 조립 — 상위 폴더를 sep로 join
 *  예: [상위, 수행평가1] → "상위/수행평가1"
 */
export function buildFolderSegment(
  folder: AssignmentFolder,
  allFolders: AssignmentFolder[],
): string {
  const segs: string[] = [];
  let cur: AssignmentFolder | undefined = folder;
  while (cur) {
    segs.unshift(sanitizeSegment(cur.name));
    cur = cur.parent_id ? allFolders.find((f) => f.id === cur!.parent_id) : undefined;
  }
  return segs.join(sep);
}

/** 폴더+학생 기준 저장 절대경로 */
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

/** rename + 존재 여부 확인 */
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

/** OS 기본 앱으로 파일 열기 */
export async function openInOS(path: string): Promise<void> {
  await openPath(path);
}

/** 상위 폴더 탐색기에서 열기 */
export async function openParentInExplorer(filePath: string): Promise<void> {
  const dir = await dirname(filePath);
  await openPath(dir);
}

export async function directoryExists(path: string): Promise<boolean> {
  try {
    return await exists(path);
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: `tsc --noEmit` 통과**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

만약 `@tauri-apps/plugin-fs` 타입에서 `rename` 대신 다른 이름을 쓰면 에러가 남 — 그럴 때 해당 파일의 export를 확인해 맞추기(버전별 차이). 이 플러그인은 `rename`을 지원하지만 파라미터 시그니처는 버전마다 다르니 에러 발생 시 `(from: string, to: string)` 형태로 확인 후 조정.

Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/lib/submissionStorage.ts && git commit -m "feat(storage): submission filename normalization and fs helpers"
```

---

## Task 4: capabilities 권한 확장

**Files:**
- Modify: `src/-tauri/capabilities/default.json`

- [ ] **Step 1: FS 쓰기·디렉토리 읽기·opener path 권한 확인**

현재 `"fs:default"`만 있음. 쓰기/mkdir/rename/remove이 막힐 수 있으니 명시적으로 추가.

`src-tauri/capabilities/default.json`의 `permissions` 배열에 추가:

```json
"fs:allow-mkdir",
"fs:allow-write-file",
"fs:allow-read-file",
"fs:allow-remove",
"fs:allow-rename",
"fs:allow-exists",
"fs:allow-read-dir",
"opener:allow-open-path",
```

- [ ] **Step 2: 전역 scope — `$HOME/Documents/**` 접근 허용**

기본 scope가 좁으면 `$DOCUMENT/**`을 명시해야 할 수 있다. capabilities에 `fs` 관련 scope 블록 추가 (Tauri v2 형식):

배열에 한 줄 추가 (단순 permission은 위에서 허용했고 scope는 별도 설정):

```json
{
  "identifier": "fs:scope",
  "allow": [{ "path": "$DOCUMENT/**" }, { "path": "$HOME/Documents/**" }]
}
```

즉 배열 내 요소가 문자열/객체 혼합이어야 한다. 최종 `permissions` 배열은 기존 문자열들 + 새 객체 1개가 된다.

- [ ] **Step 3: Cargo/Tauri dev 빌드 한번 돌려 유효성 확인**

```bash
cd /home/shinchang/salpeeem && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -20
```

Expected: `Finished` 또는 심각한 에러 없음. capabilities 파싱 에러가 있으면 JSON 형식 재확인.

- [ ] **Step 4: Commit**

```bash
cd /home/shinchang/salpeeem && git add src-tauri/capabilities/default.json && git commit -m "feat(tauri): grant fs write/mkdir/remove and opener path permissions"
```

---

## Task 5: 설정 화면 — "제출물 저장" 섹션

**Files:**
- Modify: `src/views/SettingsView.tsx`

- [ ] **Step 1: 사이드바 배열에 새 항목 추가**

`sidebarItems` 배열을 다음으로 바꾼다(위치: "단축키 설정"과 "데이터 관리" 사이):

```ts
const sidebarItems = ['학생 명단 관리', '영역 관리', 'AI 연결', '단축키 설정', '제출물 저장', '데이터 관리'];
```

- [ ] **Step 2: 새 섹션 컴포넌트 추가**

`sectionComponents` 선언부에 엔트리를 추가하고, 컴포넌트 함수를 같은 파일 내에 구현한다. 구현부 위치: 다른 섹션 컴포넌트(`ShortcutSettingsSection` 등) 다음.

```tsx
function SubmissionStorageSection() {
  const { settings, updateSetting, saveAllSettings } = useSettingsStore();
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePick = async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const picked = await open({ directory: true, multiple: false, defaultPath: settings.submission_root_path });
    if (typeof picked !== 'string') return;
    if (picked === settings.submission_root_path) return;

    const oldPath = settings.submission_root_path;
    const doMove = window.confirm(`저장 경로를 변경합니다.\n기존 파일들을 새 경로로 이동할까요?\n\n이전: ${oldPath}\n새 경로: ${picked}`);
    updateSetting('submission_root_path', picked);
    await saveAllSettings();

    if (doMove && oldPath) {
      setMoving(true);
      setMessage('파일을 새 경로로 이동 중...');
      try {
        const { moveRoot } = await import('@/lib/submissionStorage-migrate');
        await moveRoot(oldPath, picked);
        setMessage('이동 완료');
      } catch (e) {
        setMessage('이동 중 오류: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        setMoving(false);
      }
    }
  };

  const handleOpenExplorer = async () => {
    const { openInOS } = await import('@/lib/submissionStorage');
    if (settings.submission_root_path) await openInOS(settings.submission_root_path);
  };

  const handleRenameAll = async () => {
    if (!window.confirm('저장된 모든 제출물의 파일명을 현재 학번 규칙으로 일괄 변경할까요?')) return;
    setMoving(true);
    setMessage('일괄 변경 중...');
    try {
      const { renameAllToPattern } = await import('@/lib/submissionStorage-migrate');
      const n = await renameAllToPattern();
      setMessage(`${n}개 파일 이름 변경 완료`);
    } catch (e) {
      setMessage('변경 중 오류: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setMoving(false);
    }
  };

  return (
    <>
      <div style={customStyles.sectionHeader}>
        <h1 style={customStyles.sectionTitle}>제출물 저장</h1>
        <p style={customStyles.sectionDesc}>학생이 올린 과제·설문 파일이 저장될 경로를 설정합니다.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 600 }}>현재 저장 경로</div>
          <div style={{
            padding: '12px 14px',
            border: '1px solid #000',
            borderRadius: 8,
            backgroundColor: '#fff',
            fontSize: 14,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}>
            {settings.submission_root_path || '(미설정 — 첫 실행 시 자동 지정됩니다)'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={customStyles.btnSecondary} onClick={handlePick} disabled={moving}>폴더 변경</button>
            <button style={customStyles.btnSecondary} onClick={handleOpenExplorer} disabled={moving || !settings.submission_root_path}>탐색기에서 열기</button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 600 }}>파일명 규칙</div>
          <div style={{ fontSize: 14, color: '#111', lineHeight: 1.6 }}>
            현재 학번 규칙(<b>{settings.student_id_pattern}</b>)을 따릅니다. 예: <code>{settings.student_id_pattern === 'G1C1N2' ? '2315_홍길동.docx' : '20315_홍길동.docx'}</code><br />
            규칙은 <b>학생 명단 관리</b> 설정에서 변경할 수 있습니다.
          </div>
          <button style={{ ...customStyles.btnSecondary, marginTop: 12 }} onClick={handleRenameAll} disabled={moving}>
            기존 파일 전체를 현재 규칙으로 재명명
          </button>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', backgroundColor: '#F0FDF4', border: '1px solid #10B981', borderRadius: 8, fontSize: 13, color: '#065F46' }}>
            {message}
          </div>
        )}
      </div>
    </>
  );
}
```

그리고 `sectionComponents`에 등록:

```ts
const sectionComponents: Record<string, React.FC> = {
  '학생 명단 관리': StudentManagementSection,
  '영역 관리': GroupManagementSection,
  'AI 연결': AIConnectionSection,
  '단축키 설정': ShortcutSettingsSection,
  '제출물 저장': SubmissionStorageSection,
  '데이터 관리': DataManagementSection,
};
```

(정확한 기존 키 이름은 파일에서 확인 후 맞춘다.)

- [ ] **Step 3: `tsc --noEmit`**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

`submissionStorage-migrate` 모듈이 아직 없어 에러 날 것 — Task 6에서 만든다. 지금은 `@ts-expect-error` 등은 쓰지 말고 그대로 두고, 다음 태스크에서 해결.

→ 이 단계의 커밋은 Task 6 끝나고 한꺼번에.

---

## Task 6: 이동·일괄 리네이밍 유틸 (`submissionStorage-migrate.ts`)

**Files:**
- Create: `src/lib/submissionStorage-migrate.ts`

- [ ] **Step 1: 파일 생성**

```ts
import { join, dirname, basename, extname, sep } from '@tauri-apps/api/path';
import { exists, mkdir, rename, readDir, remove } from '@tauri-apps/plugin-fs';
import {
  getAllSubmissions,
  updateSubmissionPath,
  getAssignmentFolders,
} from '@/lib/database';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStudentStore } from '@/stores/useStudentStore';
import {
  buildFolderSegment,
  buildStudentFilename,
  sanitizeSegment,
} from '@/lib/submissionStorage';

/** 전체 저장 루트 이동 — 구 경로의 내용을 새 경로로 move + submissions.stored_path 일괄 갱신 */
export async function moveRoot(oldRoot: string, newRoot: string): Promise<void> {
  if (!oldRoot || !newRoot || oldRoot === newRoot) return;
  if (!(await exists(oldRoot))) return;

  if (!(await exists(newRoot))) {
    await mkdir(newRoot, { recursive: true });
  }

  // 최상위 디렉토리 엔트리들을 하나씩 이동
  const entries = await readDir(oldRoot);
  for (const entry of entries) {
    const from = await join(oldRoot, entry.name);
    const to = await join(newRoot, entry.name);
    await rename(from, to);
  }
  // 비워진 구 루트 삭제 시도 (실패해도 무시)
  try { await remove(oldRoot, { recursive: true }); } catch { /* ignore */ }

  // DB stored_path prefix 교체
  const subs = await getAllSubmissions();
  for (const s of subs) {
    if (s.stored_path.startsWith(oldRoot)) {
      const newPath = newRoot + s.stored_path.slice(oldRoot.length);
      await updateSubmissionPath(s.id, newPath);
    }
  }
}

/** 학번 패턴이 바뀌었을 때 저장된 모든 매칭된 submissions를 현재 패턴의 파일명으로 rename. 반환: 바뀐 파일 수. */
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
    const currentBase = sub.stored_path.split('/').pop()?.split('\\').pop() ?? '';
    if (currentBase === desiredName) continue;

    const dir = await dirname(sub.stored_path);
    const newPath = await join(dir, desiredName);
    if (await exists(sub.stored_path)) {
      await rename(sub.stored_path, newPath);
    }
    await updateSubmissionPath(sub.id, newPath);
    changed++;
  }
  return changed;
}
```

- [ ] **Step 2: 학번 패턴 변경 시 일괄 리네이밍 제안 훅**

`src/views/SettingsView.tsx`에서 `student_id_pattern`을 바꾸는 `onChange` 옆에 프롬프트 추가. 패턴 바뀌었고 기존 submissions가 하나라도 있으면 모달:

파일 안 `StudentManagementSection` 내 pattern select onChange를 찾아 변경(함수 이름은 현재 파일 확인). 예시:

```ts
onChange={async (e) => {
  const next = e.target.value as StudentIdPattern;
  updateSetting('student_id_pattern', next);
  await saveAllSettings();
  const { getAllSubmissions } = await import('@/lib/database');
  const subs = await getAllSubmissions();
  if (subs.some((s) => s.student_id !== null)) {
    const yes = window.confirm('이미 저장된 제출물 파일들을 새 학번 규칙으로 일괄 변경할까요?');
    if (yes) {
      const { renameAllToPattern } = await import('@/lib/submissionStorage-migrate');
      const n = await renameAllToPattern();
      alert(`${n}개 파일 이름이 변경되었습니다.`);
    }
  }
}}
```

- [ ] **Step 3: `tsc --noEmit` 통과**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/lib/submissionStorage-migrate.ts src/views/SettingsView.tsx && git commit -m "feat(settings): submission storage section with path move and pattern rename"
```

---

## Task 7: AssignmentView — 업로드 즉시 저장 (과제 경로)

**Files:**
- Modify: `src/views/AssignmentView.tsx`

- [ ] **Step 1: 업로드 시 파일을 디스크에 저장 + submissions INSERT**

`handleFileChange`, `handleDrop`(파일을 state에 push하는 함수들) 호출 시 공통적으로 실행될 `persistUploadedFiles(files: File[])` 헬퍼를 추가(뷰 컴포넌트 내 useCallback).

1. 현재 `selectedFolder`, `folders`, `settings.student_id_pattern`, `settings.submission_root_path`, `students` 사용.
2. 각 파일에 대해:
   - `matchStudentFromFilename`으로 학생 매칭 시도.
   - 매칭 성공 → `buildStudentFilename` → `buildStoredPath`.
   - 매칭 실패 → `buildUnmatchedPath`.
   - `fileToBytes` → `saveFileTo(absolutePath, bytes)`.
   - `addSubmission(folder.id, student?.id ?? null, file.name, absolutePath)`.
3. 완료 후 `submissionStore.fetchForFolder(folder.id)` 호출해 우측 패널 갱신.
4. 기존 동작(`uploadedFiles` state에 쌓는 것)은 유지 — 문장 생성 시 그 state를 그대로 쓴다.

구현(함수 추가, 파일 상단 import 보강):

```ts
import {
  buildStudentFilename,
  buildStoredPath,
  buildUnmatchedPath,
  buildSurveyResponsePath,
  saveFileTo,
  fileToBytes,
} from '@/lib/submissionStorage';
import { addSubmission, findSubmissionByFolderAndStudent, deleteSubmission } from '@/lib/database';
import { useSubmissionStore } from '@/stores/useSubmissionStore';
```

그리고 컴포넌트 내:

```ts
const { fetchForFolder } = useSubmissionStore();

const persistUploadedFiles = useCallback(async (files: File[]) => {
  if (!selectedFolder) return;
  const root = settings.submission_root_path;
  if (!root) return;

  for (const file of files) {
    try {
      const bytes = await fileToBytes(file);

      if (isSurveyMode) {
        // Task 8에서 별도로 처리. 여기서는 과제만.
        continue;
      }

      const match = matchStudentFromFilename(file.name, students, settings.student_id_pattern);
      const student = match.student;

      const filename = student
        ? buildStudentFilename(student, settings.student_id_pattern, file.name)
        : file.name;
      const absolutePath = student
        ? await buildStoredPath(root, selectedFolder, folders, filename)
        : await buildUnmatchedPath(root, selectedFolder, folders, file.name);

      // 중복: 같은 학생의 기존 submission이 있으면 덮어쓰기
      if (student) {
        const existing = await findSubmissionByFolderAndStudent(selectedFolder.id, student.id);
        if (existing) {
          await deleteSubmission(existing.id);
          // 기존 파일도 제거(있다면)
          const { removeFileSilent } = await import('@/lib/submissionStorage');
          await removeFileSilent(existing.stored_path);
        }
      }

      await saveFileTo(absolutePath, bytes);
      await addSubmission(selectedFolder.id, student?.id ?? null, file.name, absolutePath);
    } catch (err) {
      console.error('submission persist failed:', file.name, err);
    }
  }
  await fetchForFolder(selectedFolder.id);
}, [selectedFolder, folders, settings.submission_root_path, settings.student_id_pattern, students, isSurveyMode, fetchForFolder]);
```

`handleFileChange`와 `handleDrop` 두 곳의 기존 set 직후에 `persistUploadedFiles(files)`를 호출:

```ts
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  setUploadedFiles((prev) => [...prev, ...files]);
  void persistUploadedFiles(files);
};
```

- [ ] **Step 2: 스토어 파일 생성 (`useSubmissionStore.ts`)**

`src/stores/useSubmissionStore.ts`:

```ts
import { create } from 'zustand';
import type { Submission } from '@/types';
import { getSubmissionsByFolder } from '@/lib/database';

interface SubmissionStore {
  byFolder: Record<number, Submission[]>;
  loading: boolean;
  fetchForFolder: (folderId: number) => Promise<void>;
  getFor: (folderId: number) => Submission[];
  reset: (folderId: number) => void;
}

export const useSubmissionStore = create<SubmissionStore>((set, get) => ({
  byFolder: {},
  loading: false,
  fetchForFolder: async (folderId) => {
    set({ loading: true });
    try {
      const rows = await getSubmissionsByFolder(folderId);
      set((s) => ({ byFolder: { ...s.byFolder, [folderId]: rows } }));
    } finally {
      set({ loading: false });
    }
  },
  getFor: (folderId) => get().byFolder[folderId] ?? [],
  reset: (folderId) => {
    set((s) => {
      const copy = { ...s.byFolder };
      delete copy[folderId];
      return { byFolder: copy };
    });
  },
}));
```

- [ ] **Step 3: `handleSelectFolder`에서 스토어 prefetch**

```ts
const handleSelectFolder = async (folder: AssignmentFolder) => {
  setSelectedFolder(folder);
  setResults([]); setError(null); setUploadedFiles([]);
  if (fileInputRef.current) fileInputRef.current.value = '';
  try {
    const records = await getRecordsByAssignmentFolder(folder.id);
    setFolderRecords(records);
  } catch { setFolderRecords([]); }
  await fetchForFolder(folder.id);   // 추가
};
```

- [ ] **Step 4: `tsc --noEmit`**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 5: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/views/AssignmentView.tsx src/stores/useSubmissionStore.ts && git commit -m "feat(assignment): persist uploaded files to disk and submissions on upload"
```

---

## Task 8: 설문 업로드 분기 (공용 응답 파일 + 엑셀 파싱 → 학생별 submissions)

**Files:**
- Modify: `src/views/AssignmentView.tsx`
- Modify: `src/lib/studentMatcher.ts` (필요 시 엑셀 응답 행별 매칭 함수 노출)

- [ ] **Step 1: 엑셀 응답 파서 확인/추가**

`src/lib/studentMatcher.ts`에 이미 엑셀을 파싱해 학생을 찾는 로직이 있는지 확인. 없으면 다음 함수를 추가:

```ts
import * as XLSX from 'xlsx';

/** 설문 엑셀/CSV을 읽어 각 응답 행에서 학생을 매칭한 결과 반환 */
export async function matchStudentsInSurveyFile(
  file: File,
  students: Student[],
  pattern: StudentIdPattern,
): Promise<Array<{ student: Student | null; rowIndex: number; matchMethod: 'student_id' | 'name' | 'none' }>> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

  const results: Array<{ student: Student | null; rowIndex: number; matchMethod: 'student_id' | 'name' | 'none' }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // 후보 값들을 평탄화 — 학번/이름/학년·반·번호가 들어있을만한 열
    const joined = Object.values(row).map((v) => String(v)).join(' ');
    const idMatch = parseStudentId(joined, pattern);
    let student: Student | null = null;
    let method: 'student_id' | 'name' | 'none' = 'none';
    if (idMatch) {
      student = students.find((s) =>
        String(s.grade).includes(String(idMatch.grade)) &&
        String(s.class_name).includes(String(idMatch.classNum)) &&
        Number(s.student_no) === Number(idMatch.no)
      ) ?? null;
      if (student) method = 'student_id';
    }
    if (!student) {
      // 이름으로
      for (const s of students) {
        if (joined.includes(s.name)) { student = s; method = 'name'; break; }
      }
    }
    results.push({ student, rowIndex: i, matchMethod: student ? method : 'none' });
  }
  return results;
}
```

(`parseStudentId`는 기존 파일에 이미 export되어 있음. 없으면 import 위치 조정.)

- [ ] **Step 2: `persistUploadedFiles` 안 survey 분기 채우기**

`isSurveyMode` 분기를 다음으로 교체:

```ts
if (isSurveyMode) {
  // 설문: 파일은 하나(엑셀/CSV) — _전체응답.xlsx로 저장, 행별로 submissions 행 생성
  const ext = (file.name.lastIndexOf('.') >= 0 ? file.name.slice(file.name.lastIndexOf('.')) : '.xlsx');
  const storedPath = await buildSurveyResponsePath(root, selectedFolder, folders, ext);
  await saveFileTo(storedPath, bytes);

  // 기존 이 폴더의 submissions 전부 지우고 재파싱
  const { deleteSubmissionsByFolder } = await import('@/lib/database');
  await deleteSubmissionsByFolder(selectedFolder.id);

  const { matchStudentsInSurveyFile } = await import('@/lib/studentMatcher');
  const matches = await matchStudentsInSurveyFile(file, students, settings.student_id_pattern);
  for (const m of matches) {
    await addSubmission(selectedFolder.id, m.student?.id ?? null, file.name, storedPath);
  }
  continue; // 다음 파일로
}
```

- [ ] **Step 3: `tsc --noEmit`**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/views/AssignmentView.tsx src/lib/studentMatcher.ts && git commit -m "feat(survey): save single response file and create per-respondent submissions"
```

---

## Task 9: `SubmissionRosterPanel` 컴포넌트

**Files:**
- Create: `src/components/SubmissionRosterPanel.tsx`

- [ ] **Step 1: 컴포넌트 골격**

```tsx
import React, { useMemo, useState } from 'react';
import type { Submission, Student, AssignmentFolder } from '@/types';
import { useStudentStore } from '@/stores/useStudentStore';
import { openInOS } from '@/lib/submissionStorage';

type Status = 'all' | 'submitted' | 'missing';

interface Props {
  folder: AssignmentFolder;
  submissions: Submission[];
  onOpenFile: (path: string) => void;
  onAssignUnmatched: (submissionId: number, studentId: number) => Promise<void>;
  onDropFileOnStudent: (studentId: number, files: File[]) => Promise<void>;
}

export function SubmissionRosterPanel({ folder, submissions, onOpenFile, onAssignUnmatched, onDropFileOnStudent }: Props) {
  const { students } = useStudentStore();
  const [grade, setGrade] = useState<string>('all');
  const [className, setClassName] = useState<string>('all');
  const [status, setStatus] = useState<Status>('all');

  // 학년·반 선택지
  const grades = useMemo(() => Array.from(new Set(students.map((s) => s.grade))).sort(), [students]);
  const classNames = useMemo(() => {
    const pool = grade === 'all' ? students : students.filter((s) => s.grade === grade);
    return Array.from(new Set(pool.map((s) => s.class_name))).sort();
  }, [students, grade]);

  const unmatched = submissions.filter((s) => s.student_id === null);

  // submission index by student_id
  const subByStudent = useMemo(() => {
    const m = new Map<number, Submission>();
    for (const s of submissions) if (s.student_id) m.set(s.student_id, s);
    return m;
  }, [submissions]);

  // 필터된 학생 리스트
  const filteredStudents = useMemo(() => {
    let list = students;
    if (grade !== 'all') list = list.filter((s) => s.grade === grade);
    if (className !== 'all') list = list.filter((s) => s.class_name === className);
    if (status === 'submitted') list = list.filter((s) => subByStudent.has(s.id));
    if (status === 'missing') list = list.filter((s) => !subByStudent.has(s.id));
    return list.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      if (a.class_name !== b.class_name) return a.class_name.localeCompare(b.class_name);
      return a.student_no - b.student_no;
    });
  }, [students, grade, className, status, subByStudent]);

  return (
    <div style={{
      width: 360,
      borderLeft: '1px solid #000',
      backgroundColor: '#F4F4F2',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: 16, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>제출 현황</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={grade} onChange={(e) => { setGrade(e.target.value); setClassName('all'); }} style={selectStyle}>
            <option value="all">모든 학년</option>
            {grades.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={className} onChange={(e) => setClassName(e.target.value)} style={selectStyle}>
            <option value="all">모든 반</option>
            {classNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #000', borderRadius: 6, overflow: 'hidden' }}>
            {(['all', 'submitted', 'missing'] as Status[]).map((s) => {
              const label = s === 'all' ? '전체' : s === 'submitted' ? '제출' : '미제출';
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    border: 'none',
                    backgroundColor: active ? '#111' : 'transparent',
                    color: active ? '#fff' : '#111',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >{label}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 미매칭 풀 */}
      {unmatched.length > 0 && (
        <UnmatchedPile items={unmatched} students={students} onAssign={onAssignUnmatched} />
      )}

      {/* 학생 리스트 */}
      <div style={{ flex: 1 }}>
        {filteredStudents.map((s) => {
          const sub = subByStudent.get(s.id);
          return (
            <StudentRow
              key={s.id}
              student={s}
              submission={sub ?? null}
              onOpen={() => sub && onOpenFile(sub.stored_path)}
              onDropFiles={(files) => onDropFileOnStudent(s.id, files)}
            />
          );
        })}
        {filteredStudents.length === 0 && (
          <div style={{ padding: 16, fontSize: 13, color: '#888' }}>표시할 학생이 없습니다.</div>
        )}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #000',
  borderRadius: 6,
  backgroundColor: '#fff',
  fontSize: 13,
  fontFamily: 'inherit',
};

function StudentRow({ student, submission, onOpen, onDropFiles }: {
  student: Student;
  submission: Submission | null;
  onOpen: () => void;
  onDropFiles: (files: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const submitted = !!submission;
  return (
    <div
      onDoubleClick={() => submitted && onOpen()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) void onDropFiles(files);
      }}
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        backgroundColor: dragOver ? '#E0E7FF' : 'transparent',
        cursor: submitted ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#555', width: 48 }}>{student.grade} {student.class_name}</span>
        <span style={{ fontSize: 12, color: '#555', width: 28 }}>{student.student_no}번</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', flex: 1 }}>{student.name}</span>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 4,
          fontWeight: 600,
          backgroundColor: submitted ? '#D1FAE5' : '#FEF3C7',
          color: submitted ? '#065F46' : '#92400E',
        }}>
          {submitted ? '제출' : '미제출'}
        </span>
      </div>
      {submitted && submission && (
        <div style={{ fontSize: 12, color: '#555', paddingLeft: 76, cursor: 'pointer' }} onClick={onOpen} title={submission.stored_path}>
          📎 {submission.original_filename}
        </div>
      )}
    </div>
  );
}

function UnmatchedPile({ items, students, onAssign }: {
  items: Submission[];
  students: Student[];
  onAssign: (subId: number, studentId: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.1)', backgroundColor: '#FEF3C7' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>⚠ 미매칭 파일 {items.length}개</span>
        <span style={{ fontSize: 11, color: '#92400E' }}>{open ? '접기' : '지정 >'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((it) => (
            <div key={it.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.original_filename}>
                {it.original_filename}
              </span>
              <select
                defaultValue=""
                onChange={(e) => {
                  const sid = Number(e.target.value);
                  if (sid) void onAssign(it.id, sid);
                }}
                style={{ fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '1px solid #92400E' }}
              >
                <option value="" disabled>학생 선택</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.grade} {s.class_name} {s.student_no}번 {s.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `tsc --noEmit`**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/components/SubmissionRosterPanel.tsx && git commit -m "feat(ui): SubmissionRosterPanel with filters, unmatched pile, drag-to-assign"
```

---

## Task 10: AssignmentView 3-column 통합 + 반응형 접힘

**Files:**
- Modify: `src/views/AssignmentView.tsx`

- [ ] **Step 1: 렌더에 우측 패널 붙이기**

리턴 JSX의 `<div style={customStyles.mainContent}>{renderRightPanel()}</div>` 다음에 조건부로 `<SubmissionRosterPanel ... />`를 렌더. 창 너비는 `useEffect`로 `window.innerWidth`를 추적하거나, 간단히 CSS media query 대신 state로 체크:

```ts
const [wide, setWide] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1280 : true);
useEffect(() => {
  const onResize = () => setWide(window.innerWidth >= 1280);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);

const [rosterOpenOverlay, setRosterOpenOverlay] = useState(false);
```

리턴부 끝:

```tsx
{selectedFolder && wide && (
  <SubmissionRosterPanel
    folder={selectedFolder}
    submissions={useSubmissionStore((s) => s.getFor(selectedFolder.id))}
    onOpenFile={(p) => void openInOS(p)}
    onAssignUnmatched={handleAssignUnmatched}
    onDropFileOnStudent={handleDropFileOnStudent}
  />
)}
{selectedFolder && !wide && rosterOpenOverlay && (
  <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 360, backgroundColor: '#F4F4F2', borderLeft: '1px solid #000', zIndex: 500, boxShadow: '-4px 0 12px rgba(0,0,0,0.1)' }}>
    <SubmissionRosterPanel
      folder={selectedFolder}
      submissions={useSubmissionStore((s) => s.getFor(selectedFolder.id))}
      onOpenFile={(p) => void openInOS(p)}
      onAssignUnmatched={handleAssignUnmatched}
      onDropFileOnStudent={handleDropFileOnStudent}
    />
    <button onClick={() => setRosterOpenOverlay(false)} style={{ position: 'absolute', top: 8, right: 8 }}>✕</button>
  </div>
)}
{selectedFolder && !wide && !rosterOpenOverlay && (
  <button onClick={() => setRosterOpenOverlay(true)} style={{ position: 'absolute', top: 16, right: 16, padding: '6px 12px', border: '1px solid #000', borderRadius: 6, backgroundColor: '#fff' }}>
    📋 명렬 보기
  </button>
)}
```

- [ ] **Step 2: 핸들러 구현**

```ts
const handleAssignUnmatched = useCallback(async (subId: number, studentId: number) => {
  if (!selectedFolder) return;
  const { getAllSubmissions, updateSubmissionStudent } = await import('@/lib/database');
  const { buildStudentFilename, buildStoredPath, renamePath } = await import('@/lib/submissionStorage');
  const all = await getAllSubmissions();
  const sub = all.find((s) => s.id === subId);
  if (!sub) return;
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  const newFilename = buildStudentFilename(student, settings.student_id_pattern, sub.original_filename);
  const newPath = await buildStoredPath(settings.submission_root_path, selectedFolder, folders, newFilename);
  try {
    await renamePath(sub.stored_path, newPath);
  } catch (e) {
    console.error('rename failed', e);
  }
  await updateSubmissionStudent(subId, studentId, newPath, sub.original_filename);
  await fetchForFolder(selectedFolder.id);
}, [selectedFolder, folders, settings, students, fetchForFolder]);

const handleDropFileOnStudent = useCallback(async (studentId: number, files: File[]) => {
  if (!selectedFolder) return;
  const student = students.find((s) => s.id === studentId);
  if (!student) return;
  const file = files[0];
  const bytes = await fileToBytes(file);
  const newFilename = buildStudentFilename(student, settings.student_id_pattern, file.name);
  const newPath = await buildStoredPath(settings.submission_root_path, selectedFolder, folders, newFilename);

  const existing = await findSubmissionByFolderAndStudent(selectedFolder.id, student.id);
  if (existing) {
    const { removeFileSilent } = await import('@/lib/submissionStorage');
    await removeFileSilent(existing.stored_path);
    await deleteSubmission(existing.id);
  }
  await saveFileTo(newPath, bytes);
  await addSubmission(selectedFolder.id, student.id, file.name, newPath);
  await fetchForFolder(selectedFolder.id);
}, [selectedFolder, folders, settings, students, fetchForFolder]);
```

상단 import 보강:

```ts
import { SubmissionRosterPanel } from '@/components/SubmissionRosterPanel';
import { openInOS } from '@/lib/submissionStorage';
```

- [ ] **Step 3: `tsc --noEmit`**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/views/AssignmentView.tsx && git commit -m "feat(assignment): integrate 3-column roster panel with file open and drag assign"
```

---

## Task 11: 폴더 rename/delete 시 디스크 동기화

**Files:**
- Modify: `src/views/AssignmentView.tsx`

- [ ] **Step 1: rename 훅**

`handleFolderDialogConfirm`의 `mode === 'rename'` 분기에서 DB 업데이트 직전에 디스크 rename 수행:

```ts
if (folderDialog.mode === 'rename' && folderDialog.folderId) {
  const old = folders.find((f) => f.id === folderDialog.folderId);
  if (old && settings.submission_root_path) {
    const { sep } = await import('@tauri-apps/api/path');
    const { sanitizeSegment, buildFolderSegment } = await import('@/lib/submissionStorage');
    const { renamePath, directoryExists } = await import('@/lib/submissionStorage');
    const oldSeg = buildFolderSegment(old, folders);
    const renamedFolder = { ...old, name };
    const newSeg = buildFolderSegment(renamedFolder, folders.map((f) => f.id === old.id ? renamedFolder : f));
    if (oldSeg !== newSeg) {
      const { join } = await import('@tauri-apps/api/path');
      const from = await join(settings.submission_root_path, oldSeg);
      const to = await join(settings.submission_root_path, newSeg);
      if (await directoryExists(from)) {
        await renamePath(from, to);
        // submissions.stored_path prefix 치환
        const { getAllSubmissions, updateSubmissionPath } = await import('@/lib/database');
        const all = await getAllSubmissions();
        for (const s of all) {
          if (s.stored_path.startsWith(from)) {
            await updateSubmissionPath(s.id, to + s.stored_path.slice(from.length));
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2: delete 훅**

`handleDeleteFolder`에서 `deleteAssignmentFolder(folder.id)` 호출 직전에 디스크 폴더 삭제:

```ts
if (settings.submission_root_path) {
  const { buildFolderSegment, removeDirRecursive } = await import('@/lib/submissionStorage');
  const { join } = await import('@tauri-apps/api/path');
  const seg = buildFolderSegment(folder, folders);
  const path = await join(settings.submission_root_path, seg);
  await removeDirRecursive(path);
}
```

- [ ] **Step 3: `tsc --noEmit`**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
cd /home/shinchang/salpeeem && git add src/views/AssignmentView.tsx && git commit -m "feat(assignment): sync on-disk submissions folder on rename/delete"
```

---

## Task 12: 개발 빌드 + 수동 검증 루프

**Files:** 없음. 동작 검증.

- [ ] **Step 1: TypeScript 전체 통과**

```bash
cd /home/shinchang/salpeeem && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 2: Vite 빌드 통과**

```bash
cd /home/shinchang/salpeeem && npm run build
```

Expected: `dist/` 생성, 에러 없음.

- [ ] **Step 3: 수동 시나리오 체크리스트**

사용자가 직접 `npm run tauri dev`로 띄워서 아래 항목을 체크.

- [ ] 설정 → "제출물 저장" 섹션이 보이고 기본 경로가 `~/Documents/살핌/제출물`로 채워져 있다
- [ ] 과제 폴더 만들고 파일 드래그 → 우측 명렬에 즉시 "제출" 뜬다
- [ ] 학번이 없거나 이름 매칭 실패한 파일 → 우측 상단 "미매칭 N개" 뜨고 드롭다운으로 학생 지정 가능
- [ ] 제출 행 더블클릭 → OS 기본 앱으로 원본 파일 열림
- [ ] 명렬의 학생 행에 파일 드래그 → 그 학생으로 제출 저장
- [ ] 학년·반·상태 필터가 의도대로 동작
- [ ] 창 너비 < 1280px → 우측 패널 접히고 "📋 명렬 보기" 토글 노출
- [ ] 설문 폴더: 엑셀 드롭 → 응답자가 명렬에 "제출"로 뜨고 클릭 시 `_전체응답.xlsx` 열림
- [ ] 설정에서 저장 경로 변경 → "기존 파일 이동" 선택 시 실제로 파일 이동
- [ ] 설정에서 학번 패턴 변경 → "일괄 재명명" 선택 시 파일명 바뀜
- [ ] 폴더 이름 변경 → 디스크 폴더도 따라서 rename
- [ ] 폴더 삭제 → 디스크 폴더(파일 포함) 삭제

- [ ] **Step 4: 최종 커밋 (필요 시 자잘한 버그 픽스)**

수동 검증 중 발견한 이슈가 있으면 한 번에 수정 후 commit:

```bash
cd /home/shinchang/salpeeem && git add -A && git commit -m "fix(submission-roster): manual verification fixes"
```

---

## Self-Review 체크리스트 (구현자 본인이 실행)

- [ ] Spec의 모든 테이블 필드가 Task 1–2에서 정의됨 (`submissions`, UNIQUE INDEX 포함)
- [ ] 저장 경로 기본값이 `~/Documents/살핌/제출물`인지 확인 (Task 2)
- [ ] 파일명 규칙이 `student_id_pattern`을 따르는지 (Task 3 `buildStudentFilename`)
- [ ] 3-column 레이아웃 + <1280px 접힘 (Task 10)
- [ ] 업로드 즉시 저장 (AI 확정 전에도 "제출됨") (Task 7–8)
- [ ] 설문 공용 파일 1개 + 응답별 submissions 행 (Task 8)
- [ ] 폴더 rename/delete 시 디스크 동기화 (Task 11)
- [ ] 경로 변경 시 기존 파일 이동 (Task 6)
- [ ] 패턴 변경 시 일괄 리네이밍 (Task 6)
- [ ] 미매칭 파일 → 수동 지정 → 정규화 경로로 이동 (Task 10)
