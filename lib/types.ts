/**
 * @file types.ts
 * @description 데이터베이스 스키마 기반 TypeScript 타입 정의
 *
 * 이 파일은 Supabase 데이터베이스의 테이블 구조를 기반으로 TypeScript 타입을 정의합니다.
 * 모든 타입은 데이터베이스 컬럼과 일치하도록 작성되었습니다.
 *
 * 주요 타입:
 * - User: 사용자 정보 (users 테이블)
 * - Post: 게시물 정보 (posts 테이블)
 * - Like: 좋아요 정보 (likes 테이블)
 * - Comment: 댓글 정보 (comments 테이블)
 * - Follow: 팔로우 관계 정보 (follows 테이블)
 *
 * @dependencies
 * - Supabase 데이터베이스 스키마
 */

/**
 * 사용자 정보 타입
 * users 테이블 구조를 기반으로 정의
 */
export interface User {
  /** 사용자 고유 ID (UUID) */
  id: string;
  /** Clerk 사용자 ID */
  clerk_id: string;
  /** 사용자 이름 */
  name: string;
  /** 생성 일시 */
  created_at: Date | string;
}

/**
 * 게시물 정보 타입
 * posts 테이블 구조를 기반으로 정의
 */
export interface Post {
  /** 게시물 고유 ID (UUID) */
  id: string;
  /** 작성자 사용자 ID (UUID) */
  user_id: string;
  /** 이미지 URL (Supabase Storage URL) */
  image_url: string;
  /** 게시물 캡션 (최대 2200자) */
  caption: string | null;
  /** 생성 일시 */
  created_at: Date | string;
  /** 수정 일시 */
  updated_at: Date | string;
}

/**
 * 좋아요 정보 타입
 * likes 테이블 구조를 기반으로 정의
 */
export interface Like {
  /** 좋아요 고유 ID (UUID) */
  id: string;
  /** 게시물 ID (UUID) */
  post_id: string;
  /** 좋아요한 사용자 ID (UUID) */
  user_id: string;
  /** 생성 일시 */
  created_at: Date | string;
}

/**
 * 댓글 정보 타입
 * comments 테이블 구조를 기반으로 정의
 */
export interface Comment {
  /** 댓글 고유 ID (UUID) */
  id: string;
  /** 게시물 ID (UUID) */
  post_id: string;
  /** 작성자 사용자 ID (UUID) */
  user_id: string;
  /** 댓글 내용 (최대 1000자) */
  content: string;
  /** 생성 일시 */
  created_at: Date | string;
  /** 수정 일시 */
  updated_at: Date | string;
}

/**
 * 팔로우 관계 정보 타입
 * follows 테이블 구조를 기반으로 정의
 */
export interface Follow {
  /** 팔로우 관계 고유 ID (UUID) */
  id: string;
  /** 팔로워 사용자 ID (UUID) */
  follower_id: string;
  /** 팔로잉 대상 사용자 ID (UUID) */
  following_id: string;
  /** 생성 일시 */
  created_at: Date | string;
}

