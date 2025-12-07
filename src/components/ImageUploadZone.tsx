import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// ✅ URL 기반 이미지 헬퍼 (앞에서 만든 파일)
import {
  fetchImagesFromProductUrl,
  downloadImageAsFile,
} from "@/lib/urlImageApi";

interface ImageUploadZoneProps {
  label: string;
  description?: string;
  requirements?: string[];
  file: File | null;
  onFileChange: (file: File | null) => void;
  optional?: boolean;
  // person / top / bottom 구분용 (URL 입력은 top, bottom에서만 사용)
  role?: "person" | "top" | "bottom";
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  label,
  description,
  requirements,
  file,
  onFileChange,
  optional = false,
  role = "top",
}) => {
  const { t, language } = useLanguage();
  const [isDragActive, setIsDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔹 URL 기반 상태들
  const [url, setUrl] = useState("");
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleFile = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert(
        language === "ko"
          ? "파일 크기는 5MB 이하여야 합니다."
          : "File size must be under 5MB."
      );
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      alert(
        language === "ko"
          ? "이미지 파일만 업로드할 수 있습니다."
          : "Only image files are allowed."
      );
      return;
    }

    onFileChange(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
      setCandidateImages([]);
      setUrlError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
      setCandidateImages([]);
      setUrlError(null);
    }
  };

  const handleRemove = () => {
    onFileChange(null);
    setPreview(null);
    setCandidateImages([]);
    setUrlError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // ✅ 1) 상품 URL에서 이미지 후보 가져오기
  const handleFetchFromUrl = async () => {
    try {
      setUrlError(null);
      setCandidateImages([]);

      if (!url.trim()) {
        setUrlError(
          language === "ko"
            ? "상품 페이지 URL을 입력해주세요."
            : "Please enter a product page URL."
        );
        return;
      }

      setIsUrlLoading(true);

      const type: "top" | "bottom" = role === "bottom" ? "bottom" : "top";
      const images = await fetchImagesFromProductUrl(url.trim(), type);

      if (!images.length) {
        setUrlError(
          language === "ko"
            ? "사용 가능한 이미지 후보를 찾지 못했어요."
            : "No usable images were found for this URL."
        );
      }
      setCandidateImages(images);
    } catch (err: any) {
      console.error(err);
      setUrlError(
        err?.message ||
          (language === "ko"
            ? "이미지 후보를 가져오는 중 문제가 발생했습니다."
            : "An error occurred while fetching image candidates.")
      );
    } finally {
      setIsUrlLoading(false);
    }
  };

  // ✅ 2) 후보 썸네일 선택 → 실제 File 로 변환해서 handleFile 사용
  const handleSelectCandidate = async (imageUrl: string) => {
    try {
      setUrlError(null);
      const fileFromUrl = await downloadImageAsFile(
        imageUrl,
        role === "person" ? "person" : role === "bottom" ? "bottom" : "top"
      );
      handleFile(fileFromUrl);
    } catch (err) {
      console.error(err);
      setUrlError(
        language === "ko"
          ? "이미지를 불러오는 중 오류가 발생했습니다."
          : "Failed to load the selected image."
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-base font-bold text-foreground font-display">
          {label}
          {optional && (
            <span className="ml-2 text-xs font-medium text-primary bg-accent px-2 py-0.5 rounded-full">
              {t("upload.optional")}
            </span>
          )}
        </label>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden bg-card border border-border group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-contain bg-muted/30"
          />
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              {language === "ko" ? "삭제" : "Remove"}
            </Button>
          </div>
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm text-xs text-foreground font-medium border border-border">
            {file?.name}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "upload-zone cursor-pointer p-8 text-center",
            isDragActive && "active"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
              {isDragActive ? (
                <ImageIcon className="w-8 h-8 text-white" />
              ) : (
                <Upload className="w-8 h-8 text-white" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {t("upload.dropzone")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("upload.format")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 URL 입력 영역 (person 역할이 아닐 때만) */}
      {role !== "person" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                language === "ko"
                  ? "무신사 등 상품 페이지 URL 붙여넣기"
                  : "Paste product page URL (e.g. store product page)"
              }
              className="flex-1 border rounded-md px-3 py-2 text-sm bg-background"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleFetchFromUrl}
              disabled={isUrlLoading}
            >
              {isUrlLoading
                ? language === "ko"
                  ? "불러오는 중..."
                  : "Loading..."
                : language === "ko"
                ? "URL에서 불러오기"
                : "Load from URL"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === "ko"
              ? "URL에서는 이미지 파일을 서버에 저장하지 않고, 후보 이미지만 보여준 뒤 선택하면 파일로 전환해요."
              : "We don’t store images from the URL; we only show candidates and convert the one you pick into a file."}
          </p>

          {urlError && (
            <p className="text-xs text-red-500 mt-1">
              {urlError}
            </p>
          )}

          {candidateImages.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">
                {language === "ko"
                  ? "사용할 옷 이미지를 선택해주세요."
                  : "Select the clothing image you want to use."}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {candidateImages.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => handleSelectCandidate(img)}
                    className="border rounded-md overflow-hidden hover:ring-2 hover:ring-primary/60"
                  >
                    <img
                      src={img}
                      alt="candidate"
                      className="w-full h-24 object-cover bg-muted"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {requirements && requirements.length > 0 && (
        <div className="p-4 rounded-2xl bg-accent/50 border border-border">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                {t("upload.requirements")}
              </p>
              <div className="space-y-0.5">
                {requirements.map((req, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {req}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
