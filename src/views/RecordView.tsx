import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRecordStore } from '@/stores/useRecordStore';
import { useStudentStore } from '@/stores/useStudentStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { convertToFormalSentence } from '@/lib/ai-service';
import type { Record as RecordType, Student, Group } from '@/types';

// ── Helper: build highlighted HTML from input text ──

function buildHighlightedHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /(^|\s)(@\S+)/g,
      '$1<span style="background:#FDE68A;border-radius:3px;padding:1px 0">$2</span>',
    )
    .replace(
      /(^|\s)(\/\S+)/g,
      '$1<span style="background:#A7F3D0;border-radius:3px;padding:1px 0">$2</span>',
    ) + '\n';
}

// ── Styles (from RecordScreen design component) ──

const customStyles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #000000',
    backgroundColor: '#EAEAE6',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '24px 20px 8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555555',
    letterSpacing: '0.05em',
  },
  viewItem: {
    padding: '12px 20px',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
    color: '#111111',
  },
  viewItemSelected: {
    borderLeft: '3px solid #111111',
    backgroundColor: 'rgba(0,0,0,0.05)',
    fontWeight: 600,
  },
  viewCount: {
    fontSize: '12px',
    color: '#555555',
    fontWeight: 400,
  },
  sidebarDivider: {
    height: '1px',
    backgroundColor: '#000000',
    opacity: 0.15,
    margin: '16px 20px',
  },
  btnNewView: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#555555',
    cursor: 'pointer',
    transition: 'color 0.2s',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    width: '100%',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#EAEAE6',
    minWidth: 0,
  },
  quickInputZone: {
    padding: '32px 48px',
    borderBottom: '1px solid #000000',
    background: 'linear-gradient(180deg, #F0F0EC 0%, #EAEAE6 100%)',
    zIndex: 10,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  inputWrapper: {
    display: 'flex',
    gap: '16px',
    background: '#ffffff',
    border: '1px solid #000000',
    borderRadius: '10px',
    padding: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 2px 4px rgba(0,0,0,0.02)',
  },
  quickTextarea: {
    flex: 1,
    border: 'none',
    resize: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#111111',
    fontFamily: 'inherit',
    padding: '12px 16px',
    minHeight: '80px',
  },
  btnSubmit: {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '0 24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  listZone: {
    flex: 1,
    padding: '32px 48px',
    overflowY: 'auto',
  },
  sectionHeader: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  sectionDesc: {
    fontSize: '14px',
    color: '#555555',
  },
  inboxList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
  },
  inboxItem: {
    background: '#F4F4F2',
    border: '1px solid #000000',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  itemMeta: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#555555',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badgeSource: {
    background: 'rgba(0,0,0,0.06)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  contentComparison: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1.2fr',
    gap: '24px',
    alignItems: 'start',
  },
  rawText: {
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#555555',
    padding: '12px',
    background: '#EAEAE6',
    borderRadius: '8px',
    border: '1px dashed rgba(0,0,0,0.2)',
  },
  transformIcon: {
    color: '#555555',
    paddingTop: '16px',
  },
  formalText: {
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#111111',
    fontWeight: 500,
    padding: '12px 16px',
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #000000',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  itemActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '16px',
    borderTop: '1px solid rgba(0,0,0,0.08)',
  },
  btnAssign: {
    background: 'transparent',
    border: '1px solid #111111',
    color: '#111111',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  // Dialog / overlay styles
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#F4F4F2',
    border: '1px solid #000000',
    borderRadius: '12px',
    padding: '32px',
    width: '480px',
    maxHeight: '80vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  dialogTitle: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#111111',
  },
  dialogLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#555555',
    marginBottom: '6px',
  },
  dialogSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #000000',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff',
    color: '#111111',
    outline: 'none',
  },
  dialogInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #000000',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff',
    color: '#111111',
    outline: 'none',
    boxSizing: 'border-box',
  },
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
  },
  btnCancel: {
    background: 'transparent',
    border: '1px solid rgba(0,0,0,0.2)',
    color: '#555555',
    padding: '8px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnConfirm: {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  badgeStudent: {
    background: 'rgba(0,0,0,0.06)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    marginLeft: '4px',
  },
};

// ── Icons ──

const ArrowRightIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
  </svg>
);

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
  >
    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoreIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
  </svg>
);

const InboxIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 12H16L14 15H10L8 12H2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.45 5.11L2 12V18A2 2 0 004 20H20A2 2 0 0022 18V12L18.55 5.11A2 2 0 0016.76 4H7.24A2 2 0 005.45 5.11Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FolderIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19A2 2 0 0120 21H4A2 2 0 012 19V5A2 2 0 014 3H9L11 6H20A2 2 0 0122 8Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Helpers ──

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours < 12 ? 'AM' : 'PM';
  const h12 = hours % 12 || 12;
  const timeStr = `${h12}:${minutes} ${ampm}`;

  if (isToday) return `오늘 ${timeStr}`;
  if (isYesterday) return `어제 ${timeStr}`;

  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${timeStr}`;
}

/** 동명이인 존재 여부 체크 후 표시 라벨 생성 */
function getStudentDisplayLabel(student: Student, allStudents: Student[]): string {
  const sameNameStudents = allStudents.filter((s) => s.name === student.name);
  if (sameNameStudents.length > 1) {
    return `${student.name} (${student.class_name} ${student.student_no}번)`;
  }
  return student.name;
}

/** @학생 태그에서 학생 파싱 */
function parseTags(
  input: string,
  students: Student[],
  groups: Group[],
): { studentId: number | null; groupId: number | null } {
  let studentId: number | null = null;
  let groupId: number | null = null;

  const studentMatch = input.match(/@(\S+)/);
  if (studentMatch) {
    const name = studentMatch[1];
    const found = students.find((s) => s.name === name);
    if (found) studentId = found.id;
  }

  const groupMatch = input.match(/\/(\S+)/);
  if (groupMatch) {
    const name = groupMatch[1];
    const found = groups.find((g) => g.name === name);
    if (found) groupId = found.id;
  }

  return { studentId, groupId };
}

// ── Group Tree Item (Sidebar) ──

interface GroupTreeItemProps {
  group: Group;
  selectedGroupId: number | null;
  depth: number;
  onSelect: (id: number) => void;
  onAddSubgroup: (parentId: number) => void;
  onRename: (group: Group) => void;
  onDelete: (group: Group) => void;
}

const GroupTreeItem: React.FC<GroupTreeItemProps> = ({
  group,
  selectedGroupId,
  depth,
  onSelect,
  onAddSubgroup,
  onRename,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasChildren = group.children && group.children.length > 0;
  const isSelected = selectedGroupId === group.id;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div>
      <div
        style={{
          ...customStyles.viewItem,
          ...(isSelected ? customStyles.viewItemSelected : {}),
          paddingLeft: `${20 + depth * 16}px`,
          ...(hovered && !isSelected ? { backgroundColor: 'rgba(0,0,0,0.03)' } : {}),
        }}
        onClick={() => onSelect(group.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              style={{ cursor: 'pointer', display: 'flex', flexShrink: 0 }}
            >
              <ChevronIcon open={expanded} />
            </span>
          ) : (
            <span style={{ width: '12px', flexShrink: 0 }} />
          )}
          <FolderIcon />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
          {hovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#555',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <MoreIcon />
            </button>
          )}
          {showMenu && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                background: '#ffffff',
                border: '1px solid #000000',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                zIndex: 200,
                minWidth: '140px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onAddSubgroup(group.id);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  color: '#111111',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                하위 그룹 추가
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onRename(group);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  color: '#111111',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                이름 변경
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(group);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  color: '#cc3333',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {group.children!.map((child) => (
            <GroupTreeItem
              key={child.id}
              group={child}
              selectedGroupId={selectedGroupId}
              depth={depth + 1}
              onSelect={onSelect}
              onAddSubgroup={onAddSubgroup}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Assign Dialog ──

interface AssignDialogProps {
  students: Student[];
  groups: Group[];
  onConfirm: (studentId: number, groupId: number) => void;
  onClose: () => void;
}

const AssignDialog: React.FC<AssignDialogProps> = ({ students, groups, onConfirm, onClose }) => {
  const [selectedStudent, setSelectedStudent] = useState<number>(0);
  const [selectedGroup, setSelectedGroup] = useState<number>(0);

  const renderGroupOptions = (groups: Group[], depth: number = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    for (const g of groups) {
      const prefix = '\u00A0\u00A0'.repeat(depth);
      options.push(
        <option key={g.id} value={g.id}>
          {prefix}{g.name}
        </option>
      );
      if (g.children && g.children.length > 0) {
        options.push(...renderGroupOptions(g.children, depth + 1));
      }
    }
    return options;
  };

  return (
    <div style={customStyles.overlay} onClick={onClose}>
      <div style={customStyles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={customStyles.dialogTitle}>학생·그룹 지정</div>

        <div>
          <div style={customStyles.dialogLabel}>학생</div>
          <select
            style={customStyles.dialogSelect}
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(Number(e.target.value))}
          >
            <option value={0}>선택하세요</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grade} {s.class_name} {s.student_no}번 {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={customStyles.dialogLabel}>그룹</div>
          <select
            style={customStyles.dialogSelect}
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(Number(e.target.value))}
          >
            <option value={0}>선택하세요</option>
            {renderGroupOptions(groups)}
          </select>
        </div>

        <div style={customStyles.dialogActions}>
          <button style={customStyles.btnCancel} onClick={onClose}>
            취소
          </button>
          <button
            style={{
              ...customStyles.btnConfirm,
              opacity: selectedStudent && selectedGroup ? 1 : 0.4,
              cursor: selectedStudent && selectedGroup ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (selectedStudent && selectedGroup) onConfirm(selectedStudent, selectedGroup);
            }}
            disabled={!selectedStudent || !selectedGroup}
          >
            지정하기
          </button>
        </div>
      </div>
    </div>
  );
};

// ── New/Rename Group Dialog ──

interface GroupDialogProps {
  mode: 'create' | 'rename';
  parentId?: number | null;
  initialName?: string;
  groupTree: Group[];
  onConfirm: (name: string, parentId: number | null) => void;
  onClose: () => void;
}

const GroupDialog: React.FC<GroupDialogProps> = ({ mode, parentId, initialName, groupTree, onConfirm, onClose }) => {
  const [name, setName] = useState(initialName ?? '');
  const [selectedParent, setSelectedParent] = useState<number | null>(parentId ?? null);

  const renderGroupOptions = (groups: Group[], depth: number = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    for (const g of groups) {
      const prefix = '\u00A0\u00A0'.repeat(depth);
      options.push(
        <option key={g.id} value={g.id}>
          {prefix}{g.name}
        </option>
      );
      if (g.children && g.children.length > 0) {
        options.push(...renderGroupOptions(g.children, depth + 1));
      }
    }
    return options;
  };

  return (
    <div style={customStyles.overlay} onClick={onClose}>
      <div style={customStyles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={customStyles.dialogTitle}>
          {mode === 'create' ? '새 그룹 만들기' : '그룹 이름 변경'}
        </div>

        <div>
          <div style={customStyles.dialogLabel}>그룹 이름</div>
          <input
            style={customStyles.dialogInput}
            placeholder="예: 공통수학1, 1학년 1반"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onConfirm(name.trim(), selectedParent);
              }
            }}
          />
        </div>

        {mode === 'create' && (
          <div>
            <div style={customStyles.dialogLabel}>상위 그룹 (선택사항)</div>
            <select
              style={customStyles.dialogSelect}
              value={selectedParent ?? ''}
              onChange={(e) => setSelectedParent(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">없음 (최상위)</option>
              {renderGroupOptions(groupTree)}
            </select>
          </div>
        )}

        <div style={customStyles.dialogActions}>
          <button style={customStyles.btnCancel} onClick={onClose}>
            취소
          </button>
          <button
            style={{
              ...customStyles.btnConfirm,
              opacity: name.trim() ? 1 : 0.4,
              cursor: name.trim() ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (name.trim()) onConfirm(name.trim(), selectedParent);
            }}
            disabled={!name.trim()}
          >
            {mode === 'create' ? '만들기' : '변경'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Inbox Item ──

interface InboxItemComponentProps {
  record: RecordType;
  onAssign: (id: number) => void;
}

const InboxItemComponent: React.FC<InboxItemComponentProps> = ({ record, onAssign }) => {
  const [assignHover, setAssignHover] = useState(false);

  return (
    <div style={customStyles.inboxItem}>
      <div style={customStyles.itemMeta}>
        <span>{formatTime(record.created_at)}</span>
        <span style={customStyles.badgeSource}>{record.source}</span>
      </div>
      <div style={customStyles.contentComparison}>
        <div style={customStyles.rawText}>{record.raw_input}</div>
        <div style={customStyles.transformIcon}>
          <ArrowRightIcon />
        </div>
        <div style={customStyles.formalText}>{record.generated_sentence}</div>
      </div>
      <div style={customStyles.itemActions}>
        <button
          style={{
            ...customStyles.btnAssign,
            ...(assignHover ? { backgroundColor: '#111111', color: '#ffffff' } : {}),
          }}
          onMouseEnter={() => setAssignHover(true)}
          onMouseLeave={() => setAssignHover(false)}
          onClick={() => onAssign(record.id)}
        >
          학생·그룹 지정하기
        </button>
      </div>
    </div>
  );
};

// ── Record Item (for group view: already assigned) ──

interface RecordItemComponentProps {
  record: RecordType;
  students: Student[];
}

const RecordItemComponent: React.FC<RecordItemComponentProps> = ({ record, students }) => {
  const studentName = record.student_name ?? students.find((s) => s.id === record.student_id)?.name ?? '미지정';
  const groupName = record.group_name ?? '미지정';

  return (
    <div style={customStyles.inboxItem}>
      <div style={customStyles.itemMeta}>
        <span>{formatTime(record.created_at)}</span>
        <span style={customStyles.badgeSource}>{record.source}</span>
        <span style={customStyles.badgeStudent}>{studentName}</span>
        <span style={customStyles.badgeStudent}>{groupName}</span>
      </div>
      <div style={customStyles.contentComparison}>
        <div style={customStyles.rawText}>{record.raw_input}</div>
        <div style={customStyles.transformIcon}>
          <ArrowRightIcon />
        </div>
        <div style={customStyles.formalText}>{record.generated_sentence}</div>
      </div>
    </div>
  );
};

// ── Main RecordView ──

export function RecordView() {
  const {
    inboxRecords,
    groupRecords,
    fetchInboxRecords,
    fetchRecords,
    fetchGroupRecords,
    addRecord,
    assignRecord,
  } = useRecordStore();
  const { students, fetchStudents } = useStudentStore();
  const {
    groups,
    groupTree,
    selectedGroupId,
    fetchGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    setSelectedGroup,
  } = useGroupStore();

  const [inputText, setInputText] = useState('');
  const [submitHover, setSubmitHover] = useState(false);
  const [newGroupHover, setNewGroupHover] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [assigningRecordId, setAssigningRecordId] = useState<number | null>(null);
  const [groupDialog, setGroupDialog] = useState<{
    open: boolean;
    mode: 'create' | 'rename';
    parentId: number | null;
    groupId?: number;
    initialName?: string;
  }>({ open: false, mode: 'create', parentId: null });

  // Autocomplete state
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [acOpen, setAcOpen] = useState(false);
  const [acType, setAcType] = useState<'student' | 'group'>('student');
  const [acQuery, setAcQuery] = useState('');
  const [acStartIdx, setAcStartIdx] = useState(0);
  const [acSelected, setAcSelected] = useState(0);
  const [acPosition, setAcPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Student autocomplete suggestions with 동명이인 handling
  const getStudentSuggestions = useCallback(
    (query: string): Array<{ type: 'header'; label: string } | { type: 'item'; label: string; value: string }> => {
      const q = query.toLowerCase();
      const filtered = students.filter((s) => s.name.toLowerCase().includes(q));
      const grouped = new Map<string, Student[]>();
      filtered.forEach((s) => {
        const key = `${s.grade} ${s.class_name}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(s);
      });
      const result: Array<{ type: 'header'; label: string } | { type: 'item'; label: string; value: string }> = [];
      Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, studs]) => {
          result.push({ type: 'header', label: key });
          studs.forEach((s) => {
            const label = getStudentDisplayLabel(s, students);
            result.push({ type: 'item', label, value: s.name });
          });
        });
      return result;
    },
    [students],
  );

  // Group autocomplete suggestions with hierarchy
  const getGroupSuggestions = useCallback(
    (query: string): Array<{ type: 'item'; label: string; value: string; depth: number }> => {
      const q = query.toLowerCase();
      const result: Array<{ type: 'item'; label: string; value: string; depth: number }> = [];

      const flatten = (nodes: Group[], depth: number) => {
        for (const g of nodes) {
          if (g.name.toLowerCase().includes(q)) {
            result.push({ type: 'item' as const, label: g.name, value: g.name, depth });
          }
          if (g.children && g.children.length > 0) {
            flatten(g.children, depth + 1);
          }
        }
      };
      flatten(groupTree, 0);

      return result;
    },
    [groupTree],
  );

  const acSuggestions = acType === 'student' ? getStudentSuggestions(acQuery) : getGroupSuggestions(acQuery);
  const acSelectableItems = acSuggestions.filter((s) => s.type === 'item');

  const computeDropdownPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.width = style.width;
    mirror.style.fontSize = style.fontSize;
    mirror.style.fontFamily = style.fontFamily;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.padding = style.padding;
    mirror.style.border = style.border;
    mirror.style.boxSizing = style.boxSizing;

    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    mirror.textContent = textBeforeCursor;
    const span = document.createElement('span');
    span.textContent = '|';
    mirror.appendChild(span);
    document.body.appendChild(mirror);

    const spanRect = span.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const relativeTop = spanRect.top - mirrorRect.top;
    const relativeLeft = spanRect.left - mirrorRect.left;

    document.body.removeChild(mirror);

    return {
      top: relativeTop + parseInt(style.lineHeight || '24', 10),
      left: relativeLeft,
    };
  }, []);

  const detectAutocomplete = useCallback(
    (text: string, cursorPos: number) => {
      const textBeforeCursor = text.substring(0, cursorPos);

      let triggerIdx = -1;
      let triggerChar = '';

      for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
        const ch = textBeforeCursor[i];
        if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') break;
        if (ch === '@' || ch === '/') {
          if (i === 0 || /\s/.test(textBeforeCursor[i - 1])) {
            triggerIdx = i;
            triggerChar = ch;
          }
          break;
        }
      }

      if (triggerIdx === -1) {
        setAcOpen(false);
        return;
      }

      const query = textBeforeCursor.substring(triggerIdx + 1);
      const type = triggerChar === '@' ? 'student' : 'group';

      setAcType(type);
      setAcQuery(query);
      setAcStartIdx(triggerIdx);
      setAcSelected(0);
      setAcPosition(computeDropdownPosition());
      setAcOpen(true);
    },
    [computeDropdownPosition],
  );

  const insertAutocomplete = useCallback(
    (value: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const before = inputText.substring(0, acStartIdx + 1);
      const after = inputText.substring(textarea.selectionStart);
      const newText = before + value + ' ' + after;
      setInputText(newText);
      setAcOpen(false);

      const newCursorPos = before.length + value.length + 1;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [inputText, acStartIdx],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInputText(newValue);
      detectAutocomplete(newValue, e.target.selectionStart ?? newValue.length);
    },
    [detectAutocomplete],
  );

  // Initialize on mount
  useEffect(() => {
    fetchInboxRecords();
    fetchRecords();
    fetchStudents();
    fetchGroups();
  }, [fetchInboxRecords, fetchRecords, fetchStudents, fetchGroups]);

  // Load group records when a group is selected
  useEffect(() => {
    if (selectedGroupId !== null) {
      fetchGroupRecords(selectedGroupId);
    }
  }, [selectedGroupId, fetchGroupRecords]);

  // Submit quick record
  const handleSubmit = async () => {
    const text = inputText.trim();
    if (!text || aiLoading) return;

    const { studentId, groupId: tagGroupId } = parseTags(text, students, groups);
    // Use tag group if specified, otherwise use currently selected group
    const finalGroupId = tagGroupId ?? selectedGroupId;

    setAiLoading(true);
    setInputText('');
    try {
      const formalSentence = await convertToFormalSentence(text);
      await addRecord(text, formalSentence, studentId, finalGroupId, '기록', '보통');
      // Refresh appropriate list
      if (finalGroupId === null) {
        await fetchInboxRecords();
      } else if (finalGroupId === selectedGroupId) {
        await fetchGroupRecords(finalGroupId);
      }
    } catch (error) {
      console.error('Failed to add record:', error);
      setInputText(text);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (acOpen && acSelectableItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAcSelected((prev) => (prev + 1) % acSelectableItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAcSelected((prev) => (prev - 1 + acSelectableItems.length) % acSelectableItems.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const item = acSelectableItems[acSelected];
        if (item) insertAutocomplete(item.value);
        return;
      }
    }
    if (e.key === 'Escape' && acOpen) {
      e.preventDefault();
      setAcOpen(false);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Assign dialog
  const handleAssignConfirm = async (studentId: number, groupId: number) => {
    if (assigningRecordId === null) return;
    await assignRecord(assigningRecordId, studentId, groupId);
    setAssigningRecordId(null);
    if (selectedGroupId === null) await fetchInboxRecords();
    else await fetchGroupRecords(selectedGroupId);
  };

  // Group dialog
  const handleGroupDialogConfirm = async (name: string, parentId: number | null) => {
    if (groupDialog.mode === 'create') {
      await addGroup(name, parentId);
    } else if (groupDialog.groupId) {
      await updateGroup(groupDialog.groupId, name);
    }
    setGroupDialog({ open: false, mode: 'create', parentId: null });
  };

  const handleDeleteGroup = async (group: Group) => {
    if (confirm(`"${group.name}" 그룹을 삭제할까요? 하위 그룹도 함께 삭제됩니다.`)) {
      await deleteGroup(group.id);
    }
  };

  const isInbox = selectedGroupId === null;
  const displayRecords = isInbox ? inboxRecords : groupRecords;
  const selectedGroupName = isInbox
    ? '인박스'
    : groups.find((g) => g.id === selectedGroupId)?.name ?? '';

  const sectionDesc = isInbox
    ? '학생 또는 그룹이 지정되지 않은 기록'
    : `${selectedGroupName} 그룹의 기록`;

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={customStyles.sidebar} data-tour="sidebar-views">
          <div style={customStyles.sidebarHeader}>기록 그룹</div>

          {/* Inbox - always first */}
          <div
            style={{
              ...customStyles.viewItem,
              ...(isInbox ? customStyles.viewItemSelected : {}),
            }}
            onClick={() => setSelectedGroup(null)}
            onMouseEnter={(e) => {
              if (!isInbox) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)';
            }}
            onMouseLeave={(e) => {
              if (!isInbox) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <InboxIcon />
              <span>인박스</span>
            </div>
            {inboxRecords.length > 0 && (
              <span style={customStyles.viewCount}>{inboxRecords.length}건</span>
            )}
          </div>

          <div style={customStyles.sidebarDivider} />

          {/* Group Tree */}
          <div style={{ flex: 1, overflowY: 'auto' as const }}>
            {groupTree.length === 0 ? (
              <div
                style={{
                  padding: '16px 20px',
                  fontSize: '13px',
                  color: '#999',
                  textAlign: 'center',
                }}
              >
                아직 그룹이 없습니다
              </div>
            ) : (
              groupTree.map((group) => (
                <GroupTreeItem
                  key={group.id}
                  group={group}
                  selectedGroupId={selectedGroupId}
                  depth={0}
                  onSelect={(id) => setSelectedGroup(id)}
                  onAddSubgroup={(parentId) =>
                    setGroupDialog({ open: true, mode: 'create', parentId })
                  }
                  onRename={(g) =>
                    setGroupDialog({
                      open: true,
                      mode: 'rename',
                      parentId: g.parent_id,
                      groupId: g.id,
                      initialName: g.name,
                    })
                  }
                  onDelete={handleDeleteGroup}
                />
              ))
            )}
          </div>

          <button
            style={{
              ...customStyles.btnNewView,
              ...(newGroupHover ? { color: '#111111', backgroundColor: 'rgba(0,0,0,0.02)' } : {}),
            }}
            onMouseEnter={() => setNewGroupHover(true)}
            onMouseLeave={() => setNewGroupHover(false)}
            onClick={() => setGroupDialog({ open: true, mode: 'create', parentId: null })}
          >
            <PlusIcon />
            새 그룹 만들기
          </button>
        </div>

        {/* Main Content */}
        <div style={customStyles.mainContent}>
          {/* Quick Input */}
          <div style={customStyles.quickInputZone} data-tour="quick-input">
            <div style={{ ...customStyles.inputWrapper, position: 'relative' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                {/* Visible text layer with highlights */}
                <div
                  ref={highlightRef}
                  aria-hidden="true"
                  style={{
                    ...customStyles.quickTextarea,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    minHeight: 'unset',
                    pointerEvents: 'none',
                    color: '#111111',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflow: 'hidden',
                  }}
                  dangerouslySetInnerHTML={{ __html: buildHighlightedHtml(inputText) }}
                />
                {/* Invisible textarea for input handling */}
                <textarea
                  ref={textareaRef}
                  className="quick-textarea"
                  style={{
                    ...customStyles.quickTextarea,
                    position: 'relative',
                    background: 'transparent',
                    color: 'transparent',
                    caretColor: '#111111',
                  }}
                  spellCheck={false}
                  placeholder={
                    isInbox
                      ? '관찰을 적으세요. @학생 /그룹으로 바로 분류됩니다'
                      : `관찰을 적으세요. @학생으로 태그하면 ${selectedGroupName}에 저장됩니다`
                  }
                  value={inputText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onClick={() => {
                    const ta = textareaRef.current;
                    if (ta) detectAutocomplete(inputText, ta.selectionStart);
                  }}
                  onBlur={() => {
                    setTimeout(() => setAcOpen(false), 200);
                  }}
                  onScroll={(e) => {
                    if (highlightRef.current) {
                      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
                    }
                  }}
                  disabled={aiLoading}
                />
              </div>
              {/* Autocomplete Dropdown */}
              {acOpen && acSelectableItems.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: acPosition.top + 8,
                    left: acPosition.left,
                    background: '#ffffff',
                    border: '1px solid #000000',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 100,
                    minWidth: '180px',
                  }}
                >
                  {acSuggestions.map((item, idx) => {
                    if (item.type === 'header') {
                      return (
                        <div
                          key={`header-${idx}`}
                          style={{
                            padding: '6px 16px 4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#555555',
                            letterSpacing: '0.02em',
                            borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                          }}
                        >
                          {item.label}
                        </div>
                      );
                    }
                    const selectableIdx = acSelectableItems.indexOf(item as typeof acSelectableItems[number]);
                    const isItemSelected = selectableIdx === acSelected;
                    const depth = 'depth' in item ? (item as { depth: number }).depth : 0;
                    return (
                      <div
                        key={`item-${idx}`}
                        style={{
                          padding: '8px 16px',
                          paddingLeft: `${16 + depth * 16}px`,
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#111111',
                          background: isItemSelected ? 'rgba(0,0,0,0.08)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isItemSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                          setAcSelected(selectableIdx);
                        }}
                        onMouseLeave={(e) => {
                          if (!isItemSelected) e.currentTarget.style.background = 'transparent';
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertAutocomplete(item.value);
                        }}
                      >
                        {depth > 0 && <span style={{ color: '#999999', marginRight: '4px' }}>└</span>}
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                style={{
                  ...customStyles.btnSubmit,
                  ...(submitHover ? { backgroundColor: '#333333' } : {}),
                  ...(aiLoading ? { opacity: 0.6, cursor: 'wait' } : {}),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={() => setSubmitHover(true)}
                onMouseLeave={() => setSubmitHover(false)}
                onClick={handleSubmit}
                disabled={aiLoading}
              >
                {aiLoading && <LoadingSpinner />}
                {aiLoading ? 'AI 변환 중...' : '기록'}
              </button>
            </div>
          </div>

          {/* List Zone */}
          <div style={customStyles.listZone}>
            <div style={customStyles.sectionHeader}>
              <h1 style={customStyles.sectionTitle}>{selectedGroupName}</h1>
              <p style={customStyles.sectionDesc}>{sectionDesc}</p>
            </div>

            {displayRecords.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: '#999',
                  fontSize: '15px',
                }}
              >
                {isInbox
                  ? '인박스가 비어있습니다. 위에서 기록을 입력해보세요.'
                  : '이 그룹에 기록이 없습니다.'}
              </div>
            ) : (
              <div style={customStyles.inboxList}>
                {displayRecords.map((record) =>
                  isInbox ? (
                    <InboxItemComponent
                      key={record.id}
                      record={record}
                      onAssign={(id) => setAssigningRecordId(id)}
                    />
                  ) : (
                    <RecordItemComponent
                      key={record.id}
                      record={record}
                      students={students}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Dialog */}
      {assigningRecordId !== null && (
        <AssignDialog
          students={students}
          groups={groupTree}
          onConfirm={handleAssignConfirm}
          onClose={() => setAssigningRecordId(null)}
        />
      )}

      {/* Group Create/Rename Dialog */}
      {groupDialog.open && (
        <GroupDialog
          mode={groupDialog.mode}
          parentId={groupDialog.parentId}
          initialName={groupDialog.initialName}
          groupTree={groupTree}
          onConfirm={handleGroupDialogConfirm}
          onClose={() => setGroupDialog({ open: false, mode: 'create', parentId: null })}
        />
      )}
    </>
  );
}
