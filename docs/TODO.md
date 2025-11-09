# 📋 SNS 프로젝트 TODO 리스트

PRD.md 기반 개발 작업 체크리스트

## 0. 기본 설정 (완료 ✅)

- [x] Supabase 연동 완료
- [x] Clerk 인증 연동 완료
- [x] 환경 변수 설정 완료
- [x] `users` 테이블 생성 완료
- [x] Storage 버킷 (`uploads`) 설정 완료

## 1. 데이터베이스 스키마 설정 (완료 ✅)

### 1-1. `posts` 테이블 생성 마이그레이션 (완료 ✅)

**목적**: 사용자가 작성한 게시물 저장

**컬럼 구조**:

- [x] `id`: UUID, Primary Key, DEFAULT gen_random_uuid()
- [x] `user_id`: UUID, NOT NULL, Foreign Key → users.id ON DELETE CASCADE
- [x] `image_url`: TEXT, NOT NULL (Supabase Storage URL)
- [x] `caption`: TEXT, 최대 2200자 (CHECK 제약조건: LENGTH(caption) <= 2200)
- [x] `created_at`: TIMESTAMPTZ, NOT NULL, DEFAULT now()
- [x] `updated_at`: TIMESTAMPTZ, NOT NULL, DEFAULT now()

**제약조건**:

- [x] Foreign Key: `user_id` → `users.id` ON DELETE CASCADE
- [x] CHECK: `LENGTH(caption) <= 2200`

**인덱스**:

- [x] `idx_posts_user_id`: `user_id` (사용자별 게시물 조회 최적화)
- [x] `idx_posts_created_at`: `created_at DESC` (시간 역순 정렬 최적화)

**기타**:

- [x] RLS 비활성화 (개발 단계): `ALTER TABLE posts DISABLE ROW LEVEL SECURITY`
- [x] 권한 부여: `GRANT ALL ON TABLE posts TO anon, authenticated, service_role`
- [x] 테이블 소유자 설정: `ALTER TABLE posts OWNER TO postgres`

**마이그레이션 파일**: `supabase/migrations/20251107085317_create_posts_table.sql` ✅

### 1-2. `likes` 테이블 생성 마이그레이션 (완료 ✅)

**목적**: 게시물에 대한 좋아요 관계 저장

**컬럼 구조**:

- [x] `id`: UUID, Primary Key, DEFAULT gen_random_uuid()
- [x] `post_id`: UUID, NOT NULL, Foreign Key → posts.id ON DELETE CASCADE
- [x] `user_id`: UUID, NOT NULL, Foreign Key → users.id ON DELETE CASCADE
- [x] `created_at`: TIMESTAMPTZ, NOT NULL, DEFAULT now()

**제약조건**:

- [x] Foreign Key: `post_id` → `posts.id` ON DELETE CASCADE
- [x] Foreign Key: `user_id` → `users.id` ON DELETE CASCADE
- [x] UNIQUE: `(post_id, user_id)` - 중복 좋아요 방지

**인덱스**:

- [x] `idx_likes_post_id`: `post_id` (게시물별 좋아요 조회)
- [x] `idx_likes_user_id`: `user_id` (사용자별 좋아요 조회)
- [x] UNIQUE 인덱스는 제약조건으로 자동 생성됨

**기타**:

- [x] RLS 비활성화 (개발 단계): `ALTER TABLE likes DISABLE ROW LEVEL SECURITY`
- [x] 권한 부여: `GRANT ALL ON TABLE likes TO anon, authenticated, service_role`
- [x] 테이블 소유자 설정: `ALTER TABLE likes OWNER TO postgres`

**마이그레이션 파일**: `supabase/migrations/20251107085318_create_likes_table.sql` ✅

### 1-3. `comments` 테이블 생성 마이그레이션 (완료 ✅)

**목적**: 게시물에 대한 댓글 저장

**컬럼 구조**:

- [x] `id`: UUID, Primary Key, DEFAULT gen_random_uuid()
- [x] `post_id`: UUID, NOT NULL, Foreign Key → posts.id ON DELETE CASCADE
- [x] `user_id`: UUID, NOT NULL, Foreign Key → users.id ON DELETE CASCADE
- [x] `content`: TEXT, NOT NULL, 최대 1000자 (CHECK 제약조건: LENGTH(content) <= 1000)
- [x] `created_at`: TIMESTAMPTZ, NOT NULL, DEFAULT now()
- [x] `updated_at`: TIMESTAMPTZ, NOT NULL, DEFAULT now()

