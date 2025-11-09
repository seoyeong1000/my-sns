"use client";

/**
 * @file BottomNav.tsx
 * @description 모바일 전용 하단 네비게이션 컴포넌트
 *
 * 이 컴포넌트는 Mobile 화면(< 768px)에서만 표시되는 하단 네비게이션을 제공합니다.
 *
 * 주요 기능:
 * 1. 높이 50px
 * 2. 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 * 3. Active 상태: 현재 경로와 일치 시 아이콘 색상 변경
 * 4. 하단 고정 위치
 *
 * @dependencies
 * - next/navigation: usePathname
 * - @clerk/nextjs: useAuth
 * - lucide-react: 아이콘
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import Link from "next/link";
import { CreatePostModal } from "@/components/post/CreatePostModal";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  href: string | null; // null이면 클릭 이벤트만 처리
  onClick?: () => void;
  label: string;
}

export function BottomNav() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const profilePath = userId ? `/profile/${userId}` : "/profile";

  const navItems: NavItem[] = [
    {
      icon: Home,
      href: "/",
      label: "홈",
    },
    {
      icon: Search,
      href: "/search",
      label: "검색",
    },
    {
      icon: Plus,
      href: null,
      onClick: () => {
        console.log("➕ [BottomNav] 만들기 버튼 클릭 - 모달 열기");
        setIsCreatePostModalOpen(true);
      },
      label: "만들기",
    },
    {
      icon: Heart,
      href: null, // 좋아요는 UI만 (기능은 2차에서 제외)
      onClick: () => {
        console.log("좋아요 클릭 - 기능은 2차에서 구현 예정");
      },
      label: "좋아요",
    },
    {
      icon: User,
      href: profilePath,
      label: "프로필",
    },
  ];

  const isActive = (href: string | null) => {
    if (!href) return false;
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="block md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-[var(--instagram-card-background)] border-t border-[var(--instagram-border)] z-50">
      <div className="h-full flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.href === null) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex items-center justify-center p-2"
                aria-label={item.label}
              >
                <Icon
                  className="w-6 h-6"
                  style={{
                    color: active
                      ? "var(--instagram-text-primary)"
                      : "var(--instagram-text-secondary)",
                  }}
                />
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-center p-2"
              aria-label={item.label}
            >
              <Icon
                className="w-6 h-6"
                style={{
                  color: active
                    ? "var(--instagram-text-primary)"
                    : "var(--instagram-text-secondary)",
                }}
              />
            </Link>
          );
        })}
      </div>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreatePostModalOpen}
        onOpenChange={setIsCreatePostModalOpen}
      />
    </nav>
  );
}

