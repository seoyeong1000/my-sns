/**
 * @file route.ts
 * @description 게시물 API - GET/POST 엔드포인트
 *
 * 게시물 목록 조회 및 게시물 생성 API입니다.
 *
 * GET 주요 기능:
 * 1. 페이지네이션 지원 (limit, offset)
 * 2. 시간 역순 정렬
 * 3. 사용자 정보 JOIN
 * 4. 좋아요 수, 댓글 수 집계
 * 5. 현재 사용자의 좋아요 여부 포함
 * 6. 댓글 미리보기 (최신 2개)
 *
 * POST 주요 기능:
 * 1. 이미지 파일 검증 (최대 5MB, 이미지 타입만)
 * 2. Supabase Storage에 이미지 업로드
 * 3. posts 테이블에 레코드 생성
 * 4. Clerk 인증 확인
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 * - lib/supabase/service-role: 관리자 권한 클라이언트 (사용자 조회용, Storage 업로드용)
 * - lib/utils/upload: 이미지 업로드 유틸리티
 * - @clerk/nextjs/server: Clerk 인증
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { validateImageFile, uploadImageToStorage } from "@/lib/utils/upload";
import type { PostWithDetails, Post } from "@/lib/types";

/**
 * 게시물 목록 조회
 * GET /api/posts?limit=10&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/posts - 게시물 목록 조회 시작");

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("페이지네이션:", { limit, offset });

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();
    const serviceRoleClient = getServiceRoleClient();

    // 현재 사용자 정보 가져오기 (선택적 - 로그인하지 않은 경우도 가능)
    const { userId: clerkUserId } = await auth();
    let currentUserId: string | null = null;

    if (clerkUserId) {
      console.log("현재 사용자 Clerk ID:", clerkUserId);

      // Clerk ID로 Supabase users 테이블에서 사용자 ID 찾기
      const { data: userData } = await serviceRoleClient
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (userData) {
        currentUserId = userData.id;
        console.log("현재 사용자 Supabase ID:", currentUserId);
      }
    }

    // 게시물 조회 (JOIN users, 집계 포함)
    console.log("게시물 조회 시작...");

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(
        `
        *,
        user:users!posts_user_id_fkey (
          id,
          clerk_id,
          name,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error("게시물 조회 에러:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      console.log("조회된 게시물 없음");
      return NextResponse.json({ posts: [], total: 0 });
    }

    console.log(`조회된 게시물 수: ${posts.length}`);

    // 각 게시물에 대한 집계 정보 가져오기
    const postIds = posts.map((post) => post.id);
    console.log("게시물 ID 목록:", postIds);

    // 좋아요 수 집계
    const { data: likesData, error: likesError } = await supabase
      .from("likes")
      .select("post_id")
      .in("post_id", postIds);

    if (likesError) {
      console.error("좋아요 집계 에러:", likesError);
    }

    // 댓글 수 집계
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds);

    if (commentsError) {
      console.error("댓글 집계 에러:", commentsError);
    }

    // 현재 사용자의 좋아요 여부 확인
    let userLikes: string[] = [];
    if (currentUserId) {
      const { data: userLikesData } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", postIds);

      if (userLikesData) {
        userLikes = userLikesData.map((like) => like.post_id);
      }
    }

    // 댓글 미리보기 가져오기 (각 게시물당 최신 2개)
    const commentsPreviewMap = new Map<string, any[]>();

    for (const postId of postIds) {
      const { data: commentsPreview } = await supabase
        .from("comments")
        .select(
          `
          *,
          user:users!comments_user_id_fkey (
            id,
            clerk_id,
            name,
            created_at
          )
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(2);

      if (commentsPreview) {
        commentsPreviewMap.set(postId, commentsPreview);
      }
    }

    // 집계 데이터를 맵으로 변환
    const likesCountMap = new Map<string, number>();
    const commentsCountMap = new Map<string, number>();

    if (likesData) {
      likesData.forEach((like) => {
        const count = likesCountMap.get(like.post_id) || 0;
        likesCountMap.set(like.post_id, count + 1);
      });
    }

    if (commentsData) {
      commentsData.forEach((comment) => {
        const count = commentsCountMap.get(comment.post_id) || 0;
        commentsCountMap.set(comment.post_id, count + 1);
      });
    }

    // 결과 데이터 구성
    const postsWithDetails: PostWithDetails[] = posts.map((post: any) => {
      const likesCount = likesCountMap.get(post.id) || 0;
      const commentsCount = commentsCountMap.get(post.id) || 0;
      const isLiked = currentUserId ? userLikes.includes(post.id) : false;
      const commentsPreview = commentsPreviewMap.get(post.id) || [];

      return {
        id: post.id,
        user_id: post.user_id,
        image_url: post.image_url,
        caption: post.caption,
        created_at: post.created_at,
        updated_at: post.updated_at,
        user: {
          id: post.user.id,
          clerk_id: post.user.clerk_id,
          name: post.user.name,
          created_at: post.user.created_at,
        },
        likes_count: likesCount,
        comments_count: commentsCount,
        is_liked: isLiked,
        comments_preview: commentsPreview.map((comment: any) => ({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user: {
            id: comment.user.id,
            clerk_id: comment.user.clerk_id,
            name: comment.user.name,
            created_at: comment.user.created_at,
          },
        })),
      };
    });

    console.log("게시물 목록 조회 완료:", {
      count: postsWithDetails.length,
      hasLikes: postsWithDetails.some((p) => p.likes_count > 0),
      hasComments: postsWithDetails.some((p) => p.comments_count > 0),
    });
    console.groupEnd();

    return NextResponse.json({
      posts: postsWithDetails,
      total: postsWithDetails.length,
    });
  } catch (error) {
    console.error("[API] GET /api/posts 에러:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 게시물 생성
 * POST /api/posts
 *
 * 요청 형식:
 * - Content-Type: multipart/form-data
 * - 필드:
 *   - image: File (이미지 파일, 필수)
 *   - caption: string (캡션, 최대 2200자, 선택사항)
 *
 * 응답 형식:
 * - 성공: { post: Post } (201 Created)
 * - 실패: { error: string, details?: string } (400/401/500)
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/posts - 게시물 생성 시작");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error("인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("현재 사용자 Clerk ID:", clerkUserId);

    // Supabase 클라이언트 생성
    const serviceRoleClient = getServiceRoleClient();
    const supabase = createClerkSupabaseClient();

    // Clerk ID로 Supabase users 테이블에서 사용자 ID 찾기
    console.log("사용자 정보 조회 중...");
    const { data: userData, error: userError } =
      await serviceRoleClient
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

    if (userError || !userData) {
      console.error("사용자 조회 에러:", userError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다.", details: userError?.message },
        { status: 404 }
      );
    }

    const userId = userData.id;
    console.log("사용자 Supabase ID:", userId);

    // FormData 파싱
    console.log("FormData 파싱 시작...");
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const caption = (formData.get("caption") as string) || null;

    console.log("이미지 파일:", imageFile ? imageFile.name : "없음");
    console.log("캡션:", caption ? `${caption.length}자` : "없음");

    // 이미지 파일 필수 확인
    if (!imageFile) {
      console.error("이미지 파일이 없습니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 캡션 길이 검증 (최대 2200자)
    if (caption && caption.length > 2200) {
      console.error("캡션 길이 초과:", caption.length);
      console.groupEnd();
      return NextResponse.json(
        { error: "캡션은 최대 2200자까지 가능합니다." },
        { status: 400 }
      );
    }

    // 이미지 파일 검증
    console.log("이미지 파일 검증 중...");
    const validationResult = validateImageFile(imageFile);
    if (!validationResult.valid) {
      console.error("이미지 파일 검증 실패:", validationResult.error);
      console.groupEnd();
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    console.log("✅ 이미지 파일 검증 완료");

    // Supabase Storage에 이미지 업로드
    console.log("이미지 업로드 시작...");
    const uploadResult = await uploadImageToStorage(
      serviceRoleClient,
      imageFile,
      clerkUserId,
    );

    console.log("✅ 이미지 업로드 완료");
    console.log("파일 경로:", uploadResult.filePath);
    console.log("Public URL:", uploadResult.publicUrl);

    // posts 테이블에 레코드 생성
    console.log("게시물 레코드 생성 중...");
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        image_url: uploadResult.publicUrl,
        caption: caption || null,
      })
      .select()
      .single();

    if (postError) {
      console.error("게시물 생성 에러:", postError);
      console.groupEnd();

      // 업로드된 이미지 삭제 시도 (에러 발생 시 무시)
      try {
        await serviceRoleClient.storage
          .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads")
          .remove([uploadResult.filePath]);
        console.log("업로드된 이미지 삭제 완료");
      } catch (deleteError) {
        console.error("이미지 삭제 실패 (무시):", deleteError);
      }

      return NextResponse.json(
        {
          error: "게시물 생성에 실패했습니다.",
          details: postError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ 게시물 생성 완료");
    console.log("게시물 ID:", postData.id);
    console.log("게시물 정보:", {
      user_id: postData.user_id,
      image_url: postData.image_url,
      caption_length: postData.caption?.length || 0,
    });
    console.groupEnd();

    return NextResponse.json(
      { post: postData as Post },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/posts 에러:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "알 수 없는 에러가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

