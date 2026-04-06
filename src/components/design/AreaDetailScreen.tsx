import React, { useState } from 'react';
import type { CSSProperties } from 'react';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  studentName?: string;
  areaName?: string;
  onBack?: () => void;
  onConfirm?: () => void;
}

/* ------------------------------------------------------------------ */
/*  customStyles – workspace / panel / chat / sentence-card only       */
/* ------------------------------------------------------------------ */

const customStyles: Record<string, CSSProperties> = {
  workspaceHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 32px',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    backgroundColor: '#EAEAE6',
    flexShrink: 0,
    zIndex: 2,
  },
  btnBack: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#555555',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: '24px',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background 0.2s, color 0.2s',
  },
  workspaceTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111111',
    letterSpacing: '-0.01em',
    margin: 0,
  },
  workspaceContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  panelLeft: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderRight: '1px solid #000000',
    backgroundColor: '#EAEAE6',
  },
  panelRight: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    backgroundColor: '#F8F8F6',
  },
  panelHeader: {
    padding: '24px 32px 16px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#111111',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sentenceCard: {
    background: '#ffffff',
    border: '1px solid #000000',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sentenceMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#555555',
  },
  sourceTag: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    border: '1px solid #000000',
  },
  tagRecord: { backgroundColor: '#ffffff', color: '#111111' },
  tagTask: { backgroundColor: '#E6F0FA', color: '#004488', borderColor: 'rgba(0, 68, 136, 0.2)' },
  tagSurvey: { backgroundColor: '#F6F0E6', color: '#885500', borderColor: 'rgba(136, 85, 0, 0.2)' },
  sentenceContent: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#111111',
    wordBreak: 'keep-all',
  },
  importanceControl: {
    display: 'flex',
    border: '1px solid #000000',
    borderRadius: '6px',
    overflow: 'hidden',
    width: 'max-content',
  },
  importanceBtnBase: {
    background: '#ffffff',
    border: 'none',
    padding: '6px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#555555',
    cursor: 'pointer',
    fontFamily: 'inherit',
    borderLeft: '1px solid #000000',
    transition: 'all 0.2s',
  },
  importanceBtnFirst: {
    borderLeft: 'none',
  },
  importanceBtnActive: {
    background: '#111111',
    color: '#ffffff',
  },
  limitArea: {
    background: '#FFF4F4',
    borderTop: '1px solid #000000',
    padding: '20px 32px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  limitStats: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bytesCurrent: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#DC2626',
  },
  bytesTotal: {
    fontSize: '13px',
    color: '#555555',
    fontWeight: 500,
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: '#DC2626',
    width: '100%',
  },
  limitNote: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#DC2626',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  chatContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  chatBubbleAi: {
    display: 'flex',
    gap: '16px',
    maxWidth: '95%',
  },
  aiAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#111111',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  aiMessage: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  aiText: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#111111',
    fontWeight: 500,
    paddingTop: '6px',
  },
  aiDraftBox: {
    background: '#ffffff',
    border: '1px solid #000000',
    borderRadius: '12px',
    padding: '20px',
    fontSize: '15px',
    lineHeight: 1.7,
    color: '#111111',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    position: 'relative',
  },
  draftActions: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'flex',
    gap: '8px',
  },
  btnIconSmall: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#555555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  chatInputArea: {
    padding: '20px 32px',
    background: '#F8F8F6',
    borderTop: '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexShrink: 0,
  },
  contextNote: {
    fontSize: '12px',
    color: '#555555',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    background: '#ffffff',
    border: '1px solid #000000',
    borderRadius: '12px',
    padding: '4px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  chatTextarea: {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    padding: '12px 14px',
    fontFamily: 'inherit',
    fontSize: '14px',
    color: '#111111',
    resize: 'none',
    minHeight: '48px',
    maxHeight: '120px',
    lineHeight: 1.5,
  },
  btnSend: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#111111',
    color: '#ffffff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    margin: '4px',
    transition: 'background 0.2s',
  },
  actionBottom: {
    padding: '16px 32px 24px',
    background: '#F8F8F6',
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px dashed rgba(0,0,0,0.1)',
  },
  btnPrimary: {
    background: '#111111',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    height: '48px',
    padding: '0 32px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface ImportanceControlProps {
  selected: string;
  onChange: (level: string) => void;
}

