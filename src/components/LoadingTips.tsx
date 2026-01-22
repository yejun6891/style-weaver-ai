import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

const fashionTipsKo = [
  "👕 상의는 하의보다 밝은 색상을 선택하면 시선이 위로 향해요",
  "👖 하의는 어두운 색상이 다리를 길어 보이게 해요",
  "✨ 포인트 액세서리는 하나면 충분해요",
  "🎨 비슷한 톤의 색상을 매치하면 세련된 느낌이 나요",
  "👔 기본 아이템에 투자하면 다양한 스타일링이 가능해요",
  "🧥 레이어링은 계절 변화에 유연하게 대응할 수 있어요",
  "👟 신발은 전체 룩의 분위기를 결정하는 중요한 요소예요",
  "🎒 가방 색상은 신발과 맞추면 통일감이 생겨요",
  "💡 3가지 이하의 색상으로 코디하면 깔끔해 보여요",
  "🌟 체형에 맞는 핏을 찾는 것이 스타일의 시작이에요",
];

const fashionTipsEn = [
  "👕 Light tops draw attention upward for a balanced look",
  "👖 Dark bottoms can make legs appear longer",
  "✨ One statement accessory is often enough",
  "🎨 Matching similar tones creates a sophisticated look",
  "👔 Investing in basics enables versatile styling",
  "🧥 Layering helps adapt to seasonal changes",
  "👟 Shoes define the overall mood of your outfit",
  "🎒 Matching bag color with shoes creates cohesion",
  "💡 Limiting to 3 colors keeps the look clean",
  "🌟 Finding the right fit for your body is key to style",
];

interface LoadingTipsProps {
  intervalMs?: number;
}

const LoadingTips = ({ intervalMs = 4000 }: LoadingTipsProps) => {
  const { t } = useLanguage();
  const isKorean = t("common.language") === "한국어";
  const tips = isKorean ? fashionTipsKo : fashionTipsEn;
  
  const [currentTipIndex, setCurrentTipIndex] = useState(
    Math.floor(Math.random() * tips.length)
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        setIsAnimating(false);
      }, 300);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [tips.length, intervalMs]);

  return (
    <div className="mt-6 px-4">
      <div 
        className={`text-sm text-muted-foreground text-center transition-all duration-300 ${
          isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {tips[currentTipIndex]}
      </div>
    </div>
  );
};

export default LoadingTips;
