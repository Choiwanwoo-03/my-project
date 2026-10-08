# 음악 앨범 기록 (my-project)

내가 들은 음악 앨범을 기록하고 관리하는 개인용 웹 서비스. Spotify에 연결하면 앨범 정보·커버·수록곡을 자동으로 가져오고, 브라우저에서 바로 재생할 수도 있다.

> 팀 프로젝트("재물관리 시스템") 전 예행연습으로 진행하는 1인 토이 프로젝트다.

## 프로젝트 정보

| 항목 | 내용 |
| --- | --- |
| 기간 | 2026-09-21 ~ 2026-10-12 |
| 인원 | 1인 개발 |
| 스택 | Next.js 14 (App Router), TypeScript, Tailwind CSS, MongoDB Atlas, Vercel Blob, Spotify Web API / Web Playback SDK |
| 개발 도구 | Claude Code |
| 저장소 | https://github.com/Choiwanwoo-03/my-project |

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 "환경 변수" 참고)
npm run dev
```

http://localhost:3000 에서 확인한다.

## 환경 변수

`.env.example`을 복사해서 `.env.local`을 만들고 아래 값을 채운다.

| 변수 | 용도 |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas 클러스터 연결 주소 |
| `MONGODB_DB` | 사용할 데이터베이스 이름 |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify Developer Dashboard에서 발급받은 앱 키 |
| `SPOTIFY_REDIRECT_URI` | Spotify 로그인 후 돌아올 주소 (Spotify 앱 설정의 Redirect URI와 동일해야 함) |
| `PLAYER_PASSWORD` | 등록·수정·삭제와 재생을 잠그는 비밀번호. 비우면 로컬 개발은 잠기지 않고, 배포 환경은 안전하게 전부 막힌다 |
| `BLOB_READ_WRITE_TOKEN` | 앨범 커버 이미지를 올리는 Vercel Blob 저장소 토큰 |

## 구성

```
my-project/
├── src/
│   ├── app/
│   │   ├── page.tsx                목록 (검색·정렬·장르 필터·통계, 등록은 모달로 띄움)
│   │   ├── albums/[id]/page.tsx     상세 (수록곡·재생 포함)
│   │   ├── albums/[id]/edit/page.tsx 수정
│   │   ├── player/page.tsx          LP 턴테이블 재생 화면
│   │   └── api/
│   │       ├── albums/              등록·수정·삭제 (POST/PUT/DELETE)
│   │       ├── albums/[id]/favorites/ 최애곡 표시 (PATCH)
│   │       ├── upload/               이미지 업로드
│   │       └── spotify/              검색·로그인·콜백·토큰·잠금 해제
│   ├── components/   재사용 UI (AlbumCard, NewAlbumButton(등록 모달), SpotifyPlayer, TrackList 등)
│   ├── lib/           공용 로직 (DB 연결, 입력 검증, 잠금, Spotify API)
│   └── types/         타입 정의 (Album, Spotify SDK)
└── docs/              로컬 전용 설계 문서 (git에는 안 올라감)
```

## 기능

- **등록 / 수정 / 삭제** — 앨범명·아티스트·발매일·평점(1~5)·장르·커버 이미지
- **Spotify 연동** — 등록·수정 화면에서 검색해 정보·커버 자동 입력, 상세 화면에 수록곡 목록·총 재생시간·최애곡(★) 표시
- **재생** — Spotify 계정 연결 후 상세 화면에서 바로 재생/일시정지/다음 곡, `/player`에서 LP 턴테이블 모양으로 재생(톤암 드래그, 스페이스/방향키 조작)
- **목록** — 검색(앨범명/아티스트), 정렬(평점·발매일순), 장르 필터, 통계(총 개수·평균 평점)
- **이미지 업로드** — Vercel Blob에 커버 이미지 직접 업로드
- **잠금** — 비밀번호 하나로 등록/수정/삭제/재생을 전부 보호 (`PLAYER_PASSWORD`)

## 데이터 모델

`albums` 컬렉션, 도큐먼트당 필드 10개 (`id` 제외 9개 + MongoDB가 자동으로 붙이는 `_id`).

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| title | String | 필수 | 앨범명 |
| artist | String | 필수 | 아티스트/밴드명 |
| releaseDate | String (`YYYY-MM-DD`) | 선택 | 발매일 |
| rating | Number (1~5 정수) | 필수 | 평점 |
| genre | String | 선택 | 자유 입력, 목록 화면의 장르 필터 목록은 저장된 값에서 자동으로 모은다 |
| coverImageUrl | String (`https://`만 허용) | 선택 | 커버 이미지 주소 (직접 업로드 또는 Spotify 커버) |
| spotifyId | String (영문·숫자 22자) | 선택 | 연결된 Spotify 앨범 ID |
| spotifyUrl | String | 선택 | 서버가 `spotifyId`로 직접 만든 Spotify 링크 (클라이언트가 보낸 값은 쓰지 않음) |
| favoriteTrackIds | String[] | 선택 | 최애곡으로 표시한 수록곡 ID 목록 |

등록·수정 API(`POST`/`PUT /api/albums`)는 `src/lib/album-input.ts`의 `parseAlbumInput()`으로 위 형식을 전부 검증한 뒤에만 저장한다.

## 보안

- 등록·수정·삭제·최애곡 표시·이미지 업로드는 전부 `PLAYER_PASSWORD`로 잠겨 있다. 잠금을 풀지 않으면 401을 돌려준다 (`src/lib/player-lock.ts`).
- `spotifyUrl`은 클라이언트가 보낸 값을 그대로 저장하지 않고, 검증된 `spotifyId`로 서버가 매번 직접 만든다.
- 입력값은 `parseAlbumInput()`이 타입·길이·범위·형식을 검사한 뒤에만 DB에 들어간다.

## 브랜치 전략

gitflow: `main`(배포용) → `develop`(통합) → `feature/*`(기능 단위) / `fix/*`(버그·리뷰 반영). 작업 브랜치에서 `develop`으로 PR을 올려 머지한다.

## 하지 않는 것

- 여러 명이 쓰는 로그인/회원가입 (Spotify 계정 연결은 운영자 1명 전용이고, 사이트 자체 로그인은 없음)
- 다른 사용자와 공유하는 기능
- 음악 외 다른 취미 기록

## 코드 규칙

- 커밋 메시지는 `type: 한국어 설명` 형식 (예: `feat: 등록 화면에 Spotify 검색 추가`)
- 한 번에 화면/기능 하나씩 작게 나눠서 작업한다 — 발표 때 모든 파일을 직접 설명할 수 있어야 한다
