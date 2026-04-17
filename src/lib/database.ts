import type {
  Student,
  Group,
  Record as SalpeemRecord,
  Assignment,
  Survey,
  CompletedRecord,
  RecordSource,
  Importance,
  AssignmentFolder,
  Submission,
} from '../types';

// ─── Database interface ───────────────────────────────────────────────
interface DatabaseLike {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(query: string, bindValues?: unknown[]): Promise<{ rowsAffected: number; lastInsertId: number }>;
}

let db: DatabaseLike | null = null;

// ─── Schema ───────────────────────────────────────────────────────────
const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  class_name TEXT NOT NULL,
  student_no INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  byte_limit INTEGER DEFAULT 1500,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(parent_id) REFERENCES groups(id)
);

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_input TEXT NOT NULL,
  generated_sentence TEXT NOT NULL,
  student_id INTEGER,
  group_id INTEGER,
  source TEXT DEFAULT '기록',
  importance TEXT DEFAULT '보통',
  assignment_folder_id INTEGER DEFAULT NULL,
  is_edited INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(student_id) REFERENCES students(id),
  FOREIGN KEY(group_id) REFERENCES groups(id),
  FOREIGN KEY(assignment_folder_id) REFERENCES assignment_folders(id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  group_id INTEGER,
  instructions TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  group_id INTEGER,
  instructions TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(group_id) REFERENCES groups(id)
);

