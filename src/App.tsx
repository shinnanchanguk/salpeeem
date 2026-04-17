import { useState, useEffect, useCallback } from 'react';
import { TabNavigation } from './components/design/TabNavigation';
import { RecordView } from './views/RecordView';
import { AssignmentView } from './views/AssignmentView';
import { CompletionView } from './views/CompletionView';
import { AreaDetailView } from './views/AreaDetailView';
import { SettingsView } from './views/SettingsView';
import { Onboarding } from './components/shared/Onboarding';
import { initDatabase, getSetting, setSetting } from './lib/database';
import { seedDevData } from './lib/dev-seed';
import { useStudentStore } from './stores/useStudentStore';
import { useGroupStore } from './stores/useGroupStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { useWindowMode } from './hooks/useWindowMode';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import type { WindowMode } from './hooks/useWindowMode';
import './App.css';

// ── Full mode styles (original) ──

const appFrameStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  backgroundColor: '#D8E6F3',
  fontFamily:
    "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
};

const appWindowStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  padding: '24px 24px 0 24px',
};

const appBodyStyle: React.CSSProperties = {
  backgroundColor: '#EAEAE6',
  flex: 1,
  borderRadius: '12px 12px 0 0',
  position: 'relative',
  zIndex: 5,
  display: 'flex',
  overflow: 'hidden',
  boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
};

const appBodyColumnStyle: React.CSSProperties = {
  ...appBodyStyle,
  flexDirection: 'column',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  fontSize: '18px',
  fontWeight: 600,
  color: '#555555',
};

// ── Side mode styles ──

const sideFrameStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  backgroundColor: '#EAEAE6',
  fontFamily:
    "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const sideHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid rgba(0,0,0,0.1)',
  backgroundColor: '#D8E6F3',
  flexShrink: 0,
};

const sideLogoStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#111111',
  letterSpacing: '-0.02em',
};

const sideBodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

// ── Bar mode styles ──

const barFrameStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  backgroundColor: '#111111',
  fontFamily:
    "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  borderRadius: '12px',
  overflow: 'hidden',
};

const barInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: '15px',
  lineHeight: 1.6,
  color: '#ffffff',
  fontFamily: 'inherit',
  padding: '0 8px',
};

const barBtnStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#111111',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 20px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const barLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#888888',
  flexShrink: 0,
  letterSpacing: '-0.02em',
};

// ── Mode switch button style ──

const modeSwitchBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(0,0,0,0.2)',
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#555555',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
};

// ── Mode label map ──

const NEXT_MODE_LABEL: Record<WindowMode, string> = {
  full: '사이드',
  side: '바',
  bar: '전체',
};

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [dbReady, setDbReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [areaDetail, setAreaDetail] = useState<{
    studentName: string;
    areaName: string;
  } | null>(null);

  const fetchStudents = useStudentStore((s) => s.fetchStudents);
  const fetchGroups = useGroupStore((s) => s.fetchGroups);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const { currentMode, cycleMode } = useWindowMode();
  const update = useAutoUpdate();

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        if (import.meta.env.DEV) {
          await seedDevData();
        }
        await Promise.all([fetchStudents(), fetchGroups(), fetchSettings()]);
        const onboardingCompleted = await getSetting('onboarding_completed');
        if (onboardingCompleted !== 'true') {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error('Database initialization error:', err);
      }
      setDbReady(true);
    }
    init();
  }, [fetchStudents, fetchGroups, fetchSettings]);

  const handleOnboardingComplete = useCallback(async () => {
    await setSetting('onboarding_completed', 'true');
    setShowOnboarding(false);
  }, []);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setAreaDetail(null);
  };

  const handleStudentClick = (studentName: string, areaName: string) => {
    setAreaDetail({ studentName, areaName });
  };

  const handleBackFromDetail = () => {
    setAreaDetail(null);
  };

  // ── Bar mode: minimal input only ──
  if (currentMode === 'bar') {
    return <BarModeView onCycleMode={cycleMode} dbReady={dbReady} />;
  }

  // ── Side mode: compact vertical panel ──
  if (currentMode === 'side') {
    return <SideModeView onCycleMode={cycleMode} dbReady={dbReady} />;
  }

  // ── Full mode (default) ──
  if (!dbReady) {
    return (
      <div style={appFrameStyle}>
        <div style={loadingStyle}>데이터베이스를 준비하고 있습니다...</div>
      </div>
    );
  }

  const isAreaDetail = activeTab === 2 && areaDetail !== null;

  return (
    <div style={appFrameStyle}>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      {/* Update notification */}
      {update.available && update.info && (
        <UpdateBanner
          version={update.info.version}
          body={update.info.body}
          downloading={update.downloading}
          progress={update.progress}
          onUpdate={update.downloadAndInstall}
          onDismiss={update.dismiss}
        />
      )}

      <div style={appWindowStyle}>
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div style={isAreaDetail ? appBodyColumnStyle : appBodyStyle}>
          {activeTab === 0 && <RecordView />}
          {activeTab === 1 && <AssignmentView />}
          {activeTab === 2 && !areaDetail && (
            <CompletionView onStudentClick={handleStudentClick} />
          )}
          {activeTab === 2 && areaDetail && (
            <AreaDetailView
              studentName={areaDetail.studentName}
              areaName={areaDetail.areaName}
              onBack={handleBackFromDetail}
            />
          )}
          {activeTab === 3 && <SettingsView />}
        </div>
      </div>
    </div>
  );
}