**제약조건**:

- [x] Foreign Key: `post_id` → `posts.id` ON DELETE CASCADE
- [x] Foreign Key: `user_id` → `users.id` ON DELETE CASCADE
- [x] CHECK: `LENGTH(content) <= 1000`

**인덱스**:

- [x] `idx_comments_post_id`: `post_id` (게시물별 댓글 조회)
- [x] `idx_comments_user_id`: `user_id` (사용자별 댓글 조회)
- [x] `idx_comments_created_at`: `created_at DESC` (최신 댓글 정렬)

**기타**:

- [x] RLS 비활성화 (개발 단계): `ALTER TABLE comments DISABLE ROW LEVEL SECURITY`
- [x] 권한 부여: `GRANT ALL ON TABLE comments TO anon, authenticated, service_role`
- [x] 테이블 소유자 설정: `ALTER TABLE comments OWNER TO postgres`

**마이그레이션 파일**: `supabase/migrations/20251107085319_create_comments_table.sql` ✅

### 1-4. `follows` 테이블 생성 마이그레이션 (완료 ✅)

**목적**: 사용자 간 팔로우 관계 저장

**컬럼 구조**:

- [x] `id`: UUID, Primary Key, DEFAULT gen_random_uuid()
- [x] `follower_id`: UUID, NOT NULL, Foreign Key → users.id ON DELETE CASCADE
- [x] `following_id`: UUID, NOT NULL, Foreign Key → users.id ON DELETE CASCADE
- [x] `created_at`: TIMESTAMPTZ, NOT NULL, DEFAULT now()

**제약조건**:

- [x] Foreign Key: `follower_id` → `users.id` ON DELETE CASCADE
- [x] Foreign Key: `following_id` → `users.id` ON DELETE CASCADE
- [x] UNIQUE: `(follower_id, following_id)` - 중복 팔로우 방지
- [x] CHECK: `follower_id != following_id` - 자기 자신 팔로우 방지

**인덱스**:

- [x] `idx_follows_follower_id`: `follower_id` (팔로워 목록 조회)
- [x] `idx_follows_following_id`: `following_id` (팔로잉 목록 조회)
- [x] UNIQUE 인덱스는 제약조건으로 자동 생성됨

**기타**:

- [x] RLS 비활성화 (개발 단계): `ALTER TABLE follows DISABLE ROW LEVEL SECURITY`
- [x] 권한 부여: `GRANT ALL ON TABLE follows TO anon, authenticated, service_role`
- [x] 테이블 소유자 설정: `ALTER TABLE follows OWNER TO postgres`

**마이그레이션 파일**: `supabase/migrations/20251107085320_create_follows_table.sql` ✅

### 1-5. 마이그레이션 실행 순서

1. `posts` 테이블 (다른 테이블이 참조하므로 먼저 생성)
2. `likes` 테이블 (posts 참조)
3. `comments` 테이블 (posts 참조)
4. `follows` 테이블 (users만 참조, 순서 무관)

## 2. 1단계: 홈 피드 페이지

### 2-1. 기본 세팅 (완료 ✅)

- [x] Tailwind CSS Instagram 컬러 스키마 적용 (`app/globals.css`)

  - [x] `--instagram-blue`, `--background`, `--card-background` 등 CSS 변수 정의
  - [x] 타이포그래피 설정

- [x] TypeScript 타입 정의 (`lib/types.ts`)
  - [x] `User` 타입
  - [x] `Post` 타입
  - [x] `Like` 타입
  - [x] `Comment` 타입
  - [x] `Follow` 타입

### 2-2. 레이아웃 구조 (완료 ✅)

- [x] `(main)` Route Group 생성 (`app/(main)/layout.tsx`)

  - [x] Sidebar + Main Feed 레이아웃 구조
  - [x] 반응형 처리 (Desktop/Tablet/Mobile)

