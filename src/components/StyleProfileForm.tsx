import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ruler, User, Calendar, Shirt, Target, Zap, Image } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type RunMode = "performance" | "quality";
export type GarmentPhotoType = "flat-lay" | "model";

export interface StyleProfile {
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

      {/* Fitting Options Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <div className="text-center">
          <h3 className="font-display text-xl font-bold text-foreground mb-2">
            {t("profile.fittingOptions.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("profile.fittingOptions.subtitle")}
          </p>
        </div>

        {/* Run Mode Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <Label className="text-base font-semibold">{t("profile.runMode.label")}</Label>
          </div>
          <RadioGroup
            value={value.runMode}
            onValueChange={(val) => onChange({ ...value, runMode: val as RunMode })}
            className="grid grid-cols-1 gap-3"
          >
            <label
              htmlFor="mode-performance"
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                value.runMode === "performance"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value="performance" id="mode-performance" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${value.runMode === "performance" ? "text-primary" : "text-foreground"}`}>
                    {t("profile.runMode.performance")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    ~10s
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("profile.runMode.performanceDesc")}
                </p>
              </div>
            </label>
            <label
              htmlFor="mode-quality"
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                value.runMode === "quality"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value="quality" id="mode-quality" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${value.runMode === "quality" ? "text-primary" : "text-foreground"}`}>
                    {t("profile.runMode.quality")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground font-medium">
                    ~20s
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("profile.runMode.qualityDesc")}
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Garment Photo Type Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            <Label className="text-base font-semibold">{t("profile.garmentType.label")}</Label>
          </div>
          <RadioGroup
            value={value.garmentPhotoType}
            onValueChange={(val) => onChange({ ...value, garmentPhotoType: val as GarmentPhotoType })}
            className="grid grid-cols-1 gap-3"
          >
            <label
              htmlFor="garment-flat-lay"
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                value.garmentPhotoType === "flat-lay"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value="flat-lay" id="garment-flat-lay" className="mt-1" />
              <div className="flex-1">
                <span className={`font-semibold ${value.garmentPhotoType === "flat-lay" ? "text-primary" : "text-foreground"}`}>
                  {t("profile.garmentType.flatLay")}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("profile.garmentType.flatLayDesc")}
                </p>
              </div>
            </label>
            <label
              htmlFor="garment-model"
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                value.garmentPhotoType === "model"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value="model" id="garment-model" className="mt-1" />
              <div className="flex-1">
                <span className={`font-semibold ${value.garmentPhotoType === "model" ? "text-primary" : "text-foreground"}`}>
                  {t("profile.garmentType.model")}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("profile.garmentType.modelDesc")}
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default StyleProfileForm;
