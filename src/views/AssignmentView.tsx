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
} from '@/lib/database';
import type { AssignmentFolder, RecordSource } from '@/types';

// ── Styles (kept from original) ────────────────────────────────────
const customStyles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '300px',
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
  btnSidebarAction: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #000000',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: 600,
    color: '#111111',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
  },
  btnSidebarActionSelected: {
    backgroundColor: '#111111',
    color: '#ffffff',
    borderColor: '#111111',
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
};

// ── Result item types ────────────────────────────────────────────────
interface ResultItem {
  studentName: string;
  sentence: string;
  confirmed: boolean;
  editing: boolean;
  editText: string;
  studentId: number | null;
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

// ── Folder tree item component ───────────────────────────────────────
interface FolderTreeItemProps {
  folder: AssignmentFolder;
  depth: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  hoveredId: number | null;
  renamingId: number | null;
  renameText: string;
  onSelect: (folder: AssignmentFolder) => void;
  onToggleExpand: (id: number) => void;
  onHover: (id: number | null) => void;
  onAddChild: (parentId: number) => void;
  onDelete: (id: number) => void;
  onStartRename: (id: number, currentName: string) => void;
  onRenameChange: (text: string) => void;
  onRenameConfirm: (id: number) => void;
  onRenameCancelFn: () => void;
}

function FolderTreeItem({
  folder,
  depth,
  selectedId,
  expandedIds,
  hoveredId,
  renamingId,
  renameText,
  onSelect,
  onToggleExpand,
  onHover,
  onAddChild,
  onDelete,
  onStartRename,
  onRenameChange,
  onRenameConfirm,
  onRenameCancelFn,
}: FolderTreeItemProps) {
  const isSelected = selectedId === folder.id;
  const isExpanded = expandedIds.has(folder.id);
  const isHovered = hoveredId === folder.id;
  const isRenaming = renamingId === folder.id;
  const hasChildren = (folder.children?.length ?? 0) > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(folder);
    if (hasChildren) {
      onToggleExpand(folder.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartRename(folder.id, folder.name);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onRenameConfirm(folder.id);
    } else if (e.key === 'Escape') {
      onRenameCancelFn();
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
            : isHovered
              ? 'rgba(0,0,0,0.03)'
              : 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 0.15s, border-left 0.15s',
          position: 'relative',
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => onHover(folder.id)}
        onMouseLeave={() => onHover(null)}
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

        {/* Name or rename input */}
        {isRenaming ? (
          <input
            autoFocus
            value={renameText}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={() => onRenameConfirm(folder.id)}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              fontSize: '14px',
              fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
              border: '1px solid #000000',
              borderRadius: '4px',
              padding: '2px 6px',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#111111',
              minWidth: 0,
            }}
          />
        ) : (
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
        )}

        {/* Hover actions */}
        {isHovered && !isRenaming && (
          <span
            style={{
              display: 'flex',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            <button
              title="하위 폴더 추가"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(folder.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#555555',
                fontSize: '16px',
                padding: '0 2px',
                lineHeight: 1,
                fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
              }}
            >
              +
            </button>
            <button
              title="삭제"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#555555',
                fontSize: '16px',
                padding: '0 2px',
                lineHeight: 1,
                fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
              }}
            >
              ×
            </button>
          </span>
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
            hoveredId={hoveredId}
            renamingId={renamingId}
            renameText={renameText}
            onSelect={onSelect}
            onToggleExpand={onToggleExpand}
            onHover={onHover}
            onAddChild={onAddChild}
            onDelete={onDelete}
            onStartRename={onStartRename}
            onRenameChange={onRenameChange}
            onRenameConfirm={onRenameConfirm}
            onRenameCancelFn={onRenameCancelFn}
          />
        ))}
      </div>
    </div>
  );
}

