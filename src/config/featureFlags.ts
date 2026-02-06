// Feature Flags Configuration
// Admin-only features are automatically visible to admin users

export const FEATURE_FLAGS = {
  // Hair virtual fitting - admin only for now
  HAIR_FITTING: {
    enabled: true,
    adminOnly: true,
    label: {
      ko: "헤어 피팅",
      en: "Hair Fitting",
    },
    description: {
      ko: "가상 헤어스타일 피팅 (개발 중)",
      en: "Virtual hairstyle fitting (In Development)",
    },
  },

  // Jewelry virtual fitting - admin only for now
  JEWELRY_FITTING: {
    enabled: false, // Not started yet
    adminOnly: true,
    label: {
      ko: "쥬얼리 피팅",
      en: "Jewelry Fitting",
    },
    description: {
      ko: "가상 쥬얼리 피팅 (준비 중)",
      en: "Virtual jewelry fitting (Coming Soon)",
    },
  },
} as const;

export type FeatureKey = keyof typeof FEATURE_FLAGS;
