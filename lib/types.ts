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
  /** 전체 이름 (Clerk의 fullName과 동기화) */
  fullname?: string | null;
  /** 프로필 소개글 */
  bio?: string | null;
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

/**
 * 사용자 정보가 포함된 댓글 타입
 * Comment + User 정보
 */
export interface CommentWithUser extends Comment {
  /** 댓글 작성자 정보 */
  user: User;
}

/**
 * 상세 정보가 포함된 게시물 타입
 * Post + User 정보 + 집계 정보
 */
export interface PostWithDetails extends Post {
  /** 게시물 작성자 정보 */
  user: User;
  /** 좋아요 수 */
  likes_count: number;
  /** 댓글 수 */
  comments_count: number;
  /** 현재 사용자가 좋아요를 눌렀는지 여부 */
  is_liked: boolean;
  /** 댓글 미리보기 (최신 2개) */
  comments_preview?: CommentWithUser[];
}

/**
 * 통계 정보가 포함된 사용자 타입
 * User + 통계 정보 (게시물 수, 팔로워 수, 팔로잉 수)
 */
export interface UserWithStats extends User {
  /** 게시물 수 */
  posts_count: number;
  /** 팔로워 수 */
  followers_count: number;
  /** 팔로잉 수 */
  following_count: number;
  /** 프로필 이미지 URL (Clerk에서 가져옴) */
  profile_image_url?: string | null;
}

