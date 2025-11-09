-- Posts 테이블 생성
-- 사용자가 작성한 게시물을 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT posts_caption_length CHECK (LENGTH(caption) <= 2200)
);

-- 테이블 소유자 설정
ALTER TABLE public.posts OWNER TO postgres;

-- Row Level Security (RLS) 비활성화
-- 개발 단계에서는 RLS를 끄고, 프로덕션에서는 활성화하는 것을 권장합니다
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.posts TO anon;
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.posts TO service_role;

-- 인덱스 생성
-- 사용자별 게시물 조회 최적화
CREATE INDEX idx_posts_user_id ON public.posts(user_id);

-- 시간 역순 정렬 최적화
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

