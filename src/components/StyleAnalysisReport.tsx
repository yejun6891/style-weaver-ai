import { useLanguage } from "@/contexts/LanguageContext";
import { StyleProfile } from "./StyleProfileForm";
import { 
  Star, 
  ShoppingBag, 
  Target, 
  Hash,
  Lightbulb,
  Loader2,
  AlertCircle
} from "lucide-react";

interface StyleAnalysisData {
  celebrityMatch: {
    name: string;
    reason: string;
    styleTip: string;
  };
  brandCuration: Array<{
    name: string;
    priceRange: string;
    reason: string;
  }>;
  actionPlan: string[];
  fittingGuide: string;
  styleTags: string[];
}

interface StyleAnalysisReportProps {
  profile: StyleProfile;
  analysisData?: StyleAnalysisData | null;
  isLoading?: boolean;
  error?: string | null;
}

const StyleAnalysisReport = ({ profile, analysisData, isLoading = false, error = null }: StyleAnalysisReportProps) => {
  const { t, language } = useLanguage();

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{t("report.analyzing")}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  // No data state
  if (!analysisData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t("report.noData")}</p>
      </div>
    );
  }

  // Price range translation helper
  const translatePriceRange = (priceRange: string) => {
    const priceMap: Record<string, { ko: string; en: string }> = {
      "저가": { ko: "저가", en: "Budget" },
      "중가": { ko: "중가", en: "Mid-range" },
      "고가": { ko: "고가", en: "Premium" },
      "budget": { ko: "저가", en: "Budget" },
      "mid-range": { ko: "중가", en: "Mid-range" },
      "premium": { ko: "고가", en: "Premium" },
    };
    const normalized = priceRange.toLowerCase();
    return priceMap[normalized]?.[language] || priceMap[priceRange]?.[language] || priceRange;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="font-display text-xl font-bold text-foreground mb-1">
          {t("report.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("report.subtitle")}
        </p>
      </div>

      {/* Celebrity Match */}
      {analysisData.celebrityMatch && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("report.celebrityMatch")}</h4>
          </div>
          <p className="font-medium text-lg mb-2">{analysisData.celebrityMatch.name}</p>
          <p className="text-sm text-muted-foreground mb-2">{analysisData.celebrityMatch.reason}</p>
          <p className="text-sm text-foreground">{analysisData.celebrityMatch.styleTip}</p>
        </div>
      )}

      {/* Brand Curation */}
      {analysisData.brandCuration && analysisData.brandCuration.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("report.brandCuration")}</h4>
          </div>
          <div className="space-y-3">
            {analysisData.brandCuration.map((brand, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary whitespace-nowrap">
                  {translatePriceRange(brand.priceRange)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{brand.name}</p>
                  <p className="text-sm text-muted-foreground">{brand.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Plan */}
      {analysisData.actionPlan && analysisData.actionPlan.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("report.actionPlan")}</h4>
          </div>
          <ul className="space-y-2">
            {analysisData.actionPlan.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fitting Guide */}
      {analysisData.fittingGuide && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("report.fittingGuide")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{analysisData.fittingGuide}</p>
        </div>
      )}

      {/* Style Tags */}
      {analysisData.styleTags && analysisData.styleTags.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("report.styleTags")}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysisData.styleTags.map((tag, i) => (
              <span 
                key={i}
                className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleAnalysisReport;
