# ClassSync

같은 반 학생들이 **공유 학사 캘린더**(퀴즈·시험·과제·마감)를 함께 관리하고, 각자 필기한 노트를 **AI로 하나의 완성된 노트로 합치는** 웹 애플리케이션입니다.

- 배포 주소: https://classsync-fawn.vercel.app
- 프론트엔드: Next.js 16 (App Router) · React 19 · Tailwind CSS 4
- 백엔드: Firebase Authentication + Cloud Firestore (`classsync-7c015`)
- 노트 편집기: Tiptap (Google Docs 스타일)
- AI: OpenAI GPT API — 노트 합치기, 손글씨 사진 → 텍스트 변환
- 배포: Vercel (팀 `logncoding` / 프로젝트 `classsync`)

---

## 로컬에서 실행하기 (처음 받는 개발자용)

### 1. 필요한 프로그램

| 프로그램 | 버전 | 언제 필요한가 | 확인 명령 |
| --- | --- | --- | --- |
| Node.js | **22 이상** (권장 24) | 항상 | `node -v` |
| npm | Node에 포함 | 항상 | `npm -v` |
| Java (JDK) | **21 이상** | 에뮬레이터 모드만 | `java -version` |
| Firebase CLI | 최신 | 에뮬레이터 모드만 | `firebase --version` |

macOS 설치 예시 (Homebrew):

```bash
brew install node openjdk@21
npm install -g firebase-tools
```

> Node 22 미만이면 OpenAI 라이브러리가 동작하지 않습니다. 여러 Node 버전을 쓴다면 `nvm use 24` 등으로 맞춰 주세요.

### 2. 프로젝트 받기 & 설치

이 프로젝트는 Git 저장소가 없습니다. 폴더를 압축해서 주고받는 경우, 아래 항목은 **빼고** 전달하세요.

| 항목 | 이유 |
| --- | --- |
| `node_modules/`, `.next/` | 설치·빌드하면 다시 생깁니다 (용량이 큼) |
| `.env.local` | **비밀 키(OpenAI API 키)** 가 들어 있습니다. 메신저나 메일로 그대로 보내지 마세요 |
| `.emulator-data/`, `firebase-export-*` | 각자의 로컬 테스트 데이터 |
| `.vercel/` | 배포 담당자의 Vercel 연결 정보 |

받은 폴더에서 패키지를 설치합니다.

```bash
npm install
```

### 3. 실행 방법 선택

두 가지 방법이 있습니다. 모두 http://localhost:3000 에서 열립니다.

| | A. 에뮬레이터 모드 (추천) | B. 실제 Firebase 모드 |
| --- | --- | --- |
| 명령 | `npm run dev:emulator` | `npm run dev` |
| 데이터 | 내 컴퓨터 안의 가짜 Firebase + 데모 데이터 | 배포된 사이트와 **같은 실제 데이터** |
| 필요한 설정 | 없음 (`.env.local` 없어도 됨) | `.env.local`에 Firebase 설정값 |
| 추가 설치 | Java 21+, Firebase CLI | 없음 |

#### A. 에뮬레이터 모드 — 설정 없이 바로 시작 (추천)

```bash
npm run dev:emulator
```

- Firebase 에뮬레이터(Auth + Firestore), 데모 데이터 입력, Next.js 개발 서버가 한 번에 실행됩니다.
- 처음 실행할 때 에뮬레이터 파일을 내려받느라 1~2분 걸릴 수 있습니다.
- 로그인 화면 하단의 **Local demo accounts** 버튼으로 바로 로그인할 수 있습니다.

| 이름 | 이메일 | 비밀번호 |
| --- | --- | --- |
| Minji Park | minji@classsync.test | classsync123 |
| Daniel Lee | daniel@classsync.test | classsync123 |
| Sora Kim | sora@classsync.test | classsync123 |
| Ethan Choi | ethan@classsync.test | classsync123 |
| Yuna Jung | yuna@classsync.test | classsync123 |

(로컬 에뮬레이터 전용 테스트 계정입니다. 실제 사이트에는 없습니다.)

- 터미널에서 `Ctrl+C`로 종료하면 데이터가 `.emulator-data/`에 저장되고, 다음 실행 때 복원됩니다.
- 데모 데이터를 처음 상태로 되돌리려면 (실행 중에): `npm run seed -- --force`
- 에뮬레이터에 저장된 데이터 보기: http://localhost:4000

AI 기능을 쓰려면 프로젝트 폴더에 `.env.local` 파일을 만들고 OpenAI 키만 넣으면 됩니다.

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

키가 없으면 노트 합치기는 **오프라인 데모 방식**(단순 규칙 기반)으로 동작하고, 사진 → 텍스트 변환은 꺼집니다.

#### B. 실제 Firebase 모드

1. 설정 파일을 만듭니다.
   ```bash
   cp .env.example .env.local
   ```
