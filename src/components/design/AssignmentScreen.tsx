import React, { useState } from 'react';

interface AssignmentScreenProps {
  onSubmit?: () => void;
}

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
  historyItem: {
    padding: '14px 20px',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  historyMeta: {
    fontSize: '14px',
    color: '#111111',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  historyStatus: {
    fontSize: '12px',
    color: '#555555',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
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

interface HistoryItem {
  id: number;
  date: string;
  title: string;
  count: number;
}

const historyData: HistoryItem[] = [
  { id: 1, date: '11.20', title: '2학기 진로탐구보고서', count: 24 },
  { id: 2, date: '11.15', title: '동아리 활동 소감문', count: 18 },
  { id: 3, date: '11.02', title: '학교폭력 예방교육 설문', count: 30 },
  { id: 4, date: '10.28', title: '학급 자치회의 안건 제안서', count: 12 },
  { id: 5, date: '09.14', title: '1학기 진로희망조사', count: 32 },
];

const AssignmentScreen: React.FC<AssignmentScreenProps> = ({ onSubmit }) => {
  const [activeAction, setActiveAction] = useState<string>('assignment');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [uploadHover, setUploadHover] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [hoveredHistory, setHoveredHistory] = useState<number | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleSubmit = () => {
    if (!selectedArea || !taskDescription) {
      alert('영역과 과제 안내사항을 입력해주세요.');
      return;
    }
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
    onSubmit?.();
  };

  const isSurveyMode = activeAction === 'survey';

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Sidebar */}
      <div style={customStyles.sidebar}>
        <div style={customStyles.sidebarActions}>
          <button
            style={{
              ...customStyles.btnSidebarAction,
              ...(activeAction === 'assignment' ? customStyles.btnSidebarActionSelected : {}),
              ...(hoveredAction === 'assignment' && activeAction !== 'assignment' ? { backgroundColor: 'rgba(0,0,0,0.03)' } : {}),
            }}
            onClick={() => setActiveAction('assignment')}
            onMouseEnter={() => setHoveredAction('assignment')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            + 새 과제 등록
          </button>
          <button
            style={{
              ...customStyles.btnSidebarAction,
              ...(activeAction === 'survey' ? customStyles.btnSidebarActionSelected : {}),
              ...(hoveredAction === 'survey' && activeAction !== 'survey' ? { backgroundColor: 'rgba(0,0,0,0.03)' } : {}),
            }}
            onClick={() => setActiveAction('survey')}
            onMouseEnter={() => setHoveredAction('survey')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            + 새 설문 등록
          </button>
        </div>

        <div style={customStyles.sidebarDivider} />

        <div style={customStyles.sidebarHeader}>최근 등록 내역</div>

        <div style={customStyles.historyList}>
          {historyData.map((item) => (
            <div
              key={item.id}
              style={{
                ...customStyles.historyItem,
                ...(hoveredHistory === item.id ? { backgroundColor: 'rgba(0,0,0,0.03)' } : {}),
              }}
              onMouseEnter={() => setHoveredHistory(item.id)}
              onMouseLeave={() => setHoveredHistory(null)}
            >
              <div style={customStyles.historyMeta}>{item.date} — {item.title}</div>
              <div style={customStyles.historyStatus}>
                <span style={customStyles.statusDot} />
                {item.count}명 완료
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={customStyles.mainContent}>
        <div style={customStyles.formZone}>
          <div style={customStyles.sectionHeader}>
            <h1 style={customStyles.sectionTitle}>
              {isSurveyMode ? '설문' : '과제·설문'}
            </h1>
            <p style={customStyles.sectionDesc}>
              {isSurveyMode
                ? '설문 문항과 학생 응답을 올리면, 학생별 생기부 문장으로 변환됩니다.'
                : '안내사항과 학생 제출물을 올리면, 학생별 생기부 문장으로 변환됩니다.'}
            </p>
          </div>

          {submitSuccess && (
            <div style={{
              backgroundColor: '#D1FAE5',
              border: '1px solid #10B981',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '24px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#065F46',
            }}>
              ✓ 문장 생성이 시작되었습니다. 잠시 후 결과를 확인하세요.
            </div>
          )}

          <div style={customStyles.formContainer}>
            {/* Area Select */}
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>영역</label>
              <select
                style={{
                  ...customStyles.formInput,
                  ...customStyles.formSelect,
                  color: selectedArea ? '#111111' : '#888888',
                }}
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="" disabled hidden>이 과제가 들어갈 영역을 선택하세요</option>
                <option value="career">진로활동</option>
                <option value="autonomous">자율활동</option>
                <option value="club">동아리활동</option>
                <option value="subject">세부능력 및 특기사항</option>
                <option value="behavior">행동특성 및 종합의견</option>
              </select>
            </div>

            {/* Task Description */}
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>
                {isSurveyMode ? '설문 안내사항' : '과제 안내사항'}
              </label>
              <textarea
                style={{ ...customStyles.formInput, ...customStyles.formTextarea }}
                placeholder={isSurveyMode
                  ? '어떤 설문인지 적어주세요. AI가 이 맥락을 보고 문장을 만듭니다.'
                  : '어떤 과제인지 적어주세요. AI가 이 맥락을 보고 문장을 만듭니다.'}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Upload Zone */}
            <div style={customStyles.formGroup}>
              <label style={customStyles.formLabel}>
                {isSurveyMode ? '학생 응답' : '학생 제출물'}
                <span style={customStyles.labelNote}>파일명에 학생 이름을 포함하면 자동 매칭됩니다.</span>
              </label>
              <label
                htmlFor="file-upload"
                style={{
                  ...customStyles.uploadZone,
                  backgroundColor: dragOver ? '#EFEFEA' : (uploadHover ? '#EFEFEA' : '#F4F4F2'),
                }}
                onMouseEnter={() => setUploadHover(true)}
                onMouseLeave={() => setUploadHover(false)}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".hwp,.docx,.pdf,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div style={customStyles.uploadIcon}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                {uploadedFiles.length > 0 ? (
                  <div style={customStyles.uploadText}>
                    {uploadedFiles.length}개 파일 선택됨<br />
                    <span style={{ fontSize: '13px', fontWeight: 400, color: '#555555' }}>
                      {uploadedFiles.map(f => f.name).join(', ')}
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={customStyles.uploadText}>
                      클릭하여 파일을 선택하거나<br />여기로 파일을 드래그하세요
                    </div>
                    <div style={customStyles.uploadHint}>지원 파일: HWP, DOCX, PDF, TXT (최대 50MB)</div>
                  </>
                )}
              </label>
            </div>

            {/* Form Actions */}
            <div style={customStyles.formActions}>
              <button
                style={customStyles.btnSubmitLarge}
                onClick={handleSubmit}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333333')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111111')}
              >
                문장 생성하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentScreen;
