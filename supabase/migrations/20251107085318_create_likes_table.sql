-- Likes 테이블 생성
-- 게시물에 대한 좋아요 관계를 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT likes_unique_post_user UNIQUE (post_id, user_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.likes OWNER TO postgres;

-- Row Level Security (RLS) 비활성화
-- 개발 단계에서는 RLS를 끄고, 프로덕션에서는 활성화하는 것을 권장합니다
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.likes TO anon;
GRANT ALL ON TABLE public.likes TO authenticated;
GRANT ALL ON TABLE public.likes TO service_role;

-- 인덱스 생성
-- 게시물별 좋아요 조회 최적화
CREATE INDEX idx_likes_post_id ON public.likes(post_id);

-- 사용자별 좋아요 조회 최적화
CREATE INDEX idx_likes_user_id ON public.likes(user_id);

