/**
 * @file PostFeed.tsx
 * @description 게시물 피드 컴포넌트
 *
 * 게시물 목록을 표시하는 메인 피드 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 게시물 목록 렌더링
 * 2. 무한 스크롤 (Intersection Observer 사용)
 * 3. 로딩 상태 처리 (PostCardSkeleton 표시)
 * 4. 에러 상태 처리 (에러 메시지 표시)
 * 5. 빈 상태 처리 (게시물이 없을 때)
 *
 * @dependencies
 * - components/post/PostCard: 게시물 카드 컴포넌트
 * - components/post/PostCardSkeleton: 로딩 스켈레톤
 * - app/api/posts: 게시물 API
 */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import type { PostWithDetails } from "@/lib/types";

const POSTS_PER_PAGE = 10;

export function PostFeed() {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 게시물 로드 함수
  const fetchPosts = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setLoading(true);
          setError(null);
          setHasLoaded(false);
        }

        console.group(`[PostFeed] 게시물 목록 로드 ${append ? "(추가)" : "(초기)"}`);
        console.log("API 호출: GET /api/posts", {
          limit: POSTS_PER_PAGE,
          offset: currentOffset,
        });

        const response = await fetch(
          `/api/posts?limit=${POSTS_PER_PAGE}&offset=${currentOffset}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "게시물을 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        const postsArray = Array.isArray(data.posts) ? data.posts : [];
        const total = data.total || 0;

        console.log("게시물 로드 완료:", {
          count: postsArray.length,
          total,
          currentOffset,
        });

        // 게시물 추가 또는 교체
        if (append) {
          setPosts((prev) => [...prev, ...postsArray]);
        } else {
          setPosts(postsArray);
        }

        // 더 불러올 데이터가 있는지 확인
        const newOffset = currentOffset + postsArray.length;
        // total이 있으면 total과 비교, 없으면 로드된 게시물 수가 POSTS_PER_PAGE와 같으면 더 있을 가능성이 있음
        const hasMoreData =
          total > 0
            ? newOffset < total && postsArray.length === POSTS_PER_PAGE
            : postsArray.length === POSTS_PER_PAGE;
        setHasMore(hasMoreData);
        setOffset(newOffset);

        console.log("다음 상태:", {
          hasMore: hasMoreData,
          nextOffset: newOffset,
        });

        if (!append) {
          setHasLoaded(true);
        }
        console.groupEnd();
      } catch (err) {
        console.error("[PostFeed] 게시물 로드 에러:", err);
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        if (!append) {
          setHasLoaded(true);
        }
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // 초기 로드
  useEffect(() => {
    fetchPosts(0, false);
  }, [fetchPosts]);

  // Intersection Observer 설정 (무한 스크롤)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !loading &&
          hasLoaded
        ) {
          console.log("[PostFeed] 하단 도달 - 다음 게시물 로드");
          fetchPosts(offset, true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, loading, hasLoaded, offset, fetchPosts]);

  // 로딩 상태 - hasLoaded가 false일 때만 스켈레톤 표시
  if (loading || !hasLoaded) {
    return (
      <div className="w-full space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div
        className="w-full p-8 text-center rounded"
        style={{
          backgroundColor: "var(--instagram-card-background)",
          border: "1px solid var(--instagram-border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--instagram-text-primary)" }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm rounded hover:opacity-50 transition-opacity"
          style={{
            backgroundColor: "var(--instagram-blue)",
            color: "white",
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 빈 상태 - hasLoaded가 true이고 posts가 비어있을 때만 표시
  if (hasLoaded && posts.length === 0) {
    return (
      <div
        className="w-full p-8 text-center rounded"
        style={{
          backgroundColor: "var(--instagram-card-background)",
          border: "1px solid var(--instagram-border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--instagram-text-secondary)" }}>
          아직 게시물이 없습니다.
        </p>
      </div>
    );
  }

  // 게시물 목록
  return (
    <div className="w-full space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* 무한 스크롤 감지 영역 및 로딩/종료 메시지 */}
      <div ref={observerTarget} className="w-full">
        {isLoadingMore && (
          <div className="w-full space-y-4 mt-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <PostCardSkeleton key={`loading-${index}`} />
            ))}
          </div>
        )}

        {!hasMore && hasLoaded && posts.length > 0 && (
          <div
            className="w-full p-8 text-center rounded mt-4"
            style={{
              backgroundColor: "var(--instagram-card-background)",
              border: "1px solid var(--instagram-border)",
            }}
          >
            <p
              className="text-sm"
              style={{ color: "var(--instagram-text-secondary)" }}
            >
              더 이상 게시물이 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