export function AssignmentView() {
  // ── Stores ───────────────────────────────────────────────────────
  const { groups, fetchGroups } = useGroupStore();
  const { students, fetchStudents } = useStudentStore();
  const { addRecord } = useRecordStore();

  // ── Folder state ────────────────────────────────────────────────
  const [folders, setFolders] = useState<AssignmentFolder[]>([]);
  const [folderTree, setFolderTree] = useState<AssignmentFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<AssignmentFolder | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [hoveredFolderId, setHoveredFolderId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'assignment' | 'survey'>('all');

  // ── Form state ───────────────────────────────────────────────────
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadHover, setUploadHover] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // ── Generation state ─────────────────────────────────────────────
  const [generating, setGenerating] = useState<boolean>(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleAddTopLevelFolder = async () => {
    const name = '새 폴더';
    const folderType = filterType === 'survey' ? 'survey' : 'assignment';
    const result = await addAssignmentFolder(name, null, folderType as 'assignment' | 'survey');
    await loadFolders();
    // Auto-select and start renaming
    const all = await getAssignmentFolders();
    const newFolder = all.find((f) => f.id === result.lastInsertId);
    if (newFolder) {
      setSelectedFolder(newFolder);
      setRenamingId(newFolder.id);
      setRenameText(newFolder.name);
    }
  };

  const handleAddChildFolder = async (parentId: number) => {
    const parent = folders.find((f) => f.id === parentId);
    const folderType = parent?.folder_type || 'assignment';
    const result = await addAssignmentFolder('새 폴더', parentId, folderType as 'assignment' | 'survey');
    // Expand parent
    setExpandedIds((prev) => new Set([...prev, parentId]));
    await loadFolders();
    // Auto-select and start renaming
    const all = await getAssignmentFolders();
    const newFolder = all.find((f) => f.id === result.lastInsertId);
    if (newFolder) {
      setSelectedFolder(newFolder);
      setRenamingId(newFolder.id);
      setRenameText(newFolder.name);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
    const childCount = folders.filter((f) => f.parent_id === id).length;
    const msg = childCount > 0
      ? `"${folder.name}" 폴더와 하위 ${childCount}개 폴더를 삭제하시겠습니까?`
      : `"${folder.name}" 폴더를 삭제하시겠습니까?`;
    if (!confirm(msg)) return;
    await deleteAssignmentFolder(id);
    if (selectedFolder?.id === id) {
      setSelectedFolder(null);
      resetForm();
    }
    await loadFolders();
  };

  const handleStartRename = (id: number, currentName: string) => {
    setRenamingId(id);
    setRenameText(currentName);
  };

  const handleRenameConfirm = async (id: number) => {
    if (renameText.trim()) {
      const folder = folders.find((f) => f.id === id);
      await updateAssignmentFolder(id, renameText.trim(), folder?.group_id, folder?.instructions);
      await loadFolders();
      // Update selectedFolder if it was renamed
      if (selectedFolder?.id === id) {
        const all = await getAssignmentFolders();
        const updated = all.find((f) => f.id === id);
        if (updated) setSelectedFolder(updated);
      }
    }
    setRenamingId(null);
    setRenameText('');
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameText('');
  };

  const handleSelectFolder = (folder: AssignmentFolder) => {
    setSelectedFolder(folder);
    setResults([]);
    setError(null);
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  // ── File handling ────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
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

  // ── Match student name from filename to existing students ────────
  const findStudentId = (name: string): number | null => {
    const match = students.find(
      (s) => s.name === name || s.name.includes(name) || name.includes(s.name),
    );
    return match?.id ?? null;
  };

  // ── Save instructions only (no files required) ──────────────────
  const handleSave = async () => {
    if (!selectedFolder) return;

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

    try {
      // Save instructions to folder
      await updateAssignmentFolder(
        selectedFolder.id,
        selectedFolder.name,
        selectedGroupId ? Number(selectedGroupId) : null,
        taskDescription,
      );

      // Extract text from files (supports XLSX, PDF, DOCX, images, etc.)
      const fileData = await Promise.all(
        uploadedFiles.map(async (file) => {
          const studentName = extractNameFromFilename(file.name);
          let content = '';
          try {
            const result = await extractText(file);
            if (!result.success) {
              content = result.error ?? `(${file.name} 파일 처리 실패)`;
            } else if (result.needsVision && result.images && result.images.length > 0) {
              // Use Vision API for scanned PDFs and images
              content = await extractTextFromImages(result.images);
            } else {
              content = result.text;
            }
          } catch {
            content = `(${file.name} 파일 내용 추출 실패)`;
          }
          return { studentName, content };
        }),
      );

      let generated: Array<{ studentName: string; sentence: string }>;

      if (isSurveyMode) {
        generated = await generateSurveySentences(
          taskDescription,
          fileData.map((d) => ({ studentName: d.studentName, response: d.content })),
        );
      } else {
        generated = await generateAssignmentSentences(taskDescription, fileData);
      }

      const resultItems: ResultItem[] = generated.map((g) => ({
        studentName: g.studentName,
        sentence: g.sentence,
        confirmed: false,
        editing: false,
        editText: g.sentence,
        studentId: findStudentId(g.studentName),
      }));

      setResults(resultItems);

      // Save assignment/survey to history tables
      const title = `${selectedFolder.name}: ${taskDescription.slice(0, 40)}`;
      const catId = selectedGroupId ? Number(selectedGroupId) : 0;
      if (isSurveyMode) {
        await addSurvey(title, taskDescription);
      } else {
        await addAssignment(title, catId, taskDescription);
      }

      // Reload folders to get updated instructions
      await loadFolders();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
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

  const confirmSingle = async (index: number) => {
    const item = results[index];
    if (item.confirmed) return;

    const source: RecordSource = isSurveyMode ? '설문' : '과제';
    const catId = selectedGroupId ? Number(selectedGroupId) : null;

    await addRecord(
      taskDescription,
      item.sentence,
      item.studentId,
      catId,
      source,
      '보통',
    );

    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, confirmed: true } : r)));
  };

  const confirmAll = async () => {
    const source: RecordSource = isSurveyMode ? '설문' : '과제';
    const catId = selectedGroupId ? Number(selectedGroupId) : null;

    const unconfirmed = results
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => !r.confirmed);

    for (const item of unconfirmed) {
      await addRecord(
        taskDescription,
        item.sentence,
        item.studentId,
        catId,
        source,
        '보통',
      );
    }

    setResults((prev) => prev.map((r) => ({ ...r, confirmed: true })));
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
                  {results.filter((r) => r.confirmed).length}/{results.length}명 확정됨
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
                    전체 확정
                  </button>
                )}
                <button
                  onClick={resetForm}
                  style={{
                    ...customStyles.btnSidebarAction,
                    padding: '12px 28px',
                    fontSize: '14px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#111111' }}>
                      {item.studentName}
                    </span>
                    {item.studentId && (
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
                        매칭됨
                      </span>
                    )}
                    {!item.studentId && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#D97706',
                          backgroundColor: '#FEF3C7',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        미매칭
                      </span>
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
                      확정됨
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
                          확정
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
                  파일명에 학생 이름을 포함하면 자동 매칭됩니다.
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
                {generating ? '생성 중...' : '문장 생성하기'}
              </button>
              <button
                style={{
                  ...customStyles.btnSidebarAction,
                  padding: '16px 32px',
                  fontSize: '16px',
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
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Sidebar */}
      <div style={customStyles.sidebar}>
        <div style={customStyles.sidebarActions}>
          <button
            style={{
              ...customStyles.btnSidebarAction,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={handleAddTopLevelFolder}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {'\uD83D\uDCC1'} 새 폴더
          </button>

          {/* Filter tabs */}
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
                    fontFamily:
                      'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
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
              hoveredId={hoveredFolderId}
              renamingId={renamingId}
              renameText={renameText}
              onSelect={handleSelectFolder}
              onToggleExpand={handleToggleExpand}
              onHover={setHoveredFolderId}
              onAddChild={handleAddChildFolder}
              onDelete={handleDeleteFolder}
              onStartRename={handleStartRename}
              onRenameChange={setRenameText}
              onRenameConfirm={handleRenameConfirm}
              onRenameCancelFn={handleRenameCancel}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={customStyles.mainContent}>{renderRightPanel()}</div>
    </div>
  );
}
