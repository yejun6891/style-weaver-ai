import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ArrowLeft, Shirt, Watch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FittingCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogStep = "main" | "accessory";

const FittingCategoryDialog: React.FC<FittingCategoryDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [step, setStep] = useState<DialogStep>("main");

  const handleClose = () => {
    setStep("main");
    onOpenChange(false);
  };

  const handleClothingSelect = () => {
    handleClose();
    navigate("/upload");
  };

  const handleAccessorySelect = (categoryId: string) => {
    handleClose();
    navigate(`/upload-accessory/${categoryId}`);
  };

  const mainCategories = [
    {
      id: "clothing",
      icon: <Shirt className="w-6 h-6" />,
      emoji: "👔",
      label: { ko: "의상 체인지", en: "Clothing Change" },
      description: {
        ko: "상의, 하의, 원피스/코디 등 의상을 가상으로 피팅해보세요",
        en: "Virtually try on tops, bottoms, dresses, and full outfits",
      },
      features: {
        ko: ["상의 피팅 (티셔츠, 셔츠, 자켓 등)", "하의 피팅 (바지, 스커트 등)", "전체 코디 피팅"],
        en: ["Top fitting (T-shirts, shirts, jackets)", "Bottom fitting (pants, skirts)", "Full outfit fitting"],
      },
      processingTime: "~15초",
    },
    {
      id: "accessory",
      icon: <Watch className="w-6 h-6" />,
      emoji: "✨",
      label: { ko: "악세서리 체인지", en: "Accessory Change" },
      description: {
        ko: "모자, 신발, 가방, 쥬얼리를 가상으로 착용해보세요",
        en: "Virtually try on hats, shoes, bags, and jewelry",
      },
      features: {
        ko: ["모자 (캡, 비니, 버킷햇 등)", "신발 (스니커즈, 부츠, 힐 등)", "가방 (백팩, 숄더백 등)", "쥬얼리 (목걸이, 귀걸이 등)"],
        en: ["Hats (caps, beanies, bucket hats)", "Shoes (sneakers, boots, heels)", "Bags (backpacks, shoulder bags)", "Jewelry (necklaces, earrings)"],
      },
      processingTime: "~12초",
    },
  ];

  const accessoryCategories = [
    {
      id: "hat",
      emoji: "🧢",
      label: { ko: "모자", en: "Hats" },
      description: {
        ko: "캡, 비니, 버킷햇, 페도라 등",
        en: "Caps, beanies, bucket hats, fedoras",
      },
      personRequirement: {
        ko: "얼굴과 머리 전체가 보이는 정면 사진",
        en: "Front photo showing full face and head",
      },
      productRequirement: {
        ko: "모자 정면이 잘 보이는 단독 사진",
        en: "Standalone photo showing hat front clearly",
      },
    },
    {
      id: "shoes",
      emoji: "👟",
      label: { ko: "신발", en: "Shoes" },
      description: {
        ko: "스니커즈, 부츠, 힐, 구두 등",
        en: "Sneakers, boots, heels, dress shoes",
      },
      personRequirement: {
        ko: "발이 보이는 전신 사진 (필수)",
        en: "Full body photo showing feet (required)",
      },
      productRequirement: {
        ko: "신발 측면이 잘 보이는 단독 사진",
        en: "Standalone photo showing shoe side view",
      },
    },
    {
      id: "bag",
      emoji: "👜",
      label: { ko: "가방", en: "Bags" },
      description: {
        ko: "백팩, 숄더백, 크로스백, 클러치 등",
        en: "Backpacks, shoulder bags, crossbody, clutches",
      },
      personRequirement: {
        ko: "상반신 또는 전신이 보이는 자연스러운 포즈",
        en: "Natural pose showing upper or full body",
      },
      productRequirement: {
        ko: "가방 전체 형태가 보이는 단독 사진",
        en: "Standalone photo showing full bag shape",
      },
    },
    {
      id: "jewelry",
      emoji: "💎",
      label: { ko: "쥬얼리", en: "Jewelry" },
      description: {
        ko: "목걸이, 귀걸이, 반지, 팔찌 등",
        en: "Necklaces, earrings, rings, bracelets",
      },
      personRequirement: {
        ko: "착용 부위가 잘 보이는 사진 (목, 귀, 손 등)",
        en: "Photo clearly showing wearing area (neck, ears, hands)",
      },
      productRequirement: {
        ko: "쥬얼리가 선명하게 보이는 클로즈업 사진",
        en: "Close-up photo showing jewelry clearly",
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          {step === "accessory" && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => setStep("main")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {language === "ko" ? "뒤로" : "Back"}
            </Button>
          )}
          <DialogTitle className="text-xl font-bold">
            {step === "main"
              ? language === "ko" ? "피팅 유형 선택" : "Select Fitting Type"
              : language === "ko" ? "악세서리 선택" : "Select Accessory"
            }
          </DialogTitle>
          <DialogDescription>
            {step === "main"
              ? language === "ko" ? "어떤 아이템을 피팅해볼까요?" : "What item would you like to try on?"
              : language === "ko" ? "피팅할 악세서리 종류를 선택하세요" : "Choose the type of accessory to try on"
            }
          </DialogDescription>
        </DialogHeader>

        {step === "main" ? (
          <div className="grid gap-4 mt-4">
            {mainCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  if (category.id === "clothing") {
                    handleClothingSelect();
                  } else {
                    setStep("accessory");
                  }
                }}
                className={cn(
                  "relative flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                  "border-border hover:border-primary hover:bg-accent/50 cursor-pointer"
                )}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {category.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-lg">
                      {category.label[language]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description[language]}
                  </p>
                  
                  {/* Features List */}
                  <div className="space-y-1">
                    {category.features[language].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-primary">•</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 mt-4">
            {accessoryCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleAccessorySelect(category.id)}
                className={cn(
                  "relative flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                  "border-border hover:border-primary hover:bg-accent/50 cursor-pointer"
                )}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl">
                  {category.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {category.label[language]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {category.description[language]}
                  </p>
                  
                  {/* Requirements */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-blue-500 font-medium shrink-0">👤</span>
                      <span>{category.personRequirement[language]}</span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-green-500 font-medium shrink-0">📦</span>
                      <span>{category.productRequirement[language]}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Admin Notice */}
            <div className="mt-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning">
                {language === "ko" 
                  ? "⚠️ 악세서리 피팅은 현재 관리자 전용 테스트 기능입니다."
                  : "⚠️ Accessory fitting is currently an admin-only test feature."}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FittingCategoryDialog;
