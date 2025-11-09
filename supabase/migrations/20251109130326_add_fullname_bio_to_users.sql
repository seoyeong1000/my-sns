-- Users 테이블에 fullname, bio 필드 추가
-- 프로필 페이지에서 사용할 사용자 정보 확장

-- fullname 필드 추가 (Clerk의 fullName과 동기화)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS fullname TEXT;

-- bio 필드 추가 (프로필 소개글, 나중에 프로필 편집 기능에서 업데이트)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 기존 데이터는 NULL로 유지 (기본값)

