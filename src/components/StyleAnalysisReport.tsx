import { useLanguage } from "@/contexts/LanguageContext";
import { StyleProfile } from "./StyleProfileForm";
import { 
  CheckCircle, 
  Palette, 
  MapPin, 
  Target, 
  Hash,
  TrendingUp
} from "lucide-react";

interface StyleAnalysisReportProps {
  profile: StyleProfile;
}

const StyleAnalysisReport = ({ profile }: StyleAnalysisReportProps) => {
  const { t } = useLanguage();

  const styleTags = profile.styles.filter(s => s !== "other").map(s => `#${t(`profile.style.${s}`)}`);
  if (profile.occasions.length > 0) {
    const mainOccasion = profile.occasions.find(o => o !== "other");
    if (mainOccasion) styleTags.push(`#${t(`profile.occasion.${mainOccasion}`)}룩`);
  }

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

      {/* Fit Analysis */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">{t("report.fitAnalysis")}</h4>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{t("report.fitTip1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{t("report.fitTip2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{t("report.fitTip3")}</span>
          </li>
        </ul>
      </div>

      {/* Color Analysis */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">{t("report.colorAnalysis")}</h4>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{t("report.colorTip1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{t("report.colorTip2")}</span>
          </li>
        </ul>
      </div>

      {/* TPO Analysis */}
      {profile.occasions.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("report.tpoAnalysis")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("report.tpoTip")}
          </p>
        </div>
      )}

      {/* Personal Goals */}
      {profile.concerns && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("report.personalGoals")}</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            "{profile.concerns}"
          </p>
          <p className="text-sm text-foreground">
            {t("report.goalTip")}
          </p>
        </div>
      )}

      {/* Style Tags */}
      {styleTags.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("report.styleTags")}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {styleTags.map((tag, i) => (
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
