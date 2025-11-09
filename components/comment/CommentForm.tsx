/**
 * @file CommentForm.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * Instagram 스타일의 댓글 작성 입력 폼입니다.
 *
 * 주요 기능:
 * 1. 댓글 입력 (최대 1000자)
 * 2. Enter 키 또는 "게시" 버튼으로 제출
 * 3. 로딩 상태 처리
 * 4. 댓글 작성 성공 후 입력창 초기화
 * 5. 에러 처리
 *
 * @dependencies
 * - components/ui/input: 입력 필드
 * - components/ui/button: 제출 버튼
 * - lib/types: CommentWithUser 타입
 */

"use client";

import { useState, useCallback, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CommentWithUser } from "@/lib/types";

interface CommentFormProps {
  /** 게시물 ID */
  postId: string;
  /** 댓글 작성 성공 콜백 */
  onCommentAdded?: (comment: CommentWithUser) => void;
  /** 댓글 작성 실패 콜백 */
  onError?: (error: string) => void;
}

const MAX_COMMENT_LENGTH = 1000;

export function CommentForm({ postId, onCommentAdded, onError }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 입력 내용 변경 핸들러
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 최대 길이 제한
    if (value.length <= MAX_COMMENT_LENGTH) {
      setContent(value);
      setError(null); // 에러 초기화
    }
  }, []);

  // 댓글 제출 핸들러
  const handleSubmit = useCallback(
    async (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();

      // 빈 댓글 체크
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        console.log("[CommentForm] 빈 댓글 - 제출 무시");
        return;
      }

      // 길이 체크
      if (trimmedContent.length > MAX_COMMENT_LENGTH) {
        const errorMsg = `댓글은 최대 ${MAX_COMMENT_LENGTH}자까지 가능합니다.`;
        setError(errorMsg);
        console.error("[CommentForm] 댓글 길이 초과:", trimmedContent.length);
        onError?.(errorMsg);
        return;
      }

      // 이미 로딩 중이면 무시
      if (isLoading) {
        console.log("[CommentForm] 이미 제출 중 - 무시");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.group(`[CommentForm] 댓글 작성 시작`);
        console.log("게시물 ID:", postId);
        console.log("댓글 내용:", trimmedContent);
        console.log("댓글 길이:", trimmedContent.length);

        const response = await fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            post_id: postId,
            content: trimmedContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMsg = errorData.error || "댓글 작성에 실패했습니다.";
          console.error("[CommentForm] 댓글 작성 실패:", errorData);
          setError(errorMsg);
          onError?.(errorMsg);
          console.groupEnd();
          return;
        }

        const data = await response.json();
        const newComment = data.comment as CommentWithUser;

        console.log("✅ 댓글 작성 완료");
        console.log("생성된 댓글:", {
          id: newComment.id,
          user_name: newComment.user.name,
          content_length: newComment.content.length,
        });
        console.groupEnd();

        // 입력창 초기화
        setContent("");

        // 성공 콜백 호출
        onCommentAdded?.(newComment);
      } catch (error) {
        console.error("[CommentForm] 댓글 작성 에러:", error);
        const errorMsg = error instanceof Error ? error.message : "댓글 작성 중 오류가 발생했습니다.";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [content, postId, isLoading, onCommentAdded, onError]
  );

  // Enter 키 핸들러 (Shift+Enter는 줄바꿈 허용하지 않음, 단순 Enter만 제출)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // 입력 가능 여부 (빈 내용이 아니고, 로딩 중이 아니어야 함)
  const canSubmit = content.trim().length > 0 && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: "var(--instagram-border)" }}>
      <Input
        type="text"
        placeholder="댓글 달기..."
        value={content}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        maxLength={MAX_COMMENT_LENGTH}
        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 h-auto text-sm"
        style={{
          backgroundColor: "transparent",
          color: "var(--instagram-text-primary)",
        }}
        aria-label="댓글 입력"
      />
      <Button
        type="submit"
        disabled={!canSubmit}
        variant="ghost"
        size="sm"
        className="px-2 py-0 h-auto text-sm font-semibold disabled:opacity-30"
        style={{
          color: canSubmit ? "var(--instagram-blue)" : "var(--instagram-text-secondary)",
        }}
        aria-label="댓글 게시"
      >
        {isLoading ? "게시 중..." : "게시"}
      </Button>
      {error && (
        <div className="absolute bottom-full left-4 right-4 mb-2 text-xs text-red-500">
          {error}
        </div>
      )}
    </form>
  );
}


