/**
 * @file route.ts
 * @description 좋아요 API - DELETE 엔드포인트
 *
 * 게시물의 좋아요를 제거하는 API입니다.
 *
 * 주요 기능:
 * 1. Clerk 인증 확인
 * 2. Clerk ID로 Supabase users 테이블에서 user_id 조회
 * 3. 게시물 좋아요 제거
 * 4. 본인 좋아요만 삭제 가능 (user_id 검증)
 * 5. 에러 처리 및 로깅
 *
 * @dependencies
 * - lib/supabase/service-role: 관리자 권한 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 게시물 좋아요 제거
 * DELETE /api/likes/[postId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    console.group("[API] DELETE /api/likes/[postId] - 좋아요 제거 시작");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      console.error("인증되지 않은 사용자");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("현재 사용자 Clerk ID:", clerkUserId);

    // URL 파라미터에서 postId 가져오기
    const { postId } = await params;

    if (!postId || typeof postId !== "string") {
      console.error("잘못된 요청: postId가 없거나 유효하지 않음");
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    console.log("좋아요 제거할 게시물 ID:", postId);

    // Supabase Service Role 클라이언트 생성
    const supabase = getServiceRoleClient();

    // Clerk ID로 Supabase users 테이블에서 user_id 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 에러:", userError);
      return NextResponse.json(
        { error: "User not found", details: userError?.message },
        { status: 404 }
      );
    }

    const userId = userData.id;
    console.log("현재 사용자 Supabase ID:", userId);

    // 좋아요 존재 여부 및 본인 소유 확인
    const { data: likeData, error: likeCheckError } = await supabase
      .from("likes")
      .select("id, user_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (likeCheckError || !likeData) {
      console.error("좋아요 조회 에러:", likeCheckError);
      return NextResponse.json(
        { error: "Like not found", details: "좋아요를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 좋아요인지 확인 (추가 검증)
    if (likeData.user_id !== userId) {
      console.error("권한 없음: 본인 좋아요가 아님");
      return NextResponse.json(
        { error: "Forbidden", details: "본인의 좋아요만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 좋아요 제거
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("id", likeData.id);

    if (deleteError) {
      console.error("좋아요 제거 에러:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove like", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("좋아요 제거 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "좋아요가 제거되었습니다.",
    });
  } catch (error) {
    console.error("[API] DELETE /api/likes/[postId] 에러:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

