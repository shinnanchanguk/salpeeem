# Assignment Sidebar UI Consistency Plan

> Status: COMPLETED (2026-04-16) — sidebar unified with RecordView pattern. Commit `4b96305 feat: unify assignment sidebar UX with record tab pattern`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** AssignmentView 사이드바의 폴더 생성/이름변경/삭제 UX를 RecordView의 그룹 관리 패턴과 일치시킨다.

**Architecture:** AssignmentView.tsx 단일 파일 수정. FolderTreeItem의 인라인 rename + hover 액션(+/x)을 MoreIcon 컨텍스트 메뉴로 교체하고, 즉시 생성을 FolderDialog 모달 방식으로 변경하며, 버튼 위치와 스타일을 RecordView와 통일한다.

**Tech Stack:** React + TypeScript, inline styles (Tailwind 아님)

---

### Task 1: Add dialog/overlay styles and icons to AssignmentView

**Files:**
- Modify: `src/views/AssignmentView.tsx:17-100` (customStyles 객체)
- Modify: `src/views/AssignmentView.tsx:239` (아이콘 추가)

- [x] **Step 1: Add dialog styles to customStyles**

RecordView에서 사용하는 overlay, dialog, dialogTitle, dialogLabel, dialogInput, dialogSelect, dialogActions, btnCancel, btnConfirm 스타일을 AssignmentView의 customStyles에 추가한다. 또한 btnNewView 스타일을 추가하고, sidebar width를 280px로 변경한다.

`customStyles` 객체 끝부분(현재 `formContainer` 이후)에 아래 스타일들을 추가:

```typescript
// 기존 sidebar 스타일에서 width 변경
sidebar: {
  width: '280px',  // 300px → 280px
  // ... 나머지 동일
},

// 기존 btnSidebarAction, btnSidebarActionSelected 스타일은 제거 (더 이상 사용 안 함)

// 새로 추가할 스타일들:
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
```

- [x] **Step 2: Add PlusIcon and MoreIcon components**

FolderTreeItem 정의 앞(line ~237)에 아이콘 컴포넌트 추가:

```tsx
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
```

- [x] **Step 3: Verify no TypeScript errors**

Run: `cd /home/shinchang/salpeeem && npx tsc --noEmit 2>&1 | head -20`

- [x] **Step 4: Commit**

```bash
git add src/views/AssignmentView.tsx
git commit -m "refactor: add dialog styles and icons to AssignmentView for consistency"
```

---

### Task 2: Replace FolderTreeItem inline rename + hover actions with MoreIcon context menu

**Files:**
- Modify: `src/views/AssignmentView.tsx:239-469` (FolderTreeItem 컴포넌트)

- [x] **Step 1: Rewrite FolderTreeItem props and component**

기존 FolderTreeItem의 인라인 rename 관련 props(`renamingId`, `renameText`, `onStartRename`, `onRenameChange`, `onRenameConfirm`, `onRenameCancelFn`)를 제거하고, 대신 `onRename(folder)`, `onAddSubfolder(parentId)`, `onDelete(folder)` 콜백으로 단순화한다.

더블클릭 이벤트를 제거하고, 호버 시 `+`/`×` 버튼 대신 MoreIcon 버튼을 표시한다. MoreIcon 클릭 시 3개 메뉴("하위 폴더 추가", "이름 변경", "삭제")가 나타난다.

새 props 인터페이스:

```tsx
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
```

컴포넌트 내부에서 `useState`로 `hovered`, `showMenu`를 로컬 관리하고, `useRef`로 메뉴 외부 클릭 감지.

RecordView의 GroupTreeItem 패턴 그대로:
- 호버 시 MoreIcon 표시
- 클릭 시 메뉴 토글
- 메뉴 항목: "하위 폴더 추가" / "이름 변경" / "삭제" (삭제는 `color: '#cc3333'`)
- 메뉴 외부 클릭 시 닫힘 (useEffect + mousedown 리스너)

```tsx
function FolderTreeItem({
  folder, depth, selectedId, expandedIds,
  onSelect, onToggleExpand, onAddSubfolder, onRename, onDelete,
}: FolderTreeItemProps) {
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedId === folder.id;
  const isExpanded = expandedIds.has(folder.id);
  const hasChildren = (folder.children?.length ?? 0) > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(folder);
    if (hasChildren) onToggleExpand(folder.id);
  };

  // 폴더 아이콘은 FolderIcon SVG 사용 (RecordView와 동일)
  // 메뉴 스타일은 RecordView GroupTreeItem의 메뉴와 동일
  // children 재귀 렌더링은 기존과 동일하되 새 props 전달
}
```

- [x] **Step 2: Verify no TypeScript errors**

Run: `cd /home/shinchang/salpeeem && npx tsc --noEmit 2>&1 | head -20`

- [x] **Step 3: Commit**

```bash
git add src/views/AssignmentView.tsx
git commit -m "refactor: replace inline rename with context menu in FolderTreeItem"
```

---

### Task 3: Add FolderDialog modal component

**Files:**
- Modify: `src/views/AssignmentView.tsx` (FolderTreeItem 뒤에 FolderDialog 추가)

- [x] **Step 1: Create FolderDialog component**

