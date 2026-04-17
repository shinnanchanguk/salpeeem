import React, { useMemo, useState } from 'react';
import type { Submission, Student, AssignmentFolder } from '@/types';
import { useStudentStore } from '@/stores/useStudentStore';

type Status = 'all' | 'submitted' | 'missing';

interface Props {
  folder: AssignmentFolder;
  submissions: Submission[];
  onOpenFile: (path: string) => void;
  onAssignUnmatched: (submissionId: number, studentId: number) => Promise<void>;
  onDropFileOnStudent: (studentId: number, files: File[]) => Promise<void>;
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #000',
  borderRadius: 6,
  backgroundColor: '#fff',
  fontSize: 13,
  fontFamily: 'inherit',
};

export function SubmissionRosterPanel({
  folder: _folder,
  submissions,
  onOpenFile,
  onAssignUnmatched,
  onDropFileOnStudent,
}: Props) {
  const { students } = useStudentStore();
  const [grade, setGrade] = useState<string>('all');
  const [className, setClassName] = useState<string>('all');
  const [status, setStatus] = useState<Status>('all');

  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade))).sort(),
    [students]
  );
  const classNames = useMemo(() => {
    const pool = grade === 'all' ? students : students.filter((s) => s.grade === grade);
    return Array.from(new Set(pool.map((s) => s.class_name))).sort();
  }, [students, grade]);

  const unmatched = submissions.filter((s) => s.student_id === null);

  const subByStudent = useMemo(() => {
    const m = new Map<number, Submission>();
    for (const s of submissions) if (s.student_id) m.set(s.student_id, s);
    return m;
  }, [submissions]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (grade !== 'all') list = list.filter((s) => s.grade === grade);
    if (className !== 'all') list = list.filter((s) => s.class_name === className);
    if (status === 'submitted') list = list.filter((s) => subByStudent.has(s.id));
    if (status === 'missing') list = list.filter((s) => !subByStudent.has(s.id));
    return [...list].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      if (a.class_name !== b.class_name) return a.class_name.localeCompare(b.class_name);
      return a.student_no - b.student_no;
    });
  }, [students, grade, className, status, subByStudent]);

  return (
    <div
      style={{
        width: 360,
        borderLeft: '1px solid #000',
        backgroundColor: '#F4F4F2',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: 16, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>제출 현황</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              setClassName('all');
            }}
            style={selectStyle}
          >
            <option value="all">모든 학년</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select value={className} onChange={(e) => setClassName(e.target.value)} style={selectStyle}>
            <option value="all">모든 반</option>
            {classNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {unmatched.length > 0 && (
        <UnmatchedPile items={unmatched} students={students} onAssign={onAssignUnmatched} />
      )}

      <div style={{ flex: 1 }}>
        {filteredStudents.map((s) => {
          const sub = subByStudent.get(s.id) ?? null;
          return (
            <StudentRow
              key={s.id}
              student={s}
              submission={sub}
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

function StudentRow({
  student,
  submission,
  onOpen,
  onDropFiles,
}: {
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
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
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
        <span style={{ fontSize: 12, color: '#555', minWidth: 60 }}>
          {student.grade} {student.class_name}
        </span>
        <span style={{ fontSize: 12, color: '#555', width: 34 }}>{student.student_no}번</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', flex: 1 }}>{student.name}</span>
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            fontWeight: 600,
            backgroundColor: submitted ? '#D1FAE5' : '#FEF3C7',
            color: submitted ? '#065F46' : '#92400E',
          }}
        >
          {submitted ? '제출' : '미제출'}
        </span>
      </div>
      {submitted && submission && (
        <div
          style={{ fontSize: 12, color: '#555', paddingLeft: 100, cursor: 'pointer' }}
          onClick={onOpen}
          title={submission.stored_path}
        >
          📎 {submission.original_filename}
        </div>
      )}
    </div>
  );
}

function UnmatchedPile({
  items,
  students,
  onAssign,
}: {
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
        <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
          ⚠ 미매칭 파일 {items.length}개
        </span>
        <span style={{ fontSize: 11, color: '#92400E' }}>{open ? '접기' : '지정 >'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((it) => (
            <div key={it.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
              <span
                style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={it.original_filename}
              >
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
                <option value="" disabled>
                  학생 선택
                </option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.grade} {s.class_name} {s.student_no}번 {s.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
