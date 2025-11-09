"use client";

/**
 * @file MobileHeader.tsx
 * @description 모바일 전용 헤더 컴포넌트
 *
 * 이 컴포넌트는 Mobile 화면(< 768px)에서만 표시되는 상단 헤더를 제공합니다.
 *
 * 주요 기능:
 * 1. 높이 60px
 * 2. 로고(좌측) + 아이콘들(우측) 레이아웃
 * 3. 알림, DM, 프로필 아이콘 (UI만, 기능은 2차에서 제외)
 * 4. 상단 고정 위치
 *
 * @dependencies
 * - @clerk/nextjs: useAuth
 * - lucide-react: 아이콘
 * - next/navigation: Link
 */

import { useAuth } from "@clerk/nextjs";
import { Heart, MessageCircle, User } from "lucide-react";
import Link from "next/link";

export function MobileHeader() {
  const { userId } = useAuth();

  const profilePath = userId ? `/profile/${userId}` : "/profile";

  return (
    <header className="block md:hidden fixed top-0 left-0 right-0 h-[60px] bg-[var(--instagram-card-background)] border-b border-[var(--instagram-border)] z-50">
      <div className="h-full flex items-center justify-between px-4">
        {/* 로고 */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold" style={{ color: "var(--instagram-text-primary)" }}>
            Instagram
          </h1>
        </div>

        {/* 우측 아이콘들 */}
        <div className="flex items-center gap-4">
          {/* 알림 (UI만) */}
          <button
            onClick={() => {
              console.log("알림 클릭 - 기능은 2차에서 구현 예정");
            }}
            className="p-2"
            aria-label="알림"
          >
            <Heart className="w-6 h-6" style={{ color: "var(--instagram-text-primary)" }} />
          </button>

          {/* DM (UI만) */}
          <button
            onClick={() => {
              console.log("DM 클릭 - 기능은 2차에서 구현 예정");
            }}
            className="p-2"
            aria-label="메시지"
          >
            <MessageCircle className="w-6 h-6" style={{ color: "var(--instagram-text-primary)" }} />
          </button>

          {/* 프로필 */}
          <Link href={profilePath} className="p-2" aria-label="프로필">
            <User className="w-6 h-6" style={{ color: "var(--instagram-text-primary)" }} />
          </Link>
        </div>
      </div>
    </header>
  );
}

