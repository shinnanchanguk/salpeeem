import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStudentStore } from '@/stores/useStudentStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { Student, Group, AppSettings } from '@/types';

// --- Styles (copied from SettingsScreen design) ---

const customStyles = {
  sidebar: {
    width: '280px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    borderRight: '1px solid #000000',
    backgroundColor: '#EAEAE6',
    flexShrink: 0,
    paddingTop: '24px',
  },
  viewItemBase: {
    padding: '14px 24px',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    fontSize: '15px',
    color: '#111111',
    fontWeight: 500,
  } as React.CSSProperties,
  viewItemSelected: {
    borderLeftColor: '#111111',
    backgroundColor: 'rgba(0,0,0,0.05)',
    fontWeight: 700,
  } as React.CSSProperties,
  mainContent: {
    flex: 1,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    backgroundColor: '#EAEAE6',
    minWidth: 0,
    overflowY: 'auto' as const,
  },
  settingsZone: {
    padding: '40px 56px',
    maxWidth: '1000px',
    width: '100%',
  },
  sectionHeader: {
    marginBottom: '32px',
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
  actionBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#111111',
    border: '1px solid #000000',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  } as React.CSSProperties,
  btnPrimary: {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  } as React.CSSProperties,
  tableCard: {
    background: '#ffffff',
    border: '1px solid #000000',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  },
  th: {
    padding: '16px 24px',
    background: '#F4F4F2',
    borderBottom: '1px solid #000000',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555555',
    letterSpacing: '0.02em',
  },
  thRight: {
    padding: '16px 24px',
    background: '#F4F4F2',
    borderBottom: '1px solid #000000',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555555',
    letterSpacing: '0.02em',
    textAlign: 'right' as const,
  },
  td: {
    padding: '16px 24px',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    fontSize: '15px',
    color: '#111111',
    fontWeight: 500,
  },
  tdRight: {
    padding: '16px 24px',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    fontSize: '15px',
    color: '#111111',
    fontWeight: 500,
    textAlign: 'right' as const,
  },
  tdLast: {
    padding: '16px 24px',
    fontSize: '15px',
    color: '#111111',
    fontWeight: 500,
    textAlign: 'right' as const,
  },
  rowActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
  },
  btnText: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555555',
    cursor: 'pointer',
    transition: 'color 0.2s',
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    padding: '4px',
  } as React.CSSProperties,
  modal: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #000000',
    borderRadius: '16px',
    padding: '40px',
    width: '420px',
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    fontFamily: "'Pretendard', -apple-system, sans-serif",
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '24px',
    color: '#111111',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555555',
    marginBottom: '8px',
    letterSpacing: '0.01em',
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #000000',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 500,
    color: '#111111',
    backgroundColor: '#ffffff',
    outline: 'none',
    fontFamily: "'Pretendard', -apple-system, sans-serif",
    boxSizing: 'border-box' as const,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '32px',
  },
};

const hoverHandlers = {
  btnSecondaryEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#F8F8F6';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
  },
  btnSecondaryLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#ffffff';
    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
  },
  btnPrimaryEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#333333';
  },
  btnPrimaryLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#111111';
  },
};

// --- Sidebar items ---

const sidebarItems = ['학생 명단 관리', '영역 관리', 'AI 연결', '단축키 설정', '데이터 관리'];

// ===========================================================================
// 1. Student Management Section
// ===========================================================================