// ── Update Banner Component ──

function UpdateBanner({
  version,
  body,
  downloading,
  progress,
  onUpdate,
  onDismiss,
}: {
  version: string;
  body: string;
  downloading: boolean;
  progress: number;
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
      onClick={downloading ? undefined : onDismiss}
    >
      <div
        style={{
          backgroundColor: '#F4F4F2',
          border: '1px solid #000000',
          borderRadius: '16px',
          padding: '32px',
          width: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#D8E6F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
              새 버전이 있습니다
            </div>
            <div style={{ fontSize: '13px', color: '#555555', marginTop: '2px' }}>
              v{version}
            </div>
          </div>
        </div>

        {/* Release notes */}
        {body && (
          <div
            style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#333333',
              backgroundColor: '#EAEAE6',
              borderRadius: '8px',
              padding: '12px 16px',
              maxHeight: '120px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {body}
          </div>
        )}

        {/* Progress bar */}
        {downloading && (
          <div>
            <div
              style={{
                height: '6px',
                backgroundColor: '#E0E0E0',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: '#111111',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#555555', marginTop: '6px', textAlign: 'center' }}>
              다운로드 중... {progress}%
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {!downloading && (
            <button
              onClick={onDismiss}
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.2)',
                color: '#555555',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              나중에
            </button>
          )}
          <button
            onClick={onUpdate}
            disabled={downloading}
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: downloading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading ? '설치 중...' : '지금 업데이트'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bar Mode Component ──

function BarModeView({
  onCycleMode,
  dbReady,
}: {
  onCycleMode: () => void;
  dbReady: boolean;
}) {
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!inputText.trim() || !dbReady || submitting) return;
    setSubmitting(true);
    try {
      const { useRecordStore } = await import('./stores/useRecordStore');
      const { convertToFormalSentence } = await import('./lib/ai-service');
      const { useStudentStore } = await import('./stores/useStudentStore');
      const { useGroupStore } = await import('./stores/useGroupStore');

      const students = useStudentStore.getState().students;
      const groups = useGroupStore.getState().groups;

      let studentId: number | null = null;
      let groupId: number | null = null;
      let cleanText = inputText;

      const studentMatch = inputText.match(/@(\S+)/);
      if (studentMatch) {
        const found = students.find((s) => s.name === studentMatch[1]);
        if (found) studentId = found.id;
        cleanText = cleanText.replace(/@\S+/, '').trim();
      }

      const groupMatch = inputText.match(/\/(\S+)/);
      if (groupMatch) {
        const found = groups.find((g) => g.name === groupMatch[1]);
        if (found) groupId = found.id;
        cleanText = cleanText.replace(/\/\S+/, '').trim();
      }

      let generated = '';
      try {
        generated = (await convertToFormalSentence(cleanText)).sentence;
      } catch {
        generated = cleanText;
      }

      await useRecordStore.getState().addRecord(
        inputText,
        generated,
        studentId,
        groupId,
        '기록',
        '보통',
      );

      setInputText('');
    } catch (err) {
      console.error('Bar mode submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={barFrameStyle}>
      <span style={barLabelStyle}>살핌</span>
      <input
        style={barInputStyle}
        placeholder={dbReady ? '관찰을 적으세요. @학생 /그룹' : '준비 중...'}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!dbReady || submitting}
        autoFocus
      />
      <button
        style={{
          ...barBtnStyle,
          ...(submitting ? { opacity: 0.6, cursor: 'wait' } : {}),
        }}
        onClick={handleSubmit}
        disabled={!dbReady || submitting}
      >
        {submitting ? '...' : '기록'}
      </button>
      <button
        style={{
          ...barBtnStyle,
          backgroundColor: 'transparent',
          color: '#888888',
          border: '1px solid #444444',
          marginLeft: '8px',
          padding: '8px 12px',
          fontSize: '12px',
        }}
        onClick={onCycleMode}
        title="모드 전환"
      >
        {NEXT_MODE_LABEL.bar}
      </button>
    </div>
  );
}

// ── Side Mode Component ──

function SideModeView({
  onCycleMode,
  dbReady,
}: {
  onCycleMode: () => void;
  dbReady: boolean;
}) {
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recentRecords, setRecentRecords] = useState<
    Array<{
      id: number;
      raw_input: string;
      generated_sentence: string;
      created_at: string;
    }>
  >([]);

  // Load recent records
  useEffect(() => {
    if (!dbReady) return;
    let cancelled = false;

    async function loadRecent() {
      try {
        const { useRecordStore } = await import('./stores/useRecordStore');
        const records = useRecordStore.getState().records;
        if (!cancelled) {
          const sorted = [...records]
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .slice(0, 10);
          setRecentRecords(sorted);
        }
      } catch (err) {
        console.error('Failed to load recent records:', err);
      }
    }

    loadRecent();
    return () => {
      cancelled = true;
    };
  }, [dbReady, submitting]);

  const handleSubmit = async () => {
    if (!inputText.trim() || !dbReady || submitting) return;
    setSubmitting(true);
    try {
      const { useRecordStore } = await import('./stores/useRecordStore');
      const { convertToFormalSentence } = await import('./lib/ai-service');
      const { useStudentStore } = await import('./stores/useStudentStore');
      const { useGroupStore } = await import('./stores/useGroupStore');

      const students = useStudentStore.getState().students;
      const groups = useGroupStore.getState().groups;

      let studentId: number | null = null;
      let groupId: number | null = null;
      let cleanText = inputText;

      const studentMatch = inputText.match(/@(\S+)/);
      if (studentMatch) {
        const found = students.find((s) => s.name === studentMatch[1]);
        if (found) studentId = found.id;
        cleanText = cleanText.replace(/@\S+/, '').trim();
      }

      const groupMatch = inputText.match(/\/(\S+)/);
      if (groupMatch) {
        const found = groups.find((g) => g.name === groupMatch[1]);
        if (found) groupId = found.id;
        cleanText = cleanText.replace(/\/\S+/, '').trim();
      }

      let generated = '';
      try {
        generated = (await convertToFormalSentence(cleanText)).sentence;
      } catch {
        generated = cleanText;
      }

      await useRecordStore.getState().addRecord(
        inputText,
        generated,
        studentId,
        groupId,
        '기록',
        '보통',
      );

      setInputText('');
    } catch (err) {
      console.error('Side mode submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!dbReady) {
    return (
      <div style={sideFrameStyle}>
        <div style={{ ...loadingStyle, fontSize: '14px' }}>준비 중...</div>
      </div>
    );
  }

  return (
    <div style={sideFrameStyle}>
      {/* Header */}
      <div style={sideHeaderStyle}>
        <span style={sideLogoStyle}>살핌</span>
        <button style={modeSwitchBtnStyle} onClick={onCycleMode}>
          {NEXT_MODE_LABEL.side} →
        </button>
      </div>

      {/* Quick Input */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #000000',
            borderRadius: '8px',
            padding: '4px',
          }}
        >
          <textarea
            style={{
              flex: 1,
              border: 'none',
              resize: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#111111',
              fontFamily: 'inherit',
              padding: '8px 12px',
              minHeight: '60px',
            }}
            placeholder="관찰을 적으세요. @학생 /그룹"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={submitting}
            autoFocus
          />
          <button
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              alignSelf: 'stretch',
              ...(submitting ? { opacity: 0.6, cursor: 'wait' } : {}),
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '...' : '기록'}
          </button>
        </div>
      </div>

      {/* Recent Records */}
      <div style={sideBodyStyle}>
        <div
          style={{
            padding: '12px 16px 8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#888888',
            letterSpacing: '0.03em',
          }}
        >
          최근 기록
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {recentRecords.length === 0 && (
            <div
              style={{
                padding: '24px 0',
                textAlign: 'center',
                fontSize: '13px',
                color: '#999999',
              }}
            >
              아직 기록이 없습니다
            </div>
          )}
          {recentRecords.map((record) => (
            <div
              key={record.id}
              style={{
                padding: '10px 12px',
                marginBottom: '6px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: '#111111',
                  lineHeight: 1.5,
                  marginBottom: '4px',
                }}
              >
                {record.generated_sentence || record.raw_input}
              </div>
              <div style={{ fontSize: '11px', color: '#999999' }}>
                {new Date(record.created_at).toLocaleString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
