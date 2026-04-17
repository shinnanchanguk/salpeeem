# 과제·설문 제출물 트래커 + 학년·반 명렬 뷰 — 설계

작성일: 2026-04-17

## 배경

현재 `AssignmentView`는 폴더(과제·설문) 선택 시 파일을 업로드 → 텍스트 추출 → AI가 학생별 생기부 문장 생성 → 확정하면 `records`에 저장하는 흐름이다. 업로드한 원본 파일 자체는 세션 중 메모리에만 존재하고 디스크에 남지 않으며, "어느 학생이 냈는지 / 누가 안 냈는지"를 한눈에 볼 뷰가 없다. 데스크톱 앱이라는 특성을 살려, 제출물을 사용자 컴퓨터에 영구 저장하고 학년·반·번호순 명렬로 제출 현황을 관리할 수 있게 한다.

## 목표

- 학생이 올린 과제 파일을 교사 PC에 영구 저장하고, 교사가 탐색기로도 접근할 수 있게 한다.
- 폴더(과제·설문) 선택 시 우측에 학년·반·번호순 학생 명렬을 항상 볼 수 있게 한다.
- 각 학생의 제출/미제출 상태를 즉시 파악하고, 제출 파일을 OS 기본 앱으로 바로 열 수 있게 한다.
- 설문은 파일 1개에 다수 응답이 들어오는 특성을 그대로 반영한다.

## 비목표 (이번 범위 아님)

- 학생이 직접 업로드하는 기능 (교사 PC에 교사가 업로드하는 기존 흐름 유지).
- 파일 버전 관리 (재업로드 = 덮어쓰기).
- 설문 응답을 학생별로 쪼개서 각자 파일로 저장.
- 제출물을 AI에 보내지 않는 기존 원칙은 그대로 유지 (텍스트 추출 후에만 AI 호출).

## 사용자 시나리오

1. 교사가 "수학 1단원 수행평가" 폴더를 연다.
2. 우측 명렬 패널이 뜬다. 기본적으로 교사가 마지막에 본 학년·반이 선택된 상태.
3. 반을 `2학년 3반`으로 바꾸면 그 반 학생 번호순으로 쭉 나열. 각 행은 제출/미제출 배지.
4. 학생이 이메일로 보낸 파일들을 업로드 zone에 드래그 → `studentMatcher`가 학번/이름으로 자동 인식 → 인식된 학생은 즉시 "제출됨"으로 표시되고, 파일은 지정 경로에 정규화된 이름으로 저장됨.
5. 인식 실패한 파일은 명렬 상단 "미매칭 파일 N개"에 묶여 있고, 교사가 드롭다운으로 학생을 지정하면 그 학생 행으로 이동.
6. 제출됨 행을 더블클릭하면 저장된 원본 파일이 OS 기본 앱으로 열림.
7. 기존 "문장 생성하기"·"전체 전송" 흐름은 그대로. "제출됨"과 "AI 문장 확정됨"은 독립된 상태로 공존.

## 데이터 모델

### 새 테이블: `submissions`

```sql
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_folder_id INTEGER NOT NULL,
  student_id INTEGER,                    -- NULL이면 미매칭 상태
  original_filename TEXT NOT NULL,       -- 학생이 보낸 그대로
  stored_path TEXT NOT NULL,             -- 살핌이 저장한 절대 경로
  uploaded_at TEXT NOT NULL,             -- ISO8601
  FOREIGN KEY (assignment_folder_id) REFERENCES assignment_folders(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_submissions_folder_student
  ON submissions(assignment_folder_id, student_id)
  WHERE student_id IS NOT NULL;
```

- `student_id IS NULL`은 여러 개 허용 (미매칭 풀). 매칭되면 `student_id` 업데이트 + 파일 재이름.
- 같은 폴더+학생에 재업로드 시: 기존 `stored_path` 파일 삭제 → 새 파일로 덮어쓰기 → `uploaded_at` 갱신.

### 새 설정: `submission_root_path`

`app_settings` 테이블에 키 추가. 기본값은 런타임에 OS별로 계산:
- macOS/Linux: `~/Documents/살핌/제출물`
- Windows: `%USERPROFILE%\Documents\살핌\제출물`

Tauri의 `dirs::document_dir()` 또는 `@tauri-apps/api/path`의 `documentDir()`로 구함.

## 저장 파일 구조

