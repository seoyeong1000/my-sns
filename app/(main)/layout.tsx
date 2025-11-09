/**
 * @file layout.tsx
 * @description (main) Route Group 레이아웃
 *
 * 이 레이아웃은 Instagram 스타일의 반응형 레이아웃 구조를 제공합니다.
 *
 * 주요 기능:
 * 1. Desktop: Sidebar(244px) + Main Feed(최대 630px, 중앙 정렬)
 * 2. Tablet: Icon-only Sidebar(72px) + Main Feed
 * 3. Mobile: MobileHeader + Main Feed + BottomNav
 * 4. SyncUserProvider 통합 (사용자 동기화)
 *
 * @dependencies
 * - components/layout/Sidebar: 사이드바 컴포넌트
 * - components/layout/MobileHeader: 모바일 헤더
 * - components/layout/BottomNav: 하단 네비게이션
 * - components/providers/sync-user-provider: 사용자 동기화 프로바이더
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SyncUserProvider>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--instagram-background)" }}
      >
        {/* Sidebar (Desktop & Tablet) */}
        <Sidebar />

        {/* Mobile Header */}
        <MobileHeader />

        {/* Main Content Area */}
        <main
          className="
            pt-[60px] md:pt-0
            pb-[50px] md:pb-0
            min-h-screen
            flex justify-center
            md:ml-[72px] lg:ml-[244px]
          "
        >
          {/* Main Feed Container (최대 630px, 중앙 정렬) */}
          <div className="w-full max-w-[630px] px-4 md:px-0 py-4 md:py-8">
            {children}
          </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <BottomNav />
      </div>
    </SyncUserProvider>
  );
}

