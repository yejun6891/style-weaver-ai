import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "ko" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ko: {
    // Landing
    "hero.badge": "AI 가상 피팅",
    "hero.title1": "옷을 입어보지 않아도",
    "hero.title2": "내 모습을 확인하세요",
    "hero.subtitle": "전신 사진 한 장과 원하는 옷만 있으면, AI가 당신이 그 옷을 입은 모습을 보여드립니다.",
    "hero.cta": "시작하기",
    "feature.speed": "30초 만에 완성",
    "feature.face": "얼굴 그대로 유지",
    "feature.combo": "상하의 조합 가능",
    "benefits.title": "이런 분들을 위해 만들었어요",
    "benefits.subtitle": "가상 피팅으로 더 스마트한 패션 라이프",
    "benefits.1": "온라인 쇼핑 전 가상 피팅",
    "benefits.2": "쇼핑몰 상품 사진 제작",
    "benefits.3": "SNS용 패션 콘텐츠",
    "benefits.4": "브랜드 룩북 제작",
    "howto.title": "어떻게 사용하나요?",
    "howto.subtitle": "단 3단계로 가상 피팅 완성",
    "howto.step1.title": "전신 사진 업로드",
    "howto.step1.desc": "정면을 바라보는 전신 사진을 올려주세요",
    "howto.step2.title": "옷 사진 선택",
    "howto.step2.desc": "입어보고 싶은 상의, 하의 이미지를 추가하세요",
    "howto.step3.title": "결과 확인",
    "howto.step3.desc": "AI가 자연스럽게 옷을 입힌 결과를 받아보세요",
    "cta.title": "지금 바로 체험해보세요",
    "cta.subtitle": "회원가입 없이 바로 시작",
    "cta.button": "무료로 시작하기",
    "footer.copyright": "© 2024 FitVision. All rights reserved.",
    
    // Upload
    "upload.back": "돌아가기",
    "upload.title": "이미지 업로드",
    "upload.subtitle": "전신 사진과 입어보고 싶은 옷을 업로드하세요",
    "upload.person.label": "전신 사진",
    "upload.person.desc": "정면을 바라보는 전신 사진",
    "upload.person.req1": "정면 전신 (손이 보여야 함)",
    "upload.person.req2": "단체 사진 불가",
    "upload.person.req3": "측면/반신/앉은 자세 불가",
    "upload.person.req4": "물건을 들고 있으면 안됨",
    "upload.person.req5": "밝고 선명한 사진 권장",
    "upload.top.label": "상의",
    "upload.top.desc": "입어보고 싶은 상의 이미지",
    "upload.top.req1": "평평하게 펼친 단일 의류",
    "upload.top.req2": "정면 촬영 (뒷면 불가)",
    "upload.top.req3": "깔끔한 배경",
    "upload.top.req4": "접히거나 구겨진 옷 불가",
    "upload.top.req5": "여러 벌 겹쳐진 사진 불가",
    "upload.bottom.label": "하의",
    "upload.bottom.desc": "하의 없으면 AI가 자동 생성",
    "upload.bottom.req1": "드레스는 상의만 올려주세요",
    "upload.bottom.req2": "상의와 동일한 조건 적용",
    "upload.optional": "선택",
    "upload.dropzone": "클릭하거나 드래그",
    "upload.format": "JPG, PNG, BMP (최대 5MB)",
    "upload.requirements": "이미지 요구사항",
    "upload.submit": "피팅 생성하기",
    "upload.submitting": "처리 중...",
    "upload.required": "전신 사진과 상의는 필수입니다",
    
    // Result
    "result.title": "가상 피팅 결과",
    "result.processing": "AI가 열심히 작업 중이에요",
    "result.wait": "약 30초 정도 소요됩니다",
    "result.complete": "피팅 완료!",
    "result.download": "다운로드",
    "result.share": "공유하기",
    "result.retry": "다시 시도",
    "result.new": "새로 만들기",
    "result.error": "오류가 발생했습니다",
  },
  en: {
    // Landing
    "hero.badge": "AI Virtual Try-On",
    "hero.title1": "See yourself in any outfit",
    "hero.title2": "without trying it on",
    "hero.subtitle": "Just upload a full-body photo and the clothes you want. AI will show you wearing them.",
    "hero.cta": "Get Started",
    "feature.speed": "Done in 30 seconds",
    "feature.face": "Keep your real face",
    "feature.combo": "Mix tops & bottoms",
    "benefits.title": "Perfect for you",
    "benefits.subtitle": "Smart fashion decisions with virtual fitting",
    "benefits.1": "Try before you buy online",
    "benefits.2": "Create product photos",
    "benefits.3": "Fashion content for SNS",
    "benefits.4": "Brand lookbook creation",
    "howto.title": "How does it work?",
    "howto.subtitle": "Virtual fitting in just 3 steps",
    "howto.step1.title": "Upload your photo",
    "howto.step1.desc": "A front-facing full-body photo works best",
    "howto.step2.title": "Choose your outfit",
    "howto.step2.desc": "Add the top and bottom images you want to try",
    "howto.step3.title": "Get your result",
    "howto.step3.desc": "AI seamlessly puts the clothes on you",
    "cta.title": "Try it now",
    "cta.subtitle": "No sign up required",
    "cta.button": "Start Free",
    "footer.copyright": "© 2024 FitVision. All rights reserved.",
    
    // Upload
    "upload.back": "Back",
    "upload.title": "Upload Images",
    "upload.subtitle": "Upload your photo and the clothes you want to try",
    "upload.person.label": "Your Photo",
    "upload.person.desc": "Front-facing full-body photo",
    "upload.person.req1": "Full body, front view (hands visible)",
    "upload.person.req2": "No group photos",
    "upload.person.req3": "No side/half body/sitting poses",
    "upload.person.req4": "Don't hold any objects",
    "upload.person.req5": "Bright and clear photo recommended",
    "upload.top.label": "Top",
    "upload.top.desc": "The top you want to try on",
    "upload.top.req1": "Flat-lay single garment",
    "upload.top.req2": "Front view only (no back)",
    "upload.top.req3": "Clean background",
    "upload.top.req4": "No folded or wrinkled clothes",
    "upload.top.req5": "No multiple layered items",
    "upload.bottom.label": "Bottom",
    "upload.bottom.desc": "AI will generate if not provided",
    "upload.bottom.req1": "For dresses, upload as top only",
    "upload.bottom.req2": "Same requirements as top",
    "upload.optional": "Optional",
    "upload.dropzone": "Click or drag to upload",
    "upload.format": "JPG, PNG, BMP (max 5MB)",
    "upload.requirements": "Image Requirements",
    "upload.submit": "Generate Try-On",
    "upload.submitting": "Processing...",
    "upload.required": "Photo and top are required",
    
    // Result
    "result.title": "Virtual Try-On Result",
    "result.processing": "AI is working on your look",
    "result.wait": "This takes about 30 seconds",
    "result.complete": "Try-On Complete!",
    "result.download": "Download",
    "result.share": "Share",
    "result.retry": "Try Again",
    "result.new": "Create New",
    "result.error": "Something went wrong",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("ko")) {
      setLanguage("ko");
    } else {
      setLanguage("en");
    }
  }, []);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.ko] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
