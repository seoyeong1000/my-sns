/**
 * @file page.tsx
 * @description 홈 피드 페이지
 *
 * Instagram 스타일의 홈 피드 페이지입니다.
 * 게시물 목록을 표시하는 메인 페이지입니다.
 *
 * 주요 기능:
 * 1. PostFeed 컴포넌트 통합
 * 2. 레이아웃은 MainLayout에서 처리됨
 *
 * @dependencies
 * - components/post/PostFeed: 게시물 피드 컴포넌트
 */

import { PostFeed } from "@/components/post/PostFeed";

export default function HomePage() {
  return (
    <div className="w-full">
      <PostFeed />
    </div>
  );
}
