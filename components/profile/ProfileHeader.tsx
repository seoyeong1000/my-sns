/**
 * @file ProfileHeader.tsx
 * @description 프로필 헤더 컴포넌트
 *
 * Instagram 스타일의 프로필 헤더를 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 프로필 이미지: 150px (Desktop) / 90px (Mobile) 원형
 * 2. 사용자명 (Bold, 20px)
 * 3. 통계: 게시물 수, 팔로워 수, 팔로잉 수 (숫자 포맷팅)
 * 4. 본인 프로필: "프로필 편집" 버튼 (1차 제외, 미구현)
 * 5. 다른 사람 프로필: "팔로우" 또는 "팔로잉" 버튼 (4-3에서 구현 예정, UI만)
 * 6. Bio 표시: fullname (Bold) + bio (있을 경우)
 *
 * @dependencies
 * - components/ui/avatar: 프로필 이미지
 * - components/ui/button: 버튼
 * - lib/utils/format-number: 숫자 포맷팅
 * - lib/types: UserWithStats 타입
 * - next/image: 이미지 최적화
 */

"use client";

import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils/format-number";
import type { UserWithStats } from "@/lib/types";
import { User } from "lucide-react";

interface ProfileHeaderProps {
  user: UserWithStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export function ProfileHeader({
  user,
  isOwnProfile,
  isFollowing,
}: ProfileHeaderProps) {
  console.log("[ProfileHeader] 렌더링:", {
    userId: user.id,
    name: user.name,
    isOwnProfile,
    isFollowing,
    posts_count: user.posts_count,
    followers_count: user.followers_count,
    following_count: user.following_count,
  });

  // 프로필 이미지 URL (Clerk에서 가져온 이미지 또는 기본 아바타)
  const profileImageUrl = user.profile_image_url;

  // 팔로우/언팔로우 핸들러 (4-3에서 구현 예정, 현재는 빈 함수)
  const handleFollowClick = () => {
    console.log("[ProfileHeader] 팔로우 클릭 (4-3에서 구현 예정)");
    // TODO: 4-3에서 팔로우 API 호출 구현
  };

  const handleUnfollowClick = () => {
    console.log("[ProfileHeader] 언팔로우 클릭 (4-3에서 구현 예정)");
    // TODO: 4-3에서 언팔로우 API 호출 구현
  };

  return (
    <div className="w-full">
      {/* Desktop 레이아웃 */}
      <div className="hidden md:flex md:flex-row md:gap-8 md:items-start md:px-4 md:py-8">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          {profileImageUrl ? (
            <div className="relative w-[150px] h-[150px] rounded-full overflow-hidden border-2 border-gray-200">
              <Image
                src={profileImageUrl}
                alt={user.name}
                fill
                className="object-cover"
                sizes="150px"
              />
            </div>
          ) : (
            <Avatar className="w-[150px] h-[150px]">
              <AvatarFallback className="text-4xl bg-gray-200">
                <User className="w-16 h-16 text-gray-400" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* 사용자 정보 영역 */}
        <div className="flex-1 flex flex-col gap-4">
          {/* 사용자명 + 버튼 */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">{user.name}</h1>
            {isOwnProfile ? (
              <Button
                variant="outline"
                className="px-4 py-1.5 text-sm font-semibold"
                disabled
              >
                프로필 편집
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                className={`px-4 py-1.5 text-sm font-semibold ${
                  isFollowing
                    ? "hover:border-red-500 hover:text-red-500"
                    : "bg-[var(--instagram-blue)] text-white hover:bg-[var(--instagram-blue)]/90"
                }`}
                onClick={isFollowing ? handleUnfollowClick : handleFollowClick}
              >
                {isFollowing ? "팔로잉" : "팔로우"}
              </Button>
            )}
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{formatNumber(user.posts_count)}</span>
              <span className="text-gray-600">게시물</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{formatNumber(user.followers_count)}</span>
              <span className="text-gray-600">팔로워</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{formatNumber(user.following_count)}</span>
              <span className="text-gray-600">팔로잉</span>
            </div>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1">
            {user.fullname && (
              <p className="font-semibold text-base">{user.fullname}</p>
            )}
            {user.bio && (
              <p className="text-base whitespace-pre-line">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile 레이아웃 */}
      <div className="flex md:hidden flex-col gap-4 px-4 py-4">
        {/* 상단: 프로필 이미지 + 통계 */}
        <div className="flex items-start gap-4">
          {/* 프로필 이미지 */}
          <div className="flex-shrink-0">
            {profileImageUrl ? (
              <div className="relative w-[90px] h-[90px] rounded-full overflow-hidden border-2 border-gray-200">
                <Image
                  src={profileImageUrl}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="90px"
                />
              </div>
            ) : (
              <Avatar className="w-[90px] h-[90px]">
                <AvatarFallback className="text-2xl bg-gray-200">
                  <User className="w-10 h-10 text-gray-400" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* 통계 */}
          <div className="flex-1 flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold text-base">
                {formatNumber(user.posts_count)}
              </span>
              <span className="text-xs text-gray-600">게시물</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold text-base">
                {formatNumber(user.followers_count)}
              </span>
              <span className="text-xs text-gray-600">팔로워</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold text-base">
                {formatNumber(user.following_count)}
              </span>
              <span className="text-xs text-gray-600">팔로잉</span>
            </div>
          </div>
        </div>

        {/* 사용자명 + 버튼 */}
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold">{user.name}</h1>
          {isOwnProfile ? (
            <Button
              variant="outline"
              className="w-full py-1.5 text-sm font-semibold"
              disabled
            >
              프로필 편집
            </Button>
          ) : (
            <Button
              variant={isFollowing ? "outline" : "default"}
              className={`w-full py-1.5 text-sm font-semibold ${
                isFollowing
                  ? "hover:border-red-500 hover:text-red-500"
                  : "bg-[var(--instagram-blue)] text-white hover:bg-[var(--instagram-blue)]/90"
              }`}
              onClick={isFollowing ? handleUnfollowClick : handleFollowClick}
            >
              {isFollowing ? "팔로잉" : "팔로우"}
            </Button>
          )}
        </div>

        {/* Bio */}
        {(user.fullname || user.bio) && (
          <div className="flex flex-col gap-1">
            {user.fullname && (
              <p className="font-semibold text-sm">{user.fullname}</p>
            )}
            {user.bio && (
              <p className="text-sm whitespace-pre-line">{user.bio}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

