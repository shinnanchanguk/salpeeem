import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGroupStore } from '@/stores/useGroupStore';
import { useStudentStore } from '@/stores/useStudentStore';
import { useRecordStore } from '@/stores/useRecordStore';
import { generateAssignmentSentences, generateSurveySentences, extractTextFromImages } from '@/lib/ai-service';
import { extractText } from '@/lib/file-extractor';
import {
  addAssignment,
  addSurvey,
  getAssignmentFolders,
  addAssignmentFolder,
  updateAssignmentFolder,
  deleteAssignmentFolder,
  getRecordsByAssignmentFolder,
  addSubmission,
  deleteSubmission,
  deleteSubmissionsByFolder,
  findSubmissionByFolderAndStudent,
  updateSubmissionStudent,
  updateSubmissionPath,
  getAllSubmissions,
} from '@/lib/database';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSubmissionStore } from '@/stores/useSubmissionStore';
import { matchStudentFromFilename } from '@/lib/studentMatcher';
import {
  buildStudentFilename,
  buildStoredPath,
  buildUnmatchedPath,
  buildSurveyResponsePath,
  buildFolderSegment,
  saveFileTo,
  fileToBytes,
  removeFileSilent,
  removeDirRecursive,
  renamePath,
  directoryExists,
  openInOS,
} from '@/lib/submissionStorage';
import { SubmissionRosterPanel } from '@/components/SubmissionRosterPanel';
import type { AssignmentFolder, RecordSource, Record as SalpeemRecord } from '@/types';

// ── Styles (kept from original) ────────────────────────────────────
const customStyles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #000000',
    backgroundColor: '#EAEAE6',
    flexShrink: 0,
  },
  sidebarActions: {
    padding: '24px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sidebarDivider: {
    height: '1px',
    backgroundColor: '#000000',
    opacity: 0.15,
    margin: '8px 20px 16px',
  },
  sidebarHeader: {
    padding: '8px 20px 12px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555555',
    letterSpacing: '0.05em',
  },
  historyList: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '24px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#EAEAE6',
    minWidth: 0,
    overflowY: 'auto',
  },
  formZone: {
    padding: '40px 56px',
    maxWidth: '800px',
    width: '100%',
  },
  sectionHeader: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '12px',
    color: '#111111',
  },
  sectionDesc: {
    fontSize: '15px',
    color: '#555555',
    lineHeight: 1.5,
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '36px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formLabel: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#111111',
    display: 'flex',
    alignItems: 'baseline',
  },
  labelNote: {
    fontSize: '13px',
    fontWeight: 400,
    color: '#555555',
    marginLeft: '10px',
  },
  formInput: {
    width: '100%',
    border: '1px solid #000000',
    borderRadius: '10px',
    padding: '16px',
    fontSize: '15px',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
    backgroundColor: '#ffffff',
    color: '#111111',
    outline: 'none',
    transition: 'box-shadow 0.2s, border-color 0.2s',
    lineHeight: 1.5,
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  formTextarea: {
    resize: 'vertical' as const,
    minHeight: '120px',
  },
  formSelect: {
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23111111' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    backgroundSize: '16px',
    cursor: 'pointer',
  },
  uploadZone: {
    border: '1px dashed #000000',
    borderRadius: '10px',
    backgroundColor: '#F4F4F2',
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  uploadIcon: {
    color: '#555555',
    marginBottom: '20px',
  },
  uploadText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111111',
    marginBottom: '8px',
    lineHeight: 1.5,
  },
  uploadHint: {
    fontSize: '13px',
    color: '#555555',
  },
  formActions: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '32px',
    borderTop: '1px solid rgba(0,0,0,0.08)',
  },
  btnSubmitLarge: {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '16px 40px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
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
};

// ── Result item types ────────────────────────────────────────────────
interface ResultItem {
  studentName: string;
  sentence: string;
  confirmed: boolean;
  editing: boolean;
  editText: string;
  studentId: number | null;
  groupId: number | null;
  matchMethod?: 'student_id' | 'name' | 'none' | 'duplicate';
  candidates?: Array<{ id: number; name: string; grade: string; class_name: string; student_no: number }>;
}

// ── Helper: extract student name from filename ───────────────────────
function extractNameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/^[\d_\-.\s]+/, '').trim();
  return cleaned || base;
}

