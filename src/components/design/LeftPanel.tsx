import type { CSSProperties, ReactNode } from 'react';

const baseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #000000',
  backgroundColor: '#EAEAE6',
  flexShrink: 0,
};

interface LeftPanelProps {
  width?: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function LeftPanel({ width = '280px', children, style }: LeftPanelProps) {
  return (
    <div style={{ ...baseStyle, width, ...style }}>
      {children}
    </div>
  );
}