const StudentListSection: React.FC = () => {
  const { students, loading, fetchStudents, addStudent, updateStudent, deleteStudent } = useStudentStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: '', grade: '', class_name: '' });
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredEditBtn, setHoveredEditBtn] = useState<number | null>(null);
  const [hoveredDeleteBtn, setHoveredDeleteBtn] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openAddModal = () => {
    setEditingStudent(null);
    setForm({ name: '', grade: '', class_name: '' });
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setForm({ name: student.name, grade: student.grade, class_name: student.class_name });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
    setForm({ name: '', grade: '', class_name: '' });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.grade.trim() || !form.class_name.trim()) return;
    if (editingStudent) {
      await updateStudent(editingStudent.id, form.name.trim(), form.grade.trim(), form.class_name.trim());
    } else {
      await addStudent(form.name.trim(), form.grade.trim(), form.class_name.trim());
    }
    closeModal();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 이 학생을 삭제하시겠습니까?')) return;
    await deleteStudent(id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      // Skip header if it looks like one
      const startIdx = lines.length > 0 && /이름|name/i.test(lines[0]) ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(/[,\t]/).map((c) => c.trim());
        if (cols.length >= 3 && cols[0] && cols[1] && cols[2]) {
          await addStudent(cols[0], cols[1], cols[2]);
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <>
      <div style={customStyles.sectionHeader}>
        <h1 style={customStyles.sectionTitle}>학생 명단 관리</h1>
        <p style={customStyles.sectionDesc}>엑셀 업로드 또는 직접 추가. 학년·반·이름 포함.</p>
      </div>

      <div style={customStyles.actionBar}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.xls,.xlsx"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          style={customStyles.btnSecondary}
          onMouseEnter={hoverHandlers.btnSecondaryEnter}
          onMouseLeave={hoverHandlers.btnSecondaryLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          명단 업로드 (엑셀/CSV)
        </button>
        <button
          style={customStyles.btnPrimary}
          onClick={openAddModal}
          onMouseEnter={hoverHandlers.btnPrimaryEnter}
          onMouseLeave={hoverHandlers.btnPrimaryLeave}
        >
          + 학생 추가
        </button>
      </div>

      <div style={customStyles.tableCard}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#555555', fontSize: '15px' }}>
            불러오는 중...
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#555555', fontSize: '15px' }}>
            등록된 학생이 없습니다. 학생을 추가해주세요.
          </div>
        ) : (
          <table style={customStyles.dataTable}>
            <thead>
              <tr>
                <th style={{ ...customStyles.th, width: '30%' }}>이름</th>
                <th style={{ ...customStyles.th, width: '25%' }}>학년</th>
                <th style={{ ...customStyles.th, width: '25%' }}>반</th>
                <th style={{ ...customStyles.thRight, width: '20%' }}></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr
                  key={student.id}
                  onMouseEnter={() => setHoveredRow(student.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ backgroundColor: hoveredRow === student.id ? '#FAFAFA' : 'transparent' }}
                >
                  <td style={{ ...customStyles.td, borderBottom: idx === students.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>{student.name}</td>
                  <td style={{ ...customStyles.td, borderBottom: idx === students.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>{student.grade}</td>
                  <td style={{ ...customStyles.td, borderBottom: idx === students.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>{student.class_name}</td>
                  <td style={{ ...customStyles.tdLast, borderBottom: idx === students.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>
                    <div style={customStyles.rowActions}>
                      <button
                        style={{ ...customStyles.btnText, color: hoveredEditBtn === student.id ? '#111111' : '#555555' }}
                        onClick={() => openEditModal(student)}
                        onMouseEnter={() => setHoveredEditBtn(student.id)}
                        onMouseLeave={() => setHoveredEditBtn(null)}
                      >
                        수정
                      </button>
                      <button
                        style={{ ...customStyles.btnText, color: hoveredDeleteBtn === student.id ? '#DC2626' : '#555555' }}
                        onClick={() => handleDelete(student.id)}
                        onMouseEnter={() => setHoveredDeleteBtn(student.id)}
                        onMouseLeave={() => setHoveredDeleteBtn(null)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div style={customStyles.modal} onClick={closeModal}>
          <div style={customStyles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={customStyles.modalTitle}>{editingStudent ? '학생 정보 수정' : '학생 추가'}</div>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>이름</label>
              <input
                style={customStyles.formInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="이름을 입력하세요"
              />
            </div>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>학년</label>
              <input
                style={customStyles.formInput}
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                placeholder="예: 2학년"
              />
            </div>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>반</label>
              <input
                style={customStyles.formInput}
                value={form.class_name}
                onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                placeholder="예: 1반"
              />
            </div>
            <div style={customStyles.modalActions}>
              <button
                style={customStyles.btnSecondary}
                onClick={closeModal}
                onMouseEnter={hoverHandlers.btnSecondaryEnter}
                onMouseLeave={hoverHandlers.btnSecondaryLeave}
              >
                취소
              </button>
              <button
                style={customStyles.btnPrimary}
                onClick={handleSave}
                onMouseEnter={hoverHandlers.btnPrimaryEnter}
                onMouseLeave={hoverHandlers.btnPrimaryLeave}
              >
                {editingStudent ? '저장' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ===========================================================================
// 2. Group Management Section
// ===========================================================================

const AreaManagementSection: React.FC = () => {
  const { groups, loading, fetchGroups, addGroup, updateGroup, deleteGroup } = useGroupStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState({ name: '', byte_limit: '1500' });
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredEditBtn, setHoveredEditBtn] = useState<number | null>(null);
  const [hoveredDeleteBtn, setHoveredDeleteBtn] = useState<number | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const openAddModal = () => {
    setEditingGroup(null);
    setForm({ name: '', byte_limit: '1500' });
    setModalOpen(true);
  };

  const openEditModal = (g: Group) => {
    setEditingGroup(g);
    setForm({ name: g.name, byte_limit: String(g.byte_limit) });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGroup(null);
    setForm({ name: '', byte_limit: '1500' });
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const byteLimit = parseInt(form.byte_limit, 10);
    if (!name || isNaN(byteLimit) || byteLimit <= 0) return;

    if (editingGroup) {
      await updateGroup(editingGroup.id, name, byteLimit);
    } else {
      await addGroup(name, null, byteLimit);
    }
    closeModal();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 이 그룹을 삭제하시겠습니까?')) return;
    await deleteGroup(id);
  };

  return (
    <>
      <div style={customStyles.sectionHeader}>
        <h1 style={customStyles.sectionTitle}>그룹 관리</h1>
        <p style={customStyles.sectionDesc}>기록 그룹을 관리합니다. 각 그룹별 바이트 제한을 설정할 수 있습니다.</p>
      </div>

      <div style={customStyles.actionBar}>
        <button
          style={customStyles.btnPrimary}
          onClick={openAddModal}
          onMouseEnter={hoverHandlers.btnPrimaryEnter}
          onMouseLeave={hoverHandlers.btnPrimaryLeave}
        >
          + 그룹 추가
        </button>
      </div>

      <div style={customStyles.tableCard}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#555555', fontSize: '15px' }}>
            불러오는 중...
          </div>
        ) : groups.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#555555', fontSize: '15px' }}>
            등록된 그룹이 없습니다.
          </div>
        ) : (
          <table style={customStyles.dataTable}>
            <thead>
              <tr>
                <th style={{ ...customStyles.th, width: '50%' }}>그룹명</th>
                <th style={{ ...customStyles.th, width: '30%' }}>바이트 제한</th>
                <th style={{ ...customStyles.thRight, width: '20%' }}></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, idx) => (
                <tr
                  key={g.id}
                  onMouseEnter={() => setHoveredRow(g.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ backgroundColor: hoveredRow === g.id ? '#FAFAFA' : 'transparent' }}
                >
                  <td style={{ ...customStyles.td, borderBottom: idx === groups.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>{g.name}</td>
                  <td style={{ ...customStyles.td, borderBottom: idx === groups.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>{g.byte_limit.toLocaleString()} bytes</td>
                  <td style={{ ...customStyles.tdLast, borderBottom: idx === groups.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>
                    <div style={customStyles.rowActions}>
                      <button
                        style={{ ...customStyles.btnText, color: hoveredEditBtn === g.id ? '#111111' : '#555555' }}
                        onClick={() => openEditModal(g)}
                        onMouseEnter={() => setHoveredEditBtn(g.id)}
                        onMouseLeave={() => setHoveredEditBtn(null)}
                      >
                        수정
                      </button>
                      <button
                        style={{ ...customStyles.btnText, color: hoveredDeleteBtn === g.id ? '#DC2626' : '#555555' }}
                        onClick={() => handleDelete(g.id)}
                        onMouseEnter={() => setHoveredDeleteBtn(g.id)}
                        onMouseLeave={() => setHoveredDeleteBtn(null)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div style={customStyles.modal} onClick={closeModal}>
          <div style={customStyles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={customStyles.modalTitle}>{editingGroup ? '그룹 수정' : '그룹 추가'}</div>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>그룹명</label>
              <input
                style={customStyles.formInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="그룹 이름을 입력하세요"
              />
            </div>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>바이트 제한</label>
              <input
                style={customStyles.formInput}
                type="number"
                value={form.byte_limit}
                onChange={(e) => setForm({ ...form, byte_limit: e.target.value })}
                placeholder="예: 1500"
                min="1"
              />
            </div>
            <div style={customStyles.modalActions}>
              <button
                style={customStyles.btnSecondary}
                onClick={closeModal}
                onMouseEnter={hoverHandlers.btnSecondaryEnter}
                onMouseLeave={hoverHandlers.btnSecondaryLeave}
              >
                취소
              </button>
              <button
                style={customStyles.btnPrimary}
                onClick={handleSave}
                onMouseEnter={hoverHandlers.btnPrimaryEnter}
                onMouseLeave={hoverHandlers.btnPrimaryLeave}
              >
                {editingGroup ? '저장' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ===========================================================================
// 3. AI Connection Section
// ===========================================================================

const MODEL_OPTIONS = [
  { value: 'google/gemini-2.5-flash', label: 'Google Gemini 2.5 Flash Preview' },
  { value: 'google/gemini-2.0-flash', label: 'Google Gemini 2.0 Flash' },
  { value: 'anthropic/claude-sonnet-4', label: 'Anthropic Claude Sonnet 4' },
];

const AIConnectionSection: React.FC = () => {
  const { settings, updateSetting, saveAllSettings, loading } = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveAllSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectStyle: React.CSSProperties = {
    ...customStyles.formInput,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23555555' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: '40px',
    cursor: 'pointer',
  };

  return (
    <>
      <div style={customStyles.sectionHeader}>
        <h1 style={customStyles.sectionTitle}>AI 연결</h1>
        <p style={customStyles.sectionDesc}>AI 서비스 연결 및 설정을 관리합니다.</p>
      </div>

      <div style={{ ...customStyles.tableCard, padding: '32px', marginBottom: '24px' }}>
        <div style={{ fontSize: '15px', color: '#111111', fontWeight: 600, marginBottom: '8px' }}>
          사용 현황
        </div>
        <div style={{ fontSize: '14px', color: '#555555' }}>
          현재 모델: {MODEL_OPTIONS.find((m) => m.value === settings.openrouter_model)?.label || settings.openrouter_model}
        </div>
      </div>

      <div style={{ ...customStyles.tableCard, padding: '32px' }}>
        {/* Toggle: use custom key */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <label style={{ fontSize: '15px', fontWeight: 600, color: '#111111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                onClick={() => updateSetting('use_custom_key', !settings.use_custom_key)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: settings.use_custom_key ? '#111111' : '#CCCCCC',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    top: '3px',
                    left: settings.use_custom_key ? '23px' : '3px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
              내 API 키 사용
            </label>
          </div>
          <p style={{ fontSize: '13px', color: '#888888', margin: 0 }}>
            OpenRouter API 키를 직접 입력하여 사용합니다.
          </p>
        </div>

        {settings.use_custom_key && (
          <>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>OpenRouter API 키</label>
              <input
                style={customStyles.formInput}
                type="password"
                value={settings.openrouter_api_key}
                onChange={(e) => updateSetting('openrouter_api_key', e.target.value)}
                placeholder="sk-or-..."
              />
            </div>

            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>AI 모델</label>
              <select
                style={selectStyle}
                value={settings.openrouter_model}
                onChange={(e) => updateSetting('openrouter_model', e.target.value)}
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#F4F4F2',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#555555',
          lineHeight: 1.6,
        }}>
          학생 개인정보는 전송되지 않습니다.
        </div>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={customStyles.btnPrimary}
            onClick={handleSave}
            disabled={loading}
            onMouseEnter={hoverHandlers.btnPrimaryEnter}
            onMouseLeave={hoverHandlers.btnPrimaryLeave}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
          {saved && (
            <span style={{ fontSize: '14px', color: '#16A34A', fontWeight: 500 }}>저장되었습니다.</span>
          )}
        </div>
      </div>
    </>
  );
};

// ===========================================================================
// 4. Shortcut Settings Section
// ===========================================================================

type ShortcutKey = 'shortcut_full' | 'shortcut_side' | 'shortcut_bar' | 'shortcut_focus';

const SHORTCUT_LABELS: { key: ShortcutKey; label: string; desc: string }[] = [
  { key: 'shortcut_full', label: '전체 화면', desc: '메인 작업 화면을 전체 화면으로 전환' },
  { key: 'shortcut_side', label: '사이드 패널', desc: '사이드 패널 열기/닫기' },
  { key: 'shortcut_bar', label: '빠른 입력 바', desc: '빠른 입력 바 활성화' },
  { key: 'shortcut_focus', label: '집중 모드', desc: '집중 모드 전환' },
];

const ShortcutInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');

    const key = e.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
      onChange(parts.join('+'));
      setRecording(false);
    }
  }, [recording, onChange]);

  return (
    <input
      ref={inputRef}
      style={{
        ...customStyles.formInput,
        cursor: 'pointer',
        backgroundColor: recording ? '#FFFFF0' : '#ffffff',
        borderColor: recording ? '#111111' : '#000000',
        borderWidth: recording ? '2px' : '1px',
      }}
      value={recording ? '키 조합을 입력하세요...' : value}
      readOnly
      onClick={() => {
        setRecording(true);
        inputRef.current?.focus();
      }}
      onKeyDown={handleKeyDown}
      onBlur={() => setRecording(false)}
      placeholder="클릭하여 단축키 입력"
    />
  );
};

const ShortcutSection: React.FC = () => {
  const { settings, updateSetting, saveAllSettings, loading } = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveAllSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div style={customStyles.sectionHeader}>
        <h1 style={customStyles.sectionTitle}>단축키 설정</h1>
        <p style={customStyles.sectionDesc}>자주 사용하는 기능의 단축키를 설정합니다. 입력 필드를 클릭한 후 원하는 키 조합을 누르세요.</p>
      </div>

      <div style={{ ...customStyles.tableCard, padding: '32px' }}>
        {SHORTCUT_LABELS.map((item) => (
          <div key={item.key} style={{ marginBottom: '24px' }}>
            <label style={customStyles.formLabel}>{item.label}</label>
            <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 8px 0' }}>{item.desc}</p>
            <ShortcutInput
              value={settings[item.key]}
              onChange={(val) => updateSetting(item.key, val)}
            />
          </div>
        ))}

        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={customStyles.btnPrimary}
            onClick={handleSave}
            disabled={loading}
            onMouseEnter={hoverHandlers.btnPrimaryEnter}
            onMouseLeave={hoverHandlers.btnPrimaryLeave}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
          {saved && (
            <span style={{ fontSize: '14px', color: '#16A34A', fontWeight: 500 }}>저장되었습니다.</span>
          )}
        </div>
      </div>
    </>
  );
};

// ===========================================================================
// 5. Data Management Section
// ===========================================================================

const DataManagementSection: React.FC = () => {
  const { students, fetchStudents, addStudent } = useStudentStore();
  const { groups, fetchGroups, addGroup } = useGroupStore();
  const { settings, updateSetting, saveAllSettings, fetchSettings } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
  }, [fetchStudents, fetchGroups]);

  const handleExport = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      students,
      groups,
      settings,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salpeem-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage('데이터를 내보냈습니다.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // Import students
        if (Array.isArray(data.students)) {
          for (const s of data.students) {
            if (s.name && s.grade && s.class_name) {
              await addStudent(s.name, s.grade, s.class_name);
            }
          }
        }

        // Import groups
        if (Array.isArray(data.groups)) {
          for (const g of data.groups) {
            if (g.name) {
              await addGroup(g.name, g.parent_id ?? null, g.byte_limit ?? 1500);
            }
          }
        }

        // Import settings
        if (data.settings && typeof data.settings === 'object') {
          const settingsObj = data.settings as AppSettings;
          for (const [key, value] of Object.entries(settingsObj)) {
            if (key in settings) {
              updateSetting(key as keyof AppSettings, value as any);
            }
          }
          await saveAllSettings();
        }

        await fetchStudents();
        await fetchGroups();
        await fetchSettings();

        setStatusMessage('데이터를 성공적으로 가져왔습니다.');
      } catch (err) {
        console.error('Import failed:', err);
        setStatusMessage('가져오기 실패: 올바른 JSON 파일인지 확인해주세요.');
      }
      setTimeout(() => setStatusMessage(null), 3000);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  return (
    <>
      <div style={customStyles.sectionHeader}>
        <h1 style={customStyles.sectionTitle}>데이터 관리</h1>
        <p style={customStyles.sectionDesc}>데이터 백업, 복원 및 관리를 할 수 있습니다.</p>
      </div>

      <div style={{ ...customStyles.tableCard, padding: '32px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
            데이터 내보내기
          </div>
          <p style={{ fontSize: '13px', color: '#555555', marginBottom: '16px', lineHeight: 1.5 }}>
            현재 저장된 학생, 영역, 설정 데이터를 JSON 파일로 내보냅니다.
          </p>
          <button
            style={customStyles.btnSecondary}
            onClick={handleExport}
            onMouseEnter={hoverHandlers.btnSecondaryEnter}
            onMouseLeave={hoverHandlers.btnSecondaryLeave}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            내보내기 (JSON)
          </button>
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '28px', marginBottom: '28px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
            데이터 가져오기
          </div>
          <p style={{ fontSize: '13px', color: '#555555', marginBottom: '16px', lineHeight: 1.5 }}>
            이전에 내보낸 JSON 파일에서 데이터를 복원합니다.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button
            style={customStyles.btnSecondary}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={hoverHandlers.btnSecondaryEnter}
            onMouseLeave={hoverHandlers.btnSecondaryLeave}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            가져오기 (JSON)
          </button>
        </div>

        {statusMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: statusMessage.includes('실패') ? '#FEF2F2' : '#F0FDF4',
            borderRadius: '8px',
            fontSize: '14px',
            color: statusMessage.includes('실패') ? '#DC2626' : '#16A34A',
            fontWeight: 500,
            marginBottom: '20px',
          }}>
            {statusMessage}
          </div>
        )}

        <div style={{
          padding: '16px',
          backgroundColor: '#F4F4F2',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#555555',
          lineHeight: 1.6,
        }}>
          모든 데이터는 이 기기에만 저장됩니다.
        </div>
      </div>
    </>
  );
};

// ===========================================================================
// Section registry
// ===========================================================================

const sectionComponents: Record<string, React.FC> = {
  '학생 명단 관리': StudentListSection,
  '영역 관리': AreaManagementSection,
  'AI 연결': AIConnectionSection,
  '단축키 설정': ShortcutSection,
  '데이터 관리': DataManagementSection,
};

// ===========================================================================
// Main SettingsView
// ===========================================================================

export function SettingsView() {
  const [activeSection, setActiveSection] = useState('학생 명단 관리');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const { fetchSettings, initialized } = useSettingsStore();

  useEffect(() => {
    if (!initialized) {
      fetchSettings();
    }
  }, [fetchSettings, initialized]);

  const ActiveSection = sectionComponents[activeSection];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={customStyles.sidebar}>
        {sidebarItems.map((item) => (
          <div
            key={item}
            style={{
              ...customStyles.viewItemBase,
              ...(activeSection === item ? customStyles.viewItemSelected : {}),
              ...(hoveredSection === item && activeSection !== item ? { backgroundColor: 'rgba(0,0,0,0.03)' } : {}),
            }}
            onClick={() => setActiveSection(item)}
            onMouseEnter={() => setHoveredSection(item)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            {item}
          </div>
        ))}
      </div>

      <div style={customStyles.mainContent}>
        <div style={customStyles.settingsZone}>
          <ActiveSection />
        </div>
      </div>
    </div>
  );
}