CREATE TABLE IF NOT EXISTS completed_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  final_text TEXT NOT NULL,
  byte_count INTEGER DEFAULT 0,
  status TEXT DEFAULT '미완성',
  confirmed_at TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id),
  FOREIGN KEY(group_id) REFERENCES groups(id),
  UNIQUE(student_id, group_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS assignment_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  folder_type TEXT DEFAULT 'assignment',
  group_id INTEGER DEFAULT NULL,
  instructions TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(parent_id) REFERENCES assignment_folders(id),
  FOREIGN KEY(group_id) REFERENCES groups(id)
);

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
`;

// ─── In-memory stub for non-Tauri environments ────────────────────────
function createInMemoryDb(): DatabaseLike {
  const tables: { [key: string]: unknown[] } = {
    students: [],
    groups: [],
    records: [],
    assignments: [],
    surveys: [],
    completed_records: [],
    app_settings: [],
    assignment_folders: [],
    submissions: [],
  };

  const autoIncrements: { [key: string]: number } = {
    students: 0,
    groups: 0,
    records: 0,
    assignments: 0,
    surveys: 0,
    completed_records: 0,
    assignment_folders: 0,
    submissions: 0,
  };

  return {
    async select<T>(query: string, bindValues: unknown[] = []): Promise<T> {
      const q = query.trim().toUpperCase();

      // students
      if (q.includes('FROM STUDENTS')) {
        return tables.students as unknown as T;
      }
      // groups
      if (q.includes('FROM GROUPS')) {
        if (q.includes('WHERE') && q.includes('PARENT_ID') && bindValues.length === 1) {
          const parentId = bindValues[0];
          if (parentId === null) {
            return (tables.groups as any[]).filter(
              (g: any) => g.parent_id === null
            ) as unknown as T;
          }
          return (tables.groups as any[]).filter(
            (g: any) => g.parent_id === parentId
          ) as unknown as T;
        }
        if (q.includes('WHERE') && q.includes('ID =') && bindValues.length === 1) {
          return (tables.groups as any[]).filter(
            (g: any) => g.id === bindValues[0]
          ) as unknown as T;
        }
        return tables.groups as unknown as T;
      }
      // records
      if (q.includes('FROM RECORDS')) {
        if (q.includes('COUNT(*)')) {
          if (q.includes('GROUP_ID IN')) {
            // recursive: first bind is student_id, rest are group ids
            const sId = bindValues[0] as number;
            const gIds = bindValues.slice(1) as number[];
            const count = (tables.records as any[]).filter(
              (r) => r.student_id === sId && gIds.includes(r.group_id)
            ).length;
            return [{ count }] as unknown as T;
          }
          const sId = bindValues[0] as number;
          const gId = bindValues[1] as number;
          const count = (tables.records as any[]).filter(
            (r) => r.student_id === sId && r.group_id === gId
          ).length;
          return [{ count }] as unknown as T;
        }
        if (q.includes('GROUP_ID IN')) {
          const gIds = bindValues as number[];
          return (tables.records as any[]).filter(
            (r) => gIds.includes(r.group_id)
          ) as unknown as T;
        }
        if (q.includes('ASSIGNMENT_FOLDER_ID') && bindValues.length === 1) {
          return (tables.records as any[]).filter(
            (r: any) => r.assignment_folder_id === bindValues[0]
          ) as unknown as T;
        }
        if (q.includes('IS NULL')) {
          return (tables.records as any[]).filter(
            (r: any) => r.student_id === null || r.group_id === null
          ) as unknown as T;
        }
        if (q.includes('WHERE') && bindValues.length > 0) {
          return tables.records as unknown as T;
        }
        return tables.records as unknown as T;
      }
      // assignments
      if (q.includes('FROM ASSIGNMENTS')) {
        return tables.assignments as unknown as T;
      }
      // surveys
      if (q.includes('FROM SURVEYS')) {
        return tables.surveys as unknown as T;
      }
      // completed_records
      if (q.includes('FROM COMPLETED_RECORDS')) {
        if (bindValues.length === 2) {
          const [sId, gId] = bindValues;
          const found = (tables.completed_records as any[]).filter(
            (r) => r.student_id === sId && r.group_id === gId
          );
          return found as unknown as T;
        }
        return tables.completed_records as unknown as T;
      }
      // app_settings
      if (q.includes('FROM APP_SETTINGS')) {
        if (bindValues.length === 1) {
          const found = (tables.app_settings as any[]).filter(
            (r: any) => r.key === bindValues[0]
          );
          return found as unknown as T;
        }
        return tables.app_settings as unknown as T;
      }
      // assignment_folders
      if (q.includes('FROM ASSIGNMENT_FOLDERS')) {
        if (q.includes('WHERE') && q.includes('PARENT_ID') && bindValues.length === 1) {
          const parentId = bindValues[0];
          if (parentId === null) {
            return (tables.assignment_folders as any[]).filter(
              (f: any) => f.parent_id === null
            ) as unknown as T;
          }
          return (tables.assignment_folders as any[]).filter(
            (f: any) => f.parent_id === parentId
          ) as unknown as T;
        }
        return tables.assignment_folders as unknown as T;
      }
      // submissions
      if (q.includes('FROM SUBMISSIONS')) {
        if (q.includes('WHERE') && q.includes('ASSIGNMENT_FOLDER_ID') && q.includes('STUDENT_ID') && bindValues.length >= 2) {
          const fid = bindValues[0];
          const sid = bindValues[1];
          return (tables.submissions as any[]).filter(
            (s: any) => s.assignment_folder_id === fid && s.student_id === sid
          ) as unknown as T;
        }
        if (q.includes('WHERE') && q.includes('ASSIGNMENT_FOLDER_ID') && bindValues.length >= 1) {
          const fid = bindValues[0];
          const rows = (tables.submissions as any[]).filter(
            (s: any) => s.assignment_folder_id === fid
          );
          // Enrich with joined student fields (mirror SQL LEFT JOIN students)
          return rows.map((sub: any) => {
            const student = (tables.students as any[]).find((st: any) => st.id === sub.student_id);
            return {
              ...sub,
              student_name: student?.name,
              grade: student?.grade,
              class_name: student?.class_name,
              student_no: student?.student_no,
            };
          }) as unknown as T;
        }
        return tables.submissions as unknown as T;
      }
      return [] as unknown as T;
    },

    async execute(query: string, bindValues: unknown[] = []) {
      const q = query.trim().toUpperCase();

      // INSERT INTO students
      if (q.startsWith('INSERT INTO STUDENTS')) {
        const id = ++autoIncrements.students;
        tables.students.push({
          id,
          name: bindValues[0],
          grade: bindValues[1],
          class_name: bindValues[2],
          student_no: bindValues[3] ?? 0,
        });
        return { rowsAffected: 1, lastInsertId: id };
      }
      // UPDATE students
      if (q.startsWith('UPDATE STUDENTS')) {
        const row = (tables.students as any[]).find((s) => s.id === bindValues[4]);
        if (row) {
          row.name = bindValues[0];
          row.grade = bindValues[1];
          row.class_name = bindValues[2];
          row.student_no = bindValues[3] ?? 0;
        }
        return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
      }
      // DELETE FROM students
      if (q.startsWith('DELETE FROM STUDENTS')) {
        const idx = (tables.students as any[]).findIndex((s) => s.id === bindValues[0]);
        if (idx >= 0) tables.students.splice(idx, 1);
        return { rowsAffected: idx >= 0 ? 1 : 0, lastInsertId: 0 };
      }

      // INSERT INTO groups
      if (q.startsWith('INSERT INTO GROUPS')) {
        const id = ++autoIncrements.groups;
        tables.groups.push({
          id,
          name: bindValues[0],
          parent_id: bindValues[1] ?? null,
          sort_order: bindValues[2] ?? 0,
          byte_limit: bindValues[3] ?? 1500,
          created_at: new Date().toISOString(),
        });
        return { rowsAffected: 1, lastInsertId: id };
      }
      // UPDATE groups SET name
      if (q.startsWith('UPDATE GROUPS') && q.includes('NAME')) {
        if (q.includes('PARENT_ID')) {
          // moveGroup
          const row = (tables.groups as any[]).find((g) => g.id === bindValues[1]);
          if (row) row.parent_id = bindValues[0];
          return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
        }
        const row = (tables.groups as any[]).find((g) => g.id === bindValues[2]);
        if (row) {
          row.name = bindValues[0];
          row.byte_limit = bindValues[1] ?? row.byte_limit;
        }
        return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
      }
      // DELETE FROM groups
      if (q.startsWith('DELETE FROM GROUPS')) {
        const id = bindValues[0] as number;
        const deleteRecursive = (parentId: number) => {
          const children = (tables.groups as any[]).filter((g) => g.parent_id === parentId);
          for (const child of children) {
            deleteRecursive(child.id);
          }
          const idx = (tables.groups as any[]).findIndex((g) => g.id === parentId);
          if (idx >= 0) tables.groups.splice(idx, 1);
        };
        deleteRecursive(id);
        return { rowsAffected: 1, lastInsertId: 0 };
      }

      // INSERT INTO records
      if (q.startsWith('INSERT INTO RECORDS')) {
        const id = ++autoIncrements.records;
        tables.records.push({
          id,
          raw_input: bindValues[0],
          generated_sentence: bindValues[1],
          student_id: bindValues[2] ?? null,
          group_id: bindValues[3] ?? null,
          source: bindValues[4] ?? '기록',
          importance: bindValues[5] ?? '보통',
          assignment_folder_id: bindValues[6] ?? null,
          is_edited: 0,
          created_at: new Date().toISOString(),
        });
        return { rowsAffected: 1, lastInsertId: id };
      }
      // UPDATE records SET student_id / group_id
      if (q.startsWith('UPDATE RECORDS') && q.includes('STUDENT_ID')) {
        const row = (tables.records as any[]).find((r) => r.id === bindValues[2]);
        if (row) {
          row.student_id = bindValues[0];
          row.group_id = bindValues[1];
        }
        return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
      }
      // UPDATE records SET importance
      if (q.startsWith('UPDATE RECORDS') && q.includes('IMPORTANCE')) {
        const row = (tables.records as any[]).find((r) => r.id === bindValues[1]);
        if (row) {
          row.importance = bindValues[0];
        }
        return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
      }
      // UPDATE records SET raw_input / generated_sentence / is_edited
      if (q.startsWith('UPDATE RECORDS') && q.includes('RAW_INPUT')) {
        const row = (tables.records as any[]).find((r) => r.id === bindValues[3]);
        if (row) {
          row.raw_input = bindValues[0];
          row.generated_sentence = bindValues[1];
          row.is_edited = bindValues[2];
        }
        return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
      }
      // DELETE FROM records
      if (q.startsWith('DELETE FROM RECORDS')) {
        const idx = (tables.records as any[]).findIndex((r) => r.id === bindValues[0]);
        if (idx >= 0) tables.records.splice(idx, 1);
        return { rowsAffected: idx >= 0 ? 1 : 0, lastInsertId: 0 };
      }
      // UPDATE records SET group_id = NULL WHERE group_id = $1  (cascade)
      if (q.startsWith('UPDATE RECORDS') && q.includes('GROUP_ID = NULL')) {
        let affected = 0;
        for (const row of tables.records as any[]) {
          if (row.group_id === bindValues[0]) {
            row.group_id = null;
            affected++;
          }
        }
        return { rowsAffected: affected, lastInsertId: 0 };
      }
      // UPDATE records SET assignment_folder_id = NULL WHERE assignment_folder_id = $1
      if (q.startsWith('UPDATE RECORDS') && q.includes('ASSIGNMENT_FOLDER_ID = NULL')) {
        let affected = 0;
        for (const row of tables.records as any[]) {
          if (row.assignment_folder_id === bindValues[0]) {
            row.assignment_folder_id = null;
            affected++;
          }
        }
        return { rowsAffected: affected, lastInsertId: 0 };
      }
      // DELETE FROM completed_records WHERE group_id = $1
      if (q.startsWith('DELETE FROM COMPLETED_RECORDS')) {
        const before = tables.completed_records.length;
        tables.completed_records = (tables.completed_records as any[]).filter(
          (r) => r.group_id !== bindValues[0]
        );
        return { rowsAffected: before - tables.completed_records.length, lastInsertId: 0 };
      }
      // Generic: UPDATE <table> SET group_id = NULL WHERE group_id = $1
      if (
        q.includes('GROUP_ID = NULL') &&
        (q.startsWith('UPDATE SURVEYS') || q.startsWith('UPDATE ASSIGNMENTS') || q.startsWith('UPDATE ASSIGNMENT_FOLDERS'))
      ) {
        const tableName = q.startsWith('UPDATE SURVEYS')
          ? 'surveys'
          : q.startsWith('UPDATE ASSIGNMENTS')
            ? 'assignments'
            : 'assignment_folders';
        let affected = 0;
        for (const row of tables[tableName] as any[]) {
          if (row.group_id === bindValues[0]) {
            row.group_id = null;
            affected++;
          }
        }
        return { rowsAffected: affected, lastInsertId: 0 };
      }

      // INSERT INTO assignments
      if (q.startsWith('INSERT INTO ASSIGNMENTS')) {
        const id = ++autoIncrements.assignments;
        tables.assignments.push({
          id,
          title: bindValues[0],
          group_id: bindValues[1],
          instructions: bindValues[2],
          created_at: new Date().toISOString(),
        });
        return { rowsAffected: 1, lastInsertId: id };
      }

      // INSERT INTO surveys (title, group_id, instructions)
      if (q.startsWith('INSERT INTO SURVEYS')) {
        const id = ++autoIncrements.surveys;
        tables.surveys.push({
          id,
          title: bindValues[0],
          group_id: bindValues[1] ?? null,
          instructions: bindValues[2] ?? '',
          created_at: new Date().toISOString(),
        });
        return { rowsAffected: 1, lastInsertId: id };
      }

      // INSERT INTO assignment_folders
      if (q.startsWith('INSERT INTO ASSIGNMENT_FOLDERS')) {
        const id = ++autoIncrements.assignment_folders;
        tables.assignment_folders.push({
          id,
          name: bindValues[0],
          parent_id: bindValues[1] ?? null,
          folder_type: bindValues[2] ?? 'assignment',
          group_id: bindValues[3] ?? null,
          instructions: bindValues[4] ?? '',
          created_at: new Date().toISOString(),
        });
        return { rowsAffected: 1, lastInsertId: id };
      }
      // UPDATE assignment_folders
      if (q.startsWith('UPDATE ASSIGNMENT_FOLDERS')) {
        if (q.includes('NAME') && q.includes('GROUP_ID') && q.includes('INSTRUCTIONS')) {
          const row = (tables.assignment_folders as any[]).find((f) => f.id === bindValues[3]);
          if (row) {
            row.name = bindValues[0];
            row.group_id = bindValues[1];
            row.instructions = bindValues[2];
          }
          return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
        }
        return { rowsAffected: 0, lastInsertId: 0 };
      }
      // DELETE FROM assignment_folders
      if (q.startsWith('DELETE FROM ASSIGNMENT_FOLDERS')) {
        const id = bindValues[0] as number;
        const deleteRecursive = (parentId: number) => {
          const children = (tables.assignment_folders as any[]).filter((f: any) => f.parent_id === parentId);
          for (const child of children) {
            deleteRecursive(child.id);
          }
          const idx = (tables.assignment_folders as any[]).findIndex((f: any) => f.id === parentId);
          if (idx >= 0) tables.assignment_folders.splice(idx, 1);
        };
        deleteRecursive(id);
        return { rowsAffected: 1, lastInsertId: 0 };
      }

      // INSERT INTO submissions
      if (q.startsWith('INSERT INTO SUBMISSIONS')) {
        const id = ++autoIncrements.submissions;
        tables.submissions.push({
          id,
          assignment_folder_id: bindValues[0],
          student_id: bindValues[1] ?? null,
          original_filename: bindValues[2],
          stored_path: bindValues[3],
          uploaded_at: new Date().toISOString(),
        });
        return { rowsAffected: 1, lastInsertId: id };
      }
      // UPDATE submissions SET student_id, stored_path, original_filename
      if (q.startsWith('UPDATE SUBMISSIONS') && q.includes('STUDENT_ID') && q.includes('ORIGINAL_FILENAME')) {
        const row = (tables.submissions as any[]).find((r) => r.id === bindValues[3]);
        if (row) {
          row.student_id = bindValues[0];
          row.stored_path = bindValues[1];
          row.original_filename = bindValues[2];
        }
        return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
      }
      // UPDATE submissions SET stored_path
      if (q.startsWith('UPDATE SUBMISSIONS') && q.includes('STORED_PATH')) {
        const row = (tables.submissions as any[]).find((r) => r.id === bindValues[1]);
        if (row) {
          row.stored_path = bindValues[0];
        }
        return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
      }
      // DELETE FROM submissions WHERE assignment_folder_id
      if (q.startsWith('DELETE FROM SUBMISSIONS') && q.includes('ASSIGNMENT_FOLDER_ID')) {
        const fid = bindValues[0];
        const before = tables.submissions.length;
        tables.submissions = (tables.submissions as any[]).filter((s) => s.assignment_folder_id !== fid);
        return { rowsAffected: before - tables.submissions.length, lastInsertId: 0 };
      }
      // DELETE FROM submissions WHERE id
      if (q.startsWith('DELETE FROM SUBMISSIONS')) {
        const idx = (tables.submissions as any[]).findIndex((s) => s.id === bindValues[0]);
        if (idx >= 0) tables.submissions.splice(idx, 1);
        return { rowsAffected: idx >= 0 ? 1 : 0, lastInsertId: 0 };
      }

      // INSERT OR REPLACE INTO completed_records
      if (q.includes('COMPLETED_RECORDS') && q.includes('INSERT')) {
        const existing = (tables.completed_records as any[]).find(
          (r) => r.student_id === bindValues[0] && r.group_id === bindValues[1]
        );
        if (existing) {
          existing.final_text = bindValues[2];
          existing.byte_count = bindValues[3];
          existing.status = bindValues[4];
          return { rowsAffected: 1, lastInsertId: existing.id };
        }
        const id = ++autoIncrements.completed_records;
        tables.completed_records.push({
          id,
          student_id: bindValues[0],
          group_id: bindValues[1],
          final_text: bindValues[2],
          byte_count: bindValues[3],
          status: bindValues[4],
          confirmed_at: null,
        });
        return { rowsAffected: 1, lastInsertId: id };
      }
      // UPDATE completed_records SET confirmed_at
      if (q.startsWith('UPDATE COMPLETED_RECORDS')) {
        const row = (tables.completed_records as any[]).find((r) => r.id === bindValues[1]);
        if (row) {
          row.status = '완성됨';
          row.confirmed_at = bindValues[0];
        }
        return { rowsAffected: row ? 1 : 0, lastInsertId: 0 };
      }

      // INSERT OR REPLACE INTO app_settings
      if (q.includes('APP_SETTINGS') && q.includes('INSERT')) {
        const existing = (tables.app_settings as any[]).find((s: any) => s.key === bindValues[0]);
        if (existing) {
          existing.value = bindValues[1];
        } else {
          tables.app_settings.push({ key: bindValues[0], value: bindValues[1] });
        }
        return { rowsAffected: 1, lastInsertId: 0 };
      }

      return { rowsAffected: 0, lastInsertId: 0 };
    },
  };
}

// ─── Init ─────────────────────────────────────────────────────────────
export async function initDatabase(): Promise<DatabaseLike> {
  if (db) return db;

  try {
    const Database = (await import('@tauri-apps/plugin-sql')).default;
    const instance = await Database.load('sqlite:salpeem.db');

    // Create tables — execute each statement individually (plugin-sql doesn't support multi-statement)
    const statements = CREATE_TABLES.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await instance.execute(stmt);
    }

    db = instance as unknown as DatabaseLike;

    // Migration: add assignment_folder_id to records if not exists
    try {
      await instance.execute(
        'ALTER TABLE records ADD COLUMN assignment_folder_id INTEGER DEFAULT NULL REFERENCES assignment_folders(id)'
      );
    } catch {
      // column already exists — ignore
    }

    // Migration: add group_id to surveys if not exists
    try {
      await instance.execute(
        'ALTER TABLE surveys ADD COLUMN group_id INTEGER REFERENCES groups(id)'
      );
    } catch {
      // column already exists — ignore
    }
  } catch (e) {
    console.warn('[salpeem] Tauri SQL not available, using in-memory stub:', e);
    db = createInMemoryDb();
  }

  return db;
}

async function getDb(): Promise<DatabaseLike> {
  if (!db) await initDatabase();
  return db!;
}

// ─── Students ─────────────────────────────────────────────────────────
export async function getStudents(): Promise<Student[]> {
  const d = await getDb();
  return d.select<Student[]>('SELECT * FROM students ORDER BY grade, class_name, student_no, name');
}

export async function addStudent(
  name: string,
  grade: string,
  class_name: string,
  student_no: number = 0
): Promise<{ lastInsertId: number }> {
  const d = await getDb();
  return d.execute('INSERT INTO students (name, grade, class_name, student_no) VALUES ($1, $2, $3, $4)', [
    name,
    grade,
    class_name,
    student_no,
  ]);
}

export async function updateStudent(
  id: number,
  name: string,
  grade: string,
  class_name: string,
  student_no: number = 0
): Promise<void> {
  const d = await getDb();
  await d.execute('UPDATE students SET name = $1, grade = $2, class_name = $3, student_no = $4 WHERE id = $5', [
    name,
    grade,
    class_name,
    student_no,
    id,
  ]);
}

export async function deleteStudent(id: number): Promise<void> {
  const d = await getDb();
  await d.execute('DELETE FROM students WHERE id = $1', [id]);
}

// ─── Groups ──────────────────────────────────────────────────────────
export async function getGroups(): Promise<Group[]> {
  const d = await getDb();
  return d.select<Group[]>('SELECT * FROM groups ORDER BY sort_order, created_at ASC');
}

export async function getGroupTree(): Promise<Group[]> {
  const flat = await getGroups();
  const map = new Map<number, Group>();
  const roots: Group[] = [];

  for (const g of flat) {
    map.set(g.id, { ...g, children: [] });
  }

  for (const g of flat) {
    const node = map.get(g.id)!;
    if (g.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(g.parent_id);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}

export async function addGroup(
  name: string,
  parent_id?: number | null,
  sort_order?: number,
  byte_limit?: number
): Promise<{ lastInsertId: number }> {
  const d = await getDb();
  return d.execute(
    'INSERT INTO groups (name, parent_id, sort_order, byte_limit) VALUES ($1, $2, $3, $4)',
    [name, parent_id ?? null, sort_order ?? 0, byte_limit ?? 1500]
  );
}

export async function updateGroup(
  id: number,
  name: string,
  byte_limit?: number
): Promise<void> {
  const d = await getDb();
  await d.execute('UPDATE groups SET name = $1, byte_limit = $2 WHERE id = $3', [
    name,
    byte_limit ?? 1500,
    id,
  ]);
}

export async function deleteGroup(id: number): Promise<void> {
  const d = await getDb();
  // Get all children recursively and delete from leaves up
  const all = await d.select<Group[]>('SELECT * FROM groups');
  const toDelete: number[] = [];
  const collectIds = (parentId: number) => {
    const children = all.filter((g) => g.parent_id === parentId);
    for (const child of children) {
      collectIds(child.id);
    }
    toDelete.push(parentId);
  };
  collectIds(id);
  // Move orphaned records back to inbox, drop stale completed drafts, null FK refs
  for (const groupId of toDelete) {
    await d.execute('UPDATE records SET group_id = NULL WHERE group_id = $1', [groupId]);
    // completed_records has NOT NULL group_id constraint → must delete
    await d.execute('DELETE FROM completed_records WHERE group_id = $1', [groupId]);
    await d.execute('UPDATE surveys SET group_id = NULL WHERE group_id = $1', [groupId]);
    await d.execute('UPDATE assignments SET group_id = NULL WHERE group_id = $1', [groupId]);
    await d.execute('UPDATE assignment_folders SET group_id = NULL WHERE group_id = $1', [groupId]);
  }
  for (const groupId of toDelete) {
    await d.execute('DELETE FROM groups WHERE id = $1', [groupId]);
  }
}

export async function moveGroup(id: number, newParentId: number | null): Promise<void> {
  const d = await getDb();
  await d.execute('UPDATE groups SET parent_id = $1 WHERE id = $2', [newParentId, id]);
}

export async function getGroupChildren(parent_id: number | null): Promise<Group[]> {
  const d = await getDb();
  if (parent_id === null) {
    return d.select<Group[]>(
      'SELECT * FROM groups WHERE parent_id IS NULL ORDER BY sort_order, created_at ASC'
    );
  }
  return d.select<Group[]>(
    'SELECT * FROM groups WHERE parent_id = $1 ORDER BY sort_order, created_at ASC',
    [parent_id]
  );
}

// ─── Records ──────────────────────────────────────────────────────────
export async function getRecords(): Promise<SalpeemRecord[]> {
  const d = await getDb();
  return d.select<SalpeemRecord[]>(`
    SELECT r.*, s.name AS student_name, g.name AS group_name
    FROM records r
    LEFT JOIN students s ON r.student_id = s.id
    LEFT JOIN groups g ON r.group_id = g.id
    ORDER BY r.created_at DESC
  `);
}

export async function getInboxRecords(): Promise<SalpeemRecord[]> {
  const d = await getDb();
  return d.select<SalpeemRecord[]>(`
    SELECT r.*, s.name AS student_name, g.name AS group_name
    FROM records r
    LEFT JOIN students s ON r.student_id = s.id
    LEFT JOIN groups g ON r.group_id = g.id
    WHERE r.student_id IS NULL OR r.group_id IS NULL
    ORDER BY r.created_at DESC
  `);
}

export async function getRecordsByGroup(groupId: number): Promise<SalpeemRecord[]> {
  const d = await getDb();
  return d.select<SalpeemRecord[]>(`
    SELECT r.*, s.name AS student_name, g.name AS group_name
    FROM records r
    LEFT JOIN students s ON r.student_id = s.id
    LEFT JOIN groups g ON r.group_id = g.id
    WHERE r.group_id = $1
    ORDER BY r.created_at DESC
  `, [groupId]);
}

/**
 * Returns all records belonging to groupId OR any of its descendants.
 * Used when selecting a parent group to show the union of all nested records.
 */
export async function getRecordsByGroupRecursive(groupId: number): Promise<SalpeemRecord[]> {
  const d = await getDb();
  const all = await d.select<Group[]>('SELECT * FROM groups');
  const ids: number[] = [];
  const collect = (parentId: number) => {
    ids.push(parentId);
    for (const child of all.filter((g) => g.parent_id === parentId)) {
      collect(child.id);
    }
  };
  collect(groupId);
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  return d.select<SalpeemRecord[]>(
    `SELECT r.*, s.name AS student_name, g.name AS group_name
     FROM records r
     LEFT JOIN students s ON r.student_id = s.id
     LEFT JOIN groups g ON r.group_id = g.id
     WHERE r.group_id IN (${placeholders})
     ORDER BY r.created_at DESC`,
    ids
  );
}

export async function getRecordsByFilter(
  studentIds?: number[],
  groupIds?: number[]
): Promise<SalpeemRecord[]> {
  const d = await getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (studentIds && studentIds.length > 0) {
    const placeholders = studentIds.map(() => `$${paramIdx++}`).join(', ');
    conditions.push(`r.student_id IN (${placeholders})`);
    params.push(...studentIds);
  }

  if (groupIds && groupIds.length > 0) {
    const placeholders = groupIds.map(() => `$${paramIdx++}`).join(', ');
    conditions.push(`r.group_id IN (${placeholders})`);
    params.push(...groupIds);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return d.select<SalpeemRecord[]>(`
    SELECT r.*, s.name AS student_name, g.name AS group_name
    FROM records r
    LEFT JOIN students s ON r.student_id = s.id
    LEFT JOIN groups g ON r.group_id = g.id
    ${where}
    ORDER BY r.created_at DESC
  `, params);
}

export async function addRecord(
  raw_input: string,
  generated_sentence: string,
  student_id?: number | null,
  group_id?: number | null,
  source?: RecordSource,
  importance?: Importance,
  assignment_folder_id?: number | null
): Promise<{ lastInsertId: number }> {
  const d = await getDb();
  return d.execute(
    `INSERT INTO records (raw_input, generated_sentence, student_id, group_id, source, importance, assignment_folder_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      raw_input,
      generated_sentence,
      student_id ?? null,
      group_id ?? null,
      source ?? '기록',
      importance ?? '보통',
      assignment_folder_id ?? null,
    ]
  );
}

