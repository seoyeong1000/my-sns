/**
 * @file route.ts
 * @description 댓글 API - POST 엔드포인트
 *
 * 게시물에 댓글을 작성하는 API입니다.
 *
 * 주요 기능:
 * 1. Clerk 인증 확인
 * 2. Clerk ID로 Supabase users 테이블에서 user_id 조회
 * 3. 댓글 내용 검증 (최대 1000자)
 * 4. 게시물 댓글 추가
 * 5. 생성된 댓글 정보 반환 (사용자 정보 포함)
 * 6. 에러 처리 및 로깅
 *
 * @dependencies
 * - lib/supabase/server: Clerk 인증 클라이언트
 * - lib/supabase/service-role: 관리자 권한 클라이언트 (사용자 조회용)
 * - @clerk/nextjs/server: Clerk 인증
 * - lib/types: Comment, CommentWithUser 타입
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { CommentWithUser } from "@/lib/types";

/**
 * 댓글 작성
 * POST /api/comments
 *
 * 요청 본문:
 * {
 *   "post_id": "uuid",
 *   "content": "string (최대 1000자)"
 * }
 *
 * 응답 형식:
 * - 성공: { comment: CommentWithUser } (201 Created)
 * - 실패: { error: string, details?: string } (400/401/404/500)
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/comments - 댓글 작성 시작");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      console.error("인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("현재 사용자 Clerk ID:", clerkUserId);

    // 요청 본문 파싱
    const body = await request.json();
    const { post_id, content } = body;

    console.log("요청 데이터:", {
      post_id: post_id || "없음",
      content_length: content ? content.length : 0,
    });

    // post_id 검증
    if (!post_id || typeof post_id !== "string") {
      console.error("잘못된 요청: post_id가 없거나 유효하지 않음");
      console.groupEnd();
      return NextResponse.json(
        { error: "post_id가 필요합니다." },
        { status: 400 }
      );
    }

    // content 검증
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      console.error("잘못된 요청: content가 없거나 비어있음");
      console.groupEnd();
      return NextResponse.json(
        { error: "댓글 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // content 길이 검증 (최대 1000자)
    if (content.length > 1000) {
      console.error("댓글 길이 초과:", content.length);
      console.groupEnd();
      return NextResponse.json(
        { error: "댓글은 최대 1000자까지 가능합니다." },
        { status: 400 }
      );
    }

    console.log("✅ 요청 데이터 검증 완료");

    // Supabase 클라이언트 생성
    const serviceRoleClient = getServiceRoleClient();
    const supabase = createClerkSupabaseClient();

    // Clerk ID로 Supabase users 테이블에서 user_id 조회
    console.log("사용자 정보 조회 중...");
    const { data: userData, error: userError } = await serviceRoleClient
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 에러:", userError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다.", details: userError?.message },
        { status: 404 }
      );
    }

    const userId = userData.id;
    console.log("현재 사용자 Supabase ID:", userId);

    // 게시물 존재 여부 확인
    console.log("게시물 존재 여부 확인 중...");
    const { data: postData, error: postError } = await serviceRoleClient
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .single();

    if (postError || !postData) {
      console.error("게시물 조회 에러:", postError);
      console.groupEnd();
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다.", details: postError?.message },
        { status: 404 }
      );
    }

    console.log("✅ 게시물 확인 완료");

    // 댓글 추가
    console.log("댓글 생성 중...");
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id,
        user_id: userId,
        content: content.trim(),
      })
      .select()
      .single();

    if (commentError) {
      console.error("댓글 생성 에러:", commentError);
      console.groupEnd();
      return NextResponse.json(
        { error: "댓글 작성에 실패했습니다.", details: commentError.message },
        { status: 500 }
      );
    }

    console.log("✅ 댓글 생성 완료");
    console.log("댓글 ID:", commentData.id);

    // 생성된 댓글에 사용자 정보 JOIN
    console.log("댓글 작성자 정보 조회 중...");
    const { data: commentWithUser, error: joinError } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:users!comments_user_id_fkey (
          id,
          clerk_id,
          name,
          created_at
        )
      `
      )
      .eq("id", commentData.id)
      .single();

    if (joinError || !commentWithUser) {
      console.error("댓글 조회 에러:", joinError);
      // 댓글은 생성되었지만 사용자 정보 조회 실패
      // 댓글 데이터만 반환
      console.log("⚠️ 사용자 정보 조회 실패, 댓글 데이터만 반환");
      console.groupEnd();
      return NextResponse.json(
        {
          comment: {
            ...commentData,
            user: null, // 사용자 정보 없음
          },
        },
        { status: 201 }
      );
    }

    // CommentWithUser 형식으로 변환
    const result: CommentWithUser = {
      id: commentWithUser.id,
      post_id: commentWithUser.post_id,
      user_id: commentWithUser.user_id,
      content: commentWithUser.content,
      created_at: commentWithUser.created_at,
      updated_at: commentWithUser.updated_at,
      user: {
        id: commentWithUser.user.id,
        clerk_id: commentWithUser.user.clerk_id,
        name: commentWithUser.user.name,
        created_at: commentWithUser.user.created_at,
      },
    };

    console.log("✅ 댓글 작성 완료");
    console.log("댓글 정보:", {
      id: result.id,
      post_id: result.post_id,
      user_name: result.user.name,
      content_length: result.content.length,
    });
    console.groupEnd();

    return NextResponse.json(
      { comment: result },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/comments 에러:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "알 수 없는 에러가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}


