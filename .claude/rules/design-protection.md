---
description: src/components/design/ 폴더 파일 편집 시 적용
globs: src/components/design/**
---

# Design Protection Rules

이 폴더의 파일은 Variant.com에서 확정 익스포트한 디자인 원본이다.

## 절대 금지
- className, style, Tailwind 클래스를 수정/삭제/추가하지 마
- div 중첩, flex/grid 구조 변경 금지
- 색상, font-size, padding, margin, gap, border-radius 변경 금지
- "개선", "정리", "리팩토링" 명목으로 마크업 변경 금지
- 새 Tailwind 클래스 추가 금지 (hover, transition 포함)

## 허용
- .jsx → .tsx 변환, Props 인터페이스 추가
- 하드코딩 텍스트를 copy.md 카피로 교체
- 이미지 src를 props로 교체
- onClick/onChange 등 이벤트 핸들러 추가
- 반복 UI를 map()으로 교체 (JSX 구조 유지)
- aria-*, data-testid 속성 추가

## 위반 시
수정하지 말고 사용자에게 보고: "design/[파일명]의 [부분]을 변경해야 합니다. Variant에서 수정해주세요."
