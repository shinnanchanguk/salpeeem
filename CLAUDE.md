# 살핌 (Salpeem)

## 개요
교사용 데스크톱 앱. 수업 중 관찰 메모 → AI가 생기부 문장으로 변환 → 학기말 생기부 완성.

## 프로젝트 플랜
전체 기능 범위, 화면 구조, 기술 결정, 마일스톤은 docs/plan.md 참조.
새 기능 추가나 구조 변경 시 plan.md와 대조하여 범위 내인지 확인.
plan.md에 없는 기능을 임의로 추가하지 않기.

## 기술 스택
Tauri v2 / Vite + React + TypeScript / Tailwind + shadcn/ui / Zustand / Framer Motion / SQLite

## 디자인 보호
- src/components/design/ 파일의 className과 스타일은 Variant 원본. 수정 금지.
- 텍스트는 design-assets/copy.md 카피 사용. AI가 임의로 카피 작성 금지.
- 디자인 변경 필요시 → 수정하지 말고 나에게 보고.
- 상세 규칙은 .claude/rules/design-protection.md 참조.

## 작업 순서
1. design/ 컴포넌트를 views/에서 import하여 조립
2. copy.md 카피로 텍스트 교체
3. 이벤트 핸들러/라우팅 연결
4. 시각적 검증: screenshots/ 와 비교, 차이 있으면 보고
