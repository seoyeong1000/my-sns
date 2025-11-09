/**
 * @file PostCardSkeleton.tsx
 * @description 게시물 카드 로딩 스켈레톤 컴포넌트
 *
 * 게시물 로딩 중 표시되는 스켈레톤 UI입니다.
 * PostCard와 동일한 레이아웃 구조를 가지며 Shimmer 효과를 적용합니다.
 *
 * @dependencies
 * - components/ui/skeleton: 기본 Skeleton 컴포넌트
 */

import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <article
      className="w-full mb-4 rounded-none"
      style={{
        backgroundColor: "var(--instagram-card-background)",
        border: "1px solid var(--instagram-border)",
      }}
    >
      {/* 헤더 스켈레톤 (60px) */}
      <header className="flex items-center justify-between px-4 h-[60px]">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="w-6 h-6 rounded" />
      </header>

      {/* 이미지 스켈레톤 (1:1 정사각형) */}
      <div className="relative w-full aspect-square">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* 액션 버튼 스켈레톤 (48px) */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-4">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* 컨텐츠 스켈레톤 */}
      <div className="px-4 pb-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-1 pt-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </article>
  );
}


