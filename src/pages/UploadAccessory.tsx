import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Info, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import ImageUploadZone from "@/components/ImageUploadZone";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { FITTING_CATEGORIES, FittingCategory } from "@/config/featureFlags";
import { useVisitorLog } from "@/hooks/useVisitorLog";
import { toast } from "sonner";

// 악세서리 카테고리별 가이드 정보
const ACCESSORY_GUIDES: Record<string, {
  personGuide: { ko: string; en: string };
  productGuide: { ko: string; en: string };
  tips: { ko: string[]; en: string[] };
}> = {
  hat: {
    personGuide: {
      ko: "얼굴과 머리가 잘 보이는 정면 또는 약간 측면 사진이 좋아요. 현재 모자를 쓰고 있지 않은 사진을 권장합니다.",
      en: "A front or slightly angled photo showing your face and head clearly works best. We recommend a photo without a hat.",
    },
    productGuide: {
      ko: "모자 단독 사진을 업로드하세요. 정면에서 촬영한 깨끗한 상품 사진이 가장 좋습니다.",
      en: "Upload a standalone hat photo. A clean product shot from the front works best.",
    },
    tips: {
      ko: [
        "캡, 비니, 버킷햇, 페도라 등 다양한 모자 지원",
        "모자의 앞면이 잘 보이는 사진 권장",
        "배경이 단순할수록 정확도 상승",
      ],
      en: [
        "Supports caps, beanies, bucket hats, fedoras, etc.",
        "Photos showing the front of the hat recommended",
        "Simpler backgrounds improve accuracy",
      ],
    },
  },
  shoes: {
    personGuide: {
      ko: "발이 보이는 전신 또는 하반신 사진이 필요해요. 신발이 잘 보이도록 서 있는 자세가 좋습니다.",
      en: "A full body or lower body photo showing your feet is needed. Standing poses that show shoes clearly work best.",
    },
    productGuide: {
      ko: "신발 단독 사진을 업로드하세요. 한 켤레 또는 한 짝의 측면 사진이 가장 좋습니다.",
      en: "Upload a standalone shoe photo. Side view of a pair or single shoe works best.",
    },
    tips: {
      ko: [
        "스니커즈, 구두, 부츠, 힐 등 다양한 신발 지원",
        "신발의 측면이 잘 보이는 사진 권장",
        "발목까지 보이는 전신 사진 사용",
      ],
      en: [
        "Supports sneakers, dress shoes, boots, heels, etc.",
        "Side view photos of shoes recommended",
        "Use full body photos showing ankles",
      ],
    },
  },
  bag: {
    personGuide: {
      ko: "상반신 또는 전신 사진이 좋아요. 가방을 들거나 메는 위치가 잘 보이면 더 자연스러운 결과를 얻을 수 있습니다.",
      en: "Upper body or full body photos work well. Results are more natural when the bag carrying position is visible.",
    },
    productGuide: {
      ko: "가방 단독 사진을 업로드하세요. 정면 또는 약간 측면에서 촬영한 상품 사진이 좋습니다.",
      en: "Upload a standalone bag photo. Front or slightly angled product shots work well.",
    },
    tips: {
      ko: [
        "백팩, 숄더백, 크로스백, 클러치 등 지원",
        "가방의 전체 형태가 보이는 사진 권장",
        "손잡이/스트랩이 잘 보이면 더 자연스러움",
      ],
      en: [
        "Supports backpacks, shoulder bags, crossbody, clutches, etc.",
        "Photos showing full bag shape recommended",
        "Visible handles/straps create more natural results",
      ],
    },
  },
  jewelry: {
    personGuide: {
      ko: "목걸이는 목이 보이는 사진, 귀걸이는 귀가 보이는 사진, 반지는 손이 보이는 사진이 필요합니다.",
      en: "For necklaces, neck should be visible. For earrings, ears should show. For rings, hands should be visible.",
    },
    productGuide: {
      ko: "쥬얼리 단독 사진을 업로드하세요. 제품이 선명하게 보이는 클로즈업 사진이 좋습니다.",
      en: "Upload a standalone jewelry photo. Clear close-up product shots work best.",
    },
    tips: {
      ko: [
        "목걸이, 귀걸이, 반지, 팔찌 등 지원",
        "쥬얼리가 선명하게 보이는 사진 권장",
        "착용 부위가 잘 보이는 사람 사진 필요",
      ],
      en: [
        "Supports necklaces, earrings, rings, bracelets, etc.",
        "Clear jewelry photos recommended",
        "Person photos should show wearing area clearly",
      ],
    },
  },
};

const UploadAccessory = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { isEnabled, loading: featureLoading } = useFeatureFlag("ACCESSORY_FITTING");
  
  useVisitorLog(`/upload-accessory/${category}`);

  const [personFile, setPersonFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 유효한 카테고리인지 확인
  const categoryInfo = FITTING_CATEGORIES.find(c => c.id === category);
  const accessoryGuide = category ? ACCESSORY_GUIDES[category] : null;

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
      if (!categoryInfo || category === "clothing") {
        navigate("/upload");
        return;
      }
    }
  }, [user, authLoading, isEnabled, featureLoading, categoryInfo, category, navigate, language]);

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

  if (!categoryInfo || !accessoryGuide) {
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-2xl">{categoryInfo.icon}</span>
            <span className="font-semibold">
              {categoryInfo.label[language]}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            {language === "ko" 
              ? `${categoryInfo.label.ko} 피팅` 
              : `${categoryInfo.label.en} Fitting`}
          </h1>
          <p className="text-muted-foreground">
            {categoryInfo.description[language]}
          </p>
        </div>

        {/* Upload Sections */}
        <div className="space-y-8">
          {/* Person Photo */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <ImageUploadZone
              label={language === "ko" ? "내 사진" : "My Photo"}
              description={accessoryGuide.personGuide[language]}
              file={personFile}
              onFileChange={setPersonFile}
              requirements={[]}
            />
          </div>

          {/* Product Photo */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <ImageUploadZone
              label={language === "ko" ? `${categoryInfo.label.ko} 사진` : `${categoryInfo.label.en} Photo`}
              description={accessoryGuide.productGuide[language]}
              file={productFile}
              onFileChange={setProductFile}
              requirements={accessoryGuide.tips[language]}
            />
          </div>

          {/* Tips Section */}
          <div className="p-4 rounded-xl bg-accent/50 border border-border">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {language === "ko" ? "피팅 팁" : "Fitting Tips"}
                </h4>
                <ul className="space-y-1">
                  {accessoryGuide.tips[language].map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Development Notice */}
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-warning mb-1">
                  {language === "ko" ? "개발 중인 기능" : "Feature in Development"}
                </h4>
                <p className="text-sm text-warning/80">
                  {language === "ko" 
                    ? "이 기능은 현재 개발 중이며, 관리자 전용으로 테스트 중입니다. Fashn.ai Product to Model API가 연동되면 실제 피팅이 가능합니다."
                    : "This feature is currently under development and being tested by admins only. Real fitting will be available once Fashn.ai Product to Model API is integrated."}
                </p>
              </div>
            </div>
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
                {language === "ko" ? "피팅 시작하기" : "Start Fitting"}
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default UploadAccessory;