RecordView의 GroupDialog와 동일한 구조. mode에 따라 다른 타이틀과 필드를 표시한다.

```tsx
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
    <div style={customStyles.overlay} onClick={onClose}>
      <div style={customStyles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={customStyles.dialogTitle}>
          {mode === 'create' ? '새 폴더 만들기' : '폴더 이름 변경'}
        </div>

        <div>
          <div style={customStyles.dialogLabel}>폴더 이름</div>
          <input
            style={customStyles.dialogInput}
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
```

- [x] **Step 2: Verify no TypeScript errors**

Run: `cd /home/shinchang/salpeeem && npx tsc --noEmit 2>&1 | head -20`

- [x] **Step 3: Commit**

```bash
git add src/views/AssignmentView.tsx
git commit -m "feat: add FolderDialog modal component for create/rename"
```

---

### Task 4: Rewire AssignmentView state and sidebar layout

**Files:**
- Modify: `src/views/AssignmentView.tsx:471-590` (state + folder actions)
- Modify: `src/views/AssignmentView.tsx:1401-1497` (sidebar JSX + dialog 렌더링)

- [x] **Step 1: Replace folder state with dialog state**

기존 상태에서 제거:
- `renamingId`, `renameText` (인라인 rename 제거)

새로 추가:
```tsx
const [folderDialog, setFolderDialog] = useState<{
  open: boolean;
  mode: 'create' | 'rename';
  parentId: number | null;
  folderId?: number;
  initialName?: string;
  initialFolderType?: 'assignment' | 'survey';
}>({ open: false, mode: 'create', parentId: null });
const [newFolderHover, setNewFolderHover] = useState(false);
```

- [x] **Step 2: Replace folder action handlers**

기존 `handleAddTopLevelFolder`, `handleAddChildFolder`, `handleStartRename`, `handleRenameConfirm`, `handleRenameCancel` 제거.

새 핸들러:

```tsx
const handleFolderDialogConfirm = async (name: string, parentId: number | null, folderType: 'assignment' | 'survey') => {
  if (folderDialog.mode === 'create') {
    await addAssignmentFolder(name, parentId, folderType);
    if (parentId !== null) {
      setExpandedIds((prev) => new Set([...prev, parentId]));
    }
  } else if (folderDialog.folderId) {
    const folder = folders.find((f) => f.id === folderDialog.folderId);
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
  await deleteAssignmentFolder(folder.id);
  if (selectedFolder?.id === folder.id) {
    setSelectedFolder(null);
    resetForm();
  }
  await loadFolders();
};
```

- [x] **Step 3: Rewrite sidebar JSX**

기존 상단 `sidebarActions`(새 폴더 버튼 + 필터 탭) 구조를 변경:
- 필터 탭은 상단에 유지 (sidebarActions 안)
- "새 폴더" 버튼은 제거
- 사이드바 하단에 btnNewView 스타일 버튼 추가 (historyList 바로 아래)
- FolderTreeItem에 새 props 전달 (inline rename 관련 props 제거)

```tsx
return (
  <div style={{ display: 'flex', width: '100%', height: '100%' }}>
    <div style={customStyles.sidebar}>
      {/* Filter tabs only */}
      <div style={customStyles.sidebarActions}>
        <div style={{ display: 'flex', gap: '0', border: '1px solid #000000', borderRadius: '8px', overflow: 'hidden' }}>
          {(['all', 'assignment', 'survey'] as const).map((type) => {
            const label = type === 'all' ? '전체' : type === 'assignment' ? '과제' : '설문';
            const isActive = filterType === type;
            return (
              <button key={type} onClick={() => setFilterType(type)} style={{
                flex: 1, padding: '8px 0', border: 'none',
                backgroundColor: isActive ? '#111111' : 'transparent',
                color: isActive ? '#ffffff' : '#111111',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
              }}>
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
                initialFolderType: parent?.folder_type as 'assignment' | 'survey' || 'assignment',
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

      {/* Bottom: new folder button */}
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

    <div style={customStyles.mainContent}>{renderRightPanel()}</div>

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
```

- [x] **Step 4: Clean up unused styles**

`btnSidebarAction`, `btnSidebarActionSelected` 스타일을 customStyles에서 제거.

- [x] **Step 5: Verify no TypeScript errors**

Run: `cd /home/shinchang/salpeeem && npx tsc --noEmit 2>&1 | head -20`

- [x] **Step 6: Visual verification**

Run: `cd /home/shinchang/salpeeem && npm run dev`

확인 사항:
- 사이드바 너비가 기록 탭과 동일한지 (280px)
- "새 폴더 만들기" 버튼이 사이드바 하단에 위치하고 RecordView와 동일한 스타일인지
- 버튼 클릭 시 모달 다이얼로그가 뜨고, 이름 입력 + 유형 선택 + 상위 폴더 선택이 가능한지
- 폴더 호버 시 MoreIcon(⋮)이 나타나고, 클릭 시 메뉴(하위 폴더 추가/이름 변경/삭제)가 표시되는지
- 기존 더블클릭 이름 변경이 제거되었는지

- [x] **Step 7: Commit**

```bash
git add src/views/AssignmentView.tsx
git commit -m "feat: unify assignment sidebar UX with record tab pattern"
```