- [x] Sidebar 컴포넌트 (`components/layout/Sidebar.tsx`)

  - [x] Desktop: 244px 너비, 아이콘 + 텍스트 메뉴
  - [x] Tablet: 72px 너비, 아이콘만 표시
  - [x] Mobile: 숨김 처리
  - [x] 메뉴 항목: 🏠 홈, 🔍 검색, ➕ 만들기, 👤 프로필
  - [x] Active 상태 스타일링 (볼드)
  - [x] Hover 효과

- [x] MobileHeader 컴포넌트 (`components/layout/MobileHeader.tsx`)

  - [x] Mobile 전용 (768px 미만)
  - [x] 높이 60px
  - [x] 로고 + 알림/DM/프로필 아이콘

- [x] BottomNav 컴포넌트 (`components/layout/BottomNav.tsx`)
  - [x] Mobile 전용 (768px 미만)
  - [x] 높이 50px
  - [x] 5개 아이콘: 🏠 🔍 ➕ ❤️ 👤

### 2-3. 홈 피드 - 게시물 목록

- [ ] PostCard 컴포넌트 (`components/post/PostCard.tsx`)

  - [ ] 헤더 (60px): 프로필 이미지(32px 원형) + 사용자명 + 시간 + ⋯ 메뉴
  - [ ] 이미지 영역: 1:1 정사각형 비율
  - [ ] 액션 버튼 (48px): ❤️ 좋아요, 💬 댓글, ✈️ 공유(UI만), 🔖 북마크(UI만)
  - [ ] 컨텐츠: 좋아요 수(Bold) + 캡션(사용자명 Bold) + "... 더 보기" 처리
  - [ ] 댓글 미리보기: 최신 2개만 표시
  - [ ] "댓글 N개 모두 보기" 링크

- [ ] PostCardSkeleton 컴포넌트 (`components/post/PostCardSkeleton.tsx`)

  - [ ] 로딩 UI (회색 박스 애니메이션)
  - [ ] Shimmer 효과

- [ ] PostFeed 컴포넌트 (`components/post/PostFeed.tsx`)

  - [ ] 게시물 목록 렌더링
  - [ ] 로딩 상태 처리 (Skeleton UI)
  - [ ] 에러 상태 처리

- [ ] 홈 페이지 (`app/(main)/page.tsx`)

  - [ ] PostFeed 컴포넌트 통합
  - [ ] 레이아웃 적용 (Sidebar + Main Feed)

- [ ] 게시물 API - GET (`app/api/posts/route.ts`)
  - [ ] 페이지네이션 지원 (limit, offset)
  - [ ] 시간 역순 정렬
  - [ ] 사용자 정보 JOIN
  - [ ] 좋아요 수, 댓글 수 집계
  - [ ] 현재 사용자의 좋아요 여부 포함

### 2-4. 홈 피드 - 좋아요 기능

- [ ] 좋아요 API - POST (`app/api/likes/route.ts`)

  - [ ] 게시물 좋아요 추가
  - [ ] 중복 좋아요 방지
  - [ ] Clerk 인증 확인

- [ ] 좋아요 API - DELETE (`app/api/likes/[postId]/route.ts`)

  - [ ] 게시물 좋아요 제거
  - [ ] 본인 좋아요만 삭제 가능

- [ ] 좋아요 버튼 기능 (PostCard 내부)

  - [ ] 빈 하트 ↔ 빨간 하트 상태 토글
  - [ ] 클릭 시 API 호출
  - [ ] 애니메이션: scale(1.3) → scale(1)
  - [ ] 좋아요 수 실시간 업데이트

- [ ] 더블탭 좋아요 기능 (모바일)
  - [ ] 이미지 더블탭 감지
  - [ ] 큰 하트 등장 애니메이션 (fade in/out)
  - [ ] 좋아요 상태 업데이트

## 3. 2단계: 게시물 작성 & 댓글 기능

### 3-1. 게시물 작성 모달

- [ ] CreatePostModal 컴포넌트 (`components/post/CreatePostModal.tsx`)
  - [ ] Dialog 기반 모달 (shadcn/ui)
  - [ ] Sidebar "만들기" 버튼 클릭 시 열림
  - [ ] 이미지 업로드 영역 (드래그 앤 드롭 또는 파일 선택)
  - [ ] 이미지 미리보기 UI
  - [ ] 캡션 입력 필드 (최대 2200자)
  - [ ] 글자 수 카운터
  - [ ] "공유" 버튼 (비활성화 → 활성화)

