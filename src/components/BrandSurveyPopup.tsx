import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";

const SURVEY_STORAGE_KEY = "brand_survey_completed";

// Popular US fashion brands
const BRAND_OPTIONS = [
  "Nike",
  "Adidas",
  "Zara",
  "H&M",
  "Uniqlo",
  "Levi's",
  "Gap",
  "Ralph Lauren",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Patagonia",
  "The North Face",
  "Lululemon",
  "Anthropologie",
  "Urban Outfitters",
  "Free People",
  "Madewell",
  "J.Crew",
  "Everlane",
  "Aritzia",
];

const BrandSurveyPopup = () => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [otherBrand, setOtherBrand] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if survey was already completed
    const completed = localStorage.getItem(SURVEY_STORAGE_KEY);
    if (!completed) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
  };

  const handleSubmit = async () => {
    if (selectedBrands.length === 0 && !otherBrand.trim()) {
      toast.error(language === "ko" ? "최소 1개의 브랜드를 선택해주세요" : "Please select at least 1 brand");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get session ID (use a unique identifier for anonymous users)
      const sessionId = localStorage.getItem("survey_session_id") || crypto.randomUUID();
      localStorage.setItem("survey_session_id", sessionId);

      // Get user ID if logged in
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const { error } = await supabase.from("brand_surveys").insert({
        user_id: userId,
        session_id: sessionId,
        favorite_brands: selectedBrands,
        other_brand: otherBrand.trim() || null,
      });

      if (error) throw error;

      // Mark survey as completed
      localStorage.setItem(SURVEY_STORAGE_KEY, "true");
      setIsOpen(false);
      toast.success(language === "ko" ? "소중한 의견 감사합니다!" : "Thank you for your feedback!");
    } catch (err) {
      console.error("Survey submission error:", err);
      toast.error(language === "ko" ? "제출에 실패했습니다. 다시 시도해주세요." : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(SURVEY_STORAGE_KEY, "skipped");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">
              {language === "ko" ? "좋아하는 브랜드를 알려주세요!" : "Tell us your favorite brands!"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {language === "ko" 
              ? "여러분이 좋아하는 브랜드와 협업하여, 해당 브랜드의 옷을 바로 가상 피팅할 수 있도록 준비 중입니다. 30초만 투자해주세요!"
              : "We're partnering with your favorite brands so you can virtually try on their clothes directly. Take 30 seconds to help us!"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm font-medium text-foreground mb-3">
            {language === "ko" ? "좋아하는 브랜드를 선택하세요 (복수 선택 가능)" : "Select your favorite brands (multiple selection)"}
          </p>
          
          <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-2">
            {BRAND_OPTIONS.map((brand) => (
              <label
                key={brand}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedBrands.includes(brand)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() => handleBrandToggle(brand)}
                />
                <span className="text-sm font-medium">{brand}</span>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-2">
              {language === "ko" ? "다른 브랜드가 있다면 적어주세요" : "Any other brand you'd like?"}
            </p>
            <Input
              value={otherBrand}
              onChange={(e) => setOtherBrand(e.target.value)}
              placeholder={language === "ko" ? "브랜드명 입력..." : "Enter brand name..."}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-muted-foreground"
          >
            {language === "ko" ? "다음에 하기" : "Skip for now"}
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            {isSubmitting 
              ? (language === "ko" ? "제출 중..." : "Submitting...") 
              : (language === "ko" ? "제출하기" : "Submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BrandSurveyPopup;