export async function updateRecordAssignment(
  id: number,
  student_id: number,
  group_id: number
): Promise<void> {
  const d = await getDb();
  await d.execute('UPDATE records SET student_id = $1, group_id = $2 WHERE id = $3', [
    student_id,
    group_id,
    id,
  ]);
}

export async function updateRecordImportance(id: number, importance: Importance): Promise<void> {
  const d = await getDb();
  await d.execute('UPDATE records SET importance = $1 WHERE id = $2', [importance, id]);
}

export async function updateRecordText(
  id: number,
  raw_input: string,
  generated_sentence: string,
  is_edited: boolean
): Promise<void> {
  const d = await getDb();
  await d.execute(
    'UPDATE records SET raw_input = $1, generated_sentence = $2, is_edited = $3 WHERE id = $4',
    [raw_input, generated_sentence, is_edited ? 1 : 0, id]
  );
}

export async function deleteRecord(id: number): Promise<void> {
  const d = await getDb();
  await d.execute('DELETE FROM records WHERE id = $1', [id]);
}

export async function getRecordCountByStudentAndGroup(
  student_id: number,
  group_id: number
): Promise<number> {
  const d = await getDb();
  const result = await d.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM records WHERE student_id = $1 AND group_id = $2',
    [student_id, group_id]
  );
  return result[0]?.count ?? 0;
}

