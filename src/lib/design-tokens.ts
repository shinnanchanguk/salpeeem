/**
 * Design tokens extracted from Variant design code.
 * DO NOT modify these values — they are the source of truth from Variant.
 */

export const colors = {
  /** App frame background */
  appFrame: '#D8E6F3',
  /** Canvas / body background */
  canvas: '#EAEAE6',
  /** Card / subtle background */
  cardBg: '#F4F4F2',
  /** Right panel / chat background */
  panelBg: '#F8F8F6',
  /** White */
  white: '#ffffff',

  /** Tab colors by distance from active */
  tabDistance1: '#CED7DE',
  tabDistance2: '#B0C0CD',
  tabDistance3: '#94A3B0',

  /** Text */
  textPrimary: '#111111',
  textSecondary: '#555555',
  textPlaceholder: '#888888',

  /** Borders */
  borderStrong: '#000000',

  /** Status */
  success: '#10B981',
  successBg: '#D1FAE5',
  successDark: '#065F46',
  danger: '#DC2626',
  dangerBg: '#FFF4F4',

  /** Source tags */
  tagTaskBg: '#E6F0FA',
  tagTaskText: '#004488',
  tagSurveyBg: '#F6F0E6',
  tagSurveyText: '#885500',
} as const;

export const fontFamily =
  "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif";

export const fontSize = {
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '15px',
  xl: '16px',
  '2xl': '18px',
  '3xl': '20px',
  '4xl': '22px',
  '5xl': '28px',
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '12px',
  '3xl': '16px',
} as const;

export const spacing = {
  sidebar: {
    record: '280px',
    assignment: '300px',
    completion: '320px',
    settings: '280px',
  },
} as const;

export const shadows = {
  card: '0 2px 12px rgba(0,0,0,0.03)',
  input: '0 4px 16px rgba(0,0,0,0.06), inset 0 2px 4px rgba(0,0,0,0.02)',
  appBody: '0 -4px 20px rgba(0,0,0,0.05)',
  modal: '0 8px 32px rgba(0,0,0,0.1)',
  button: '0 2px 4px rgba(0,0,0,0.02)',
  draft: '0 4px 12px rgba(0,0,0,0.03)',
  confirm: '0 20px 60px rgba(0,0,0,0.2)',
} as const;
