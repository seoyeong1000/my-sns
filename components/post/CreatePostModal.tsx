/**
 * @file CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 작성 모달을 제공합니다.
 *
 * 주요 기능:
 * 1. 이미지 업로드 (드래그 앤 드롭 또는 파일 선택)
 * 2. 이미지 미리보기
 * 3. 캡션 입력 (최대 2200자)
 * 4. 글자 수 카운터
 * 5. 공유 버튼 (이미지 선택 시 활성화)
 *
 * @dependencies
 * - components/ui/dialog: shadcn/ui Dialog 컴포넌트
 * - lucide-react: 아이콘
 * - react: useState, useCallback, useRef
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface CreatePostModalProps {
  /** 모달 열림/닫힘 상태 */
  open: boolean;
  /** 모달 닫기 핸들러 */
  onOpenChange: (open: boolean) => void;
}

const MAX_CAPTION_LENGTH = 2200;

export function CreatePostModal({
  open,
  onOpenChange,
}: CreatePostModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 미리보기 URL 생성 및 정리
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // 모달 닫을 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (file: File) => {
      console.group("📸 [CreatePostModal] 이미지 파일 선택");
      console.log("파일명:", file.name);
      console.log("파일 크기:", (file.size / 1024 / 1024).toFixed(2), "MB");
      console.log("파일 타입:", file.type);

      // 이미지 파일인지 확인
      if (!file.type.startsWith("image/")) {
        console.error("❌ 이미지 파일이 아닙니다.");
        alert("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      setSelectedFile(file);
      console.log("✅ 이미지 파일 선택 완료");
      console.groupEnd();
    },
    []
  );

  // 파일 입력 변경 핸들러
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 드래그 오버 핸들러
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // 드래그 리브 핸들러
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // 드롭 핸들러
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 이미지 제거 핸들러
  const handleRemoveImage = useCallback(() => {
    console.log("🗑️ [CreatePostModal] 이미지 제거");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // 캡션 변경 핸들러
  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_CAPTION_LENGTH) {
        setCaption(value);
      }
    },
    []
  );

  // 공유 버튼 클릭 핸들러
  const handleShare = useCallback(async () => {
    if (!selectedFile) {
      console.error("❌ [CreatePostModal] 이미지 파일이 없습니다.");
      return;
    }

    try {
      console.group("📤 [CreatePostModal] 게시물 공유 시작");
      console.log("선택된 파일:", selectedFile.name);
      console.log("파일 크기:", (selectedFile.size / 1024 / 1024).toFixed(2), "MB");
      console.log("캡션:", caption || "(없음)");
      console.log("캡션 길이:", caption.length);

      setIsUploading(true);

      // FormData 생성
      const formData = new FormData();
      formData.append("image", selectedFile);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      console.log("API 호출 시작: POST /api/posts");

      // API 호출
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      console.log("API 응답 상태:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API 에러:", errorData);
        throw new Error(errorData.error || "게시물 업로드에 실패했습니다.");
      }

      const data = await response.json();
      console.log("✅ 게시물 생성 완료:", data.post.id);
      console.groupEnd();

      // 성공 시 모달 닫기 및 페이지 새로고침
      onOpenChange(false);

      // 페이지 새로고침하여 새 게시물 표시
      window.location.reload();
    } catch (error) {
      console.error("❌ [CreatePostModal] 게시물 업로드 에러:", error);
      console.groupEnd();

      // 에러 메시지 표시
      const errorMessage =
        error instanceof Error
          ? error.message
          : "게시물 업로드에 실패했습니다. 다시 시도해주세요.";
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, caption, onOpenChange]);

  // 공유 버튼 활성화 여부
  const isShareEnabled = selectedFile !== null && !isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0"
        style={{
          backgroundColor: "var(--instagram-card-background)",
        }}
      >
        <DialogHeader className="px-4 py-3 border-b border-[var(--instagram-border)]">
          <DialogTitle
            className="text-base font-semibold text-center"
            style={{ color: "var(--instagram-text-primary)" }}
          >
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* 이미지 업로드 영역 */}
          {!previewUrl ? (
            <div
              className={`
                relative flex flex-col items-center justify-center
                min-h-[400px] p-8
                border-2 border-dashed rounded-lg
                transition-colors duration-200
                cursor-pointer
                ${
                  isDragging
                    ? "border-[var(--instagram-blue)] bg-blue-50"
                    : "border-[var(--instagram-border)] hover:border-[var(--instagram-blue)] hover:bg-gray-50"
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <Upload
                className="w-12 h-12 mb-4"
                style={{ color: "var(--instagram-text-secondary)" }}
              />
              <p
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--instagram-text-primary)" }}
              >
                사진과 동영상을 여기에 끌어다 놓으세요
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded text-sm font-semibold"
                style={{
                  backgroundColor: "var(--instagram-blue)",
                  color: "#ffffff",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                컴퓨터에서 선택
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* 이미지 미리보기 */}
              <div className="relative w-full aspect-square bg-black">
                <Image
                  src={previewUrl}
                  alt="미리보기"
                  fill
                  className="object-contain"
                />
              </div>

              {/* 이미지 제거 버튼 */}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                aria-label="이미지 제거"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* 캡션 입력 영역 */}
          <div className="p-4 border-t border-[var(--instagram-border)]">
            <div className="flex flex-col gap-2">
              <textarea
                value={caption}
                onChange={handleCaptionChange}
                placeholder="문구 입력..."
                className="w-full min-h-[100px] p-2 border-none resize-none focus:outline-none"
                style={{
                  backgroundColor: "var(--instagram-card-background)",
                  color: "var(--instagram-text-primary)",
                }}
                maxLength={MAX_CAPTION_LENGTH}
              />

              {/* 글자 수 카운터 */}
              <div className="flex justify-end">
                <span
                  className="text-xs"
                  style={{
                    color:
                      caption.length >= MAX_CAPTION_LENGTH
                        ? "var(--instagram-like)"
                        : "var(--instagram-text-secondary)",
                  }}
                >
                  {caption.length}/{MAX_CAPTION_LENGTH}
                </span>
              </div>
            </div>

            {/* 공유 버튼 */}
            <button
              type="button"
              onClick={handleShare}
              disabled={!isShareEnabled}
              className={`
                w-full mt-4 py-2 rounded text-sm font-semibold
                transition-all duration-200
                ${
                  isShareEnabled
                    ? "opacity-100 cursor-pointer hover:opacity-90"
                    : "opacity-50 cursor-not-allowed"
                }
              `}
              style={{
                backgroundColor: isShareEnabled
                  ? "var(--instagram-blue)"
                  : "var(--instagram-border)",
                color: isShareEnabled ? "#ffffff" : "var(--instagram-text-secondary)",
              }}
            >
              {isUploading ? "공유 중..." : "공유"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

