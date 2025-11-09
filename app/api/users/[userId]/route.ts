/**
 * @file route.ts
 * @description 사용자 정보 조회 API - GET 엔드포인트
 *
 * 특정 사용자의 프로필 정보를 조회하는 API입니다.
 *
 * GET 주요 기능:
 * 1. 사용자 기본 정보 조회 (users 테이블)
 * 2. 게시물 수 집계 (posts 테이블)
 * 3. 팔로워 수 집계 (follows 테이블)
 * 4. 팔로잉 수 집계 (follows 테이블)
 * 5. 현재 사용자의 팔로우 여부 확인
 * 6. Clerk에서 프로필 이미지 URL 가져오기
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 * - lib/supabase/service-role: 관리자 권한 클라이언트
 * - @clerk/nextjs/server: Clerk 인증 및 사용자 정보
 * - lib/types: UserWithStats 타입
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { UserWithStats } from "@/lib/types";

/**
 * 사용자 정보 조회
 * GET /api/users/[userId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.group("[API] GET /api/users/[userId] - 사용자 정보 조회 시작");

    const { userId } = await params;
    console.log("조회할 사용자 ID:", userId);

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();
    const serviceRoleClient = getServiceRoleClient();

    // 현재 사용자 정보 가져오기 (선택적 - 로그인하지 않은 경우도 가능)
    const { userId: clerkUserId } = await auth();
    let currentUserId: string | null = null;

    if (clerkUserId) {
      console.log("현재 사용자 Clerk ID:", clerkUserId);

      // Clerk ID로 Supabase users 테이블에서 사용자 ID 찾기
      const { data: currentUserData } = await serviceRoleClient
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUserData) {
        currentUserId = currentUserData.id;
        console.log("현재 사용자 Supabase ID:", currentUserId);
      }
    }

    // 사용자 기본 정보 조회
    console.log("사용자 기본 정보 조회 중...");
    const { data: userData, error: userError } = await serviceRoleClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("사용자 조회 에러:", userError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다.", details: userError?.message },
        { status: 404 }
      );
    }

    console.log("✅ 사용자 기본 정보 조회 완료:", {
      id: userData.id,
      name: userData.name,
      clerk_id: userData.clerk_id,
    });

    // 게시물 수 집계
    console.log("게시물 수 집계 중...");
    const { count: postsCount, error: postsCountError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (postsCountError) {
      console.error("게시물 수 집계 에러:", postsCountError);
    }

    const postsCountValue = postsCount || 0;
    console.log("게시물 수:", postsCountValue);

    // 팔로워 수 집계 (following_id = userId인 경우)
    console.log("팔로워 수 집계 중...");
    const { count: followersCount, error: followersCountError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (followersCountError) {
      console.error("팔로워 수 집계 에러:", followersCountError);
    }

    const followersCountValue = followersCount || 0;
    console.log("팔로워 수:", followersCountValue);

    // 팔로잉 수 집계 (follower_id = userId인 경우)
    console.log("팔로잉 수 집계 중...");
    const { count: followingCount, error: followingCountError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (followingCountError) {
      console.error("팔로잉 수 집계 에러:", followingCountError);
    }

    const followingCountValue = followingCount || 0;
    console.log("팔로잉 수:", followingCountValue);

    // 현재 사용자의 팔로우 여부 확인
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      console.log("팔로우 여부 확인 중...");
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .single();

      isFollowing = !!followData;
      console.log("팔로우 여부:", isFollowing);
    }

    // Clerk에서 프로필 이미지 URL 가져오기
    let profileImageUrl: string | null = null;
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userData.clerk_id);
      profileImageUrl = clerkUser.imageUrl || null;
      console.log("프로필 이미지 URL:", profileImageUrl ? "있음" : "없음");
    } catch (clerkError) {
      console.error("Clerk 사용자 정보 조회 에러:", clerkError);
      // 에러가 발생해도 계속 진행 (프로필 이미지는 선택사항)
    }

    // 본인 프로필 여부 확인
    const isOwnProfile = currentUserId === userId;
    console.log("본인 프로필 여부:", isOwnProfile);

    // 결과 데이터 구성
    const userWithStats: UserWithStats = {
      id: userData.id,
      clerk_id: userData.clerk_id,
      name: userData.name,
      fullname: userData.fullname || null,
      bio: userData.bio || null,
      created_at: userData.created_at,
      posts_count: postsCountValue,
      followers_count: followersCountValue,
      following_count: followingCountValue,
      profile_image_url: profileImageUrl,
    };

    console.log("사용자 정보 조회 완료:", {
      userId: userWithStats.id,
      name: userWithStats.name,
      posts_count: userWithStats.posts_count,
      followers_count: userWithStats.followers_count,
      following_count: userWithStats.following_count,
      isFollowing,
      isOwnProfile,
    });
    console.groupEnd();

    return NextResponse.json({
      user: userWithStats,
      isFollowing,
      isOwnProfile,
    });
  } catch (error) {
    console.error("[API] GET /api/users/[userId] 에러:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "알 수 없는 에러가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

