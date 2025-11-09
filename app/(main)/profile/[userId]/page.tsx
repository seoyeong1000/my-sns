/**
 * @file page.tsx
 * @description 프로필 페이지
 *
 * 사용자 프로필을 표시하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 사용자 기본 정보 표시 (ProfileHeader)
 * 2. 게시물 그리드 표시 (4-2에서 구현 예정)
 * 3. 본인 프로필 / 다른 사람 프로필 구분
 *
 * @dependencies
 * - components/profile/ProfileHeader: 프로필 헤더 컴포넌트
 * - app/api/users/[userId]: 사용자 정보 조회 API
 * - @clerk/nextjs/server: Clerk 인증
 * - lib/supabase/service-role: Supabase 클라이언트
 */

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import type { UserWithStats } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

/**
 * 프로필 페이지
 * GET /profile/[userId]
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  try {
    console.group("[ProfilePage] 프로필 페이지 로드 시작");

    const { userId } = await params;
    console.log("조회할 사용자 ID:", userId);

    // userId가 UUID 형식인지 확인 (Supabase ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    let targetUserId = userId;
    const serviceRoleClient = getServiceRoleClient();

    // UUID가 아니면 Clerk ID로 간주하고 Supabase ID로 변환
    if (!isUUID) {
      console.log("Clerk ID로 감지됨, Supabase ID로 변환 중...");
      const { data: userData } = await serviceRoleClient
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();
      
      if (!userData) {
        console.error("사용자를 찾을 수 없음 (Clerk ID):", userId);
        console.groupEnd();
        return (
          <div className="w-full flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">사용자를 찾을 수 없습니다</h2>
              <p className="text-gray-600">요청하신 프로필이 존재하지 않습니다.</p>
            </div>
          </div>
        );
      }
      
      targetUserId = userData.id;
      console.log("Supabase ID로 변환 완료:", targetUserId);
    }

    // Clerk 인증 확인 (선택적 - 로그인하지 않아도 프로필 조회 가능)
    const { userId: clerkUserId } = await auth();
    let currentUserId: string | null = null;

    if (clerkUserId) {
      console.log("현재 사용자 Clerk ID:", clerkUserId);
      const { data: currentUserData } = await serviceRoleClient
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUserData) {
        currentUserId = currentUserData.id;
        console.log("현재 사용자 Supabase ID:", currentUserId);
      }
    } else {
      console.log("인증되지 않은 사용자 (프로필 조회는 가능)");
    }

    // 사용자 정보 조회 API 호출
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const apiUrl = `${baseUrl}/api/users/${targetUserId}`;

    console.log("API 호출 URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Server Component에서 fetch 사용 시 캐시 비활성화
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("사용자 정보 조회 실패:", errorData);
      console.groupEnd();

      if (response.status === 404) {
        return (
          <div className="w-full flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">사용자를 찾을 수 없습니다</h2>
              <p className="text-gray-600">요청하신 프로필이 존재하지 않습니다.</p>
            </div>
          </div>
        );
      }

      return (
        <div className="w-full flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-600">
              {errorData.error || "프로필을 불러오는 중 문제가 발생했습니다."}
            </p>
          </div>
        </div>
      );
    }

    const data = await response.json();
    const { user, isFollowing, isOwnProfile } = data as {
      user: UserWithStats;
      isFollowing: boolean;
      isOwnProfile: boolean;
    };

    console.log("사용자 정보 조회 완료:", {
      userId: user.id,
      name: user.name,
      isOwnProfile,
      isFollowing,
      posts_count: user.posts_count,
      followers_count: user.followers_count,
      following_count: user.following_count,
    });
    console.groupEnd();

    return (
      <div className="w-full">
        <ProfileHeader
          user={user}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
        />

        {/* 게시물 그리드는 4-2에서 구현 예정 */}
        <div className="mt-8 px-4">
          <p className="text-center text-gray-500 text-sm">
            게시물 그리드는 4-2에서 구현 예정입니다.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error("[ProfilePage] 에러:", error);
    console.groupEnd();

    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600">
            {error instanceof Error
              ? error.message
              : "프로필을 불러오는 중 문제가 발생했습니다."}
          </p>
        </div>
      </div>
    );
  }
}

