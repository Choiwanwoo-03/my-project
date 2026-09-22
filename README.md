# 음악 앨범 기록 (my-project)

내가 들은 음악 앨범을 기록하고 관리하는 개인용 웹 서비스.

> 팀 프로젝트("재물관리 시스템") 전 예행연습으로 진행하는 1인 토이 프로젝트다.
> 등록 → 목록 → 검색 → 상태 변경 → 통계라는 같은 뼈대를 미리 연습한다.

## 프로젝트 정보

| 항목 | 내용 |
| --- | --- |
| 기간 | 2026-09-21 ~ 2026-10-07 |
| 인원 | 1인 개발 |
| 스택 | Next.js 14 (App Router), TypeScript, Tailwind CSS, MongoDB Atlas, (선택) Vercel Blob |
| 개발 도구 | Claude Code |
| 저장소 | https://github.com/Choiwanwoo-03/my-project |

## 시작하기

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인한다. 아직 MongoDB 연결 전이라 목록/상세 화면은 `src/data/mock-albums.ts`의 목업 데이터를 보여준다.

## 구성

```
my-project/
├── src/
│   ├── app/          페이지 (/, /new, /albums/[id])
│   ├── components/   재사용 UI 컴포넌트 (AlbumCard 등)
│   ├── data/          목업 데이터 (DB 연결 전 임시)
│   ├── lib/           공용 유틸 (그라데이션 색상 등)
│   └── types/         타입 정의 (Album)
└── docs/              요구사항정의서, 데이터베이스 정의서
```

## 문서

| 문서 | 내용 |
| --- | --- |
| [`docs/요구사항정의서.md`](./docs/요구사항정의서.md) | 기능 범위(단계별), 데이터 모델, 화면 설계, 제약사항, 일정 |
| `docs/데이터베이스 정의서.xlsx` | MongoDB `albums` 컬렉션 필드 정의, 예시 데이터 |

## 기능

### 1단계 — 필수 (정적 UI 완료, DB 연동 전)
- **앨범 등록** (`/new`) — 앨범명·아티스트·발매일·평점(1~5)·상태·장르 입력
- **목록 조회** (`/`) — 카드형 그리드
- **상세 조회** (`/albums/[id]`) — 전체 필드 표시

### 2단계 — 발표 목표
- 수정 · 삭제(확인 절차 포함) · 검색(앨범명/아티스트)

### 3단계 — 여유 있을 때
- 정렬 · 필터(상태별) · 통계 · 사진 업로드(Vercel Blob) · 디자인 다듬기

## 데이터 모델

`albums` 컬렉션, 도큐먼트당 필드 6개.

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| title | String | 필수 | 앨범명 |
| artist | String | 필수 | 아티스트/밴드명 |
| releaseDate | Date | 선택 | 발매일 |
| rating | Number (1~5) | 필수 | 평점, 드롭다운 선택 |
| status | enum | 필수 | 듣는중 / 다들음 / 인생앨범 |
| genre | String | 선택 | 자유 입력 |

자세한 제약조건과 예시 값은 `docs/데이터베이스 정의서.xlsx` 참고.

## 브랜치 전략

gitflow: `main`(배포용) → `develop`(통합) → `feature/*`(기능 단위). 기능 브랜치에서 작업 후 `develop`으로 머지한다.

## 하지 않는 것

- 외부 API 연동, 로그인/회원가입, 공유·알림 기능
- 음악 외 다른 취미 기록
- MongoDB 접속 정보 커밋 (`.env.local`에 보관, `.gitignore` 등록)

## 코드 규칙

- 커밋 메시지는 영어 동사로 시작 (예: `feat: add ...`)
- 한 번에 화면/기능 하나씩 작게 나눠서 작업한다 — 발표 때 모든 파일을 직접 설명할 수 있어야 한다