2. `.env.local`에 값을 채웁니다.
   - `NEXT_PUBLIC_FIREBASE_*` 6개: Firebase 콘솔 → 프로젝트 `classsync-7c015` → 프로젝트 설정(톱니바퀴) → **내 앱** → 웹 앱의 설정값. 콘솔 접근 권한이 없으면 프로젝트 담당자에게 받으세요. (브라우저에 공개되는 값이라 비밀은 아닙니다.)
   - `OPENAI_API_KEY`: 프로젝트 담당자에게 안전한 방법으로 전달받으세요.
3. 실행합니다.
   ```bash
   npm run dev
   ```

> ⚠️ 이 모드는 **배포된 사이트와 같은 데이터베이스**를 씁니다. 테스트로 만든 반·일정·노트가 실제 사용자에게 보일 수 있으니, 기능 개발과 테스트는 가능하면 에뮬레이터 모드로 하세요.

### 4. 사용하는 포트

| 포트 | 용도 |
| --- | --- |
| 3000 | 웹앱 (Next.js) |
| 4000 | Firebase Emulator UI (에뮬레이터 모드) |
| 8085 | Firestore 에뮬레이터 |
| 9099 | Auth 에뮬레이터 |
| 4400, 4500, 9150 | 에뮬레이터 내부용 |

### 5. 자주 발생하는 문제

| 증상 | 해결 |
| --- | --- |
| `firebase: command not found` | `npm install -g firebase-tools` |
| Java를 찾을 수 없다거나 Java 버전이 낮다는 오류 | JDK 21 이상 설치 (`brew install openjdk@21`) 후 터미널 재시작 |
| 포트가 이미 사용 중이라는 오류 | `lsof -i :8085`로 사용 중인 프로그램을 확인해 종료합니다. 포트를 바꾸려면 `firebase.json`, `src/lib/firebase.ts`, `scripts/seed.mjs`, `package.json`(`seed:wait`)의 `8085`를 함께 바꿉니다. |
| 로그인이 이상하거나 "Please sign in again" | 모드를 바꿨거나 에뮬레이터를 재시작하면 이전 로그인이 무효가 됩니다. 오른쪽 위 프로필 메뉴에서 로그아웃 후 다시 로그인하세요. (A/B 모드는 계정이 완전히 별개입니다.) |
| `.env.local`을 고쳤는데 반영이 안 됨 | 개발 서버를 재시작하세요 (`Ctrl+C` 후 다시 실행). |
| 에뮬레이터 데이터가 저장되지 않음 | 터미널에서 `Ctrl+C`로 정상 종료할 때만 저장됩니다. 창을 강제로 닫으면 저장되지 않습니다. |
| 에뮬레이터 데이터를 완전히 지우고 싶음 | 서버를 끈 상태에서 `.emulator-data/` 폴더를 삭제하고 다시 실행합니다. |

### 6. 코드 작업 전 참고

- 이 프로젝트는 **Next.js 16**입니다. 이전 버전과 API가 다른 부분이 있으니 `node_modules/next/dist/docs/`의 문서를 참고하세요 (`AGENTS.md` 참고).
- 변경 후 확인:
  ```bash
  npm test
  ```
  (성적 계산기의 계산 규칙 테스트 — 스펙 §9의 기대값을 그대로 검사합니다)
  ```bash
  npm run lint
  ```
  ```bash
  npx tsc --noEmit
  ```
  ```bash
  npm run build
  ```

---

## AI 기능 동작 방식

- **노트 합치기** (`/api/merge-notes`): 한 수업에 학생들이 쓴 노트를 하나로 합칩니다. 관련 내용끼리 묶고, 같은 말만 하나로 합치며, 한 학생에게만 있는 내용도 유지합니다. 각 줄에는 출처(N1, N2…)가 붙습니다.
  - GPT 결과에는 규칙 기반 검사가 한 번 더 적용됩니다. GPT가 빠뜨린 학생 문장은 **"Also noted"** 에 다시 넣고, 숫자·요일이 다른 내용(예: 36 vs 38 ATP, 금요일 vs 목요일)은 충돌로 표시합니다.
  - 충돌은 문서 오른쪽 **"Notes disagree"** 패널에 표시됩니다.
- **사진 → 텍스트** (`/api/transcribe-note`): 편집기 툴바의 **Photo to text** 버튼으로 손글씨 사진을 올리면 GPT가 텍스트로 옮겨 내 노트에 넣습니다.
- OpenAI 키는 서버에서만 사용되고 브라우저로 전달되지 않습니다. 두 API 모두 로그인한 사용자만 호출할 수 있습니다 (Firebase ID 토큰 검증).
- 사용 모델은 `OPENAI_MODEL`로 바꿀 수 있습니다 (기본 `gpt-4o-mini`).

---

## 주요 기능 (MVP)

화면은 **Calendar**, **Notes**, **Calculator** 세 개입니다. Calendar와 Notes에서는 헤더 아래 반 목록에서 반 하나를 고르거나 "All classes"로 전체를 볼 수 있습니다.

