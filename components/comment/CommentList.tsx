/**
 * @file CommentList.tsx
 * @description 댓글 목록 컴포넌트
 *
 * 게시물의 댓글 목록을 표시하고 삭제 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 댓글 목록 렌더링
 * 2. 본인 댓글에만 삭제 버튼 표시
 * 3. 댓글 삭제 기능
 * 4. 삭제 후 부모 컴포넌트에 콜백 호출
 *
 * @dependencies
 * - @clerk/nextjs: useAuth 훅
 * - lucide-react: MoreHorizontal 아이콘
 */

"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Trash2 } from "lucide-react";

interface AnyComment {
  [key: string]: any;
}

interface CommentListProps {
  comments: AnyComment[];
  /** 댓글 삭제 성공 콜백 */
  onCommentDeleted?: (commentId: string) => void;
  /** 댓글 삭제 실패 콜백 */
  onError?: (error: string) => void;
}

// 이름 찾기: 여러 경우를 유연하게 처리
function getUsername(c: AnyComment): string {
  // 1) 가장 흔한 키들 먼저
  const direct =
    c.user_name ??      // 예: user_name: "서영 천"
    c.username ??
    c.name ??
    null;

  if (typeof direct === "string" && direct.trim() !== "") {
    return direct;
  }

  // 2) user 객체 안에서 찾기
  if (c.user && typeof c.user === "object") {
    const fromUser =
      c.user.username ??
      c.user.user_name ??
      c.user.name ??
      null;

    if (typeof fromUser === "string" && fromUser.trim() !== "") {
      return fromUser;
    }

    // user 객체 안의 문자열 중 name 관련 키
    for (const [k, v] of Object.entries(c.user)) {
      if (
        typeof v === "string" &&
        v.trim() &&
        k.toLowerCase().includes("name")
      ) {
        return v;
      }
    }
  }

  // 3) 최상위에서 user / name 이 포함된 문자열 키 찾기
  for (const [k, v] of Object.entries(c)) {
    if (
      typeof v === "string" &&
      v.trim() &&
      (k.toLowerCase().includes("user") ||
        k.toLowerCase().includes("name"))
    ) {
      return v;
    }
  }

  // 4) 그래도 없으면 기본값
  return "사용자";
}

// 댓글 내용 찾기
function getText(c: AnyComment): string | null {
  const direct =
    c.content ??
    c.text ??
    c.body ??
    c.comment ??
    c.message ??
    null;

  if (typeof direct === "string" && direct.trim() !== "") {
    return direct;
  }

  // content/text/body/message 같은 키를 가진 문자열 프로퍼티 찾기
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === "string") {
      const key = k.toLowerCase();
      if (
        !key.includes("user") &&
        !key.includes("name") &&
        (key.includes("content") ||
          key.includes("text") ||
          key.includes("comment") ||
          key.includes("body") ||
          key.includes("message"))
      ) {
        if (v.trim() !== "") return v;
      }
    }
  }

  // 마지막: 문자열 프로퍼티들 중에서 두 번째 걸 내용으로 사용
  const strings = Object.values(c).filter(
    (v) => typeof v === "string" && (v as string).trim() !== ""
  ) as string[];

  if (strings.length >= 2) return strings[1];
  if (strings.length === 1) return strings[0];

  return null;
}

// 시간 표시: 사람이 읽기 좋은 필드만 사용 (ISO created_at 은 안 씀)
function getTime(c: AnyComment): string | null {
  const candidate =
    c.timeAgo ??
    c.relative_created_at ??
    c.created_at_human ??
    c.created_at_relative ??
    null;

  if (!candidate || typeof candidate !== "string" || !candidate.trim()) {
    return null;
  }
  return candidate;
}

// 댓글 작성자의 Clerk ID 찾기
function getCommentClerkId(c: AnyComment): string | null {
  // user 객체 안에서 clerk_id 찾기
  if (c.user && typeof c.user === "object") {
    const clerkId = c.user.clerk_id ?? c.user.clerkId ?? null;
    if (typeof clerkId === "string" && clerkId.trim() !== "") {
      return clerkId;
    }
  }

  // 최상위에서 clerk_id 찾기
  const topLevel = c.clerk_id ?? c.clerkId ?? null;
  if (typeof topLevel === "string" && topLevel.trim() !== "") {
    return topLevel;
  }

  return null;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  onCommentDeleted,
  onError,
}) => {
  const { userId: currentClerkId } = useAuth();
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  // 댓글 삭제 핸들러
  const handleDelete = useCallback(
    async (commentId: string) => {
      if (deletingCommentId) {
        console.log("[CommentList] 이미 삭제 중 - 무시");
        return;
      }

      setDeletingCommentId(commentId);

      try {
        console.group(`[CommentList] 댓글 삭제 시작`);
        console.log("댓글 ID:", commentId);

        const response = await fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMsg =
            errorData.error || "댓글 삭제에 실패했습니다.";
          console.error("[CommentList] 댓글 삭제 실패:", errorData);
          onError?.(errorMsg);
          console.groupEnd();
          return;
        }

        console.log("✅ 댓글 삭제 완료");
        console.groupEnd();

        // 성공 콜백 호출
        onCommentDeleted?.(commentId);
      } catch (error) {
        console.error("[CommentList] 댓글 삭제 에러:", error);
        const errorMsg =
          error instanceof Error
            ? error.message
            : "댓글 삭제 중 오류가 발생했습니다.";
        onError?.(errorMsg);
      } finally {
        setDeletingCommentId(null);
      }
    },
    [deletingCommentId, onCommentDeleted, onError]
  );

  if (!comments || comments.length === 0) return null;

  return (
    <ul className="mt-2 space-y-2 text-[13px]">
      {comments.map((c, index) => {
        const text = getText(c);
        if (!text) return null;

        const username = getUsername(c);
        const time = getTime(c);
        const commentId = String(c.id ?? c.comment_id ?? index);
        const commentClerkId = getCommentClerkId(c);
        const isOwnComment =
          currentClerkId && commentClerkId && currentClerkId === commentClerkId;
        const isDeleting = deletingCommentId === commentId;

        return (
          <li key={commentId}>
            <div className="flex items-baseline gap-2 flex-wrap group">
              {/* 작성자 이름 */}
              <span className="font-semibold text-xs text-gray-900">
                {username}
              </span>

              {/* 댓글 내용 */}
              <span className="text-sm text-gray-800">{text}</span>

              {/* 시간 (있으면만 표시) */}
              {time && (
                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                  {time}
                </span>
              )}

              {/* 삭제 버튼 (본인 댓글만 표시) */}
              {isOwnComment && (
                <button
                  type="button"
                  onClick={() => handleDelete(commentId)}
                  disabled={isDeleting}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="댓글 삭제"
                  title="댓글 삭제"
                >
                  <Trash2
                    className="w-4 h-4 text-gray-400 hover:text-gray-600"
                    size={16}
                  />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default CommentList;
