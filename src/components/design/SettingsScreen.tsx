import React, { useState } from 'react';

// --- Types ---

interface Student {
  id: number;
  name: string;
  grade: string;
  class: string;
}

interface StudentForm {
  name: string;
  grade: string;
  class: string;
}

export interface SettingsScreenProps {}

// --- Styles ---

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

// --- Demo data ---

const initialStudents: Student[] = [
  { id: 1, name: '김도윤', grade: '2학년', class: '1반' },
  { id: 2, name: '박서연', grade: '2학년', class: '1반' },
  { id: 3, name: '이지호', grade: '2학년', class: '1반' },
  { id: 4, name: '최민준', grade: '2학년', class: '2반' },
  { id: 5, name: '정하은', grade: '2학년', class: '2반' },
];

const sidebarItems = ['학생 명단 관리', '영역 관리', 'AI 연결', '단축키 설정', '데이터 관리'];

// --- Section subcomponents ---

const StudentListSection: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>({ name: '', grade: '', class: '' });
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredEditBtn, setHoveredEditBtn] = useState<number | null>(null);
  const [hoveredDeleteBtn, setHoveredDeleteBtn] = useState<number | null>(null);

  const openAddModal = () => {
    setEditingStudent(null);
    setForm({ name: '', grade: '', class: '' });
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setForm({ name: student.name, grade: student.grade, class: student.class });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
    setForm({ name: '', grade: '', class: '' });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.grade.trim() || !form.class.trim()) return;
    if (editingStudent) {
      setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...form } : s));
    } else {
      const newId = Math.max(...students.map(s => s.id), 0) + 1;
      setStudents([...students, { id: newId, ...form }]);
    }
    closeModal();
  };

  const handleDelete = (id: number) => {
    setStudents(students.filter(s => s.id !== id));
  };

  return (
    <>
      <div style={customStyles.sectionHeader}>
        <h1 style={customStyles.sectionTitle}>학생 명단 관리</h1>
        <p style={customStyles.sectionDesc}>엑셀 업로드 또는 직접 추가. 학년·반·이름 포함.</p>
      </div>

      <div style={customStyles.actionBar}>
        <button
          style={customStyles.btnSecondary}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8F8F6'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
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
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#333333'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#111111'; }}
        >
          + 학생 추가
        </button>
      </div>

      <div style={customStyles.tableCard}>
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
                <td style={{ ...customStyles.td, borderBottom: idx === students.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>{student.class}</td>
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
      </div>

      {modalOpen && (
        <div style={customStyles.modal} onClick={closeModal}>
          <div style={customStyles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={customStyles.modalTitle}>{editingStudent ? '학생 정보 수정' : '학생 추가'}</div>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>이름</label>
              <input
                style={customStyles.formInput}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="이름을 입력하세요"
              />
            </div>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>학년</label>
              <input
                style={customStyles.formInput}
                value={form.grade}
                onChange={e => setForm({ ...form, grade: e.target.value })}
                placeholder="예: 2학년"
              />
            </div>
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>반</label>
              <input
                style={customStyles.formInput}
                value={form.class}
                onChange={e => setForm({ ...form, class: e.target.value })}
                placeholder="예: 1반"
              />
            </div>
            <div style={customStyles.modalActions}>
              <button
                style={customStyles.btnSecondary}
                onClick={closeModal}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8F8F6'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
              >
                취소
              </button>
              <button
                style={customStyles.btnPrimary}
                onClick={handleSave}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#333333'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#111111'; }}
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

const AreaManagementSection: React.FC = () => (
  <>
    <div style={customStyles.sectionHeader}>
      <h1 style={customStyles.sectionTitle}>영역 관리</h1>
      <p style={customStyles.sectionDesc}>관찰 및 기록 영역을 관리합니다.</p>
    </div>
    <div style={{ color: '#555555', fontSize: '15px' }}>영역 관리 기능이 여기에 표시됩니다.</div>
  </>
);

const AIConnectionSection: React.FC = () => (
  <>
    <div style={customStyles.sectionHeader}>
      <h1 style={customStyles.sectionTitle}>AI 연결</h1>
      <p style={customStyles.sectionDesc}>AI 서비스 연결 및 설정을 관리합니다.</p>
    </div>
    <div style={{ color: '#555555', fontSize: '15px' }}>AI 연결 설정이 여기에 표시됩니다.</div>
  </>
);

const ShortcutSection: React.FC = () => (
  <>
    <div style={customStyles.sectionHeader}>
      <h1 style={customStyles.sectionTitle}>단축키 설정</h1>
      <p style={customStyles.sectionDesc}>자주 사용하는 기능의 단축키를 설정합니다.</p>
    </div>
    <div style={{ color: '#555555', fontSize: '15px' }}>단축키 설정이 여기에 표시됩니다.</div>
  </>
);

const DataManagementSection: React.FC = () => (
  <>
    <div style={customStyles.sectionHeader}>
      <h1 style={customStyles.sectionTitle}>데이터 관리</h1>
      <p style={customStyles.sectionDesc}>데이터 백업, 복원 및 삭제를 관리합니다.</p>
    </div>
    <div style={{ color: '#555555', fontSize: '15px' }}>데이터 관리 기능이 여기에 표시됩니다.</div>
  </>
);

const sectionComponents: Record<string, React.FC> = {
  '학생 명단 관리': StudentListSection,
  '영역 관리': AreaManagementSection,
  'AI 연결': AIConnectionSection,
  '단축키 설정': ShortcutSection,
  '데이터 관리': DataManagementSection,
};

// --- Main component ---

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const [activeSection, setActiveSection] = useState('학생 명단 관리');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const ActiveSection = sectionComponents[activeSection];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={customStyles.sidebar}>
        {sidebarItems.map(item => (
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
};

export default SettingsScreen;
