import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, AlertCircle, User, Package, Info } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import ImageUploadZone from "@/components/ImageUploadZone";
import AccessoryStyleProfileForm, { type AccessoryStyleProfile, defaultAccessoryStyleProfile } from "@/components/AccessoryStyleProfileForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useVisitorLog } from "@/hooks/useVisitorLog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 악세서리 카테고리 정의
const ACCESSORY_CATEGORIES = [
  {
    id: "hat",
    emoji: "🧢",
    label: { ko: "모자", en: "Hats" },
  },
  {
    id: "shoes",
    emoji: "👟",
    label: { ko: "신발", en: "Shoes" },
  },
  {
    id: "bag",
    emoji: "👜",
    label: { ko: "가방", en: "Bags" },
  },
  {
    id: "jewelry",
    emoji: "💎",
    label: { ko: "쥬얼리", en: "Jewelry" },
  },
];

// 악세서리 카테고리별 가이드 정보
const ACCESSORY_GUIDES: Record<string, {
  personGuide: { ko: string; en: string };
  productGuide: { ko: string; en: string };
  personRequirements: { ko: string[]; en: string[] };
  productRequirements: { ko: string[]; en: string[] };
  warnings: { ko: string[]; en: string[] };
}> = {
  hat: {
    personGuide: {
      ko: "머리와 얼굴이 잘 보이는 정면 사진을 업로드하세요",
      en: "Upload a front photo showing your head and face clearly",
    },
    productGuide: {
      ko: "피팅하고 싶은 모자의 정면 사진을 업로드하세요",
      en: "Upload a front photo of the hat you want to try on",
    },
    personRequirements: {
      ko: [
        "얼굴과 머리 전체가 보여야 함",
        "현재 모자를 쓰지 않은 사진 권장",
        "정면 또는 약간 측면 각도",
      ],
      en: [
        "Full face and head must be visible",
        "Photos without hats recommended",
        "Front or slightly angled view",
      ],
    },
    productRequirements: {
      ko: [
        "모자만 단독으로 촬영된 사진",
        "정면에서 촬영한 깨끗한 상품 사진",
        "배경이 단순할수록 정확도 상승",
      ],
      en: [
        "Photo of hat alone",
        "Clean product shot from the front",
        "Simpler backgrounds improve accuracy",
      ],
    },
    warnings: {
      ko: [
        "머리가 가려진 사진은 정확도가 낮아질 수 있습니다",
        "⚠️ 비니, 버킷햇 등은 자연스럽게 피팅되지만, 볼캡(야구모자)은 AI 특성상 퀄리티가 다소 낮을 수 있습니다",
      ],
      en: [
        "Photos with covered heads may reduce accuracy",
        "⚠️ Beanies and bucket hats fit naturally, but baseball caps may have lower quality due to AI limitations",
      ],
    },
  },
  shoes: {
    personGuide: {
      ko: "발이 보이는 전신 사진을 업로드하세요 (필수)",
      en: "Upload a full body photo showing your feet (required)",
    },
    productGuide: {
      ko: "피팅하고 싶은 신발의 측면 사진을 업로드하세요",
      en: "Upload a side view photo of the shoes you want to try on",
    },
    personRequirements: {
      ko: [
        "⚠️ 발이 반드시 보여야 함 (필수)",
        "머리부터 발끝까지 전신 사진",
        "서 있는 자세가 가장 좋음",
        "⚠️ 앉은 자세는 발이 가려져 결과 퀄리티가 크게 떨어질 수 있습니다",
      ],
      en: [
        "⚠️ Feet must be visible (required)",
        "Full body from head to toe",
        "Standing pose works best",
        "⚠️ Sitting poses may hide feet and significantly reduce quality",
      ],
    },
    productRequirements: {
      ko: [
        "신발만 단독으로 촬영된 사진",
        "측면이 잘 보이는 사진 권장",
        "한 켤레 또는 한 짝 모두 가능",
      ],
      en: [
        "Photo of shoes alone",
        "Side view recommended",
        "Pair or single shoe both work",
      ],
    },
    warnings: {
      ko: ["발이 보이지 않는 사진은 신발 피팅이 불가능합니다"],
      en: ["Shoe fitting is not possible without visible feet"],
    },
  },
  bag: {
    personGuide: {
      ko: "가방 착용 방향에 맞는 사진을 업로드하세요",
      en: "Upload a photo matching how you'd carry the bag",
    },
    productGuide: {
      ko: "피팅하고 싶은 가방의 전체 사진을 업로드하세요",
      en: "Upload a full photo of the bag you want to try on",
    },
    personRequirements: {
      ko: [
        "상반신 또는 전신이 보이는 사진",
        "팔이 자연스럽게 보이는 포즈",
        "📌 앞으로 메는 가방 → 정면 사진",
        "📌 뒤로 메는 가방 (백팩 등) → 뒷모습 사진",
      ],
      en: [
        "Upper body or full body visible",
        "Natural pose with visible arms",
        "📌 Front-carry bags → front-facing photo",
        "📌 Back-carry bags (backpacks) → back-facing photo",
      ],
    },
    productRequirements: {
      ko: [
        "가방만 단독으로 촬영된 사진",
        "가방의 전체 형태가 보여야 함",
        "손잡이/스트랩이 보이면 더 자연스러움",
      ],
      en: [
        "Photo of bag alone",
        "Full bag shape must be visible",
        "Visible handles/straps improve results",
      ],
    },
    warnings: {
      ko: ["가방 종류(백팩, 숄더백 등)에 맞는 포즈가 결과에 영향을 줍니다"],
      en: ["Pose matching bag type (backpack, shoulder) affects results"],
    },
  },
  jewelry: {
    personGuide: {
      ko: "착용 부위의 클로즈업 사진을 업로드하세요",
      en: "Upload a close-up photo of the wearing area",
    },
    productGuide: {
      ko: "피팅하고 싶은 쥬얼리의 선명한 사진을 업로드하세요",
      en: "Upload a clear photo of the jewelry you want to try on",
    },
    personRequirements: {
      ko: [
        "목걸이: 목~가슴이 잘 보이는 사진",
        "귀걸이: 귀가 잘 보이는 사진 (원하는 쪽 귀만 보이게 촬영 권장)",
        "반지/팔찌: 손목~손이 잘 보이는 사진",
        "💡 착용 부위만 클로즈업한 사진이 가장 좋은 결과를 냅니다",
        "⚠️ 전신 사진은 제품이 너무 작게 보여 결과가 좋지 않을 수 있습니다",
        "⚠️ 귀걸이는 AI가 귓볼 위치에 배치합니다. 이어커프 등 귀 중간/위쪽 제품도 귓볼에 나올 수 있습니다",
      ],
      en: [
        "Necklaces: Photo showing neck to chest area",
        "Earrings: Photo showing ears clearly (show only the desired ear for best results)",
        "Rings/Bracelets: Photo showing wrists and hands",
        "💡 Close-up photos of the wearing area produce the best results",
        "⚠️ Full body photos may make jewelry appear too small for good results",
        "⚠️ Earrings are placed on the earlobe by AI. Ear cuffs and mid-ear products may also appear on the earlobe",
      ],
    },
    productRequirements: {
      ko: [
        "쥬얼리만 단독으로 촬영된 사진",
        "제품이 선명하게 보이는 클로즈업",
        "복잡한 배경 피하기",
      ],
      en: [
        "Photo of jewelry alone",
        "Clear close-up of the product",
        "Avoid complex backgrounds",
      ],
    },
    warnings: {
      ko: ["AI가 자동으로 배치하므로, 원하는 부위만 보이는 사진을 올려주세요"],
      en: ["AI auto-places jewelry, so upload a photo showing only the desired area"],
    },
  },
};

