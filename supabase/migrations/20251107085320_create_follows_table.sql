-- Follows 테이블 생성
-- 사용자 간 팔로우 관계를 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT follows_unique_follower_following UNIQUE (follower_id, following_id),
    CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.follows OWNER TO postgres;

-- Row Level Security (RLS) 비활성화
-- 개발 단계에서는 RLS를 끄고, 프로덕션에서는 활성화하는 것을 권장합니다
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.follows TO anon;
GRANT ALL ON TABLE public.follows TO authenticated;
GRANT ALL ON TABLE public.follows TO service_role;

-- 인덱스 생성
-- 팔로워 목록 조회 최적화
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);

-- 팔로잉 목록 조회 최적화
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

