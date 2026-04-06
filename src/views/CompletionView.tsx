import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStudentStore } from '@/stores/useStudentStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useCompletionStore } from '@/stores/useCompletionStore';
import { getRecordCountByStudentAndGroup } from '@/lib/database';
import type { Student } from '@/types';

interface CompletionViewProps {
  onStudentClick?: (studentName: string, areaName: string) => void;
}

// ─── Styles (copied from CompletionScreen.tsx) ──────────────────────────

const customStyles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #000000',
    backgroundColor: '#EAEAE6',
    flexShrink: 0,
    overflowY: 'auto',
  },
  sidebarSection: {
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebarHeader: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#111111',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarDivider: {
    height: '1px',
    backgroundColor: '#000000',
    opacity: 0.15,
    margin: '0 20px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    border: '1px solid #000000',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#111111',
  },
  treeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  treeNode: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  btnExpand: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#555555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    width: '20px',
    height: '20px',
  },
  treeChildren: {
    paddingLeft: '26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px',
  },
  checkboxList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#111111',
    padding: '4px 0',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#EAEAE6',
    minWidth: 0,
    overflowY: 'auto',
    padding: '40px 56px',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
  },
  viewToggle: {
    display: 'flex',
    background: '#F4F4F2',
    borderRadius: '8px',
    padding: '4px',
    border: '1px solid #000000',
  },
  toggleBtnBase: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#555555',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  toggleBtnActive: {
    background: '#ffffff',
    color: '#111111',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  actionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  targetBytes: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#111111',
  },
  targetInput: {
    width: '76px',
    height: '36px',
    border: '1px solid #000000',
    borderRadius: '6px',
    textAlign: 'right' as const,
    padding: '0 12px',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    fontWeight: 500,
  },
  byteHint: {
    color: '#555555',
    fontWeight: 400,
    fontSize: '13px',
  },
  btnPrimary: {
    background: '#111111',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    height: '40px',
    padding: '0 24px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '900px',
  },
  accordionItem: {
    border: '1px solid #000000',
    borderRadius: '12px',
    background: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
  },
  accordionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: '#F4F4F2',
    cursor: 'pointer',
    borderBottom: '1px solid #000000',
    transition: 'background 0.2s',
  },
  headerTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  accordionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#111111',
  },
  accordionStats: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#555555',
    background: 'rgba(0,0,0,0.05)',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  accordionBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  studentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 24px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    transition: 'background 0.2s',
  },
  stuInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  stuName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#111111',
    width: '70px',
  },
  stuClass: {
    fontSize: '14px',
    color: '#555555',
    width: '80px',
  },
  stuBadge: {
    background: '#EAEAE6',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#555555',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  statusBadgeDone: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '6px',
    color: '#10B981',
    background: 'rgba(16, 185, 129, 0.08)',
  },
  statusBadgePending: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '6px',
    color: '#555555',
    background: 'rgba(0, 0, 0, 0.04)',
  },
  statusDotDone: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
  },
  statusDotPending: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#555555',
  },
  statusBadgeGenerating: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '6px',
    color: '#F59E0B',
    background: 'rgba(245, 158, 11, 0.08)',
  },
  progressBar: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#555555',
    padding: '12px 0',
  },
};

// ─── Sub-components ──────────────────────────────────────────────────