### 3-2. 게시물 작성 - 이미지 업로드

- [ ] 게시물 API - POST (`app/api/posts/route.ts`)

  - [ ] 이미지 파일 검증 (최대 5MB, 이미지 타입만)
  - [ ] Supabase Storage에 이미지 업로드
  - [ ] 경로: `uploads/{clerk_user_id}/{filename}`
  - [ ] posts 테이블에 레코드 생성
  - [ ] Clerk 인증 확인

- [ ] 이미지 업로드 유틸리티 함수 (`lib/utils/upload.ts`)
  - [ ] 파일 크기 검증
  - [ ] 파일 타입 검증
  - [ ] Supabase Storage 업로드 로직
  - [ ] 에러 처리

### 3-3. 댓글 기능 - UI & 작성

- [ ] CommentList 컴포넌트 (`components/comment/CommentList.tsx`)

  - [ ] 댓글 목록 렌더링
  - [ ] 사용자명 Bold + 내용
  - [ ] 시간 표시
  - [ ] 삭제 버튼 (본인 댓글만 표시)

- [ ] CommentForm 컴포넌트 (`components/comment/CommentForm.tsx`)

  - [ ] "댓글 달기..." 입력창
  - [ ] Enter 키 또는 "게시" 버튼으로 제출
  - [ ] 로딩 상태 처리

- [ ] PostCard에 댓글 기능 통합

  - [ ] CommentForm 추가
  - [ ] 댓글 미리보기 (최신 2개) 표시
  - [ ] "댓글 N개 모두 보기" 클릭 시 상세 모달/페이지 이동

- [ ] 댓글 API - POST (`app/api/comments/route.ts`)
  - [ ] 댓글 작성
  - [ ] 내용 검증 (최대 1000자)
  - [ ] Clerk 인증 확인

### 3-4. 댓글 기능 - 삭제 & 무한스크롤

- [ ] 댓글 API - DELETE (`app/api/comments/[commentId]/route.ts`)

  - [ ] 댓글 삭제
  - [ ] 본인 댓글만 삭제 가능
  - [ ] Clerk 인증 확인

- [ ] 댓글 삭제 버튼 기능

  - [ ] CommentList에 삭제 버튼 추가
  - [ ] 삭제 확인 다이얼로그 (선택사항)

- [ ] PostFeed 무한 스크롤
  - [ ] Intersection Observer 사용
  - [ ] 하단 도달 시 다음 10개 로드
  - [ ] 로딩 상태 표시
  - [ ] 더 이상 데이터 없을 때 처리

## 4. 3단계: 프로필 페이지 & 팔로우 기능

### 4-1. 프로필 페이지 - 기본 정보

- [ ] 프로필 페이지 동적 라우트 (`app/(main)/profile/[userId]/page.tsx`)

  - [ ] 본인 프로필: `/profile` 또는 `/profile/[userId]` (본인 ID)
  - [ ] 다른 사람 프로필: `/profile/[userId]`
  - [ ] Clerk 인증 확인

- [ ] ProfileHeader 컴포넌트 (`components/profile/ProfileHeader.tsx`)

  - [ ] 프로필 이미지: 150px (Desktop) / 90px (Mobile) 원형
  - [ ] 사용자명 (Bold)
  - [ ] 통계: 게시물 수, 팔로워 수, 팔로잉 수
  - [ ] 본인 프로필: "프로필 편집" 버튼 (1차 제외, Clerk 설정 사용)
  - [ ] 다른 사람 프로필: "팔로우" 또는 "팔로잉" 버튼
  - [ ] Bio 표시 (fullname, bio)

- [ ] 사용자 API - GET (`app/api/users/[userId]/route.ts`)
  - [ ] 사용자 정보 조회
  - [ ] 게시물 수, 팔로워 수, 팔로잉 수 집계
  - [ ] 현재 사용자의 팔로우 여부 포함

### 4-2. 프로필 페이지 - 게시물 그리드

- [ ] PostGrid 컴포넌트 (`components/profile/PostGrid.tsx`)

  - [ ] 3열 그리드 레이아웃 (반응형)
  - [ ] 1:1 정사각형 썸네일
  - [ ] Hover 시 좋아요 수/댓글 수 오버레이 표시
  - [ ] 클릭 시 게시물 상세 모달/페이지 이동