| 기능 | 설명 |
| --- | --- |
| **반 참여** | 6자리 반 코드로 참여하거나 새 반 만들기 ("+ Add class"). 반을 선택하면 오른쪽에 반 코드가 표시됩니다. |
| **공유 캘린더** | 월/주 보기. 날짜를 클릭하면 일정 추가. 추가한 일정은 반 전체에 바로 보입니다. |
| **확인 & 수정 이력** | 일정을 열어 "Confirm — I heard this too" / "Correct". 2명 이상 확인 시 Verified, 아니면 Unverified. 모든 변경이 이력에 남습니다. |
| **놓친 공지 알림** | 마지막으로 "Mark as seen"을 누른 뒤 반 친구가 추가·수정한 일정을 캘린더 위에 표시합니다. |
| **수업 노트** | 수업마다 노트 페이지 하나. 각자 "My note" 탭에서 Docs처럼 작성하면 자동 저장됩니다. 손글씨 사진은 "Photo to text"로 텍스트 변환. |
| **AI 반 노트** | "Class note" 탭에서 모든 학생의 노트를 AI로 합칩니다. 출처를 누르면 원본 노트를 볼 수 있습니다. |
| **성적 계산기** | KISJ 성적 계산기(`kisj-grade-calculator/docs/CALCULATOR_SPEC.md`)를 옮긴 기능. **Domain** 탭: 과목별 Formative/Summative 점수로 최종 점수와 등급 계산 (분수 입력, 더 높은 Summative로 Formative 대체, 버림·반올림 규칙 원본과 동일). **GPA** 탭: Unweighted/Weighted GPA (AP +1.0, 학점, Korean 분할), "Paste from Domain". 성적은 본인만 볼 수 있게 계정에 저장됩니다. |

---

## 배포 (Vercel)

Vercel 팀 `logncoding`의 `classsync` 프로젝트에 배포됩니다. 배포하려면 이 팀에 접근 권한이 있는 계정(현재 `teacher@logncoding.com`)이 필요합니다.

```bash
npx vercel login --global-config ~/.vercel-teacher
```
```bash
npx vercel link --project classsync --global-config ~/.vercel-teacher
```
```bash
npx vercel deploy --prod --global-config ~/.vercel-teacher
```

- `--global-config ~/.vercel-teacher`(줄여서 `-Q`)는 이 프로젝트용 Vercel 로그인을 별도 폴더에 보관합니다. 다른 Vercel 계정의 로그인에 영향을 주지 않습니다.
- 환경변수는 Vercel 프로젝트에 저장돼 있습니다 (`npx vercel env ls -Q ~/.vercel-teacher`). `.env.local`은 업로드되지 않습니다 (`.vercelignore`).
- 배포 전 `npm run build`가 통과하는지 확인하세요.

## Firebase 설정

- 프로젝트: `classsync-7c015` — Authentication(이메일/비밀번호), Firestore 사용
- 승인된 도메인: `localhost`, `classsync-fawn.vercel.app`
- **보안 규칙을 바꿀 때**는 `firestore.rules`를 수정한 뒤 Firebase 콘솔 → Firestore → 규칙에 붙여넣고 게시하거나, 권한 있는 계정으로 `firebase deploy --only firestore:rules`를 실행합니다.

---

## 폴더 구조

```
src/
  app/
    page.tsx                              랜딩 페이지
    login/, signup/                       인증
    (app)/layout.tsx                      상단 헤더 + 반 선택 줄
    (app)/calendar/                       공유 캘린더
    (app)/notes/                          노트 목록
    (app)/notes/[classId]/[sessionId]/    노트 편집기 (My note / Class note)
    (app)/calculator/                     성적 계산기 (Domain / GPA)
    api/merge-notes/route.ts              AI 노트 합치기 API
    api/transcribe-note/route.ts          손글씨 사진 → 텍스트 API
  components/
    CalendarView.tsx, EventFormModal.tsx, EventDetailModal.tsx
    notes/NoteEditor.tsx                  Docs 스타일 편집기 (Tiptap)
    notes/MergedNoteView.tsx              AI 반 노트 + 충돌 패널
  lib/
    firebase.ts                           Firebase 연결 (에뮬레이터/실제 전환)
    db.ts                                 Firestore 읽기/쓰기 + 실시간 훅
    api.ts                                로그인 토큰을 붙여 API 호출
    server/verify-user.ts                 서버에서 Firebase 로그인 토큰 검증
    merge/                                GPT 프롬프트 · 누락 검사 · 충돌 검사 · 오프라인 병합
    calculator/                           성적 계산 순수 함수(grades.ts) · 과목 카탈로그 · 저장 · 테스트
firestore.rules                           보안 규칙 (반 멤버만 접근, 노트는 본인만 수정, 성적은 본인만)
scripts/seed.mjs                          에뮬레이터 데모 데이터
scripts/emulators.mjs                     에뮬레이터 실행 (데이터 저장/복원)
```
