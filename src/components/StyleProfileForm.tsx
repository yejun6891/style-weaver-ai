import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ruler, User, Calendar, Shirt, Target, Globe, Users } from "lucide-react";

export type RunMode = "performance" | "quality";
export type GarmentPhotoType = "flat-lay" | "model";
export type Gender = "male" | "female" | "other";

export interface StyleProfile {
  gender: Gender | "";
  height: string;
  bodyTypes: string[];
  bodyTypeOther: string;
  occasions: string[];
  occasionOther: string;
  styles: string[];
  styleOther: string;
  concerns: string;
  runMode: RunMode;
  garmentPhotoType: GarmentPhotoType;
  country: string;
}

interface StyleProfileFormProps {
  value: StyleProfile;
  onChange: (profile: StyleProfile) => void;
}

const StyleProfileForm = ({ value, onChange }: StyleProfileFormProps) => {
  const { t } = useLanguage();

  const bodyTypeOptions = [
    { key: "upper_heavy", label: t("profile.bodyType.upperHeavy") },
    { key: "lower_heavy", label: t("profile.bodyType.lowerHeavy") },
    { key: "wide_shoulders", label: t("profile.bodyType.wideShoulders") },
    { key: "narrow_shoulders", label: t("profile.bodyType.narrowShoulders") },
    { key: "straight", label: t("profile.bodyType.straight") },
    { key: "slim", label: t("profile.bodyType.slim") },
    { key: "other", label: t("profile.other") },
  ];

  const occasionOptions = [
    { key: "daily", label: t("profile.occasion.daily") },
    { key: "date", label: t("profile.occasion.date") },
    { key: "work", label: t("profile.occasion.work") },
    { key: "interview", label: t("profile.occasion.interview") },
    { key: "event", label: t("profile.occasion.event") },
    { key: "travel", label: t("profile.occasion.travel") },
    { key: "other", label: t("profile.other") },
  ];

  const styleOptions = [
    { key: "minimal", label: t("profile.style.minimal") },
    { key: "casual", label: t("profile.style.casual") },
    { key: "street", label: t("profile.style.street") },
    { key: "formal", label: t("profile.style.formal") },
    { key: "romantic", label: t("profile.style.romantic") },
    { key: "vintage", label: t("profile.style.vintage") },
    { key: "other", label: t("profile.other") },
  ];

  // Country is now a free-text input instead of predefined options

  const toggleSelection = (
    field: "bodyTypes" | "occasions" | "styles",
    key: string
  ) => {
    const current = value[field];
    const updated = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    onChange({ ...value, [field]: updated });
  };

  const ChipButton = ({
    selected,
    onClick,
    children,
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8 pt-4">
      {/* Section Title */}
      <div className="text-center">
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          {t("profile.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("profile.subtitle")}
        </p>
      </div>

      {/* Style Report Notice */}
      <div className="bg-accent border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          ⚠️ {t("profile.reportNotice")}
        </p>
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.gender.label")}</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          <ChipButton
            selected={value.gender === "male"}
            onClick={() => onChange({ ...value, gender: "male" })}
          >
            {t("profile.gender.male")}
          </ChipButton>
          <ChipButton
            selected={value.gender === "female"}
            onClick={() => onChange({ ...value, gender: "female" })}
          >
            {t("profile.gender.female")}
          </ChipButton>
          <ChipButton
            selected={value.gender === "other"}
            onClick={() => onChange({ ...value, gender: "other" })}
          >
            {t("profile.gender.other")}
          </ChipButton>
        </div>
      </div>

      {/* Height */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.height")}</Label>
        </div>
        <Input
          type="text"
          placeholder={t("profile.heightPlaceholder")}
          value={value.height}
          onChange={(e) => onChange({ ...value, height: e.target.value })}
          className="bg-card"
        />
      </div>

      {/* Body Type */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.bodyType.label")}</Label>
          <span className="text-xs text-muted-foreground">({t("profile.multiSelect")})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {bodyTypeOptions.map((option) => (
            <ChipButton
              key={option.key}
              selected={value.bodyTypes.includes(option.key)}
              onClick={() => toggleSelection("bodyTypes", option.key)}
            >
              {option.label}
            </ChipButton>
          ))}
        </div>
        {value.bodyTypes.includes("other") && (
          <Input
            type="text"
            placeholder={t("profile.otherPlaceholder")}
            value={value.bodyTypeOther}
            onChange={(e) => onChange({ ...value, bodyTypeOther: e.target.value })}
            className="bg-card mt-2"
          />
        )}
      </div>

      {/* Occasion (TPO) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.occasion.label")}</Label>
          <span className="text-xs text-muted-foreground">({t("profile.multiSelect")})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {occasionOptions.map((option) => (
            <ChipButton
              key={option.key}
              selected={value.occasions.includes(option.key)}
              onClick={() => toggleSelection("occasions", option.key)}
            >
              {option.label}
            </ChipButton>
          ))}
        </div>
        {value.occasions.includes("other") && (
          <Input
            type="text"
            placeholder={t("profile.otherPlaceholder")}
            value={value.occasionOther}
            onChange={(e) => onChange({ ...value, occasionOther: e.target.value })}
            className="bg-card mt-2"
          />
        )}
      </div>

      {/* Preferred Style */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.style.label")}</Label>
          <span className="text-xs text-muted-foreground">({t("profile.multiSelect")})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {styleOptions.map((option) => (
            <ChipButton
              key={option.key}
              selected={value.styles.includes(option.key)}
              onClick={() => toggleSelection("styles", option.key)}
            >
              {option.label}
            </ChipButton>
          ))}
        </div>
        {value.styles.includes("other") && (
          <Input
            type="text"
            placeholder={t("profile.otherPlaceholder")}
            value={value.styleOther}
            onChange={(e) => onChange({ ...value, styleOther: e.target.value })}
            className="bg-card mt-2"
          />
        )}
      </div>

      {/* Country Input */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.country.label")}</Label>
          <span className="text-xs text-muted-foreground">({t("upload.optional")})</span>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          {t("profile.country.hint")}
        </p>
        <Input
          type="text"
          placeholder={t("profile.country.placeholder")}
          value={value.country}
          onChange={(e) => onChange({ ...value, country: e.target.value })}
          className="bg-card"
        />
      </div>

      {/* Fashion Concerns / Goals */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.concerns.label")}</Label>
          <span className="text-xs text-muted-foreground">({t("upload.optional")})</span>
        </div>
        <Textarea
          placeholder={t("profile.concerns.placeholder")}
          value={value.concerns}
          onChange={(e) => onChange({ ...value, concerns: e.target.value })}
          className="bg-card resize-none min-h-[100px]"
        />
      </div>
    </div>
  );
};

export default StyleProfileForm;