/**
 * Record count including every descendant group of `group_id`.
 * Used by CompletionView so that selecting a parent group shows the full body
 * of sentences that would contribute to the student's final draft.
 */
export async function getRecordCountByStudentAndGroupRecursive(
  student_id: number,
  group_id: number
): Promise<number> {
  const d = await getDb();
  const all = await d.select<Group[]>('SELECT * FROM groups');
  const ids: number[] = [];
  const collect = (parentId: number) => {
    ids.push(parentId);
    for (const child of all.filter((g) => g.parent_id === parentId)) {
      collect(child.id);
    }
  };
  collect(group_id);
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
  const result = await d.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM records WHERE student_id = $1 AND group_id IN (${placeholders})`,
    [student_id, ...ids]
  );
  return result[0]?.count ?? 0;
}

// ─── Assignments ──────────────────────────────────────────────────────
export async function getAssignments(): Promise<Assignment[]> {
  const d = await getDb();
  return d.select<Assignment[]>('SELECT * FROM assignments ORDER BY created_at DESC');
}

export async function addAssignment(
  title: string,
  group_id: number,
  instructions: string
): Promise<{ lastInsertId: number }> {
  const d = await getDb();
  return d.execute(
    'INSERT INTO assignments (title, group_id, instructions) VALUES ($1, $2, $3)',
    [title, group_id, instructions]
  );
}

// ─── Surveys ──────────────────────────────────────────────────────────
export async function getSurveys(): Promise<Survey[]> {
  const d = await getDb();
  return d.select<Survey[]>('SELECT * FROM surveys ORDER BY created_at DESC');
}

export async function addSurvey(
  title: string,
  instructions: string,
  group_id?: number | null
): Promise<{ lastInsertId: number }> {
  const d = await getDb();
  return d.execute(
    'INSERT INTO surveys (title, group_id, instructions) VALUES ($1, $2, $3)',
    [title, group_id ?? null, instructions]
  );
}

// ─── CompletedRecords ─────────────────────────────────────────────────
export async function getCompletedRecords(): Promise<CompletedRecord[]> {
  const d = await getDb();
  return d.select<CompletedRecord[]>(`
    SELECT cr.*, s.name AS student_name, g.name AS group_name
    FROM completed_records cr
    LEFT JOIN students s ON cr.student_id = s.id
    LEFT JOIN groups g ON cr.group_id = g.id
    ORDER BY cr.id
  `);
}

export async function getCompletedRecord(
  student_id: number,
  group_id: number
): Promise<CompletedRecord | null> {
  const d = await getDb();
  const rows = await d.select<CompletedRecord[]>(
    `SELECT cr.*, s.name AS student_name, g.name AS group_name
     FROM completed_records cr
     LEFT JOIN students s ON cr.student_id = s.id
     LEFT JOIN groups g ON cr.group_id = g.id
     WHERE cr.student_id = $1 AND cr.group_id = $2`,
    [student_id, group_id]
  );
  return rows[0] ?? null;
}

export async function upsertCompletedRecord(
  student_id: number,
  group_id: number,
  final_text: string,
  byte_count: number,
  status: '미완성' | '완성됨'
): Promise<void> {
  const d = await getDb();
  await d.execute(
    `INSERT INTO completed_records (student_id, group_id, final_text, byte_count, status)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT(student_id, group_id) DO UPDATE SET
       final_text = excluded.final_text,
       byte_count = excluded.byte_count,
       status = excluded.status`,
    [student_id, group_id, final_text, byte_count, status]
  );
}

export async function confirmCompletedRecord(id: number): Promise<void> {
  const d = await getDb();
  await d.execute(
    `UPDATE completed_records SET status = '완성됨', confirmed_at = datetime('now','localtime') WHERE id = $1`,
    [id]
  );
}

// ─── Settings ─────────────────────────────────────────────────────────
export async function getSetting(key: string): Promise<string | null> {
  const d = await getDb();
  const rows = await d.select<{ key: string; value: string }[]>(
    'SELECT * FROM app_settings WHERE key = $1',
    [key]
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES ($1, $2)',
    [key, value]
  );
}

export async function getAllSettings(): Promise<Array<{ key: string; value: string }>> {
  const d = await getDb();
  return d.select<{ key: string; value: string }[]>('SELECT * FROM app_settings');
}

// ─── AssignmentFolders ───────────────────────────────────────────────
export async function getAssignmentFolders(): Promise<AssignmentFolder[]> {
  const d = await getDb();
  return d.select<AssignmentFolder[]>('SELECT * FROM assignment_folders ORDER BY created_at ASC');
}

export async function addAssignmentFolder(
  name: string,
  parent_id?: number | null,
  folder_type?: 'assignment' | 'survey',
  group_id?: number | null,
  instructions?: string
): Promise<{ lastInsertId: number }> {
  const d = await getDb();
  return d.execute(
    'INSERT INTO assignment_folders (name, parent_id, folder_type, group_id, instructions) VALUES ($1, $2, $3, $4, $5)',
    [name, parent_id ?? null, folder_type ?? 'assignment', group_id ?? null, instructions ?? '']
  );
}

export async function updateAssignmentFolder(
  id: number,
  name: string,
  group_id?: number | null,
  instructions?: string
): Promise<void> {
  const d = await getDb();
  await d.execute(
    'UPDATE assignment_folders SET name = $1, group_id = $2, instructions = $3 WHERE id = $4',
    [name, group_id ?? null, instructions ?? '', id]
  );
}

export async function deleteAssignmentFolder(id: number): Promise<void> {
  const d = await getDb();
  const all = await d.select<AssignmentFolder[]>('SELECT * FROM assignment_folders');
  const toDelete: number[] = [];
  const collectIds = (parentId: number) => {
    const children = all.filter((f) => f.parent_id === parentId);
    for (const child of children) {
      collectIds(child.id);
    }
    toDelete.push(parentId);
  };
  collectIds(id);
  // Detach records before deleting the folders so they stay in inbox/group
  for (const folderId of toDelete) {
    await d.execute(
      'UPDATE records SET assignment_folder_id = NULL WHERE assignment_folder_id = $1',
      [folderId]
    );
  }
  for (const folderId of toDelete) {
    await d.execute('DELETE FROM assignment_folders WHERE id = $1', [folderId]);
  }
}

export async function getAssignmentFolderChildren(parent_id: number | null): Promise<AssignmentFolder[]> {
  const d = await getDb();
  if (parent_id === null) {
    return d.select<AssignmentFolder[]>(
      'SELECT * FROM assignment_folders WHERE parent_id IS NULL ORDER BY created_at ASC'
    );
  }
  return d.select<AssignmentFolder[]>(
    'SELECT * FROM assignment_folders WHERE parent_id = $1 ORDER BY created_at ASC',
    [parent_id]
  );
}

// ─── Records by assignment folder ────────────────────────────────────
export async function getRecordsByAssignmentFolder(folderId: number): Promise<SalpeemRecord[]> {
  const d = await getDb();
  return d.select<SalpeemRecord[]>(`
    SELECT r.*, s.name AS student_name, g.name AS group_name
    FROM records r
    LEFT JOIN students s ON r.student_id = s.id
    LEFT JOIN groups g ON r.group_id = g.id
    WHERE r.assignment_folder_id = $1
    ORDER BY r.created_at DESC
  `, [folderId]);
}

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
  storedPath: string,
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
  originalFilename: string,
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
  studentId: number,
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

export async function getDefaultSubmissionRoot(): Promise<string> {
  try {
    const { documentDir, join } = await import('@tauri-apps/api/path');
    const docs = await documentDir();
    return await join(docs, '살핌', '제출물');
  } catch {
    return '';
  }
}

// ─── Seed test students ──────────────────────────────────────────────
const KOREAN_LAST_NAMES = ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','전'];
const KOREAN_FIRST_NAMES = ['민준','서윤','예준','하은','도윤','지우','시우','서연','하준','지민','은우','수아','지호','다은','예서','지아','현우','채원','준서','소율','건우','지윤','유준','나은','선우','하윤','민서','가은','우진','수민'];

export async function seedTestStudents(): Promise<void> {
  const d = await getDb();
  const existing = await d.select<Student[]>('SELECT * FROM students');
  if (existing.length > 0) return; // already has students

  for (let classNum = 1; classNum <= 5; classNum++) {
    for (let num = 1; num <= 20; num++) {
      const lastName = KOREAN_LAST_NAMES[Math.floor(Math.random() * KOREAN_LAST_NAMES.length)];
      const firstName = KOREAN_FIRST_NAMES[Math.floor(Math.random() * KOREAN_FIRST_NAMES.length)];
      const name = lastName + firstName;
      const grade = '1학년';
      const className = `${classNum}반`;
      const studentNo = num;
      await d.execute(
        'INSERT INTO students (name, grade, class_name, student_no) VALUES ($1, $2, $3, $4)',
        [name, grade, className, studentNo]
      );
    }
  }
}
