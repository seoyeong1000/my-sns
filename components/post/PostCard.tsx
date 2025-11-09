/**
 * @file PostCard.tsx
 * @description 게시물 카드 컴포넌트
 *
 * Instagram 스타일의 게시물 카드를 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 헤더: 프로필 이미지 + 사용자명 + 시간 + 메뉴
 * 2. 이미지: 1:1 정사각형 비율
 * 3. 액션 버튼: 좋아요, 댓글, 공유, 북마크
 * 4. 컨텐츠: 좋아요 수 + 캡션 + 댓글 미리보기
 *
 * @dependencies
 * - components/ui/avatar: 프로필 이미지
 * - lib/utils/format-time: 상대 시간 포맷팅
 * - lib/utils/format-number: 숫자 포맷팅
 * - lib/types: PostWithDetails 타입
 * - lucide-react: 아이콘
 * - next/image: 이미지 최적화
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { formatNumber } from "@/lib/utils/format-number";
import type { PostWithDetails, CommentWithUser } from "@/lib/types";
import { useState, useCallback } from "react";
import { CommentForm } from "@/components/comment/CommentForm";
import CommentList from "@/components/comment/CommentList";


interface PostCardProps {
  post: PostWithDetails;
}

export function PostCard({ post }: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [commentsPreview, setCommentsPreview] = useState<CommentWithUser[]>(
    post.comments_preview || [],
  );

  // 캡션이 2줄을 초과하는지 확인 (대략적으로 100자 기준)
  const shouldTruncate = post.caption && post.caption.length > 100;
  const displayCaption =
    shouldTruncate && !showFullCaption
      ? post.caption.substring(0, 100) + "..."
      : post.caption;

  // 사용자명 첫 글자로 아바타 폴백 생성
  const avatarFallback = post.user.name.charAt(0).toUpperCase();

  // 좋아요 버튼 클릭 핸들러
  const handleLikeClick = useCallback(async () => {
    // 이미 로딩 중이면 무시
    if (isLoading) {
      return;
    }

    // Optimistic UI 업데이트: API 호출 전에 UI 먼저 업데이트
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    setIsAnimating(true);
    setIsLoading(true);

    // 애니메이션 효과 (0.15초 후 scale 원복)
    setTimeout(() => {
      setIsAnimating(false);
    }, 150);

    try {
      console.group(`[PostCard] 좋아요 ${!isLiked ? "추가" : "제거"} 시작`);
      console.log("게시물 ID:", post.id);
      console.log("현재 좋아요 상태:", isLiked);

      if (!isLiked) {
        // 좋아요 추가
        const response = await fetch("/api/likes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ post_id: post.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("좋아요 추가 실패:", errorData);

          // 이미 좋아요한 경우 (409)는 상태 유지
          if (response.status === 409) {
            console.log("이미 좋아요한 게시물 - 상태 유지");
            return;
          }

          // 다른 에러는 롤백
          throw new Error(errorData.error || "좋아요 추가에 실패했습니다.");
        }

        console.log("좋아요 추가 완료");
      } else {
        // 좋아요 제거
        const response = await fetch(`/api/likes/${post.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("좋아요 제거 실패:", errorData);
          throw new Error(errorData.error || "좋아요 제거에 실패했습니다.");
        }

        console.log("좋아요 제거 완료");
      }

      console.groupEnd();
    } catch (error) {
      console.error("[PostCard] 좋아요 처리 에러:", error);

      // 에러 발생 시 이전 상태로 롤백
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);

      // 사용자에게 에러 알림 (선택사항 - 필요시 toast 등으로 표시 가능)
      // alert(error instanceof Error ? error.message : "좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [isLiked, likesCount, isLoading, post.id]);

  // 더블탭 좋아요 핸들러 (수동 감지)
  const handleImageClick = useCallback(() => {
    // 이미 좋아요 상태면 무시
    if (isLiked || isLoading) {
      return;
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - lastTapTime;

    // 더블탭 감지 (300ms 이내)
    if (timeDiff < 300 && timeDiff > 0) {
      console.group("[PostCard] 더블탭 좋아요 감지");
      console.log("게시물 ID:", post.id);

      // 큰 하트 애니메이션 표시
      setShowDoubleTapHeart(true);

      // 1초 후 하트 사라짐
      setTimeout(() => {
        setShowDoubleTapHeart(false);
      }, 1000);

      // 좋아요 추가 (handleLikeClick과 동일한 로직)
      const previousIsLiked = isLiked;
      const previousLikesCount = likesCount;

      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      setIsLoading(true);

      fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: post.id }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            console.error("더블탭 좋아요 추가 실패:", errorData);

            // 이미 좋아요한 경우는 상태 유지
            if (response.status === 409) {
              console.log("이미 좋아요한 게시물 - 상태 유지");
              return;
            }

            // 다른 에러는 롤백
            setIsLiked(previousIsLiked);
            setLikesCount(previousLikesCount);
            throw new Error(errorData.error || "좋아요 추가에 실패했습니다.");
          }

          console.log("더블탭 좋아요 추가 완료");
          console.groupEnd();
        })
        .catch((error) => {
          console.error("[PostCard] 더블탭 좋아요 처리 에러:", error);
          setIsLiked(previousIsLiked);
          setLikesCount(previousLikesCount);
        })
        .finally(() => {
          setIsLoading(false);
        });

      // 더블탭 감지 후 시간 초기화
      setLastTapTime(0);
    } else {
      // 첫 탭 시간 기록
      setLastTapTime(currentTime);
    }
  }, [isLiked, isLoading, lastTapTime, post.id, likesCount]);

  // 댓글 작성 성공 핸들러
  const handleCommentAdded = useCallback(
    (newComment: CommentWithUser) => {
      console.group("[PostCard] 댓글 작성 성공 - UI 업데이트");
      console.log("새 댓글:", {
        id: newComment.id,
        user_name: newComment.user.name,
        content_length: newComment.content.length,
      });

      // 댓글 수 증가 (optimistic update)
      setCommentsCount((prev) => prev + 1);
      console.log("댓글 수 업데이트:", commentsCount + 1);

      // 댓글 미리보기 업데이트 (최신 2개만 유지)
      setCommentsPreview((prev) => {
        const updated = [newComment, ...prev];
        // 최신 2개만 유지
        return updated.slice(0, 2);
      });
      console.log("댓글 미리보기 업데이트 완료");
      console.groupEnd();
    },
    [commentsCount],
  );

  // 댓글 작성 실패 핸들러
  const handleCommentError = useCallback((error: string) => {
    console.error("[PostCard] 댓글 작성 실패:", error);
    // 에러는 CommentForm에서 표시하므로 여기서는 로깅만
  }, []);

  // 댓글 삭제 성공 핸들러
  const handleCommentDeleted = useCallback(
    (commentId: string) => {
      console.group("[PostCard] 댓글 삭제 성공 - UI 업데이트");
      console.log("삭제된 댓글 ID:", commentId);

      // 댓글 수 감소 (optimistic update)
      setCommentsCount((prev) => Math.max(0, prev - 1));
      console.log("댓글 수 업데이트:", commentsCount - 1);

      // 댓글 미리보기에서 삭제된 댓글 제거
      setCommentsPreview((prev) => {
        const updated = prev.filter((comment) => comment.id !== commentId);
        console.log("댓글 미리보기 업데이트:", {
          이전: prev.length,
          이후: updated.length,
        });
        return updated;
      });
      console.log("✅ 댓글 삭제 UI 업데이트 완료");
      console.groupEnd();
    },
    [commentsCount]
  );

  return (
    <article
      className="w-full mb-4 rounded-none"
      style={{
        backgroundColor: "var(--instagram-card-background)",
        border: "1px solid var(--instagram-border)",
      }}
    >
      {/* 헤더 (60px) */}
      <header className="flex items-center justify-between px-4 h-[60px]">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.id}`}>
            <Avatar className="w-8 h-8">
              <AvatarImage src="" alt={post.user.name} />
              <AvatarFallback className="text-xs">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold text-sm hover:opacity-50 transition-opacity"
              style={{ color: "var(--instagram-text-primary)" }}
            >
              {post.user.name}
            </Link>
            <span
              className="text-xs"
              style={{ color: "var(--instagram-text-secondary)" }}
            >
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="p-1 hover:opacity-50 transition-opacity"
          aria-label="더보기 메뉴"
        >
          <MoreHorizontal
            size={24}
            style={{ color: "var(--instagram-text-primary)" }}
          />
        </button>
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div
        className="relative w-full aspect-square bg-gray-100"
        onClick={handleImageClick}
      >
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover select-none"
          sizes="(max-width: 768px) 100vw, 630px"
          priority={false}
          draggable={false}
        />
        {/* 더블탭 큰 하트 애니메이션 */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              size={80}
              fill="var(--instagram-like)"
              stroke="var(--instagram-like)"
              className="animate-fade-in-out"
              style={{
                filter: "drop-shadow(0 0 20px rgba(237, 73, 86, 0.5))",
              }}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 (48px) */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={isLoading}
            className="hover:opacity-50 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLiked ? "좋아요 취소" : "좋아요"}
          >
            <Heart
              size={24}
              fill={isLiked ? "var(--instagram-like)" : "none"}
              stroke={
                isLiked
                  ? "var(--instagram-like)"
                  : "var(--instagram-text-primary)"
              }
              className={`transition-transform duration-150 ${
                isAnimating ? "scale-[1.3]" : "scale-100"
              }`}
            />
          </button>
          <button
            type="button"
            className="hover:opacity-50 transition-opacity"
            aria-label="댓글"
          >
            <MessageCircle
              size={24}
              style={{ color: "var(--instagram-text-primary)" }}
            />
          </button>
          <button
            type="button"
            className="hover:opacity-50 transition-opacity"
            aria-label="공유"
          >
            <Send
              size={24}
              style={{ color: "var(--instagram-text-primary)" }}
            />
          </button>
        </div>
        <button
          type="button"
          className="hover:opacity-50 transition-opacity"
          aria-label="북마크"
        >
          <Bookmark
            size={24}
            style={{ color: "var(--instagram-text-primary)" }}
          />
        </button>
      </div>

      {/* 컨텐츠 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 */}
        {likesCount > 0 && (
          <p
            className="font-semibold text-sm"
            style={{ color: "var(--instagram-text-primary)" }}
          >
            좋아요 {formatNumber(likesCount)}개
          </p>
        )}

        {/* 캡션 */}
        {post.caption && (
          <div
            className="text-sm"
            style={{ color: "var(--instagram-text-primary)" }}
          >
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold hover:opacity-50 transition-opacity mr-1"
            >
              {post.user.name}
            </Link>
            <span>{displayCaption}</span>
            {shouldTruncate && !showFullCaption && (
              <button
                type="button"
                onClick={() => setShowFullCaption(true)}
                className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: "var(--instagram-text-secondary)" }}
              >
                더 보기
              </button>
            )}
          </div>
        )}

        {/* 댓글 미리보기 */}
        {commentsCount > 0 && (
          <div className="space-y-1 mt-2">
            {commentsCount > 2 && (
              <Link
                href={`/post/${post.id}`}
                className="text-sm opacity-50 hover:opacity-100 transition-opacity block mb-2"
                style={{ color: "var(--instagram-text-secondary)" }}
              >
                댓글 {commentsCount}개 모두 보기
              </Link>
            )}
            {commentsPreview && commentsPreview.length > 0 && (
              <CommentList
                comments={commentsPreview}
                onCommentDeleted={handleCommentDeleted}
                onError={handleCommentError}
              />
            )}
          </div>
        )}

        {/* 댓글 작성 폼 */}
        <CommentForm
          postId={post.id}
          onCommentAdded={handleCommentAdded}
          onError={handleCommentError}
        />
      </div>
    </article>
  );
}
