-- Comments 테이블 생성
-- 게시물에 대한 댓글을 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT comments_content_length CHECK (LENGTH(content) <= 1000)
);

-- 테이블 소유자 설정
ALTER TABLE public.comments OWNER TO postgres;

-- Row Level Security (RLS) 비활성화
-- 개발 단계에서는 RLS를 끄고, 프로덕션에서는 활성화하는 것을 권장합니다
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.comments TO anon;
GRANT ALL ON TABLE public.comments TO authenticated;
GRANT ALL ON TABLE public.comments TO service_role;

-- 인덱스 생성
-- 게시물별 댓글 조회 최적화
CREATE INDEX idx_comments_post_id ON public.comments(post_id);

-- 사용자별 댓글 조회 최적화
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- 최신 댓글 정렬 최적화
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

