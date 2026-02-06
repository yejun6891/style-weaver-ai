import { FEATURE_FLAGS, FeatureKey } from "@/config/featureFlags";
import { useAdminCheck } from "./useAdminCheck";

interface UseFeatureFlagResult {
  isEnabled: boolean;
  isAdminOnly: boolean;
  loading: boolean;
}

export const useFeatureFlag = (featureKey: FeatureKey): UseFeatureFlagResult => {
  const { isAdmin, loading } = useAdminCheck();
  const feature = FEATURE_FLAGS[featureKey];

  // Feature must be enabled
  if (!feature.enabled) {
    return { isEnabled: false, isAdminOnly: feature.adminOnly, loading: false };
  }

  // If admin-only, check admin status
  if (feature.adminOnly) {
    return { 
      isEnabled: isAdmin, 
      isAdminOnly: true, 
      loading 
    };
  }

  // Feature is enabled for everyone
  return { isEnabled: true, isAdminOnly: false, loading: false };
};

// Hook to get all enabled features for the current user
export const useEnabledFeatures = () => {
  const { isAdmin, loading } = useAdminCheck();

  const enabledFeatures = Object.entries(FEATURE_FLAGS)
    .filter(([_, feature]) => {
      if (!feature.enabled) return false;
      if (feature.adminOnly && !isAdmin) return false;
      return true;
    })
    .map(([key]) => key as FeatureKey);

  return { enabledFeatures, loading };
};
