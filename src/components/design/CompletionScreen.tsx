import React, { useState } from 'react';

interface Student {
  name: string;
  classInfo: string;
  sentences: number;
  status: 'done' | 'pending';
}

interface CompletionScreenProps {
  onStudentClick?: (name: string, area: string) => void;
  onGenerateAll?: () => void;
}

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
};

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, label, style = {}, labelStyle = {} }) => {
  const checkboxStyle: React.CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: '18px',
    height: '18px',
    border: '1px solid #000000',
    borderRadius: '4px',
    backgroundColor: checked ? '#111111' : '#ffffff',
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
        {checked && (
          <span style={{
            position: 'absolute',
            left: '5px',
            top: '2px',
            width: '5px',
            height: '10px',
            border: 'solid white',
            borderWidth: '0 2px 2px 0',
            transform: 'rotate(45deg)',
            display: 'block',
          }}></span>
        )}
      </span>
      <span style={labelStyle}>{label}</span>
    </label>
  );
};

interface StudentRowProps {
  name: string;
  classInfo: string;
  sentences: number;
  status: 'done' | 'pending';
  isLast: boolean;
  onClick?: () => void;
}

const StudentRow: React.FC<StudentRowProps> = ({ name, classInfo, sentences, status, isLast, onClick }) => {
  const [hovered, setHovered] = useState(false);
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
        <span style={customStyles.stuName}>{name}</span>
        <span style={customStyles.stuClass}>{classInfo}</span>
        <span style={customStyles.stuBadge}>문장 {sentences}건</span>
      </div>
      {status === 'done' ? (
        <div style={customStyles.statusBadgeDone}>
          <span style={customStyles.statusDotDone}></span>
          완성됨
        </div>
      ) : (
        <div style={customStyles.statusBadgePending}>
          <span style={customStyles.statusDotPending}></span>
          미완성
        </div>
      )}
    </div>
  );
};

