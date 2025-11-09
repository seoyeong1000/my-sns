/**
 * @file route.ts
 * @description 좋아요 API - POST 엔드포인트
 *
 * 게시물에 좋아요를 추가하는 API입니다.
 *
 * 주요 기능:
 * 1. Clerk 인증 확인
 * 2. Clerk ID로 Supabase users 테이블에서 user_id 조회
 * 3. 게시물 좋아요 추가
 * 4. 중복 좋아요 방지 (UNIQUE 제약조건 활용)
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
 * 게시물 좋아요 추가
 * POST /api/likes
 * Body: { post_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/likes - 좋아요 추가 시작");

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

    // 요청 본문 파싱
    const body = await request.json();
    const { post_id } = body;

    if (!post_id || typeof post_id !== "string") {
      console.error("잘못된 요청: post_id가 없거나 유효하지 않음");
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 }
      );
    }

    console.log("좋아요할 게시물 ID:", post_id);

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

    // 게시물 존재 여부 확인
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .single();

    if (postError || !postData) {
      console.error("게시물 조회 에러:", postError);
      return NextResponse.json(
        { error: "Post not found", details: postError?.message },
        { status: 404 }
      );
    }

    // 좋아요 추가 (UNIQUE 제약조건으로 중복 방지)
    const { data: likeData, error: likeError } = await supabase
      .from("likes")
      .insert({
        post_id,
        user_id: userId,
      })
      .select()
      .single();

    if (likeError) {
      // 중복 좋아요인 경우 (UNIQUE 제약조건 위반)
      if (likeError.code === "23505") {
        console.log("이미 좋아요한 게시물");
        return NextResponse.json(
          { error: "Already liked", message: "이미 좋아요한 게시물입니다." },
          { status: 409 }
        );
      }

      console.error("좋아요 추가 에러:", likeError);
      return NextResponse.json(
        { error: "Failed to add like", details: likeError.message },
        { status: 500 }
      );
    }

    console.log("좋아요 추가 완료:", likeData);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      like: likeData,
    });
  } catch (error) {
    console.error("[API] POST /api/likes 에러:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

