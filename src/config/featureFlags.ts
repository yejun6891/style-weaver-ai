// Feature Flags Configuration
// Admin-only features are automatically visible to admin users

export const FEATURE_FLAGS = {
  // Accessory fitting - available to all users
  ACCESSORY_FITTING: {
    enabled: true,
    adminOnly: false,
    label: {
      ko: "악세서리 피팅",
      en: "Accessory Fitting",
    },
    description: {
      ko: "모자, 신발, 가방, 쥬얼리 가상 피팅",
      en: "Virtual hat, shoes, bag, jewelry fitting",
    },
  },
} as const;

export type FeatureKey = keyof typeof FEATURE_FLAGS;

// Fitting category types
export type FittingCategory = 
  | "clothing"  // 의상 체인지 (기존)
  | "hat"       // 모자
  | "shoes"     // 신발
  | "bag"       // 가방
  | "jewelry";  // 쥬얼리

export interface FittingCategoryInfo {
  id: FittingCategory;
  label: { ko: string; en: string };
  description: { ko: string; en: string };
  icon: string;
  available: boolean;
  processingTime: string;
}

export const FITTING_CATEGORIES: FittingCategoryInfo[] = [
  {
    id: "clothing",
    label: { ko: "의상 체인지", en: "Clothing Change" },
    description: { ko: "상의, 하의, 전체 코디 가상 피팅", en: "Virtual try-on for tops, bottoms, full outfits" },
    icon: "👔",
    available: true,
    processingTime: "~15초",
  },
  {
    id: "hat",
    label: { ko: "모자", en: "Hats" },
    description: { ko: "캡, 비니, 버킷햇 등 모자 피팅", en: "Caps, beanies, bucket hats, etc." },
    icon: "🧢",
    available: true,
    processingTime: "~12초",
  },
  {
    id: "shoes",
    label: { ko: "신발", en: "Shoes" },
    description: { ko: "스니커즈, 부츠, 힐 등 신발 피팅", en: "Sneakers, boots, heels, etc." },
    icon: "👟",
    available: true,
    processingTime: "~12초",
  },
  {
    id: "bag",
    label: { ko: "가방", en: "Bags" },
    description: { ko: "백팩, 숄더백, 클러치 등 가방 피팅", en: "Backpacks, shoulder bags, clutches, etc." },
    icon: "👜",
    available: true,
    processingTime: "~12초",
  },
  {
    id: "jewelry",
    label: { ko: "쥬얼리", en: "Jewelry" },
    description: { ko: "목걸이, 귀걸이, 반지 등 쥬얼리 피팅", en: "Necklaces, earrings, rings, etc." },
    icon: "💎",
    available: true,
    processingTime: "~12초",
  },
];