// ── Helper: build tree from flat list ────────────────────────────────
function buildFolderTree(folders: AssignmentFolder[]): AssignmentFolder[] {
  const map = new Map<number, AssignmentFolder>();
  const roots: AssignmentFolder[] = [];

  for (const f of folders) {
    map.set(f.id, { ...f, children: [] });
  }

  for (const f of folders) {
    const node = map.get(f.id)!;
    if (f.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(f.parent_id);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}

// ── Icons ────────────────────────────────────────────────────────────
const PlusIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MoreIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
  </svg>
);

// ── Folder tree item component ───────────────────────────────────────
interface FolderTreeItemProps {
  folder: AssignmentFolder;
  depth: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  onSelect: (folder: AssignmentFolder) => void;
  onToggleExpand: (id: number) => void;
  onAddSubfolder: (parentId: number) => void;
  onRename: (folder: AssignmentFolder) => void;
  onDelete: (folder: AssignmentFolder) => void;
}

function FolderTreeItem({
  folder,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  onAddSubfolder,
  onRename,
  onDelete,
}: FolderTreeItemProps) {
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedId === folder.id;
  const isExpanded = expandedIds.has(folder.id);
  const hasChildren = (folder.children?.length ?? 0) > 0;

  useEffect(() => {
    if (!showMenu) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showMenu]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(folder);
    if (hasChildren) {
      onToggleExpand(folder.id);
    }
  };

  return (
    <div>
      <div
        style={{
          padding: '10px 16px',
          paddingLeft: `${16 + depth * 20}px`,
          cursor: 'pointer',
          borderLeft: isSelected ? '3px solid #111111' : '3px solid transparent',
          backgroundColor: isSelected
            ? 'rgba(0,0,0,0.05)'
            : hovered
              ? 'rgba(0,0,0,0.03)'
              : 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 0.15s, border-left 0.15s',
          position: 'relative',
        }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Expand/collapse caret */}
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            fontSize: '10px',
            color: '#555555',
            transition: 'transform 0.15s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            flexShrink: 0,
            visibility: hasChildren ? 'visible' : 'hidden',
          }}
        >
          &#9654;
        </span>

        {/* Folder icon */}
        <span style={{ fontSize: '14px', flexShrink: 0 }}>
          {hasChildren || depth === 0 ? '\uD83D\uDCC1' : '\uD83D\uDCC2'}
        </span>

        {/* Name */}
        <span
          style={{
            fontSize: '14px',
            color: '#111111',
            fontWeight: isSelected ? 600 : 500,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {folder.name}
        </span>

        {/* MoreIcon button */}
        {hovered && (
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
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

            {showMenu && (
              <div
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
                    onAddSubfolder(folder.id);
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
                  하위 폴더 추가
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onRename(folder);
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
                    onDelete(folder);
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
        )}
      </div>

      {/* Children (animated expand/collapse) */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isExpanded ? `${(folder.children?.length ?? 0) * 200}px` : '0px',
          transition: 'max-height 0.2s ease-in-out',
        }}
      >
        {folder.children?.map((child) => (
          <FolderTreeItem
            key={child.id}
            folder={child}
            depth={depth + 1}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggleExpand={onToggleExpand}
            onAddSubfolder={onAddSubfolder}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ── Folder dialog component ─────────────────────────────────────────
interface FolderDialogProps {
  mode: 'create' | 'rename';
  parentId?: number | null;
  initialName?: string;
  initialFolderType?: 'assignment' | 'survey';
  folderTree: AssignmentFolder[];
  onConfirm: (name: string, parentId: number | null, folderType: 'assignment' | 'survey') => void;
  onClose: () => void;
}

const FolderDialog: React.FC<FolderDialogProps> = ({
  mode, parentId, initialName, initialFolderType, folderTree, onConfirm, onClose,
}) => {
  const [name, setName] = useState(initialName ?? '');
  const [selectedParent, setSelectedParent] = useState<number | null>(parentId ?? null);
  const [folderType, setFolderType] = useState<'assignment' | 'survey'>(initialFolderType ?? 'assignment');

  const renderFolderOptions = (folders: AssignmentFolder[], depth: number = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    for (const f of folders) {
      const prefix = '\u00A0\u00A0'.repeat(depth);
      options.push(
        <option key={f.id} value={f.id}>{prefix}{f.name}</option>
      );
      if (f.children && f.children.length > 0) {
        options.push(...renderFolderOptions(f.children, depth + 1));
      }
    }
    return options;
  };

  return (
    <div style={customStyles.overlay as React.CSSProperties} onClick={onClose}>
      <div style={customStyles.dialog as React.CSSProperties} onClick={(e) => e.stopPropagation()}>
        <div style={customStyles.dialogTitle}>
          {mode === 'create' ? '새 폴더 만들기' : '폴더 이름 변경'}
        </div>

        <div>
          <div style={customStyles.dialogLabel}>폴더 이름</div>
          <input
            style={customStyles.dialogInput as React.CSSProperties}
            placeholder="예: 1학기 중간 과제"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onConfirm(name.trim(), selectedParent, folderType);
              }
            }}
          />
        </div>

        {mode === 'create' && (
          <>
            <div>
              <div style={customStyles.dialogLabel}>유형</div>
              <select
                style={customStyles.dialogSelect}
                value={folderType}
                onChange={(e) => setFolderType(e.target.value as 'assignment' | 'survey')}
              >
                <option value="assignment">과제</option>
                <option value="survey">설문</option>
              </select>
            </div>
            <div>
              <div style={customStyles.dialogLabel}>상위 폴더 (선택사항)</div>
              <select
                style={customStyles.dialogSelect}
                value={selectedParent ?? ''}
                onChange={(e) => setSelectedParent(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">없음 (최상위)</option>
                {renderFolderOptions(folderTree)}
              </select>
            </div>
          </>
        )}

        <div style={customStyles.dialogActions}>
          <button style={customStyles.btnCancel} onClick={onClose}>취소</button>
          <button
            style={{
              ...customStyles.btnConfirm,
              opacity: name.trim() ? 1 : 0.4,
              cursor: name.trim() ? 'pointer' : 'default',
            }}
            onClick={() => { if (name.trim()) onConfirm(name.trim(), selectedParent, folderType); }}
            disabled={!name.trim()}
          >
            {mode === 'create' ? '만들기' : '변경'}
          </button>
        </div>
      </div>
    </div>
  );
};

export function AssignmentView() {
  // ── Stores ───────────────────────────────────────────────────────
  const { groups, fetchGroups } = useGroupStore();
  const { students, fetchStudents } = useStudentStore();
  const { addRecord, deleteRecord } = useRecordStore();
  const { settings } = useSettingsStore();
  const { fetchForFolder: fetchSubmissionsForFolder } = useSubmissionStore();

  // ── Folder state ────────────────────────────────────────────────
  const [folders, setFolders] = useState<AssignmentFolder[]>([]);
  const [folderTree, setFolderTree] = useState<AssignmentFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<AssignmentFolder | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'assignment' | 'survey'>('all');
  const [folderDialog, setFolderDialog] = useState<{
    open: boolean;
    mode: 'create' | 'rename';
    parentId: number | null;
    folderId?: number;
    initialName?: string;
    initialFolderType?: 'assignment' | 'survey';
  }>({ open: false, mode: 'create', parentId: null });
  const [newFolderHover, setNewFolderHover] = useState(false);

  // ── Form state ───────────────────────────────────────────────────
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadHover, setUploadHover] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // ── Generation state ─────────────────────────────────────────────
  const [generating, setGenerating] = useState<boolean>(false);
  const [genProgress, setGenProgress] = useState<{ done: number; total: number; phase: string } | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── Confirmed records history for this folder ───────────────────
  const [folderRecords, setFolderRecords] = useState<SalpeemRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Current folder submissions (reactive to store) ──────────────
  const submissionsForSelected = useSubmissionStore((s) =>
    selectedFolder ? s.byFolder[selectedFolder.id] ?? [] : []
  );

  // ── Roster responsive state ─────────────────────────────────────
  const [rosterWide, setRosterWide] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
  );
  const [rosterOverlayOpen, setRosterOverlayOpen] = useState(false);
  useEffect(() => {
    const onResize = () => setRosterWide(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchGroups();
    fetchStudents();
    loadFolders();
  }, []);

  // ── Sync folder form fields when selecting a folder ──────────────
  useEffect(() => {
    if (selectedFolder) {
      setSelectedGroupId(selectedFolder.group_id ? String(selectedFolder.group_id) : '');
      setTaskDescription(selectedFolder.instructions || '');
    }
  }, [selectedFolder?.id]);

  const loadFolders = useCallback(async () => {
    const all = await getAssignmentFolders();
    setFolders(all);
    setFolderTree(buildFolderTree(all));
  }, []);

  // ── Folder actions ───────────────────────────────────────────────
  const handleFolderDialogConfirm = async (name: string, parentId: number | null, folderType: 'assignment' | 'survey') => {
    if (folderDialog.mode === 'create') {
      await addAssignmentFolder(name, parentId, folderType);
      if (parentId !== null) {
        setExpandedIds((prev) => new Set([...prev, parentId]));
      }
    } else if (folderDialog.folderId) {
      const folder = folders.find((f) => f.id === folderDialog.folderId);
      const root = settings.submission_root_path;
      // Sync on-disk directory rename before DB update
      if (folder && root && folder.name !== name) {
        try {
          const { join } = await import('@tauri-apps/api/path');
          const oldSeg = buildFolderSegment(folder, folders);
          const renamed = { ...folder, name };
          const newFolders = folders.map((f) => (f.id === folder.id ? renamed : f));
          const newSeg = buildFolderSegment(renamed, newFolders);
          if (oldSeg !== newSeg) {
            const fromPath = await join(root, oldSeg);
            const toPath = await join(root, newSeg);
            if (await directoryExists(fromPath)) {
              await renamePath(fromPath, toPath);
              const allSubs = await getAllSubmissions();
              for (const s of allSubs) {
                if (s.stored_path.startsWith(fromPath)) {
                  await updateSubmissionPath(s.id, toPath + s.stored_path.slice(fromPath.length));
                }
              }
            }
          }
        } catch (err) {
          console.error('folder rename on disk failed:', err);
        }
      }
      await updateAssignmentFolder(folderDialog.folderId, name, folder?.group_id, folder?.instructions);
      if (selectedFolder?.id === folderDialog.folderId) {
        const all = await getAssignmentFolders();
        const updated = all.find((f) => f.id === folderDialog.folderId);
        if (updated) setSelectedFolder(updated);
      }
    }
    setFolderDialog({ open: false, mode: 'create', parentId: null });
    await loadFolders();
  };

  const handleDeleteFolder = async (folder: AssignmentFolder) => {
    const childCount = folders.filter((f) => f.parent_id === folder.id).length;
    const msg = childCount > 0
      ? `"${folder.name}" 폴더와 하위 ${childCount}개 폴더를 삭제하시겠습니까?`
      : `"${folder.name}" 폴더를 삭제하시겠습니까?`;
    if (!confirm(msg)) return;

    // Clean on-disk directory before DB cascade
    const root = settings.submission_root_path;
    if (root) {
      try {
        const { join } = await import('@tauri-apps/api/path');
        const seg = buildFolderSegment(folder, folders);
        const path = await join(root, seg);
        await removeDirRecursive(path);
      } catch (err) {
        console.error('folder delete on disk failed:', err);
      }
    }

    await deleteAssignmentFolder(folder.id);
    if (selectedFolder?.id === folder.id) {
      setSelectedFolder(null);
      resetForm();
    }
    await loadFolders();
  };

  const handleSelectFolder = async (folder: AssignmentFolder) => {
    setSelectedFolder(folder);
    setResults([]);
    setError(null);
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Load confirmed records for this folder
    try {
      const records = await getRecordsByAssignmentFolder(folder.id);
      setFolderRecords(records);
    } catch {
      setFolderRecords([]);
    }
    // Load submissions for the roster panel
    await fetchSubmissionsForFolder(folder.id);
  };

  const handleToggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Filtered tree ────────────────────────────────────────────────
  const filteredTree = filterType === 'all'
    ? folderTree
    : folderTree.filter((f) => f.folder_type === filterType);

  // ── Determine if selected folder is a leaf ───────────────────────
  const selectedFolderChildren = selectedFolder
    ? folders.filter((f) => f.parent_id === selectedFolder.id)
    : [];
  const isLeafFolder = selectedFolder !== null && selectedFolderChildren.length === 0;

  // ── Determine the mode from the selected folder ──────────────────
  const isSurveyMode = selectedFolder?.folder_type === 'survey';

  // ── Persist uploaded files to disk + submissions table ────────────
  const persistUploadedFiles = useCallback(
    async (files: File[]) => {
      if (!selectedFolder) return;
      const root = settings.submission_root_path;
      if (!root) return;

      const isSurvey = selectedFolder.folder_type === 'survey';

      if (isSurvey) {
        // 설문: 파일 1개만 사용 (여러 드롭돼도 첫 파일 기준)
        const file = files[0];
        if (!file) return;
        try {
          const bytes = await fileToBytes(file);
          const dot = file.name.lastIndexOf('.');
          const ext = dot >= 0 ? file.name.slice(dot) : '.xlsx';
          const storedPath = await buildSurveyResponsePath(root, selectedFolder, folders, ext);
          await saveFileTo(storedPath, bytes);

          const { matchStudentsInSurveyFile } = await import('@/lib/studentMatcher');
          const matches = await matchStudentsInSurveyFile(file, students, settings.student_id_pattern);

          // 기존 이 폴더 submissions 전부 삭제 후 재생성
          await deleteSubmissionsByFolder(selectedFolder.id);
          for (const m of matches) {
            await addSubmission(
              selectedFolder.id,
              m.student?.id ?? null,
              file.name,
              storedPath,
            );
          }
        } catch (err) {
          console.error('survey persist failed:', file.name, err);
        }
        await fetchSubmissionsForFolder(selectedFolder.id);
        return;
      }

      // 과제 분기: 파일마다 학생 매칭 → 저장
      for (const file of files) {
        try {
          const bytes = await fileToBytes(file);
          const match = matchStudentFromFilename(file.name, students, settings.student_id_pattern);
          const student = match.student;

          const filename = student
            ? buildStudentFilename(student, settings.student_id_pattern, file.name)
            : file.name;
          const absolutePath = student
            ? await buildStoredPath(root, selectedFolder, folders, filename)
            : await buildUnmatchedPath(root, selectedFolder, folders, file.name);

          if (student) {
            const existing = await findSubmissionByFolderAndStudent(selectedFolder.id, student.id);
            if (existing) {
              await removeFileSilent(existing.stored_path);
              await deleteSubmission(existing.id);
            }
          }

          await saveFileTo(absolutePath, bytes);
          await addSubmission(
            selectedFolder.id,
            student?.id ?? null,
            file.name,
            absolutePath,
          );
        } catch (err) {
          console.error('submission persist failed:', file.name, err);
        }
      }
      await fetchSubmissionsForFolder(selectedFolder.id);
    },
    [selectedFolder, folders, settings.submission_root_path, settings.student_id_pattern, students, fetchSubmissionsForFolder]
  );

  // ── Roster actions ──────────────────────────────────────────────
  const handleAssignUnmatched = useCallback(
    async (subId: number, studentId: number) => {
      if (!selectedFolder) return;
      const root = settings.submission_root_path;
      if (!root) return;
      try {
        const all = await getAllSubmissions();
        const sub = all.find((s) => s.id === subId);
        if (!sub) return;
        const student = students.find((s) => s.id === studentId);
        if (!student) return;

        const newFilename = buildStudentFilename(student, settings.student_id_pattern, sub.original_filename);
        const newPath = await buildStoredPath(root, selectedFolder, folders, newFilename);

        // 만약 해당 학생에게 이미 제출이 있으면 덮어쓰기 (기존 파일 + 레코드 제거)
        const existing = await findSubmissionByFolderAndStudent(selectedFolder.id, studentId);
        if (existing && existing.id !== subId) {
          await removeFileSilent(existing.stored_path);
          await deleteSubmission(existing.id);
        }

        try {
          await renamePath(sub.stored_path, newPath);
        } catch (err) {
          console.error('rename failed during assign:', err);
        }
        await updateSubmissionStudent(subId, studentId, newPath, sub.original_filename);
        await fetchSubmissionsForFolder(selectedFolder.id);
      } catch (err) {
        console.error('assign unmatched failed:', err);
      }
    },
    [selectedFolder, folders, settings.submission_root_path, settings.student_id_pattern, students, fetchSubmissionsForFolder]
  );

  const handleDropFileOnStudent = useCallback(
    async (studentId: number, files: File[]) => {
      if (!selectedFolder) return;
      const root = settings.submission_root_path;
      if (!root) return;
      const student = students.find((s) => s.id === studentId);
      if (!student) return;
      const file = files[0];
      if (!file) return;
      try {
        const bytes = await fileToBytes(file);
        const newFilename = buildStudentFilename(student, settings.student_id_pattern, file.name);
        const newPath = await buildStoredPath(root, selectedFolder, folders, newFilename);

        const existing = await findSubmissionByFolderAndStudent(selectedFolder.id, studentId);
        if (existing) {
          await removeFileSilent(existing.stored_path);
          await deleteSubmission(existing.id);
        }
        await saveFileTo(newPath, bytes);
        await addSubmission(selectedFolder.id, studentId, file.name, newPath);
        await fetchSubmissionsForFolder(selectedFolder.id);
      } catch (err) {
        console.error('drop-on-student failed:', err);
      }
    },
    [selectedFolder, folders, settings.submission_root_path, settings.student_id_pattern, students, fetchSubmissionsForFolder]
  );

  // ── File handling ────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
    void persistUploadedFiles(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
    void persistUploadedFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Match student from filename (학번 우선 → 이름 폴백) ──────────
  const findStudentFromFile = (filename: string) => {
    return matchStudentFromFilename(filename, students, settings.student_id_pattern);
  };

  // ── Save instructions only (no files required) ──────────────────
  const handleSave = async () => {
    if (!selectedFolder) return;

    if (!selectedGroupId) {
      alert('저장될 그룹(영역)을 선택해주세요.');
      return;
    }
    if (!taskDescription.trim()) {
      alert(isSurveyMode ? '설문 안내사항을 입력해주세요.' : '과제 안내사항을 입력해주세요.');
      return;
    }

    try {
      await updateAssignmentFolder(
        selectedFolder.id,
        selectedFolder.name,
        selectedGroupId ? Number(selectedGroupId) : null,
        taskDescription,
      );
      await loadFolders();
      // Update selectedFolder with saved data
      const all = await getAssignmentFolders();
      const updated = all.find((f) => f.id === selectedFolder.id);
      if (updated) setSelectedFolder(updated);
      alert('저장되었습니다.');
    } catch (e) {
      alert('저장 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  // ── Generate sentences ───────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedFolder) return;

    if (!selectedGroupId) {
      alert('저장될 그룹(영역)을 선택해주세요.');
      return;
    }
    if (!taskDescription.trim()) {
      alert(isSurveyMode ? '설문 안내사항을 입력해주세요.' : '과제 안내사항을 입력해주세요.');
      return;
    }
    if (uploadedFiles.length === 0) {
      alert(isSurveyMode ? '학생 응답 파일을 업로드해주세요.' : '학생 제출물을 업로드해주세요.');
      return;
    }

    setGenerating(true);
    setError(null);
    setResults([]);
    setGenProgress({ done: 0, total: uploadedFiles.length, phase: '파일 읽는 중' });

    try {
      // Save instructions to folder
      await updateAssignmentFolder(
        selectedFolder.id,
        selectedFolder.name,
        selectedGroupId ? Number(selectedGroupId) : null,
        taskDescription,
      );

      // Extract text from files sequentially so the progress counter is meaningful
      const fileData: Array<{ studentName: string; content: string }> = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const studentName = extractNameFromFilename(file.name);
        let content = '';
        try {
          const result = await extractText(file);
          if (!result.success) {
            content = result.error ?? `(${file.name} 파일 처리 실패)`;
          } else if (result.needsVision && result.images && result.images.length > 0) {
            setGenProgress({ done: i, total: uploadedFiles.length, phase: `이미지 텍스트 추출 중 (${i + 1}/${uploadedFiles.length})` });
            content = await extractTextFromImages(result.images);
          } else {
            content = result.text;
          }
        } catch {
          content = `(${file.name} 파일 내용 추출 실패)`;
        }
        fileData.push({ studentName, content });
        setGenProgress({ done: i + 1, total: uploadedFiles.length, phase: '파일 읽는 중' });
      }

      setGenProgress({ done: uploadedFiles.length, total: uploadedFiles.length, phase: 'AI 문장 생성 중' });

      let generated: Array<{ studentName: string; sentence: string }>;

      if (isSurveyMode) {
        generated = await generateSurveySentences(
          taskDescription,
          fileData.map((d) => ({ studentName: d.studentName, response: d.content })),
        );
      } else {
        generated = await generateAssignmentSentences(taskDescription, fileData);
      }

      const resultItems: ResultItem[] = generated.map((g) => {
        // Try matching by filename first (for assignment mode)
        const fileMatch = uploadedFiles.find((f) => {
          const name = f.name.replace(/\.[^.]+$/, '').replace(/^[\d_\-.\s]+/, '').trim();
          return name === g.studentName || f.name.includes(g.studentName);
        });
        const match = fileMatch
          ? findStudentFromFile(fileMatch.name)
          : { student: students.find((s) => s.name === g.studentName) ?? null, matchMethod: 'name' as const };

        return {
          studentName: match.student?.name ?? g.studentName,
          sentence: g.sentence,
          confirmed: false,
          editing: false,
          editText: g.sentence,
          studentId: match.student?.id ?? null,
          groupId: selectedGroupId ? Number(selectedGroupId) : null,
          matchMethod: match.matchMethod,
          candidates: match.candidates,
        };
      });

      setResults(resultItems);

      // Save assignment/survey to history tables
      const title = `${selectedFolder.name}: ${taskDescription.slice(0, 40)}`;
      const catId = selectedGroupId ? Number(selectedGroupId) : 0;
      if (isSurveyMode) {
        await addSurvey(title, taskDescription, catId || null);
      } else {
        await addAssignment(title, catId, taskDescription);
      }

      // Reload folders to get updated instructions
      await loadFolders();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
      setGenProgress(null);
    }
  };

  // ── Result actions ───────────────────────────────────────────────
  const toggleEdit = (index: number) => {
    setResults((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, editing: !r.editing, editText: r.editing ? r.editText : r.sentence }
          : r,
      ),
    );
  };

  const updateEditText = (index: number, text: string) => {
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, editText: text } : r)));
  };

  const saveEdit = (index: number) => {
    setResults((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, sentence: r.editText, editing: false } : r,
      ),
    );
  };

  const findDuplicateId = (studentId: number | null): number | null => {
    if (studentId === null) return null;
    const existing = folderRecords.find(
      (r) => r.student_id === studentId && r.assignment_folder_id === (selectedFolder?.id ?? null),
    );
    return existing?.id ?? null;
  };

  const confirmSingle = async (index: number) => {
    const item = results[index];
    if (item.confirmed) return;

    const source: RecordSource = isSurveyMode ? '설문' : '과제';
    const catId = item.groupId ?? (selectedGroupId ? Number(selectedGroupId) : null);

    const dupId = findDuplicateId(item.studentId);
    if (dupId !== null) {
      const ok = window.confirm(
        `${item.studentName ?? '이 학생'}에게 이미 이 폴더의 문장이 있습니다. 덮어쓸까요?`,
      );
      if (!ok) return;
      await deleteRecord(dupId);
    }

    await addRecord(
      taskDescription,
      item.sentence,
      item.studentId,
      catId,
      source,
      '보통',
      selectedFolder?.id ?? null,
    );

    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, confirmed: true } : r)));
    if (selectedFolder) {
      const refreshed = await getRecordsByAssignmentFolder(selectedFolder.id);
      setFolderRecords(refreshed);
    }
  };

  const confirmAll = async () => {
    const source: RecordSource = isSurveyMode ? '설문' : '과제';

    const unconfirmed = results
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => !r.confirmed);

    // Count existing duplicates once, ask user once.
    const dups = unconfirmed
      .map((i) => ({ id: findDuplicateId(i.studentId), name: i.studentName }))
      .filter((d) => d.id !== null);
    if (dups.length > 0) {
      const names = dups.map((d) => d.name).filter(Boolean).slice(0, 5).join(', ');
      const suffix = dups.length > 5 ? ` 외 ${dups.length - 5}명` : '';
      const ok = window.confirm(
        `${dups.length}명의 기존 문장이 있습니다 (${names}${suffix}). 모두 덮어쓸까요? 취소하면 기존 문장은 유지하고 새로 만든 문장은 저장하지 않습니다.`,
      );
      if (!ok) return;
      for (const d of dups) {
        if (d.id !== null) await deleteRecord(d.id);
      }
    }

    for (const item of unconfirmed) {
      const catId = item.groupId ?? (selectedGroupId ? Number(selectedGroupId) : null);
      await addRecord(
        taskDescription,
        item.sentence,
        item.studentId,
        catId,
        source,
        '보통',
        selectedFolder?.id ?? null,
      );
    }

    setResults((prev) => prev.map((r) => ({ ...r, confirmed: true })));
    if (selectedFolder) {
      const refreshed = await getRecordsByAssignmentFolder(selectedFolder.id);
      setFolderRecords(refreshed);
    }
  };

  // ── Reset form ───────────────────────────────────────────────────
  const resetForm = () => {
    setSelectedGroupId('');
    setTaskDescription('');
    setUploadedFiles([]);
    setResults([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const allConfirmed = results.length > 0 && results.every((r) => r.confirmed);
  const hasResults = results.length > 0;

  // ── Render right panel content ───────────────────────────────────
  const renderRightPanel = () => {
    // No folder selected
    if (!selectedFolder) {
      return (
        <div style={customStyles.formZone}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              textAlign: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '48px', opacity: 0.4 }}>{'\uD83D\uDCC1'}</span>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#555555' }}>
              폴더를 만들어 과제와 설문을 관리하세요
            </div>
            <div style={{ fontSize: '14px', color: '#888888', lineHeight: 1.5 }}>
              왼쪽 패널에서 "새 폴더" 버튼을 눌러 폴더를 만들고,
              <br />
              폴더를 선택하면 이곳에 과제/설문 양식이 나타납니다.
            </div>
          </div>
        </div>
      );
    }

    // Folder with children selected — show summary
    if (!isLeafFolder) {
      return (
        <div style={customStyles.formZone}>
          <div style={customStyles.sectionHeader}>
            <h1 style={customStyles.sectionTitle}>{selectedFolder.name}</h1>
            <p style={customStyles.sectionDesc}>
              이 폴더에는 {selectedFolderChildren.length}개의 하위 폴더가 있습니다.
              하위 폴더를 선택하면 과제/설문을 등록할 수 있습니다.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedFolderChildren.map((child) => (
              <div
                key={child.id}
                onClick={() => {
                  handleSelectFolder(child);
                  setExpandedIds((prev) => new Set([...prev, selectedFolder.id]));
                }}
                style={{
                  padding: '16px 20px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <span style={{ fontSize: '20px' }}>{'\uD83D\uDCC2'}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111111' }}>
                    {child.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#555555', marginTop: '2px' }}>
                    {child.folder_type === 'survey' ? '설문' : '과제'}
                    {child.instructions ? ` — ${child.instructions.slice(0, 40)}...` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Leaf folder selected — show form or results
    return (
      <div style={customStyles.formZone}>
        <div style={customStyles.sectionHeader}>
          <h1 style={customStyles.sectionTitle}>
            {selectedFolder.name}
          </h1>
          <p style={customStyles.sectionDesc}>
            {isSurveyMode
              ? '설문 문항과 학생 응답을 올리면, 학생별 생기부 문장으로 변환됩니다.'
              : '안내사항과 학생 제출물을 올리면, 학생별 생기부 문장으로 변환됩니다.'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #EF4444',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '24px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#991B1B',
            }}
          >
            {error}
          </div>
        )}

        {/* Results view */}
        {hasResults ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#111111' }}>
                  생성 결과 ({results.length}명)
                </div>
                <div style={{ fontSize: '13px', color: '#555555', marginTop: '4px' }}>
                  {results.filter((r) => r.confirmed).length}/{results.length}명 전송됨
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {!allConfirmed && (
                  <button
                    onClick={confirmAll}
                    style={{
                      ...customStyles.btnSubmitLarge,
                      padding: '12px 28px',
                      fontSize: '14px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333333')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111111')}
                  >
                    전체 전송
                  </button>
                )}
                <button
                  onClick={resetForm}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    border: '1px solid #000000',
                    background: 'transparent',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#111111',
                    cursor: 'pointer',
                    textAlign: 'center' as const,
                    transition: 'all 0.2s',
                    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  새로 작성
                </button>
              </div>
            </div>

            {results.map((item, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid #000000',
                  borderRadius: '10px',
                  backgroundColor: item.confirmed ? '#F0FDF4' : '#ffffff',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#111111' }}>
                      {item.studentName}
                    </span>
                    {item.studentId ? (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#10B981',
                          backgroundColor: '#D1FAE5',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {item.matchMethod === 'student_id' ? '학번 매칭' : '이름 매칭'}
                      </span>
                    ) : (
                      <>
                        <span
                          style={{
                            fontSize: '11px',
                            color: item.matchMethod === 'duplicate' ? '#7C3AED' : '#D97706',
                            backgroundColor: item.matchMethod === 'duplicate' ? '#EDE9FE' : '#FEF3C7',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {item.matchMethod === 'duplicate' ? '동명이인' : '매칭 안됨'}
                        </span>
                        {!item.confirmed && (
                          <select
                            style={{
                              fontSize: '12px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${item.matchMethod === 'duplicate' ? '#7C3AED' : '#D97706'}`,
                              backgroundColor: item.matchMethod === 'duplicate' ? '#F5F3FF' : '#FFFBEB',
                              color: item.matchMethod === 'duplicate' ? '#5B21B6' : '#92400E',
                              cursor: 'pointer',
                            }}
                            value=""
                            onChange={(e) => {
                              const sid = Number(e.target.value);
                              const s = students.find((st) => st.id === sid);
                              if (s) {
                                setResults((prev) =>
                                  prev.map((r, i) =>
                                    i === index
                                      ? { ...r, studentId: sid, studentName: s.name, matchMethod: 'name', candidates: undefined }
                                      : r,
                                  ),
                                );
                              }
                            }}
                          >
                            <option value="" disabled>
                              {item.matchMethod === 'duplicate' ? '학생을 선택하세요' : '학생 직접 선택'}
                            </option>
                            {(item.candidates && item.candidates.length > 0
                              ? item.candidates
                              : students
                            ).map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.grade} {s.class_name} {s.student_no}번 {s.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}
                    {/* 그룹 변경 드롭다운 */}
                    {!item.confirmed && (
                      <select
                        style={{
                          fontSize: '12px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(0,0,0,0.15)',
                          backgroundColor: '#F9FAFB',
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                        value={String(item.groupId ?? selectedGroupId)}
                        onChange={(e) => {
                          const gid = Number(e.target.value);
                          setResults((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, groupId: gid } : r)),
                          );
                        }}
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={String(g.id)}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {item.confirmed && (
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#065F46',
                      }}
                    >
                      전송됨
                    </span>
                  )}
                </div>

                {item.editing ? (
                  <textarea
                    style={{
                      ...customStyles.formInput,
                      ...customStyles.formTextarea,
                      minHeight: '80px',
                    }}
                    value={item.editText}
                    onChange={(e) => updateEditText(index, e.target.value)}
                    spellCheck={false}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: '15px',
                      color: '#111111',
                      lineHeight: 1.6,
                      padding: '8px 0',
                    }}
                  >
                    {item.sentence}
                  </div>
                )}

                {!item.confirmed && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {item.editing ? (
                      <>
                        <button
                          onClick={() => saveEdit(index)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid #000000',
                            backgroundColor: '#111111',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily:
                              'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                          }}
                        >
                          저장
                        </button>
                        <button
                          onClick={() => toggleEdit(index)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid #000000',
                            backgroundColor: 'transparent',
                            color: '#111111',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily:
                              'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                          }}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleEdit(index)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid #000000',
                            backgroundColor: 'transparent',
                            color: '#111111',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily:
                              'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                          }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => confirmSingle(index)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid #000000',
                            backgroundColor: '#111111',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily:
                              'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                          }}
                        >
                          전송
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Form view */
          <div style={customStyles.formContainer}>
            {/* Group Select */}
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>그룹</label>
              <select
                style={{
                  ...customStyles.formInput,
                  ...customStyles.formSelect,
                  color: selectedGroupId ? '#111111' : '#888888',
                }}
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="" disabled hidden>
                  이 {isSurveyMode ? '설문' : '과제'}가 들어갈 그룹을 선택하세요
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Description */}
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>
                {isSurveyMode ? '설문 안내사항' : '과제 안내사항'}
              </label>
              <textarea
                style={{ ...customStyles.formInput, ...customStyles.formTextarea }}
                placeholder={
                  isSurveyMode
                    ? '어떤 설문인지 적어주세요. AI가 이 맥락을 보고 문장을 만듭니다.'
                    : '어떤 과제인지 적어주세요. AI가 이 맥락을 보고 문장을 만듭니다.'
                }
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Upload Zone */}
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>
                {isSurveyMode ? '학생 응답' : '학생 제출물'}
                <span style={customStyles.labelNote}>
                  파일명에 학번 또는 이름을 포함하면 자동 매칭됩니다.
                </span>
              </label>
              <label
                htmlFor="file-upload"
                style={{
                  ...customStyles.uploadZone,
                  backgroundColor: dragOver
                    ? '#EFEFEA'
                    : uploadHover
                      ? '#EFEFEA'
                      : '#F4F4F2',
                }}
                onMouseEnter={() => setUploadHover(true)}
                onMouseLeave={() => setUploadHover(false)}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".hwp,.docx,.pdf,.txt,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div style={customStyles.uploadIcon}>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                {uploadedFiles.length > 0 ? (
                  <div style={customStyles.uploadText}>
                    {uploadedFiles.length}개 파일 선택됨
                    <br />
                    <span style={{ fontSize: '13px', fontWeight: 400, color: '#555555' }}>
                      {uploadedFiles.map((f) => f.name).join(', ')}
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={customStyles.uploadText}>
                      클릭하여 파일을 선택하거나
                      <br />
                      여기로 파일을 드래그하세요
                    </div>
                    <div style={customStyles.uploadHint}>
                      지원 파일: XLSX, PDF, DOCX, TXT, 이미지 (최대 50MB)
                    </div>
                  </>
                )}
              </label>

              {uploadedFiles.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '4px',
                  }}
                >
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.15)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '13px',
                        color: '#111111',
                      }}
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeFile(i);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#888888',
                          fontSize: '16px',
                          padding: '0 2px',
                          lineHeight: 1,
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div style={{ ...customStyles.formActions, gap: '12px' }}>
              <button
                style={{
                  ...customStyles.btnSubmitLarge,
                  opacity: generating ? 0.6 : 1,
                  cursor: generating ? 'not-allowed' : 'pointer',
                }}
                onClick={handleGenerate}
                disabled={generating}
                onMouseEnter={(e) => {
                  if (!generating) e.currentTarget.style.backgroundColor = '#333333';
                }}
                onMouseLeave={(e) => {
                  if (!generating) e.currentTarget.style.backgroundColor = '#111111';
                }}
              >
                {generating
                  ? genProgress
                    ? `${genProgress.phase} (${genProgress.done}/${genProgress.total})`
                    : '생성 중...'
                  : '문장 생성하기'}
              </button>
              <button
                style={{
                  padding: '16px 32px',
                  borderRadius: '8px',
                  border: '1px solid #000000',
                  background: 'transparent',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111111',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                  transition: 'all 0.2s',
                  fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                }}
                onClick={handleSave}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* 확정된 문장 히스토리 */}
        {folderRecords.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111111', marginBottom: '12px' }}>
              전송된 문장 ({folderRecords.length}건)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {folderRecords.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    padding: '12px 16px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#111111' }}>
                      {rec.student_name || '미지정'}
                    </span>
                    {rec.group_name && (
                      <span style={{ fontSize: '11px', color: '#6B7280', backgroundColor: '#E5E7EB', padding: '1px 6px', borderRadius: '3px' }}>
                        {rec.group_name}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      {rec.source}
                    </span>
                  </div>
                  <div style={{ color: '#374151' }}>{rec.generated_sentence}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Sidebar */}
      <div style={customStyles.sidebar}>
        {/* Filter tabs only - no "new folder" button at top */}
        <div style={customStyles.sidebarActions}>
          <div
            style={{
              display: 'flex',
              gap: '0',
              border: '1px solid #000000',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {(['all', 'assignment', 'survey'] as const).map((type) => {
              const label = type === 'all' ? '전체' : type === 'assignment' ? '과제' : '설문';
              const isActive = filterType === type;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    border: 'none',
                    backgroundColor: isActive ? '#111111' : 'transparent',
                    color: isActive ? '#ffffff' : '#111111',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={customStyles.sidebarDivider} />
        <div style={customStyles.sidebarHeader}>폴더</div>

        <div style={customStyles.historyList}>
          {filteredTree.length === 0 && (
            <div style={{ padding: '14px 20px', fontSize: '13px', color: '#888888' }}>
              폴더가 없습니다. 새 폴더를 만들어보세요.
            </div>
          )}
          {filteredTree.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              depth={0}
              selectedId={selectedFolder?.id ?? null}
              expandedIds={expandedIds}
              onSelect={handleSelectFolder}
              onToggleExpand={handleToggleExpand}
              onAddSubfolder={(parentId) => {
                const parent = folders.find((f) => f.id === parentId);
                setFolderDialog({
                  open: true,
                  mode: 'create',
                  parentId,
                  initialFolderType: (parent?.folder_type as 'assignment' | 'survey') || 'assignment',
                });
              }}
              onRename={(f) => setFolderDialog({
                open: true,
                mode: 'rename',
                parentId: f.parent_id,
                folderId: f.id,
                initialName: f.name,
                initialFolderType: f.folder_type as 'assignment' | 'survey',
              })}
              onDelete={handleDeleteFolder}
            />
          ))}
        </div>

        {/* Bottom: new folder button (RecordView style) */}
        <button
          style={{
            ...customStyles.btnNewView,
            ...(newFolderHover ? { color: '#111111', backgroundColor: 'rgba(0,0,0,0.02)' } : {}),
          }}
          onMouseEnter={() => setNewFolderHover(true)}
          onMouseLeave={() => setNewFolderHover(false)}
          onClick={() => setFolderDialog({ open: true, mode: 'create', parentId: null })}
        >
          <PlusIcon />
          새 폴더 만들기
        </button>
      </div>

      {/* Main Content */}
      <div style={customStyles.mainContent}>{renderRightPanel()}</div>

      {/* Roster Panel (wide) */}
      {selectedFolder && rosterWide && (
        <SubmissionRosterPanel
          folder={selectedFolder}
          submissions={submissionsForSelected}
          onOpenFile={(p) => void openInOS(p)}
          onAssignUnmatched={handleAssignUnmatched}
          onDropFileOnStudent={handleDropFileOnStudent}
        />
      )}

      {/* Roster Panel (narrow overlay) */}
      {selectedFolder && !rosterWide && rosterOverlayOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 360,
            backgroundColor: '#F4F4F2',
            borderLeft: '1px solid #000',
            zIndex: 500,
            boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
          }}
        >
          <SubmissionRosterPanel
            folder={selectedFolder}
            submissions={submissionsForSelected}
            onOpenFile={(p) => void openInOS(p)}
            onAssignUnmatched={handleAssignUnmatched}
            onDropFileOnStudent={handleDropFileOnStudent}
          />
          <button
            onClick={() => setRosterOverlayOpen(false)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              padding: '4px 10px',
              border: '1px solid #000',
              borderRadius: 6,
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Roster toggle (narrow) */}
      {selectedFolder && !rosterWide && !rosterOverlayOpen && (
        <button
          onClick={() => setRosterOverlayOpen(true)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '8px 14px',
            border: '1px solid #000',
            borderRadius: 8,
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
          }}
        >
          📋 명렬 보기
        </button>
      )}

      {/* Folder Create/Rename Dialog */}
      {folderDialog.open && (
        <FolderDialog
          mode={folderDialog.mode}
          parentId={folderDialog.parentId}
          initialName={folderDialog.initialName}
          initialFolderType={folderDialog.initialFolderType}
          folderTree={folderTree}
          onConfirm={handleFolderDialogConfirm}
          onClose={() => setFolderDialog({ open: false, mode: 'create', parentId: null })}
        />
      )}
    </div>
  );
}
