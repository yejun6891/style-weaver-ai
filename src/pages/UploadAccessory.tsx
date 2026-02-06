import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, AlertCircle, User, Package } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import ImageUploadZone from "@/components/ImageUploadZone";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useVisitorLog } from "@/hooks/useVisitorLog";
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
      ko: ["머리가 가려진 사진은 정확도가 낮아질 수 있습니다"],
      en: ["Photos with covered heads may reduce accuracy"],
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
      ],
      en: [
        "⚠️ Feet must be visible (required)",
        "Full body from head to toe",
        "Standing pose works best",
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
      ko: "상반신 또는 전신이 보이는 자연스러운 사진을 업로드하세요",
      en: "Upload a natural photo showing your upper or full body",
    },
    productGuide: {
      ko: "피팅하고 싶은 가방의 전체 사진을 업로드하세요",
      en: "Upload a full photo of the bag you want to try on",
    },
    personRequirements: {
      ko: [
        "상반신 또는 전신이 보이는 사진",
        "팔이 자연스럽게 보이는 포즈",
        "가방 착용 위치가 예상되는 포즈",
      ],
      en: [
        "Upper body or full body visible",
        "Natural pose with visible arms",
        "Pose suggesting bag placement",
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
      ko: "착용 부위가 잘 보이는 사진을 업로드하세요",
      en: "Upload a photo clearly showing the wearing area",
    },
    productGuide: {
      ko: "피팅하고 싶은 쥬얼리의 선명한 사진을 업로드하세요",
      en: "Upload a clear photo of the jewelry you want to try on",
    },
    personRequirements: {
      ko: [
        "목걸이: 목이 잘 보이는 사진",
        "귀걸이: 귀가 잘 보이는 사진",
        "반지/팔찌: 손이 잘 보이는 사진",
      ],
      en: [
        "Necklaces: Photo showing neck clearly",
        "Earrings: Photo showing ears clearly",
        "Rings/Bracelets: Photo showing hands clearly",
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
      ko: ["착용 부위가 가려진 사진은 피팅이 어렵습니다"],
      en: ["Fitting is difficult when wearing area is covered"],
    },
  },
};

const UploadAccessory = () => {
  const { category: urlCategory } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { isEnabled, loading: featureLoading } = useFeatureFlag("ACCESSORY_FITTING");
  
  // 현재 선택된 카테고리 (URL 또는 기본값)
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || "hat");
  
  useVisitorLog(`/upload-accessory/${selectedCategory}`);

  const [personFile, setPersonFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    
    // TODO: Fashn.ai Product to Model API 연동
    toast.info(language === "ko" 
      ? "악세서리 피팅 기능은 개발 중입니다" 
      : "Accessory fitting is under development");
    
    setIsSubmitting(false);
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

        {/* Development Notice */}
        <div className="mb-6 p-3 rounded-xl bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              {language === "ko" 
                ? "관리자 전용 테스트 기능입니다. Fashn.ai API 연동 후 실제 피팅이 가능합니다."
                : "Admin-only test feature. Real fitting available after Fashn.ai API integration."}
            </p>
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