const UploadAccessory = () => {
  const { category: urlCategory } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, session, loading: authLoading } = useAuth();
  const { isEnabled, loading: featureLoading } = useFeatureFlag("ACCESSORY_FITTING");
  
  // 현재 선택된 카테고리 (URL 또는 기본값)
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || "hat");
  
  useVisitorLog(`/upload-accessory/${selectedCategory}`);

  const [personFile, setPersonFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [styleProfile, setStyleProfile] = useState<AccessoryStyleProfile>(defaultAccessoryStyleProfile);

  // URL 카테고리 변경 시 동기화
  useEffect(() => {
    if (urlCategory && ACCESSORY_CATEGORIES.find(c => c.id === urlCategory)) {
      setSelectedCategory(urlCategory);
    }
  }, [urlCategory]);

  // 카테고리 변경 시 URL 업데이트
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    navigate(`/upload-accessory/${categoryId}`, { replace: true });
    // 카테고리 변경 시 업로드된 파일 초기화 (선택사항)
    // setPersonFile(null);
    // setProductFile(null);
  };

  const accessoryGuide = ACCESSORY_GUIDES[selectedCategory];
  const categoryInfo = ACCESSORY_CATEGORIES.find(c => c.id === selectedCategory);

  // 권한 체크
  useEffect(() => {
    if (!authLoading && !featureLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!isEnabled) {
        toast.error(language === "ko" ? "접근 권한이 없습니다" : "Access denied");
        navigate("/");
        return;
      }
    }
  }, [user, authLoading, isEnabled, featureLoading, navigate, language]);

  const handleSubmit = async () => {
    if (!personFile || !productFile) {
      toast.error(language === "ko" ? "모든 이미지를 업로드해주세요" : "Please upload all images");
      return;
    }

    if (!session?.access_token) {
      toast.error(language === "ko" ? "로그인이 필요합니다" : "Login required");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Refresh session
      const { data: { session: freshSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError || !freshSession?.access_token) {
        toast.error(language === "ko" ? "세션이 만료되었습니다. 다시 로그인해주세요." : "Session expired. Please login again.");
        navigate("/auth");
        return;
      }

      const formData = new FormData();
      formData.append("person_image", personFile);
      formData.append("product_image", productFile);
      formData.append("category", selectedCategory);

      supabase.functions.setAuth(freshSession.access_token);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-proxy?action=accessory-start`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": `Bearer ${freshSession.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "x-user-token": freshSession.access_token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(language === "ko" ? "이용권이 부족합니다" : "Insufficient credits");
        } else {
          toast.error(data.error || (language === "ko" ? "오류가 발생했습니다" : "An error occurred"));
        }
        return;
      }

      if (data.taskId) {
        // Store style profile in sessionStorage for the result page
        sessionStorage.setItem("styleProfile", JSON.stringify(styleProfile));
        sessionStorage.setItem("tryonMode", "accessory");
        // Navigate to result page
        navigate(`/result/${data.taskId}?mode=accessory&category=${selectedCategory}`);
      } else {
        toast.error(language === "ko" ? "작업 생성에 실패했습니다" : "Failed to create task");
      }
    } catch (err) {
      console.error("[UploadAccessory] Submit error:", err);
      toast.error(language === "ko" ? "서버 연결에 실패했습니다" : "Server connection failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || featureLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!accessoryGuide || !categoryInfo) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <HeaderMenu />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            {language === "ko" ? "악세서리 피팅" : "Accessory Fitting"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {language === "ko" 
              ? "AI가 악세서리를 자연스럽게 착용한 모습을 생성합니다"
              : "AI generates natural try-on results for accessories"}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {ACCESSORY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all whitespace-nowrap",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className="font-medium text-sm">{cat.label[language]}</span>
            </button>
          ))}
        </div>

        {/* Image Requirements Notice */}
        <div className="mb-6 p-3 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">
                {language === "ko" ? "이미지 요구사항" : "Image Requirements"}
              </p>
              <p>• {language === "ko" ? "형식: JPG, PNG (5MB 이하)" : "Format: JPG, PNG (under 5MB)"}</p>
              <p>• {language === "ko" ? "제품 사진: 배경이 깨끗할수록 정확도 ↑" : "Product photo: cleaner background = better accuracy"}</p>
              <p>• {language === "ko" ? "처리 시간: 약 12초" : "Processing time: ~12 seconds"}</p>
            </div>
          </div>
        </div>

        {/* Upload Sections */}
        <div className="space-y-6">
          {/* Person Photo */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground">
                {language === "ko" ? "내 사진" : "My Photo"}
              </h3>
            </div>

            {/* Person Requirements Box */}
            <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                {accessoryGuide.personGuide[language]}
              </p>
              <ul className="space-y-1">
                {accessoryGuide.personRequirements[language].map((req, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <ImageUploadZone
              label=""
              description=""
              file={personFile}
              onFileChange={setPersonFile}
              requirements={[]}
            />
          </div>

          {/* Product Photo */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground">
                {language === "ko" ? `${categoryInfo.label.ko} 사진` : `${categoryInfo.label.en} Photo`}
              </h3>
            </div>

            {/* Product Requirements Box */}
            <div className="mb-4 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                {accessoryGuide.productGuide[language]}
              </p>
              <ul className="space-y-1">
                {accessoryGuide.productRequirements[language].map((req, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <ImageUploadZone
              label=""
              description=""
              file={productFile}
              onFileChange={setProductFile}
              requirements={[]}
            />
          </div>

          {/* Warning Section */}
          {accessoryGuide.warnings[language].length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {accessoryGuide.warnings[language].map((warning, idx) => (
                    <p key={idx} className="text-sm text-amber-600 dark:text-amber-400">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Style Profile Form */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <AccessoryStyleProfileForm value={styleProfile} onChange={setStyleProfile} category={selectedCategory as "hat" | "shoes" | "bag" | "jewelry"} />
          </div>

          {/* Submit Button */}
          <Button
            variant="gradient"
            size="xl"
            className="w-full"
            onClick={handleSubmit}
            disabled={!personFile || !productFile || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {language === "ko" ? "처리 중..." : "Processing..."}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {language === "ko" ? `${categoryInfo.label.ko} 피팅 시작` : `Start ${categoryInfo.label.en} Fitting`}
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default UploadAccessory;
