/**
 * @file route.ts
 * @description 댓글 API - DELETE 엔드포인트
 *
 * 댓글을 삭제하는 API입니다.
 *
 * 주요 기능:
 * 1. Clerk 인증 확인
 * 2. Clerk ID로 Supabase users 테이블에서 user_id 조회
 * 3. 댓글 존재 여부 확인
 * 4. 본인 댓글만 삭제 가능 (댓글의 user_id와 현재 사용자 비교)
 * 5. 댓글 삭제 실행
 * 6. 에러 처리 및 로깅
 *
 * @dependencies
 * - lib/supabase/server: Clerk 인증 클라이언트
 * - lib/supabase/service-role: 관리자 권한 클라이언트 (사용자 조회용)
 * - @clerk/nextjs/server: Clerk 인증
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 댓글 삭제
 * DELETE /api/comments/[commentId]
 *
 * 응답 형식:
 * - 성공: { success: true, message: "댓글이 삭제되었습니다." } (200 OK)
 * - 실패: { error: string, details?: string } (400/401/403/404/500)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    console.group("[API] DELETE /api/comments/[commentId] - 댓글 삭제 시작");

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

    // URL 파라미터에서 commentId 가져오기
    const { commentId } = await params;

    if (!commentId || typeof commentId !== "string") {
      console.error("잘못된 요청: commentId가 없거나 유효하지 않음");
      console.groupEnd();
      return NextResponse.json(
        { error: "댓글 ID가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("삭제할 댓글 ID:", commentId);

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

    // 댓글 존재 여부 및 작성자 확인
    console.log("댓글 조회 중...");
    const { data: commentData, error: commentError } = await serviceRoleClient
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (commentError || !commentData) {
      console.error("댓글 조회 에러:", commentError);
      console.groupEnd();
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다.", details: commentError?.message },
        { status: 404 }
      );
    }

    console.log("✅ 댓글 확인 완료");
    console.log("댓글 작성자 ID:", commentData.user_id);
    console.log("현재 사용자 ID:", userId);

    // 본인 댓글인지 확인
    if (commentData.user_id !== userId) {
      console.error("권한 없음: 본인 댓글이 아님");
      console.groupEnd();
      return NextResponse.json(
        { error: "본인의 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    console.log("✅ 본인 댓글 확인 완료");

    // 댓글 삭제
    console.log("댓글 삭제 중...");
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("댓글 삭제 에러:", deleteError);
      console.groupEnd();
      return NextResponse.json(
        { error: "댓글 삭제에 실패했습니다.", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("✅ 댓글 삭제 완료");
    console.log("삭제된 댓글 ID:", commentId);
    console.groupEnd();

    return NextResponse.json(
      { success: true, message: "댓글이 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] DELETE /api/comments/[commentId] 에러:", error);
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