const ImportanceControl: React.FC<ImportanceControlProps> = ({ selected, onChange }) => {
  const levels = ['높음', '보통', '낮음'];
  return (
    <div style={customStyles.importanceControl}>
      {levels.map((level, i) => (
        <button
          key={level}
          style={{
            ...customStyles.importanceBtnBase,
            ...(i === 0 ? customStyles.importanceBtnFirst : {}),
            ...(selected === level ? customStyles.importanceBtnActive : {}),
          }}
          onClick={() => onChange(level)}
        >
          {level}
        </button>
      ))}
    </div>
  );
};

interface SentenceCardProps {
  tag: string;
  tagType: string;
  date: string;
  content: string;
  importance: string;
  onImportanceChange: (val: string) => void;
}

const SentenceCard: React.FC<SentenceCardProps> = ({ tag, tagType, date, content, importance, onImportanceChange }) => {
  const tagStyle = tagType === 'record' ? customStyles.tagRecord : tagType === 'task' ? customStyles.tagTask : customStyles.tagSurvey;
  return (
    <div style={customStyles.sentenceCard}>
      <div style={customStyles.sentenceMeta}>
        <span style={{ ...customStyles.sourceTag, ...tagStyle }}>{tag}</span>
        <span>{date}</span>
      </div>
      <p style={customStyles.sentenceContent}>{content}</p>
      <ImportanceControl selected={importance} onChange={onImportanceChange} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

interface Sentence {
  id: number;
  tag: string;
  tagType: string;
  date: string;
  content: string;
  importance: string;
}

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
}

const initialSentences: Sentence[] = [
  { id: 1, tag: '기록', tagType: 'record', date: '2023.09.15', content: '수업 중 진행된 토론에서 논리적인 근거를 들어 자신의 주장을 명확하게 펼침. 타인의 의견을 반박할 때도 예의를 갖춰 논리적 결함을 지적하는 성숙한 태도를 보임.', importance: '높음' },
  { id: 2, tag: '과제', tagType: 'task', date: '2023.10.05', content: '환경 문제 해결을 위한 아이디어 제안서에서 일상생활에서 쉽게 실천할 수 있는 창의적인 분리수거 시스템 개선안을 제안하여 교사 및 동료들의 높은 평가를 받음.', importance: '높음' },
  { id: 3, tag: '설문', tagType: 'survey', date: '2023.11.02', content: '모둠 활동 시 조장으로서 팀원들의 의견을 경청하고 갈등 상황에서 중재자 역할을 훌륭히 수행하며 프로젝트를 성공적으로 이끄는 리더십을 발휘함.', importance: '보통' },
  { id: 4, tag: '기록', tagType: 'record', date: '2023.11.20', content: '심화 탐구 활동에서 주어진 주제를 넘어서 스스로 관련 논문과 자료를 주도적으로 조사하고 분석하여, 대학 수준에 준하는 완성도 높은 보고서를 제출함.', importance: '높음' },
  { id: 5, tag: '기록', tagType: 'record', date: '2023.12.05', content: '수업 시간 중 이해가 느린 친구에게 본인의 쉬는 시간을 할애하여 어려운 개념을 비유를 들어 쉽게 설명해주는 등 이타적이고 배려심 깊은 태도를 꾸준히 보임.', importance: '낮음' },
];

const initialChatMessages: ChatMessage[] = [
  { role: 'ai', text: '김도윤의 세특 초안을 만들었습니다. 수정하고 싶은 부분을 말씀해주세요.' }
];

const initialDraftText =
  '수업 중 진행된 토론에서 논리적인 근거를 들어 자신의 주장을 명확하게 펼치며, 타인의 의견을 반박할 때도 예의를 갖춰 논리적 결함을 지적하는 성숙한 태도를 보임. 환경 문제 해결을 위한 아이디어 제안서에서 일상생활에서 쉽게 실천할 수 있는 창의적인 분리수거 시스템 개선안을 제안하여 교사 및 동료들의 높은 평가를 받음. 심화 탐구 활동에서는 주어진 주제를 넘어서 스스로 관련 논문과 자료를 주도적으로 조사하고 분석하여, 대학 수준에 준하는 완성도 높은 보고서를 제출함. 또한, 모둠 활동 시 조장으로서 팀원들의 의견을 경청하고 갈등 상황에서 중재자 역할을 훌륭히 수행하며 프로젝트를 성공적으로 이끄는 리더십을 발휘함. 수업 시간 중 이해가 느린 친구에게 본인의 쉬는 시간을 할애하여 어려운 개념을 비유를 들어 쉽게 설명해주는 등 이타적이고 배려심 깊은 태도를 꾸준히 보임.';

/* ------------------------------------------------------------------ */
/*  AreaDetailScreen                                                   */
/* ------------------------------------------------------------------ */

export function AreaDetailScreen({
  studentName = '김도윤',
  areaName = '세특',
  onBack,
  onConfirm,
}: Props) {
  const [chatInput, setChatInput] = useState('');
  const [byteLimit, setByteLimit] = useState(1500);
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInputVal, setLimitInputVal] = useState('1500');
  const [copied, setCopied] = useState(false);
  const [editingDraft, setEditingDraft] = useState(false);
  const [draftText, setDraftText] = useState(initialDraftText);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [sentences, setSentences] = useState<Sentence[]>(initialSentences);

  const [backHover, setBackHover] = useState(false);
  const [sendHover, setSendHover] = useState(false);
  const [primaryHover, setPrimaryHover] = useState(false);
  const [confirmedModal, setConfirmedModal] = useState(false);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'ai', text: `"${userMsg}" 내용을 반영하여 수정하겠습니다. 잠시만 기다려 주세요.` }]);
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLimitEdit = () => {
    setLimitInputVal(String(byteLimit));
    setEditingLimit(true);
  };

  const handleLimitSave = () => {
    const val = parseInt(limitInputVal, 10);
    if (!isNaN(val) && val > 0) setByteLimit(val);
    setEditingLimit(false);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    setConfirmedModal(true);
  };

  /* Root style = appBody minus border-radius (parent provides that) */
  const rootStyle: CSSProperties = {
    backgroundColor: '#EAEAE6',
    flex: 1,
    position: 'relative',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
  };

  return (
    <div style={rootStyle}>
      {/* Workspace Header */}
      <div style={customStyles.workspaceHeader}>
        <button
          style={{ ...customStyles.btnBack, ...(backHover ? { background: 'rgba(0,0,0,0.05)', color: '#111111' } : {}) }}
          onMouseEnter={() => setBackHover(true)}
          onMouseLeave={() => setBackHover(false)}
          onClick={onBack}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          이전으로
        </button>
        <h1 style={customStyles.workspaceTitle}>{studentName} — {areaName} 완성하기</h1>
      </div>

      {/* Workspace Content */}
      <div style={customStyles.workspaceContent}>
        {/* Left Panel */}
        <div style={customStyles.panelLeft}>
          <div style={customStyles.panelHeader}>
            <span>축적된 문장</span>
          </div>
          <div style={customStyles.scrollArea}>
            {sentences.map(s => (
              <SentenceCard
                key={s.id}
                tag={s.tag}
                tagType={s.tagType}
                date={s.date}
                content={s.content}
                importance={s.importance}
                onImportanceChange={(val) => setSentences(prev => prev.map(item => item.id === s.id ? { ...item, importance: val } : item))}
              />
            ))}
          </div>

          {/* Limit Area */}
          <div style={customStyles.limitArea}>
            <div style={customStyles.limitStats}>
              <span style={customStyles.bytesCurrent}>현재 1650바이트</span>
              <span style={customStyles.bytesTotal}>
                제한{' '}
                {editingLimit ? (
                  <input
                    type="number"
                    value={limitInputVal}
                    onChange={e => setLimitInputVal(e.target.value)}
                    onBlur={handleLimitSave}
                    onKeyDown={e => e.key === 'Enter' && handleLimitSave()}
                    style={{ width: '60px', border: '1px solid #111', borderRadius: '4px', padding: '2px 4px', fontSize: '13px', fontFamily: 'inherit' }}
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={handleLimitEdit}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', transition: 'background 0.2s' }}
                  >
                    {byteLimit}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </span>
                )}
                바이트
              </span>
            </div>
            <div style={customStyles.progressBarBg}>
              <div style={customStyles.progressBarFill} />
            </div>
            <div style={customStyles.limitNote}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              제한을 초과했습니다. 중요도가 '낮음'인 문장은 AI가 축약하거나 생략합니다.
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={customStyles.panelRight}>
          <div style={customStyles.panelHeader}>
            <span>AI와 함께 완성</span>
          </div>

          <div style={customStyles.chatContainer}>
            {chatMessages.map((msg, idx) => (
              msg.role === 'ai' ? (
                <div key={idx} style={customStyles.chatBubbleAi}>
                  <div style={customStyles.aiAvatar}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                  <div style={customStyles.aiMessage}>
                    <div style={customStyles.aiText}>{msg.text}</div>
                    {idx === 0 && (
                      <div style={customStyles.aiDraftBox}>
                        <div style={customStyles.draftActions}>
                          <button
                            style={customStyles.btnIconSmall}
                            title={copied ? '복사됨!' : '복사하기'}
                            onClick={handleCopy}
                            onMouseEnter={e => { e.currentTarget.style.background = '#EAEAE6'; e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#111'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#555'; }}
                          >
                            {copied ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                          <button
                            style={customStyles.btnIconSmall}
                            title="직접 수정"
                            onClick={() => setEditingDraft(!editingDraft)}
                            onMouseEnter={e => { e.currentTarget.style.background = '#EAEAE6'; e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#111'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#555'; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#111', fontWeight: 700 }}>현재 1420</span> / 1500바이트
                        </div>
                        {editingDraft ? (
                          <textarea
                            value={draftText}
                            onChange={e => setDraftText(e.target.value)}
                            style={{ width: '100%', border: '1px solid #ccc', borderRadius: '8px', padding: '8px', fontSize: '15px', lineHeight: 1.7, fontFamily: 'inherit', resize: 'vertical', minHeight: '160px', outline: 'none' }}
                          />
                        ) : (
                          <span>{draftText}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ background: '#111111', color: '#ffffff', borderRadius: '12px 12px 2px 12px', padding: '12px 16px', fontSize: '14px', lineHeight: 1.6, maxWidth: '80%' }}>
                    {msg.text}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Chat Input */}
          <div style={customStyles.chatInputArea}>
            <div style={customStyles.contextNote}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              AI는 이 학생의 모든 기록, 과제, 설문 문장을 기억하고 있습니다.
            </div>
            <div style={customStyles.inputWrapper}>
              <textarea
                style={customStyles.chatTextarea}
                placeholder='"이 학생의 리더십을 더 부각해줘", "두 번째 문장을 구체적으로" 등'
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                rows={1}
              />
              <button
                style={{ ...customStyles.btnSend, ...(sendHover ? { background: '#333333' } : {}) }}
                onMouseEnter={() => setSendHover(true)}
                onMouseLeave={() => setSendHover(false)}
                onClick={handleSend}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Bottom */}
          <div style={customStyles.actionBottom}>
            <button
              style={{
                ...customStyles.btnPrimary,
                ...(primaryHover ? { background: '#333333', transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' } : {}),
              }}
              onMouseEnter={() => setPrimaryHover(true)}
              onMouseLeave={() => setPrimaryHover(false)}
              onClick={handleConfirm}
            >
              최종 확정
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmedModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setConfirmedModal(false)}
        >
          <div
            style={{ background: '#EAEAE6', border: '1px solid #000', borderRadius: '16px', padding: '40px 48px', maxWidth: '480px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>{areaName}이 최종 확정되었습니다!</div>
            <div style={{ fontSize: '14px', color: '#555', marginBottom: '28px', lineHeight: 1.6 }}>{studentName}의 {areaName} 문장이 저장되었습니다.</div>
            <button
              style={{ ...customStyles.btnPrimary, fontSize: '14px', height: '40px', padding: '0 24px' }}
              onClick={() => setConfirmedModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