- [ ] 게시물 API - GET에 userId 파라미터 추가
  - [ ] 특정 사용자의 게시물만 필터링
  - [ ] 프로필 페이지에서 사용

### 4-3. 팔로우 기능

- [ ] 팔로우 API - POST (`app/api/follows/route.ts`)

  - [ ] 팔로우 관계 생성
  - [ ] 자기 자신 팔로우 방지
  - [ ] 중복 팔로우 방지
  - [ ] Clerk 인증 확인

- [ ] 팔로우 API - DELETE (`app/api/follows/[userId]/route.ts`)

  - [ ] 팔로우 관계 삭제 (언팔로우)
  - [ ] 본인만 언팔로우 가능
  - [ ] Clerk 인증 확인

- [ ] 팔로우/언팔로우 버튼 기능 (ProfileHeader 내부)
  - [ ] 미팔로우: "팔로우" 버튼 (파란색, `--instagram-blue`)
  - [ ] 팔로우 중: "팔로잉" 버튼 (회색)
  - [ ] Hover 시 "언팔로우" 텍스트 (빨간 테두리)
  - [ ] 클릭 시 즉시 API 호출 → UI 업데이트
  - [ ] 팔로워 수 실시간 업데이트

### 4-4. 게시물 상세 모달 (Desktop)

- [ ] PostModal 컴포넌트 (`components/post/PostModal.tsx`)

  - [ ] Desktop: 모달 형태 (이미지 50% + 댓글 50%)
  - [ ] Mobile: 전체 페이지로 전환 (별도 라우트)
  - [ ] 이미지 영역
  - [ ] 댓글 목록 (스크롤 가능)
  - [ ] 좋아요/댓글 액션 버튼
  - [ ] 댓글 작성 폼
  - [ ] ✕ 닫기 버튼

- [ ] 게시물 상세 페이지 (`app/(main)/post/[postId]/page.tsx`)

  - [ ] Mobile 전용
  - [ ] PostModal과 동일한 레이아웃 (전체 페이지)

- [ ] 게시물 API - GET 단일 (`app/api/posts/[postId]/route.ts`)
  - [ ] 단일 게시물 상세 정보
  - [ ] 모든 댓글 포함
  - [ ] 사용자 정보 JOIN

## 5. 스타일링 & 반응형

- [ ] Instagram 컬러 스키마 완전 적용

  - [ ] 모든 컴포넌트에 일관된 컬러 사용
  - [ ] 버튼, 링크에 `--instagram-blue` 적용
  - [ ] 좋아요 하트에 `--like` (#ed4956) 적용

- [ ] 반응형 레이아웃 완성

  - [ ] Desktop (1024px+): Full Sidebar (244px) + Main Feed (최대 630px)
  - [ ] Tablet (768px~1023px): Icon-only Sidebar (72px) + Main Feed
  - [ ] Mobile (<768px): Header + Main Feed + BottomNav

- [ ] 애니메이션 효과

  - [ ] 좋아요 버튼 클릭 애니메이션 (scale)
  - [ ] 더블탭 좋아요 큰 하트 애니메이션 (fade in/out)
  - [ ] 모달 열기/닫기 애니메이션
  - [ ] 페이지 전환 애니메이션 (선택사항)

- [ ] 로딩 & 에러 상태
  - [ ] 모든 API 호출에 로딩 상태 처리
  - [ ] 에러 메시지 사용자 친화적으로 표시
  - [ ] 네트워크 에러 처리

## 6. 최종 마무리

- [ ] 모바일/태블릿 반응형 테스트

  - [ ] 모든 화면 크기에서 레이아웃 확인
  - [ ] 터치 인터랙션 테스트

- [ ] 성능 최적화

  - [ ] 이미지 최적화 (Next.js Image 컴포넌트 사용)
  - [ ] 코드 스플리팅 확인

- [ ] 접근성 (A11y)

  - [ ] 키보드 네비게이션
  - [ ] ARIA 레이블 추가

- [ ] 배포 준비
  - [ ] 환경 변수 확인
  - [ ] Vercel 배포 설정
  - [ ] 프로덕션 빌드 테스트
