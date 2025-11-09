/**
 * @file upload.ts
 * @description 이미지 파일 업로드 유틸리티 함수
 *
 * 게시물 작성 시 이미지를 Supabase Storage에 업로드하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 이미지 파일 크기 검증 (최대 5MB)
 * 2. 이미지 파일 타입 검증 (jpeg, png, gif, webp)
 * 3. Supabase Storage에 이미지 업로드
 * 4. Public URL 생성 및 반환
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 허용되는 이미지 MIME 타입
 */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

/**
 * 최대 파일 크기 (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Storage 버킷 이름 (환경변수 또는 기본값)
 */
const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";

/**
 * 이미지 파일 검증 결과 타입
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 이미지 파일 업로드 결과 타입
 */
export interface ImageUploadResult {
  filePath: string;
  publicUrl: string;
}

/**
 * 이미지 파일 검증
 *
 * @param file - 검증할 파일 객체
 * @returns 검증 결과 (valid: true/false, error: 에러 메시지)
 *
 * @example
 * ```ts
 * const result = validateImageFile(file);
 * if (!result.valid) {
 *   console.error(result.error);
 *   return;
 * }
 * ```
 */
export function validateImageFile(
  file: File,
): ImageValidationResult {
  console.group("[Upload] 이미지 파일 검증 시작");
  console.log("파일명:", file.name);
  console.log("파일 크기:", file.size, "bytes");
  console.log("파일 타입:", file.type);

  // 파일 존재 확인
  if (!file) {
    console.error("파일이 없습니다.");
    console.groupEnd();
    return {
      valid: false,
      error: "파일을 선택해주세요.",
    };
  }

  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.error(
      `파일 크기 초과: ${fileSizeMB}MB (최대 ${maxSizeMB}MB)`,
    );
    console.groupEnd();
    return {
      valid: false,
      error: `파일 크기는 최대 ${maxSizeMB}MB까지 가능합니다. (현재: ${fileSizeMB}MB)`,
    };
  }

  // 파일 타입 검증
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    console.error("허용되지 않은 파일 타입:", file.type);
    console.groupEnd();
    return {
      valid: false,
      error: "이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WebP)",
    };
  }

  console.log("✅ 이미지 파일 검증 완료");
  console.groupEnd();
  return { valid: true };
}

/**
 * Supabase Storage에 이미지 업로드
 *
 * @param supabase - Supabase 클라이언트 (Service Role 권한 권장)
 * @param file - 업로드할 이미지 파일
 * @param clerkUserId - Clerk 사용자 ID (파일 경로에 사용)
 * @returns 업로드 결과 (filePath, publicUrl)
 *
 * @example
 * ```ts
 * const supabase = getServiceRoleClient();
 * const result = await uploadImageToStorage(supabase, file, clerkUserId);
 * console.log("Public URL:", result.publicUrl);
 * ```
 */
export async function uploadImageToStorage(
  supabase: SupabaseClient,
  file: File,
  clerkUserId: string,
): Promise<ImageUploadResult> {
  console.group("[Upload] 이미지 업로드 시작");
  console.log("Clerk User ID:", clerkUserId);
  console.log("파일명:", file.name);

  try {
    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    console.log("파일 확장자:", fileExt);

    // 고유한 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `${clerkUserId}/${fileName}`;

    console.log("생성된 파일 경로:", filePath);

    // Supabase Storage에 업로드
    console.log("Storage 업로드 시작...");
    const { data: uploadData, error: uploadError } =
      await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false, // 기존 파일 덮어쓰기 방지
      });

    if (uploadError) {
      console.error("Storage 업로드 에러:", uploadError);
      throw new Error(
        `이미지 업로드에 실패했습니다: ${uploadError.message}`,
      );
    }

    if (!uploadData) {
      throw new Error("업로드 데이터가 없습니다.");
    }

    console.log("✅ Storage 업로드 완료:", uploadData.path);

    // Public URL 생성
    console.log("Public URL 생성 중...");
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error("Public URL을 생성할 수 없습니다.");
    }

    console.log("✅ Public URL 생성 완료:", publicUrl);
    console.groupEnd();

    return {
      filePath,
      publicUrl,
    };
  } catch (error) {
    console.error("[Upload] 이미지 업로드 에러:", error);
    console.groupEnd();
    throw error;
  }
}

