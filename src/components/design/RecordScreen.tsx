import React, { useState, useRef } from 'react';

interface InboxItemData {
  id: number;
  time: string;
  source: string;
  raw: string;
  formal: string;
}

interface RecordScreenProps {
  onAssign?: (id: number) => void;
  onNewView?: () => void;
  onSubmit?: (text: string) => void;
}

const customStyles: Record<string, React.CSSProperties> = {
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
  sidebarHeaderBottom: {
    padding: '8px 20px 16px',
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
};

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

const initialInboxItems: InboxItemData[] = [
  {
    id: 1,
    time: '오늘 10:42 AM',
    source: '직접 기록',
    raw: '도윤이가 모둠 활동 때 의견 조율을 잘함. 친구들 말 끝까지 듣고 자기 생각 조리있게 말함.',
    formal: '모둠 활동 중 타인의 의견을 끝까지 경청하고 존중하는 태도를 보이며, 자신의 생각을 논리정연하게 표현하여 원활한 의견 조율을 이끌어냄.',
  },
  {
    id: 2,
    time: '어제 14:15 PM',
    source: '직접 기록',
    raw: '지호 수학 문제 풀 때 자꾸 딴짓하고 집중 못함. 연산 실수도 잦은 편.',
    formal: '수학적 개념 이해에 꾸준한 노력을 기울이고 있으나, 문제 풀이 과정에서 집중력을 길게 유지하고 연산의 정확성을 높이기 위한 지속적인 격려와 지도가 필요함.',
  },
  {
    id: 3,
    time: '11월 3일 09:30 AM',
    source: '직접 기록',
    raw: '서연이 역사 발표 준비 엄청 꼼꼼하게 해옴. PPT 디자인도 깔끔하고 대본 없이 발표 잘함.',
    formal: '역사 과제 발표에서 주제에 대한 깊은 이해를 바탕으로 체계적이고 시각적으로 우수한 프레젠테이션 자료를 구성하였으며, 자신감 있는 태도로 내용을 명확하게 전달함.',
  },
];

interface InboxItemProps {
  item: InboxItemData;
  onAssign: (id: number) => void;
}

const InboxItem: React.FC<InboxItemProps> = ({ item, onAssign }) => {
  const [assignHover, setAssignHover] = useState<boolean>(false);

  return (
    <div style={customStyles.inboxItem}>
      <div style={customStyles.itemMeta}>
        <span>{item.time}</span>
        <span style={customStyles.badgeSource}>{item.source}</span>
      </div>
      <div style={customStyles.contentComparison}>
        <div style={customStyles.rawText}>{item.raw}</div>
        <div style={customStyles.transformIcon}>
          <ArrowRightIcon />
        </div>
        <div style={customStyles.formalText}>{item.formal}</div>
      </div>
      <div style={customStyles.itemActions}>
        <button
          style={{
            ...customStyles.btnAssign,
            ...(assignHover ? { backgroundColor: '#111111', color: '#ffffff' } : {}),
          }}
          onMouseEnter={() => setAssignHover(true)}
          onMouseLeave={() => setAssignHover(false)}
          onClick={() => onAssign(item.id)}
        >
          학생·영역 지정하기
        </button>
      </div>
    </div>
  );
};

const RecordScreen: React.FC<RecordScreenProps> = ({ onAssign, onNewView, onSubmit }) => {
  const [selectedView, setSelectedView] = useState<string>('인박스');
  const [inputText, setInputText] = useState<string>('');
  const [inboxItems, setInboxItems] = useState<InboxItemData[]>(initialInboxItems);
  const [submitHover, setSubmitHover] = useState<boolean>(false);
  const [newViewHover, setNewViewHover] = useState<boolean>(false);
  const nextId = useRef<number>(4);

  const views = [
    { name: '인박스', count: null },
  ];

  const smartViews = [
    { name: '1반 세특', count: '12건' },
    { name: '김도윤 전체', count: '5건' },
    { name: '2학년 행특', count: '8건' },
  ];

  const handleSubmit = (): void => {
    if (!inputText.trim()) return;
    const newItem: InboxItemData = {
      id: nextId.current++,
      time: '방금',
      source: '직접 기록',
      raw: inputText,
      formal: inputText,
    };
    setInboxItems([newItem, ...inboxItems]);
    if (onSubmit) onSubmit(inputText);
    setInputText('');
  };

  const handleAssign = (id: number): void => {
    setInboxItems(inboxItems.filter(item => item.id !== id));
    if (onAssign) onAssign(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Sidebar */}
      <div style={customStyles.sidebar}>
        <div style={customStyles.sidebarHeader}>기본 뷰</div>
        {views.map(view => (
          <div
            key={view.name}
            style={{
              ...customStyles.viewItem,
              ...(selectedView === view.name ? customStyles.viewItemSelected : {}),
            }}
            onClick={() => setSelectedView(view.name)}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              if (selectedView !== view.name) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              if (selectedView !== view.name) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>{view.name}</span>
            {view.count && <span style={customStyles.viewCount}>{view.count}</span>}
          </div>
        ))}

        <div style={customStyles.sidebarDivider} />

        <div style={customStyles.sidebarHeaderBottom}>내 스마트 뷰</div>

        <div style={{ flex: 1, overflowY: 'auto' as const }}>
          {smartViews.map(view => (
            <div
              key={view.name}
              style={{
                ...customStyles.viewItem,
                ...(selectedView === view.name ? customStyles.viewItemSelected : {}),
              }}
              onClick={() => setSelectedView(view.name)}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                if (selectedView !== view.name) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                if (selectedView !== view.name) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{view.name}</span>
              <span style={customStyles.viewCount}>{view.count}</span>
            </div>
          ))}
        </div>

        <button
          style={{
            ...customStyles.btnNewView,
            ...(newViewHover ? { color: '#111111', backgroundColor: 'rgba(0,0,0,0.02)' } : {}),
          }}
          onMouseEnter={() => setNewViewHover(true)}
          onMouseLeave={() => setNewViewHover(false)}
          onClick={() => { if (onNewView) onNewView(); }}
        >
          <PlusIcon />
          새 뷰 만들기
        </button>
      </div>

      {/* Main Content */}
      <div style={customStyles.mainContent}>
        {/* Quick Input */}
        <div style={customStyles.quickInputZone}>
          <div style={customStyles.inputWrapper}>
            <textarea
              className="quick-textarea"
              style={customStyles.quickTextarea}
              spellCheck={false}
              placeholder="관찰을 적으세요. @학생 /영역으로 바로 분류됩니다"
              value={inputText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              style={{
                ...customStyles.btnSubmit,
                ...(submitHover ? { backgroundColor: '#333333' } : {}),
              }}
              onMouseEnter={() => setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
              onClick={handleSubmit}
            >
              기록
            </button>
          </div>
        </div>

        {/* List Zone */}
        <div style={customStyles.listZone}>
          <div style={customStyles.sectionHeader}>
            <h1 style={customStyles.sectionTitle}>{selectedView}</h1>
            <p style={customStyles.sectionDesc}>학생 또는 영역이 지정되지 않은 기록</p>
          </div>
          <div style={customStyles.inboxList}>
            {inboxItems.map(item => (
              <InboxItem key={item.id} item={item} onAssign={handleAssign} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordScreen;