```
<submission_root_path>/
└── <assignment_folder_full_name>/      # 상위·하위 폴더 경로를 " / "로 join
    ├── 2315_홍길동.docx                # 매칭된 제출물
    ├── 2316_김철수.pdf
    ├── _미매칭/                        # 매칭 대기 파일 격리
    │   └── 원본파일이름.hwp
    └── _전체응답.xlsx                   # folder_type='survey'일 때만
```

### 파일명 규칙 (매칭된 경우)

현재 `settings.student_id_pattern`을 따른다.

- `G1C1N2` → `{학번4자리}_{이름}.{ext}` 예: `2315_홍길동.docx`
- `G1C2N2` → `{학번5자리}_{이름}.{ext}` 예: `20315_홍길동.docx`

이름에 파일시스템 금지 문자(`/\:*?"<>|`)가 있으면 `_`로 치환.

### 패턴 변경 시 처리

설정 화면에서 `student_id_pattern` 바뀌면 모달:
> "기존에 저장된 제출물 N개의 파일명을 새 규칙으로 일괄 변경할까요?"
- "변경": 전체 `submissions` 순회 → 새 이름으로 rename → `stored_path` 갱신.
- "그대로": 기존 파일 유지 (새 업로드만 신규 규칙 적용). 비일관 상태는 설정 화면에 경고 뱃지로 표시.

### 저장 경로 변경 시 처리

설정의 저장 경로 바꾸면 모달:
> "기존 파일 M개를 새 경로로 이동할까요?"
- "이동": 파일 move + `stored_path` 갱신.
- "그대로": 새 경로는 새 업로드부터 적용.

## UI 변경

### 레이아웃 (AssignmentView만 해당)

기존 2-column → 폴더 선택 시 **3-column**으로 확장:

```
[280px] 폴더 트리 │ [flex] 폼·결과 (maxW 800)  │ [360px] 학생 명렬 패널
```

- 창 너비 `< 1280px`이면 우측 패널 자동 접힘 + 우측 상단에 "📋 명렬 보기" 토글 버튼(누르면 오버레이로 노출).
- 폴더 미선택 상태에서는 명렬 패널 숨김 (현재 placeholder 유지).

### 우측 명렬 패널 구성

```
┌─────────────────────────────┐
│ 학년 [▼ 2학년]               │
│ 반   [▼ 3반]                │
│ 상태 [전체][제출][미제출]     │
├─────────────────────────────┤
│ ⚠ 미매칭 파일 2개  [지정 >]   │
├─────────────────────────────┤
│ ▶ 2학년 3반                  │
│   1번 김가나  [미제출]        │
│   2번 박다라  [제출] 2302_박다라.docx →│
│   ...                       │
└─────────────────────────────┘
```

- 각 학생 행:
  - 번호 · 이름 · 상태 배지 · (제출이면) 정규화된 파일명 + 열기 아이콘.
  - 더블클릭 또는 파일명·아이콘 클릭 → Tauri `opener` 플러그인 호출.
  - 행에 파일 드래그 → 그 학생 이름으로 업로드·저장 (매칭 결과 수동 보정 경로).
- 미매칭 영역:
  - 개수 뱃지 + "지정" 눌러 펼치면 파일 목록 + 학생 드롭다운.
  - 학생 선택 → 파일을 `_미매칭/`에서 정규화 경로로 이동 + `student_id` 업데이트.

### 설정 화면

사이드바에 새 섹션 **"제출물 저장"** 추가 (`학생 명단 관리 | 영역 관리 | AI 연결 | 단축키 설정 | 제출물 저장 | 데이터 관리` 순).

- **저장 경로**: 현재 경로 표시 + `[폴더 선택]` 버튼 (Tauri dialog) + `[탐색기에서 열기]` 버튼.
- **파일명 규칙**: 현 `student_id_pattern`을 따른다고 안내하는 문구 + `학생 명단 관리`에서 변경 가능한 링크.
- **현재 저장된 제출물**: 파일 수 · 총 용량 · 폴더별 통계 (가벼운 요약).

## 설문(survey) 처리

`folder_type === 'survey'`인 폴더는 "공용 응답 파일 1개" 모델.

- 업로드: 엑셀/CSV 하나 드롭 → `[폴더명]/_전체응답.xlsx`로 저장 (고정 파일명).
- 업로드 직후 `studentMatcher`로 엑셀 파싱 → 응답한 학생마다 `submissions` 행을 하나씩 INSERT (`original_filename`=업로드 원본명, `stored_path`=`_전체응답.xlsx` 절대경로, `student_id`=매칭 결과).
- 제출 판정: 명렬은 `submissions` 행 존재 여부만으로 판단 (assignment와 동일 로직).
- 명렬에서 제출됨 행 클릭 → `_전체응답.xlsx` 열림 (특정 행 포커스는 하지 않음, 단순화).
- 재업로드 = 기존 파일 덮어쓰기 + 해당 폴더의 `submissions` 행 전체 삭제 후 재파싱으로 재생성 (트랜잭션). 매칭 실패 행은 `student_id=NULL`로 들어가 "미매칭 응답" 뱃지로 노출.