interface CustomCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  label,
  style = {},
  labelStyle = {},
}) => {
  const filled = checked || indeterminate;
  const checkboxStyle: React.CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: '18px',
    height: '18px',
    border: '1px solid #000000',
    borderRadius: '4px',
    backgroundColor: filled ? '#111111' : '#ffffff',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'all 0.2s',
    display: 'inline-block',
  };

  return (
    <label style={{ ...customStyles.checkboxLabel, ...style }} onClick={onChange}>
      <span style={{ position: 'relative', width: '18px', height: '18px', flexShrink: 0 }}>
        <span style={checkboxStyle}></span>
        {checked && !indeterminate && (
          <span
            style={{
              position: 'absolute',
              left: '5px',
              top: '2px',
              width: '5px',
              height: '10px',
              border: 'solid white',
              borderWidth: '0 2px 2px 0',
              transform: 'rotate(45deg)',
              display: 'block',
            }}
          ></span>
        )}
        {indeterminate && (
          <span
            style={{
              position: 'absolute',
              left: '4px',
              top: '7px',
              width: '10px',
              height: '2px',
              backgroundColor: 'white',
              display: 'block',
            }}
          ></span>
        )}
      </span>
      <span style={labelStyle}>{label}</span>
    </label>
  );
};

const ChevronIcon: React.FC<{ expanded: boolean; size?: number }> = ({ expanded, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
      transition: 'transform 0.2s',
    }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg
    style={{ color: '#555555' }}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// ─── Row display types ───────────────────────────────────────────────

interface RowData {
  studentId: number;
  groupId: number;
  name: string;
  classInfo: string;
  sentences: number;
  status: 'done' | 'pending' | 'generating';
}

interface StudentRowProps {
  row: RowData;
  isLast: boolean;
  onClick?: () => void;
}

const StudentRowItem: React.FC<StudentRowProps> = ({ row, isLast, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const statusBadge =
    row.status === 'done' ? (
      <div style={customStyles.statusBadgeDone}>
        <span style={customStyles.statusDotDone}></span>
        완성됨
      </div>
    ) : row.status === 'generating' ? (
      <div style={customStyles.statusBadgeGenerating}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#F59E0B',
          }}
        ></span>
        생성중...
      </div>
    ) : (
      <div style={customStyles.statusBadgePending}>
        <span style={customStyles.statusDotPending}></span>
        미완성
      </div>
    );

  return (
    <div
      style={{
        ...customStyles.studentRow,
        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.06)',
        background: hovered ? '#FAFAFA' : 'transparent',
        cursor: onClick ? 'pointer' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div style={customStyles.stuInfo}>
        <span style={customStyles.stuName}>{row.name}</span>
        <span style={customStyles.stuClass}>{row.classInfo}</span>
        <span style={customStyles.stuBadge}>문장 {row.sentences}건</span>
      </div>
      {statusBadge}
    </div>
  );
};

// ─── Accordion ───────────────────────────────────────────────────────

interface AccordionProps {
  title: string;
  stats: string;
  rows: RowData[];
  collapsed?: boolean;
  dimmed?: boolean;
  onRowClick?: (row: RowData) => void;
}

const AccordionItem: React.FC<AccordionProps> = ({
  title,
  stats,
  rows,
  collapsed = false,
  dimmed = false,
  onRowClick,
}) => {
  const [isOpen, setIsOpen] = useState(!collapsed);
  const [headerHovered, setHeaderHovered] = useState(false);

  return (
    <div style={{ ...customStyles.accordionItem, opacity: dimmed ? 0.6 : 1 }}>
      <div
        style={{
          ...customStyles.accordionHeader,
          background: headerHovered ? '#EFEFEA' : '#F4F4F2',
          borderBottom: !isOpen || dimmed ? 'none' : '1px solid #000000',
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div style={customStyles.headerTitleWrapper}>
          <ChevronIcon expanded={isOpen} size={20} />
          <h3 style={customStyles.accordionTitle}>{title}</h3>
        </div>
        <div style={customStyles.accordionStats}>{stats}</div>
      </div>
      {isOpen && rows.length > 0 && (
        <div style={customStyles.accordionBody}>
          {rows.map((row, index) => (
            <StudentRowItem
              key={`${row.studentId}-${row.groupId}`}
              row={row}
              isLast={index === rows.length - 1}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Tree structures ─────────────────────────────────────────────────

interface ClassGroup {
  grade: string;
  className: string;
  students: Student[];
}

interface GradeGroup {
  grade: string;
  classes: ClassGroup[];
}

function buildGradeTree(students: Student[]): GradeGroup[] {
  const gradeMap = new Map<string, Map<string, Student[]>>();
  for (const s of students) {
    if (!gradeMap.has(s.grade)) gradeMap.set(s.grade, new Map());
    const classMap = gradeMap.get(s.grade)!;
    if (!classMap.has(s.class_name)) classMap.set(s.class_name, []);
    classMap.get(s.class_name)!.push(s);
  }
  const result: GradeGroup[] = [];
  const sortedGrades = [...gradeMap.keys()].sort();
  for (const grade of sortedGrades) {
    const classMap = gradeMap.get(grade)!;
    const classes: ClassGroup[] = [];
    const sortedClasses = [...classMap.keys()].sort();
    for (const cn of sortedClasses) {
      classes.push({
        grade,
        className: cn,
        students: classMap.get(cn)!.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
    result.push({ grade, classes });
  }
  return result;
}

// ─── Main Component ──────────────────────────────────────────────────

export function CompletionView({ onStudentClick }: CompletionViewProps) {
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const {
    completedRecords,
    fetchCompletedRecords,
    generateDraft,
    generatingIds,
  } = useCompletionStore();

  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());

  // UI state
  const [searchText, setSearchText] = useState('');
  const [activeView, setActiveView] = useState<'area' | 'student'>('area');
  const [targetBytes, setTargetBytes] = useState<number | string>(1500);
  const [btnHovered, setBtnHovered] = useState(false);

  // Tree expand state
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  // Sentence counts cache: "studentId-groupId" -> count
  const [sentenceCounts, setSentenceCounts] = useState<Map<string, number>>(new Map());

  // Batch generation progress
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    done: number;
    running: boolean;
  } | null>(null);

  // Initial data fetch
  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchCompletedRecords();
  }, [fetchStudents, fetchGroups, fetchCompletedRecords]);

  // Select all students and groups on first load
  useEffect(() => {
    if (students.length > 0 && selectedStudentIds.size === 0) {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
      // Expand all grades and classes by default
      const grades = new Set(students.map((s) => s.grade));
      setExpandedGrades(grades);
      const classKeys = new Set(students.map((s) => `${s.grade}/${s.class_name}`));
      setExpandedClasses(classKeys);
    }
  }, [students, selectedStudentIds.size]);

  useEffect(() => {
    if (groups.length > 0 && selectedGroupIds.size === 0) {
      setSelectedGroupIds(new Set(groups.map((g) => g.id)));
    }
  }, [groups, selectedGroupIds.size]);

  // Auto-select view mode based on counts
  useEffect(() => {
    const areaCount = selectedGroupIds.size;
    const studentCount = selectedStudentIds.size;
    if (areaCount === 0 && studentCount === 0) return;
    setActiveView(areaCount <= studentCount ? 'area' : 'student');
  }, [selectedGroupIds.size, selectedStudentIds.size]);

  // Build grade tree from students, filtered by search
  const filteredStudents = useMemo(() => {
    if (!searchText.trim()) return students;
    return students.filter((s) => s.name.includes(searchText.trim()));
  }, [students, searchText]);

  const gradeTree = useMemo(() => buildGradeTree(filteredStudents), [filteredStudents]);

  // Fetch sentence counts whenever selection changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const newCounts = new Map<string, number>();
      const promises: Promise<void>[] = [];
      for (const sid of selectedStudentIds) {
        for (const cid of selectedGroupIds) {
          const key = `${sid}-${cid}`;
          promises.push(
            getRecordCountByStudentAndGroup(sid, cid).then((count) => {
              if (!cancelled) newCounts.set(key, count);
            })
          );
        }
      }
      await Promise.all(promises);
      if (!cancelled) setSentenceCounts(newCounts);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedStudentIds, selectedGroupIds, completedRecords]);

  // Lookup helpers
  const getStatus = useCallback(
    (studentId: number, groupId: number): 'done' | 'pending' | 'generating' => {
      const key = `${studentId}-${groupId}`;
      if (generatingIds.has(key)) return 'generating';
      const rec = completedRecords.find(
        (r) => r.student_id === studentId && r.group_id === groupId
      );
      if (rec && rec.status === '완성됨') return 'done';
      return 'pending';
    },
    [completedRecords, generatingIds]
  );

  const getSentenceCount = useCallback(
    (studentId: number, groupId: number): number => {
      return sentenceCounts.get(`${studentId}-${groupId}`) ?? 0;
    },
    [sentenceCounts]
  );

  // Selection helpers
  const allStudentIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const isAllSelected =
    allStudentIds.size > 0 && allStudentIds.size === selectedStudentIds.size;
  const isSomeSelected = selectedStudentIds.size > 0 && !isAllSelected;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(allStudentIds));
    }
  }

  function toggleGrade(grade: string) {
    const gradeStudentIds = students.filter((s) => s.grade === grade).map((s) => s.id);
    const allIn = gradeStudentIds.every((id) => selectedStudentIds.has(id));
    const next = new Set(selectedStudentIds);
    if (allIn) {
      gradeStudentIds.forEach((id) => next.delete(id));
    } else {
      gradeStudentIds.forEach((id) => next.add(id));
    }
    setSelectedStudentIds(next);
  }

  function toggleClass(grade: string, className: string) {
    const classStudentIds = students
      .filter((s) => s.grade === grade && s.class_name === className)
      .map((s) => s.id);
    const allIn = classStudentIds.every((id) => selectedStudentIds.has(id));
    const next = new Set(selectedStudentIds);
    if (allIn) {
      classStudentIds.forEach((id) => next.delete(id));
    } else {
      classStudentIds.forEach((id) => next.add(id));
    }
    setSelectedStudentIds(next);
  }

  function toggleStudent(id: number) {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  }

  function toggleGroup(id: number) {
    const next = new Set(selectedGroupIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGroupIds(next);
  }

  function toggleExpandGrade(grade: string) {
    const next = new Set(expandedGrades);
    if (next.has(grade)) next.delete(grade);
    else next.add(grade);
    setExpandedGrades(next);
  }

  function toggleExpandClass(key: string) {
    const next = new Set(expandedClasses);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedClasses(next);
  }

  // Grade/class checkbox states
  function isGradeChecked(grade: string): boolean {
    return students
      .filter((s) => s.grade === grade)
      .every((s) => selectedStudentIds.has(s.id));
  }
  function isGradeIndeterminate(grade: string): boolean {
    const gradeStudents = students.filter((s) => s.grade === grade);
    const count = gradeStudents.filter((s) => selectedStudentIds.has(s.id)).length;
    return count > 0 && count < gradeStudents.length;
  }
  function isClassChecked(grade: string, className: string): boolean {
    return students
      .filter((s) => s.grade === grade && s.class_name === className)
      .every((s) => selectedStudentIds.has(s.id));
  }
  function isClassIndeterminate(grade: string, className: string): boolean {
    const classStudents = students.filter(
      (s) => s.grade === grade && s.class_name === className
    );
    const count = classStudents.filter((s) => selectedStudentIds.has(s.id)).length;
    return count > 0 && count < classStudents.length;
  }

  // Build rows for area-view
  function buildAreaRows(groupId: number): RowData[] {
    const selectedStudents = students.filter((s) => selectedStudentIds.has(s.id));
    return selectedStudents.map((s) => ({
      studentId: s.id,
      groupId,
      name: s.name,
      classInfo: `${s.grade}학년 ${s.class_name}반`,
      sentences: getSentenceCount(s.id, groupId),
      status: getStatus(s.id, groupId),
    }));
  }

  // Build rows for student-view
  function buildStudentRows(studentId: number): RowData[] {
    const selectedGroups = groups.filter((g) => selectedGroupIds.has(g.id));
    const student = students.find((s) => s.id === studentId);
    if (!student) return [];
    return selectedGroups.map((g) => ({
      studentId,
      groupId: g.id,
      name: g.name,
      classInfo: `${student.grade}학년 ${student.class_name}반`,
      sentences: getSentenceCount(studentId, g.id),
      status: getStatus(studentId, g.id),
    }));
  }

  // Batch generation
  async function handleGenerateAll() {
    const pairs: { studentId: number; groupId: number }[] = [];
    for (const sid of selectedStudentIds) {
      for (const cid of selectedGroupIds) {
        pairs.push({ studentId: sid, groupId: cid });
      }
    }
    if (pairs.length === 0) return;

    setBatchProgress({ total: pairs.length, done: 0, running: true });
    let done = 0;
    for (const pair of pairs) {
      await generateDraft(pair.studentId, pair.groupId);
      done++;
      setBatchProgress({ total: pairs.length, done, running: done < pairs.length });
    }
    setBatchProgress({ total: pairs.length, done: pairs.length, running: false });
  }

  // Selected lists for main view
  const selectedGroupsList = useMemo(
    () => groups.filter((g) => selectedGroupIds.has(g.id)),
    [groups, selectedGroupIds]
  );
  const selectedStudentsList = useMemo(
    () => students.filter((s) => selectedStudentIds.has(s.id)),
    [students, selectedStudentIds]
  );

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Sidebar */}
      <div style={customStyles.sidebar}>
        {/* Student Section */}
        <div style={customStyles.sidebarSection}>
          <div style={customStyles.sidebarHeader}>
            학생
            <CustomCheckbox
              checked={isAllSelected}
              indeterminate={isSomeSelected}
              onChange={toggleSelectAll}
              label="전체 선택"
              style={{ fontSize: '12px', fontWeight: 500, color: '#555555' }}
              labelStyle={{ fontSize: '12px', fontWeight: 500, color: '#555555' }}
            />
          </div>

          <div style={customStyles.searchBox}>
            <SearchIcon />
            <input
              type="text"
              placeholder="이름으로 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={customStyles.searchInput}
            />
          </div>

          <div style={customStyles.treeContainer}>
            {gradeTree.map((gradeGroup) => {
              const gradeExpanded = expandedGrades.has(gradeGroup.grade);
              return (
                <React.Fragment key={gradeGroup.grade}>
                  <div style={customStyles.treeNode}>
                    <button
                      style={customStyles.btnExpand}
                      onClick={() => toggleExpandGrade(gradeGroup.grade)}
                    >
                      <ChevronIcon expanded={gradeExpanded} />
                    </button>
                    <CustomCheckbox
                      checked={isGradeChecked(gradeGroup.grade)}
                      indeterminate={isGradeIndeterminate(gradeGroup.grade)}
                      onChange={() => toggleGrade(gradeGroup.grade)}
                      label={`${gradeGroup.grade}학년`}
                    />
                  </div>

                  {gradeExpanded && (
                    <div style={customStyles.treeChildren}>
                      {gradeGroup.classes.map((classGroup) => {
                        const classKey = `${classGroup.grade}/${classGroup.className}`;
                        const classExpanded = expandedClasses.has(classKey);
                        return (
                          <React.Fragment key={classKey}>
                            <div style={customStyles.treeNode}>
                              <button
                                style={customStyles.btnExpand}
                                onClick={() => toggleExpandClass(classKey)}
                              >
                                <ChevronIcon expanded={classExpanded} />
                              </button>
                              <CustomCheckbox
                                checked={isClassChecked(
                                  classGroup.grade,
                                  classGroup.className
                                )}
                                indeterminate={isClassIndeterminate(
                                  classGroup.grade,
                                  classGroup.className
                                )}
                                onChange={() =>
                                  toggleClass(classGroup.grade, classGroup.className)
                                }
                                label={`${classGroup.className}반`}
                              />
                            </div>

                            {classExpanded && (
                              <div style={customStyles.treeChildren}>
                                {classGroup.students.map((student) => (
                                  <div style={customStyles.treeNode} key={student.id}>
                                    <CustomCheckbox
                                      checked={selectedStudentIds.has(student.id)}
                                      onChange={() => toggleStudent(student.id)}
                                      label={student.name}
                                      style={{ paddingLeft: '20px' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div style={customStyles.sidebarDivider}></div>

        {/* Group Section */}
        <div style={customStyles.sidebarSection}>
          <div style={customStyles.sidebarHeader}>그룹</div>
          <div style={customStyles.checkboxList}>
            {groups.map((g) => (
              <CustomCheckbox
                key={g.id}
                checked={selectedGroupIds.has(g.id)}
                onChange={() => toggleGroup(g.id)}
                label={g.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={customStyles.mainContent}>
        {/* Action Bar */}
        <div style={customStyles.actionBar}>
          <div style={customStyles.viewToggle}>
            <button
              style={{
                ...customStyles.toggleBtnBase,
                ...(activeView === 'area' ? customStyles.toggleBtnActive : {}),
              }}
              onClick={() => setActiveView('area')}
            >
              영역별 보기
            </button>
            <button
              style={{
                ...customStyles.toggleBtnBase,
                ...(activeView === 'student' ? customStyles.toggleBtnActive : {}),
              }}
              onClick={() => setActiveView('student')}
            >
              학생별 보기
            </button>
          </div>

          <div style={customStyles.actionRight}>
            <div style={customStyles.targetBytes}>
              목표 바이트
              <input
                type="number"
                value={targetBytes}
                onChange={(e) => setTargetBytes(e.target.value)}
                style={customStyles.targetInput}
              />
              <span style={customStyles.byteHint}>이내로 생성</span>
            </div>
            <button
              style={{
                ...customStyles.btnPrimary,
                background: btnHovered ? '#333333' : '#111111',
              }}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              onClick={handleGenerateAll}
              disabled={batchProgress?.running}
            >
              {batchProgress?.running
                ? `${batchProgress.done}명 중 ${batchProgress.total}명 생성 중...`
                : '전체 초안 생성'}
            </button>
          </div>
        </div>

        {/* Progress message */}
        {batchProgress && batchProgress.done > 0 && (
          <div style={customStyles.progressBar}>
            {batchProgress.running
              ? `${batchProgress.total}명 중 ${batchProgress.done}명 생성 완료...`
              : `전체 ${batchProgress.total}건 생성 완료`}
          </div>
        )}

        {/* Results */}
        <div style={customStyles.resultsContainer}>
          {activeView === 'area'
            ? selectedGroupsList.map((cat) => {
                const rows = buildAreaRows(cat.id);
                const doneCount = rows.filter((r) => r.status === 'done').length;
                return (
                  <AccordionItem
                    key={cat.id}
                    title={cat.name}
                    stats={`완성 ${doneCount}명 / 선택 ${rows.length}명`}
                    rows={rows}
                    dimmed={rows.length === 0}
                    collapsed={rows.length === 0}
                    onRowClick={
                      onStudentClick
                        ? (row) => onStudentClick(row.name, cat.name)
                        : undefined
                    }
                  />
                );
              })
            : selectedStudentsList.map((student) => {
                const rows = buildStudentRows(student.id);
                const doneCount = rows.filter((r) => r.status === 'done').length;
                return (
                  <AccordionItem
                    key={student.id}
                    title={`${student.name} (${student.grade}학년 ${student.class_name}반)`}
                    stats={`완성 ${doneCount}개 / 선택 ${rows.length}개`}
                    rows={rows}
                    dimmed={rows.length === 0}
                    collapsed={rows.length === 0}
                    onRowClick={
                      onStudentClick
                        ? (row) => onStudentClick(student.name, row.name)
                        : undefined
                    }
                  />
                );
              })}
        </div>
      </div>
    </div>
  );
}
