import React, { useEffect, useRef, useCallback } from 'react';
import { Joyride, STATUS, ACTIONS, EVENTS, type EventData, type Step, type TooltipRenderProps } from 'react-joyride';

interface OnboardingProps {
  onComplete: () => void;
}

// ─── Custom Tooltip Styles ──────────────────────────────────────────

const tooltipContainerStyle: React.CSSProperties = {
  backgroundColor: '#EAEAE6',
  color: '#111111',
  border: '1px solid #000000',
  borderRadius: 12,
  padding: 28,
  maxWidth: 480,
  fontFamily: 'inherit',
};

const headlineStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#111111',
  margin: 0,
  marginBottom: 8,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#555555',
  lineHeight: 1.65,
  margin: 0,
};

const instructionCodeStyle: React.CSSProperties = {
  fontWeight: 700,
  color: '#111111',
};

const exampleCardStyle: React.CSSProperties = {
  backgroundColor: '#F4F4F2',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  padding: 16,
  marginBottom: 10,
};

const rawTextStyle: React.CSSProperties = {
  backgroundColor: '#EAEAE6',
  border: '1px dashed rgba(0,0,0,0.3)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  color: '#555555',
  lineHeight: 1.5,
};

const formalTextStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  color: '#333333',
  lineHeight: 1.5,
};

const arrowStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  fontSize: 18,
  color: '#999999',
  margin: '6px 0',
};

const viewExampleStyle: React.CSSProperties = {
  backgroundColor: '#F4F4F2',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  padding: '12px 16px',
  marginBottom: 6,
};

const modeCardStyle: React.CSSProperties = {
  backgroundColor: '#F4F4F2',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  padding: '12px 16px',
  marginBottom: 8,
};

const noteStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#888888',
  marginTop: 8,
  marginBottom: 0,
};

const buttonBase: React.CSSProperties = {
  backgroundColor: '#111111',
  color: '#ffffff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 24px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const skipButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#888888',
  border: 'none',
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const backButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#555555',
  border: '1px solid rgba(0,0,0,0.2)',
  borderRadius: 8,
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// ─── Step Content Renderers ─────────────────────────────────────────

function StepIntroContent() {
  return (
    <div>
      <h2 style={headlineStyle}>보는 순간, 기록이 됩니다.</h2>
      <p style={{ ...bodyStyle, fontSize: 15, fontWeight: 600, color: '#333333', marginBottom: 12 }}>
        학생의 모든 성장을 놓치지 않고 기록하세요.
      </p>
      <p style={bodyStyle}>
        수업 중 떠오른 관찰을 30초 안에 입력하면, 살핌이 생기부 문장으로 바꿔서
        학생별·영역별로 쌓아둡니다. 학기말엔 쌓인 문장으로 영역 생기부를 완성하세요.
      </p>
    </div>
  );
}

function StepQuickRecordContent() {
  return (
    <div>
      <h2 style={headlineStyle}>떠오른 순간 바로 적으세요</h2>
      <div style={{ marginBottom: 16 }}>
        <p style={{ ...bodyStyle, marginBottom: 6 }}>
          <span style={instructionCodeStyle}>@학생이름</span> — 학생을 태그합니다
        </p>
        <p style={{ ...bodyStyle, marginBottom: 6 }}>
          <span style={instructionCodeStyle}>/영역이름</span> — 영역을 태그합니다
        </p>
        <p style={{ ...bodyStyle, marginBottom: 0 }}>
          태그 없이 적어도 괜찮아요. 인박스에 쌓이고, 나중에 정리할 수 있습니다.
        </p>
      </div>
      <div style={exampleCardStyle}>
        <div style={rawTextStyle}>
          @김도윤 피타고라스 문제 푸는데 기하적 설명 지오지브라 써서 해가지고
          창의적이엇고 반응 좋았음
        </div>
        <div style={arrowStyle}>↓</div>
        <div style={formalTextStyle}>
          피타고라스 문제를 해결하는 과정에서 공학적 도구를 활용하여 문제의 기하적
          상황을 시각화 하는 창의력을 발휘함.
        </div>
      </div>
      <div style={exampleCardStyle}>
        <div style={rawTextStyle}>
          @이서연 학급허ㅣ의에서 Canva로 PPT 만들어서 친구들 사전 설문 통계낸거
          시각화해서 보여주느넫 반응 좋았음
        </div>
        <div style={arrowStyle}>↓</div>
        <div style={formalTextStyle}>
          학급자치회의에서 사전 설문 조사 결과를 시각화하여 통계 데이터로 보여주는
          프레젠테이션을 진행하며 급우들의 큰 호응을 얻음.
        </div>
      </div>
      <p style={noteStyle}>
        오타, 줄임말 그대로 적어도 됩니다. 살핌이 생기부 문장으로 다듬어줍니다.
      </p>
    </div>
  );
}

function StepCustomViewContent() {
  return (
    <div>
      <h2 style={headlineStyle}>보고 싶은 기록만 모아보세요</h2>
      <p style={{ ...bodyStyle, marginBottom: 14 }}>
        학생, 영역, 학급을 자유롭게 조합해서 나만의 뷰를 만들 수 있습니다. 직접
        기록, 과제, 설문 — 출처와 상관없이 해당하는 문장이 한곳에 모입니다.
      </p>
      <div style={viewExampleStyle}>
        <span style={{ fontWeight: 700, color: '#111111', fontSize: 14 }}>"1반 세특"</span>
        <span style={{ color: '#555555', fontSize: 13, marginLeft: 8 }}>— 1반 학생 전체 x 세특 영역</span>
      </div>
      <div style={viewExampleStyle}>
        <span style={{ fontWeight: 700, color: '#111111', fontSize: 14 }}>"김도윤 전체"</span>
        <span style={{ color: '#555555', fontSize: 13, marginLeft: 8 }}>— 김도윤 학생의 모든 영역</span>
      </div>
      <div style={viewExampleStyle}>
        <span style={{ fontWeight: 700, color: '#111111', fontSize: 14 }}>"2학년 행특"</span>
        <span style={{ color: '#555555', fontSize: 13, marginLeft: 8 }}>— 2학년 전체 x 행특 영역</span>
      </div>
      <p style={noteStyle}>
        좌측 패널에서 뷰를 추가하고, 클릭하면 오른쪽에 해당 기록이 표시됩니다.
      </p>
    </div>
  );
}

function StepModesContent() {
  return (
    <div>
      <h2 style={headlineStyle}>상황에 맞게 창을 바꾸세요</h2>
      <div style={{ marginBottom: 8 }}>
        <div style={modeCardStyle}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111111', margin: 0, marginBottom: 2 }}>전체</p>
          <p style={{ fontSize: 13, color: '#555555', margin: 0 }}>기록, 학생 관리, 영역 완성까지 모든 기능</p>
        </div>
        <div style={modeCardStyle}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111111', margin: 0, marginBottom: 2 }}>사이드</p>
          <p style={{ fontSize: 13, color: '#555555', margin: 0 }}>다른 작업 옆에 세로로 붙여두고 기록</p>
        </div>
        <div style={modeCardStyle}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111111', margin: 0, marginBottom: 2 }}>바</p>
          <p style={{ fontSize: 13, color: '#555555', margin: 0 }}>화면 위아래에 입력란 한 줄만. 수업 중 빠르게.</p>
        </div>
      </div>
      <p style={noteStyle}>
        단축키로 즉시 전환됩니다. 설정에서 단축키를 변경할 수 있어요.
      </p>
    </div>
  );
}

function StepStartContent() {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ ...bodyStyle, marginTop: 4 }}>
        학생 명단부터 등록하면 @태그가 바로 작동합니다.
      </p>
    </div>
  );
}