## 워크플로우 통합 (기존 AssignmentView 흐름과의 관계)

| 시점 | 기존 동작 | 추가 동작 |
|------|-----------|-----------|
| 파일 드래그·업로드 | `uploadedFiles` state에 쌓음 | **즉시 디스크 저장 + `submissions` INSERT** (매칭 결과에 따라 정규화 이름 또는 `_미매칭/`). 명렬 즉시 갱신. |
| 문장 생성하기 클릭 | 파일 → 텍스트 추출 → AI → 결과 카드 | 디스크에 이미 저장된 파일을 읽어 추출. 업로드→저장 이후 시점이라 흐름 순서 동일. |
| 전송(확정) | `records` INSERT | 변화 없음. `records`와 `submissions`는 독립. |
| "새로 작성" | `results`·`uploadedFiles` state 초기화 | 저장된 파일·`submissions`은 유지 (= 제출됨 상태 유지). |
| 폴더 삭제 | `assignment_folders` 삭제 + `records`는 인박스 복귀 | `submissions`는 FK CASCADE로 DB에서 자동 삭제. 디스크의 해당 폴더(및 `_미매칭/`·`_전체응답.xlsx` 포함)는 삭제 전에 앱 코드가 명시적으로 rm_rf로 청소한다 (DB CASCADE는 파일을 지우지 않으므로). |
| 폴더 이름 변경 | `assignment_folders` 업데이트 | 저장 서브폴더도 rename. 동시에 해당 폴더 `submissions` 전체의 `stored_path`를 새 경로로 갱신 (트랜잭션). rename 실패 시 모달로 알림 + DB는 롤백. |

## 의존성 / 외부 작업

- `@tauri-apps/plugin-opener` 추가 (또는 기존 플러그인 확인). 없으면 `tauri.conf.json`·Cargo 의존성 추가.
- `@tauri-apps/api/path`의 `documentDir()` 사용 — 이미 Tauri 기본에 포함.
- 파일 rename/move/delete는 `@tauri-apps/plugin-fs` 또는 Rust 커맨드로. Tauri 기본 allowlist 확인 필요.

## 리스크 & 대응

- **대용량 첨부**: 한 반 30명 × 20MB = 600MB. 복사하는 동안 블로킹 방지를 위해 파일 I/O는 Tauri 커맨드(비동기)로 처리하고, 기존 `genProgress` UI 옆에 저장 진행 표시 추가.
- **파일명 충돌**: 정규화 이름이 겹치는 경우(동명이인·동일 학번 실수) → 기존 재업로드 덮어쓰기 정책 적용. 단, 학생이 다르면 `student_id` 다르므로 UNIQUE INDEX가 안전망.
- **사용자가 탐색기에서 파일을 먼저 지우는 경우**: 클릭 시 "파일을 찾을 수 없습니다"로 안내하고 `submissions` 행을 "미제출로 되돌릴까요?" 옵션 제공.
- **한글 경로·이모지 파일명**: Tauri의 std::fs는 UTF-8이라 문제 없음. Windows 금지 문자만 치환.

## 열린 질문 (구현 중 확정)

- 패턴 변경 시 일괄 리네이밍을 트랜잭션으로 감쌀지, 베스트 에포트로 할지 → 트랜잭션 권장.
- 설문의 엑셀 학생별 응답 행 감지에 실패하면 "제출/미제출" 판정이 전부 미제출로 떨어짐 → 경고 배너 + 열 매핑 수동 지정 UI는 v1.1로 연기.

## 테스트 포인트

- 업로드 시 디스크 저장 · `submissions` INSERT 모두 성공.
- 매칭 성공/실패 케이스, 미매칭 → 지정 → 이동 경로.
- 재업로드 덮어쓰기, 삭제 시 CASCADE 파일 삭제.
- 경로 변경·패턴 변경 시 기존 파일 일괄 처리.
- 설문 엑셀 응답 행 검출, `_전체응답.xlsx` 열기.
- 창 너비에 따른 3-column ↔ 오버레이 전환.
- 폴더 이름 변경 → 서브폴더 rename 동기화.
