import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FITTING_CATEGORIES, FittingCategory } from "@/config/featureFlags";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, Lock } from "lucide-react";

interface FittingCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FittingCategoryDialog: React.FC<FittingCategoryDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleCategorySelect = (categoryId: FittingCategory) => {
    onOpenChange(false);
    
    if (categoryId === "clothing") {
      navigate("/upload");
    } else {
      navigate(`/upload-accessory/${categoryId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {language === "ko" ? "피팅 유형 선택" : "Select Fitting Type"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko" 
              ? "어떤 아이템을 피팅해볼까요?" 
              : "What item would you like to try on?"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          {FITTING_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              disabled={!category.available}
              className={cn(
                "relative flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                category.available
                  ? "border-border hover:border-primary hover:bg-accent/50 cursor-pointer"
                  : "border-border/50 bg-muted/30 cursor-not-allowed opacity-60"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl">
                {category.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    {category.label[language]}
                  </span>
                  {!category.available && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      {language === "ko" ? "준비중" : "Coming Soon"}
                    </Badge>
                  )}
                  {category.id !== "clothing" && category.available && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {language === "ko" ? "관리자 전용" : "Admin Only"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {category.description[language]}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{category.processingTime}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Fashn.ai Product to Model 설명 */}
        <div className="mt-4 p-4 rounded-xl bg-accent/50 border border-border">
          <h4 className="font-semibold text-sm text-foreground mb-2">
            {language === "ko" ? "📌 악세서리 피팅이란?" : "📌 What is Accessory Fitting?"}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {language === "ko" 
              ? "Fashn.ai의 Product to Model 기술을 활용하여 내 사진에 모자, 신발, 가방, 쥬얼리를 합성합니다. 의상 피팅과 동일한 방식으로 작동하며, 상품 사진을 업로드하면 AI가 자연스럽게 착용한 모습을 생성합니다."
              : "Using Fashn.ai's Product to Model technology, we synthesize hats, shoes, bags, and jewelry onto your photo. It works the same way as clothing fitting - upload a product photo and AI generates a natural try-on result."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FittingCategoryDialog;
