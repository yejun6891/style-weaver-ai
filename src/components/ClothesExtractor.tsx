import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Scissors, Loader2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ClothesExtractorProps {
  garmentType: "top" | "bottom";
  onExtracted: (file: File) => void;
}

const ClothesExtractor: React.FC<ClothesExtractorProps> = ({ garmentType, onExtracted }) => {
  const { language } = useLanguage();
  const [isExtracting, setIsExtracting] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "ko" ? "파일 크기는 5MB 이하여야 합니다." : "File size must be under 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(language === "ko" ? "이미지 파일만 업로드할 수 있습니다." : "Only image files are allowed.");
      return;
    }

    setSourceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!sourceImage || !sourceFile) return;

    setIsExtracting(true);

    try {
      // Call Render backend instead of Supabase edge function
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://tyron-backend-8yaa.onrender.com";
      
      const response = await fetch(`${backendUrl}/api/clothes-segmentation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: sourceImage, garmentType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[ClothesExtractor] API Error:", errorData);
        toast.error(language === "ko" ? "의류 추출에 실패했습니다." : "Failed to extract clothing.");
        setIsExtracting(false);
        return;
      }

      const data = await response.json();

      if (data.noClothingFound) {
        toast.error(
          language === "ko"
            ? `이미지에서 ${garmentType === "top" ? "상의" : "하의"}를 찾을 수 없습니다.`
            : `No ${garmentType} clothing found in the image.`
        );
        setIsExtracting(false);
        return;
      }

      if (!data.mask) {
        toast.error(language === "ko" ? "마스크 데이터를 받지 못했습니다." : "No mask data received.");
        setIsExtracting(false);
        return;
      }

      // Apply mask to extract clothing
      const extractedBlob = await applyMaskToImage(sourceImage, data.mask);
      const extractedFile = new File(
        [extractedBlob],
        `extracted-${garmentType}-${Date.now()}.png`,
        { type: "image/png" }
      );

      onExtracted(extractedFile);
      toast.success(
        language === "ko"
          ? `${garmentType === "top" ? "상의" : "하의"}가 추출되었습니다!`
          : `${garmentType === "top" ? "Top" : "Bottom"} extracted successfully!`
      );

      // Reset state
      setSourceImage(null);
      setSourceFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error("[ClothesExtractor] Error:", err);
      toast.error(language === "ko" ? "오류가 발생했습니다." : "An error occurred.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCancel = () => {
    setSourceImage(null);
    setSourceFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!sourceImage ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 border-dashed"
          onClick={() => inputRef.current?.click()}
        >
          <Scissors className="w-4 h-4" />
          {language === "ko"
            ? `사람 사진에서 ${garmentType === "top" ? "상의" : "하의"} 추출하기`
            : `Extract ${garmentType} from person photo`}
        </Button>
      ) : (
        <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Scissors className="w-4 h-4 text-primary" />
            {language === "ko" ? "의류 추출" : "Clothes Extraction"}
          </div>
          
          <div className="relative rounded-lg overflow-hidden bg-card border border-border">
            <img
              src={sourceImage}
              alt="Source"
              className="w-full h-40 object-contain"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCancel}
              disabled={isExtracting}
            >
              <X className="w-4 h-4 mr-1" />
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="gradient"
              size="sm"
              className="flex-1"
              onClick={handleExtract}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  {language === "ko" ? "추출 중..." : "Extracting..."}
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4 mr-1" />
                  {language === "ko"
                    ? `${garmentType === "top" ? "상의" : "하의"} 추출`
                    : `Extract ${garmentType}`}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Apply mask to extract clothing from image
async function applyMaskToImage(imageBase64: string, maskBase64: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const img = new Image();
    const mask = new Image();

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Create temporary canvas for mask
        const maskCanvas = document.createElement("canvas");
        const maskCtx = maskCanvas.getContext("2d");
        if (!maskCtx) {
          reject(new Error("Could not get mask canvas context"));
          return;
        }
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        maskCtx.drawImage(mask, 0, 0, img.width, img.height);
        const maskData = maskCtx.getImageData(0, 0, img.width, img.height);

        // Apply mask to alpha channel
        for (let i = 0; i < imageData.data.length; i += 4) {
          // Use mask brightness as alpha (white = visible, black = transparent)
          const maskBrightness = (maskData.data[i] + maskData.data[i + 1] + maskData.data[i + 2]) / 3;
          imageData.data[i + 3] = maskBrightness;
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/png",
          1.0
        );
      }
    };

    img.onload = checkLoaded;
    mask.onload = checkLoaded;
    img.onerror = () => reject(new Error("Failed to load image"));
    mask.onerror = () => reject(new Error("Failed to load mask"));

    img.src = imageBase64;
    mask.src = maskBase64.startsWith("data:") ? maskBase64 : `data:image/png;base64,${maskBase64}`;
  });
}

export default ClothesExtractor;