// ─── Custom Tooltip Component ───────────────────────────────────────

function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  isLastStep,
  tooltipProps,
  size,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      style={tooltipContainerStyle}
    >
      {step.content}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 20,
        }}
      >
        <div>
          {!isLastStep && (
            <button {...skipProps} style={skipButtonStyle}>
              건너뛰기
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {index > 0 && (
            <button {...backProps} style={backButtonStyle}>
              이전
            </button>
          )}
          {continuous && (
            <button {...primaryProps} style={buttonBase}>
              {isLastStep ? '시작하기' : '다음'}
            </button>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
        {Array.from({ length: size }, (_, i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: i === index ? '#111111' : 'rgba(0,0,0,0.18)',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Steps Definition ───────────────────────────────────────────────

const STEPS: Step[] = [
  {
    target: '[data-tour="app-logo"]',
    content: <StepIntroContent />,
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="quick-input"]',
    content: <StepQuickRecordContent />,
    placement: 'bottom-start',
    skipBeacon: true,
  },
  {
    target: '[data-tour="sidebar-views"]',
    content: <StepCustomViewContent />,
    placement: 'right-start',
    skipBeacon: true,
  },
  {
    target: '[data-tour="tab-area"]',
    content: <StepModesContent />,
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="quick-input"]',
    content: <StepStartContent />,
    placement: 'bottom-start',
    skipBeacon: true,
  },
];

// ─── Typing animation helper ────────────────────────────────────────

const TYPING_EXAMPLE = '@김도윤 피타고라스 문제 푸는데 기하적 설명 지오지브라 써서 해가지고 창의적이엇고 반응 좋았음';

function useTypingDemo(active: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idxRef = useRef(0);

  const start = useCallback(() => {
    const textarea = document.querySelector('[data-tour="quick-input"] textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    idxRef.current = 0;
    textarea.value = '';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    timerRef.current = setInterval(() => {
      idxRef.current++;
      if (idxRef.current > TYPING_EXAMPLE.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      textarea.value = TYPING_EXAMPLE.slice(0, idxRef.current);
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value',
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(textarea, TYPING_EXAMPLE.slice(0, idxRef.current));
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 45);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const textarea = document.querySelector('[data-tour="quick-input"] textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value',
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(textarea, '');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, []);

  useEffect(() => {
    if (active) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [active, start, stop]);
}

// ─── Main Component ─────────────────────────────────────────────────

export function Onboarding({ onComplete }: OnboardingProps) {
  const stepIndexRef = useRef(0);
  const [typingActive, setTypingActive] = React.useState(false);

  useTypingDemo(typingActive);

  const handleEvent = useCallback((data: EventData) => {
    const { status, index, action, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setTypingActive(false);
      onComplete();
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
      stepIndexRef.current = nextIndex;
      setTypingActive(nextIndex === 1);
    }

    if (type === EVENTS.STEP_BEFORE) {
      setTypingActive(index === 1);
    }
  }, [onComplete]);

  return (
    <Joyride
      steps={STEPS}
      run={true}
      continuous={true}
      tooltipComponent={CustomTooltip}
      onEvent={handleEvent}
      options={{ spotlightPadding: 8 }}
    />
  );
}
