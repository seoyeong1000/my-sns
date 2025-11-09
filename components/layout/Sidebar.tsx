"use client";

/**
 * @file Sidebar.tsx
 * @description Instagram 스타일 사이드바 컴포넌트
 *
 * 이 컴포넌트는 Desktop과 Tablet에서 표시되는 사이드바를 제공합니다.
 *
 * 주요 기능:
 * 1. Desktop (1024px+): 244px 너비, 아이콘 + 텍스트 메뉴
 * 2. Tablet (768px~1023px): 72px 너비, 아이콘만 표시
 * 3. Mobile (<768px): 숨김 처리
 * 4. Active 상태: 현재 경로와 일치 시 볼드 스타일
 * 5. Hover 효과: 배경색 변경
 *
 * @dependencies
 * - next/navigation: usePathname
 * - @clerk/nextjs: useAuth
 * - lucide-react: 아이콘
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Home, Search, Plus, User } from "lucide-react";
import Link from "next/link";
import { CreatePostModal } from "@/components/post/CreatePostModal";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string | null; // null이면 클릭 이벤트만 처리
  onClick?: () => void;
}

export function Sidebar() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  // 프로필 경로 생성 (현재는 Clerk ID 사용, 나중에 Supabase users 테이블과 연동)
  const profilePath = userId ? `/profile/${userId}` : "/profile";

  const menuItems: MenuItem[] = [
    {
      icon: Home,
      label: "홈",
      href: "/",
    },
    {
      icon: Search,
      label: "검색",
      href: "/search",
    },
    {
      icon: Plus,
      label: "만들기",
      href: null,
      onClick: () => {
        console.log("➕ [Sidebar] 만들기 버튼 클릭 - 모달 열기");
        setIsCreatePostModalOpen(true);
      },
    },
    {
      icon: User,
      label: "프로필",
      href: profilePath,
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
    <aside className="hidden md:block fixed left-0 top-0 h-screen bg-[var(--instagram-card-background)] border-r border-[var(--instagram-border)] z-40">
      {/* Desktop: 244px, Tablet: 72px */}
      <div className="w-[244px] lg:w-[244px] md:w-[72px] h-full flex flex-col pt-8 px-3">
        {/* 로고 영역 (Desktop만 표시) */}
        <div className="hidden lg:block mb-8 px-3">
          <h1 className="text-2xl font-bold" style={{ color: "var(--instagram-text-primary)" }}>
            Instagram
          </h1>
        </div>

        {/* 메뉴 항목 */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (item.href === null) {
              // 클릭 이벤트만 있는 항목 (만들기)
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`
                    flex items-center gap-4 px-3 py-3 rounded-lg
                    transition-colors duration-200
                    ${active ? "font-bold" : "font-normal"}
                    hover:bg-gray-100
                  `}
                  style={{
                    color: "var(--instagram-text-primary)",
                  }}
                  title={item.label}
                >
                  <Icon className="w-6 h-6" />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  flex items-center gap-4 px-3 py-3 rounded-lg
                  transition-colors duration-200
                  ${active ? "font-bold" : "font-normal"}
                  hover:bg-gray-100
                `}
                style={{
                  color: "var(--instagram-text-primary)",
                }}
                title={item.label}
              >
                <Icon className="w-6 h-6" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreatePostModalOpen}
        onOpenChange={setIsCreatePostModalOpen}
      />
    </aside>
  );
}

