import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Scissors, Loader2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
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
      // Prefer in-app backend function (avoids CORS + keeps API key private).
      // If you want to force your own backend, set VITE_BACKEND_URL.
      const backendUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;

      let data: any;
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/api/clothes-segmentation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: sourceImage, garmentType }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[ClothesExtractor] API Error:", errorData);
          toast.error(language === "ko" ? "의류 추출에 실패했습니다." : "Failed to extract clothing.");
          return;
        }

        data = await response.json();
      } else {
        const res = await supabase.functions.invoke("clothes-segmentation", {
          body: { image: sourceImage, garmentType },
        });

        if (res.error) {
          console.error("[ClothesExtractor] Function Error:", res.error);
          toast.error(language === "ko" ? "의류 추출에 실패했습니다." : "Failed to extract clothing.");
          return;
        }

        data = res.data;
      }

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

      // Apply mask to extract clothing (subtract skin/face/hair if provided)
      const extractedBlob = await applyMaskToImage(sourceImage, data.mask, data.subtractMask ?? null);
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
async function applyMaskToImage(
  imageBase64: string,
  maskValue: string,
  subtractMaskValue: string | null
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const img = new Image();
    const mask = new Image();
    const subtract = subtractMaskValue ? new Image() : null;

    const setSrc = (el: HTMLImageElement, v: string) => {
      if (v.startsWith("http://") || v.startsWith("https://")) {
        el.crossOrigin = "anonymous";
        el.src = v;
      } else if (v.startsWith("data:")) {
        el.src = v;
      } else {
        el.src = `data:image/png;base64,${v}`;
      }
    };

    let loadedCount = 0;
    const needCount = subtract ? 3 : 2;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount !== needCount) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const readMask = (maskImg: HTMLImageElement) => {
        const mc = document.createElement("canvas");
        const mctx = mc.getContext("2d");
        if (!mctx) throw new Error("Could not get mask canvas context");
        mc.width = img.width;
        mc.height = img.height;
        mctx.drawImage(maskImg, 0, 0, img.width, img.height);
        return mctx.getImageData(0, 0, img.width, img.height);
      };

      try {
        const garmentMask = readMask(mask);
        const subtractMask = subtract ? readMask(subtract) : null;

        // Determine if garment mask should be inverted
        let brightCount = 0;
        const total = garmentMask.data.length / 4;
        for (let i = 0; i < garmentMask.data.length; i += 4) {
          const b = (garmentMask.data[i] + garmentMask.data[i + 1] + garmentMask.data[i + 2]) / 3;
          if (b > 200) brightCount++;
        }
        const shouldInvertGarment = brightCount / total > 0.6;

        // If subtract mask exists, also decide inversion for it
        let shouldInvertSubtract = false;
        if (subtractMask) {
          let bright2 = 0;
          const total2 = subtractMask.data.length / 4;
          for (let i = 0; i < subtractMask.data.length; i += 4) {
            const b = (subtractMask.data[i] + subtractMask.data[i + 1] + subtractMask.data[i + 2]) / 3;
            if (b > 200) bright2++;
          }
          shouldInvertSubtract = bright2 / total2 > 0.6;
        }

        // Apply garment alpha, then subtract person parts alpha if available
        for (let i = 0; i < imageData.data.length; i += 4) {
          const gb = (garmentMask.data[i] + garmentMask.data[i + 1] + garmentMask.data[i + 2]) / 3;
          const garmentAlpha = shouldInvertGarment ? 255 - gb : gb;

          let finalAlpha = garmentAlpha;
          if (subtractMask) {
            const sb = (subtractMask.data[i] + subtractMask.data[i + 1] + subtractMask.data[i + 2]) / 3;
            const subtractAlpha = shouldInvertSubtract ? 255 - sb : sb;
            // remove person parts from garment area
            finalAlpha = Math.max(0, garmentAlpha - subtractAlpha);
          }

          imageData.data[i + 3] = finalAlpha;
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
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Failed to apply mask"));
      }
    };

    img.onload = checkLoaded;
    mask.onload = checkLoaded;
    if (subtract) subtract.onload = checkLoaded;

    img.onerror = () => reject(new Error("Failed to load image"));
    mask.onerror = () => reject(new Error("Failed to load mask"));
    if (subtract) subtract.onerror = () => reject(new Error("Failed to load subtract mask"));

    img.src = imageBase64;
    setSrc(mask, maskValue);
    if (subtract && subtractMaskValue) setSrc(subtract, subtractMaskValue);
  });
}

export default ClothesExtractor;
