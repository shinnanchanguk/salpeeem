import { useState } from 'react';

const TAB_INACTIVE_COLORS = ['#CED7DE', '#B0C0CD', '#94A3B0'];

const styles = {
  tabsContainer: {
    display: 'flex' as const,
    alignItems: 'flex-end' as const,
    paddingLeft: '24px',
    height: '48px',
    position: 'relative' as const,
    zIndex: 10,
  },
  appLogo: {
    fontSize: '20px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginRight: '32px',
    marginBottom: '12px',
    color: '#111111',
  },
  tabBase: {
    padding: '12px 32px 10px',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    color: '#111111',
    borderRadius: '12px 12px 0 0',
    marginRight: '-16px',
    cursor: 'pointer',
    position: 'relative' as const,
    clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)',
    minWidth: '140px',
    textAlign: 'center' as const,
    transition: 'transform 0.2s ease',
    userSelect: 'none' as const,
    border: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'none',
  },
  tabActive: {
    backgroundColor: '#EAEAE6',
    paddingBottom: '12px',
    fontWeight: 700,
  },
  taglineContainer: {
    marginLeft: 'auto',
    padding: '0 24px 10px 32px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'flex-end' as const,
  },
  taglineMain: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#111111',
    letterSpacing: '-0.01em',
    marginBottom: '4px',
  },
  taglineSub: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#555555',
    letterSpacing: '0.02em',
  },
};

interface TabNavigationProps {
  activeTab: number;
  onTabChange: (index: number) => void;
  logo?: string;
  taglineMain?: string;
  taglineSub?: string;
}

const TAB_LABELS = ['기록', '과제·설문', '문장 완성하기', '설정'];

function getTabStyle(tabIndex: number, activeTab: number) {
  if (tabIndex === activeTab) {
    return { zIndex: 10, ...styles.tabActive };
  }
  const distance = Math.abs(tabIndex - activeTab);
  const colorIndex = Math.min(distance - 1, TAB_INACTIVE_COLORS.length - 1);
  const maxZ = TAB_LABELS.length - distance;
  return {
    backgroundColor: TAB_INACTIVE_COLORS[colorIndex],
    zIndex: Math.max(maxZ, 1),
  };
}

export function TabNavigation({
  activeTab,
  onTabChange,
  logo = '살핌',
  taglineMain = '보는 순간, 기록이 됩니다.',
  taglineSub = '학생의 모든 성장을 놓치지 않고 기록하세요.',
}: TabNavigationProps) {
  const [tabHover, setTabHover] = useState<number | null>(null);

  return (
    <div style={styles.tabsContainer}>
      <div style={{ ...styles.appLogo, cursor: 'pointer' }} data-tour="app-logo" onClick={() => onTabChange(0)}>{logo}</div>
      <div data-tour="tab-area" style={{ display: 'flex', alignItems: 'flex-end' }}>
      {TAB_LABELS.map((label, i) => {
        const isActive = activeTab === i;
        const isHovered = tabHover === i && !isActive;
        return (
          <div
            key={label}
            style={{
              ...styles.tabBase,
              ...getTabStyle(i, activeTab),
              ...(isHovered ? { transform: 'translateY(-2px)' } : {}),
            }}
            onClick={() => onTabChange(i)}
            onMouseEnter={() => setTabHover(i)}
            onMouseLeave={() => setTabHover(null)}
          >
            {label}
          </div>
        );
      })}
      </div>
      <div style={styles.taglineContainer}>
        <div style={styles.taglineMain}>{taglineMain}</div>
        <div style={styles.taglineSub}>{taglineSub}</div>
      </div>
    </div>
  );
}