interface AccordionItemProps {
  title: string;
  stats: string;
  students: Student[] | null;
  collapsed?: boolean;
  dimmed?: boolean;
  onStudentClick?: (name: string, area: string) => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, stats, students, collapsed = false, dimmed = false, onStudentClick }) => {
  const [isOpen, setIsOpen] = useState(!collapsed);
  const [headerHovered, setHeaderHovered] = useState(false);

  return (
    <div style={{ ...customStyles.accordionItem, opacity: dimmed ? 0.6 : 1 }}>
      <div
        style={{
          ...customStyles.accordionHeader,
          background: headerHovered ? '#EFEFEA' : '#F4F4F2',
          borderBottom: (!isOpen || dimmed) ? 'none' : '1px solid #000000',
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div style={customStyles.headerTitleWrapper}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: '#555555',
              transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <h3 style={customStyles.accordionTitle}>{title}</h3>
        </div>
        <div style={customStyles.accordionStats}>{stats}</div>
      </div>
      {isOpen && students && (
        <div style={customStyles.accordionBody}>
          {students.map((student, index) => (
            <StudentRow
              key={index}
              name={student.name}
              classInfo={student.classInfo}
              sentences={student.sentences}
              status={student.status}
              isLast={index === students.length - 1}
              onClick={onStudentClick ? () => onStudentClick(student.name, title) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const area1Students: Student[] = [
  { name: '김도윤', classInfo: '2학년 1반', sentences: 12, status: 'done' },
  { name: '이지호', classInfo: '2학년 1반', sentences: 8, status: 'done' },
  { name: '박서연', classInfo: '2학년 1반', sentences: 5, status: 'pending' },
];

const area2Students: Student[] = [
  { name: '김도윤', classInfo: '2학년 1반', sentences: 4, status: 'pending' },
  { name: '이지호', classInfo: '2학년 1반', sentences: 3, status: 'pending' },
  { name: '박서연', classInfo: '2학년 1반', sentences: 6, status: 'pending' },
];

const CompletionScreen: React.FC<CompletionScreenProps> = ({ onStudentClick, onGenerateAll }) => {
  const [activeView, setActiveView] = useState('area');
  const [targetBytes, setTargetBytes] = useState<number | string>(1500);
  const [searchText, setSearchText] = useState('');
  const [selectAll, setSelectAll] = useState(true);
  const [grade2Expanded, setGrade2Expanded] = useState(true);
  const [class1Expanded, setClass1Expanded] = useState(true);
  const [students, setStudents] = useState({
    kimDoyun: true,
    parkSeoyeon: true,
    leeJiho: true,
  });
  const [areas, setAreas] = useState({
    detail: true,
    behavior: true,
    career: true,
    club: false,
    autonomous: false,
    volunteer: false,
  });

  const [btnHovered, setBtnHovered] = useState(false);

  const toggleStudent = (key: keyof typeof students) => {
    setStudents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleArea = (key: keyof typeof areas) => {
    setAreas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Sidebar */}
      <div style={customStyles.sidebar}>
        {/* Student Section */}
        <div style={customStyles.sidebarSection}>
          <div style={customStyles.sidebarHeader}>
            학생
            <CustomCheckbox
              checked={selectAll}
              onChange={() => setSelectAll(!selectAll)}
              label="전체 선택"
              style={{ fontSize: '12px', fontWeight: 500, color: '#555555' }}
              labelStyle={{ fontSize: '12px', fontWeight: 500, color: '#555555' }}
            />
          </div>

          <div style={customStyles.searchBox}>
            <svg style={{ color: '#555555' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="이름으로 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ ...customStyles.searchInput }}
            />
          </div>

          <div style={customStyles.treeContainer}>
            {/* Grade 2 */}
            <div style={customStyles.treeNode}>
              <button style={customStyles.btnExpand} onClick={() => setGrade2Expanded(!grade2Expanded)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: grade2Expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <CustomCheckbox checked={true} onChange={() => {}} label="2학년" />
            </div>

            {grade2Expanded && (
              <div style={customStyles.treeChildren}>
                {/* Class 1 */}
                <div style={customStyles.treeNode}>
                  <button style={customStyles.btnExpand} onClick={() => setClass1Expanded(!class1Expanded)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: class1Expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <CustomCheckbox checked={true} onChange={() => {}} label="1반" />
                </div>

                {class1Expanded && (
                  <div style={customStyles.treeChildren}>
                    <div style={customStyles.treeNode}>
                      <CustomCheckbox
                        checked={students.kimDoyun}
                        onChange={() => toggleStudent('kimDoyun')}
                        label="김도윤"
                        style={{ paddingLeft: '20px' }}
                      />
                    </div>
                    <div style={customStyles.treeNode}>
                      <CustomCheckbox
                        checked={students.parkSeoyeon}
                        onChange={() => toggleStudent('parkSeoyeon')}
                        label="박서연"
                        style={{ paddingLeft: '20px' }}
                      />
                    </div>
                    <div style={customStyles.treeNode}>
                      <CustomCheckbox
                        checked={students.leeJiho}
                        onChange={() => toggleStudent('leeJiho')}
                        label="이지호"
                        style={{ paddingLeft: '20px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={customStyles.sidebarDivider}></div>

        {/* Area Section */}
        <div style={customStyles.sidebarSection}>
          <div style={customStyles.sidebarHeader}>영역</div>
          <div style={customStyles.checkboxList}>
            <CustomCheckbox checked={areas.detail} onChange={() => toggleArea('detail')} label="세부능력 및 특기사항" />
            <CustomCheckbox checked={areas.behavior} onChange={() => toggleArea('behavior')} label="행동특성 및 종합의견" />
            <CustomCheckbox checked={areas.career} onChange={() => toggleArea('career')} label="진로활동" />
            <CustomCheckbox checked={areas.club} onChange={() => toggleArea('club')} label="동아리활동" />
            <CustomCheckbox checked={areas.autonomous} onChange={() => toggleArea('autonomous')} label="자율활동" />
            <CustomCheckbox checked={areas.volunteer} onChange={() => toggleArea('volunteer')} label="봉사활동" />
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
              onClick={onGenerateAll ? onGenerateAll : () => alert('전체 초안 생성이 시작됩니다.')}
            >
              전체 초안 생성
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={customStyles.resultsContainer}>
          <AccordionItem
            title="세부능력 및 특기사항"
            stats="완성 2명 / 선택 3명"
            students={area1Students}
            onStudentClick={onStudentClick}
          />
          <AccordionItem
            title="행동특성 및 종합의견"
            stats="완성 0명 / 선택 3명"
            students={area2Students}
            onStudentClick={onStudentClick}
          />
          <AccordionItem
            title="진로활동"
            stats="완성 0명 / 선택 0명"
            students={null}
            collapsed={true}
            dimmed={true}
          />
        </div>
      </div>
    </div>
  );
};

export default CompletionScreen;
