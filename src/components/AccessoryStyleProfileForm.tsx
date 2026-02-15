import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Shirt, Target, Globe, Users, Gem, ShoppingBag, Footprints } from "lucide-react";

export interface AccessoryStyleProfile {
  gender: "male" | "female" | "other" | "";
  height: string;
  // Hat-specific
  faceShape: string[];
  faceShapeOther: string;
  hatStyles: string[];
  hatStyleOther: string;
  // Shoes-specific
  legShape: string[];
  legShapeOther: string;
  shoeStyles: string[];
  shoeStyleOther: string;
  // Bag-specific
  bagUsage: string[];
  bagUsageOther: string;
  bagStyles: string[];
  bagStyleOther: string;
  // Jewelry-specific
  skinTone: string;
  jewelryStyles: string[];
  jewelryStyleOther: string;
  // Common
  occasions: string[];
  occasionOther: string;
  concerns: string;
  country: string;
}

export const defaultAccessoryStyleProfile: AccessoryStyleProfile = {
  gender: "",
  height: "",
  faceShape: [],
  faceShapeOther: "",
  hatStyles: [],
  hatStyleOther: "",
  legShape: [],
  legShapeOther: "",
  shoeStyles: [],
  shoeStyleOther: "",
  bagUsage: [],
  bagUsageOther: "",
  bagStyles: [],
  bagStyleOther: "",
  skinTone: "",
  jewelryStyles: [],
  jewelryStyleOther: "",
  occasions: [],
  occasionOther: "",
  concerns: "",
  country: "",
};

type AccessoryCategory = "hat" | "shoes" | "bag" | "jewelry";

interface AccessoryStyleProfileFormProps {
  value: AccessoryStyleProfile;
  onChange: (profile: AccessoryStyleProfile) => void;
  category: AccessoryCategory;
}

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

const AccessoryStyleProfileForm = ({ value, onChange, category }: AccessoryStyleProfileFormProps) => {
  const { t } = useLanguage();

  const toggleSelection = (
    field: keyof AccessoryStyleProfile,
    key: string
  ) => {
    const current = value[field];
    if (!Array.isArray(current)) return;
    const updated = current.includes(key)
      ? current.filter((k: string) => k !== key)
      : [...current, key];
    onChange({ ...value, [field]: updated });
  };

  const occasionOptions = [
    { key: "daily", label: t("profile.occasion.daily") },
    { key: "date", label: t("profile.occasion.date") },
    { key: "work", label: t("profile.occasion.work") },
    { key: "event", label: t("profile.occasion.event") },
    { key: "travel", label: t("profile.occasion.travel") },
    { key: "other", label: t("profile.other") },
  ];

  // Category-specific options
  const faceShapeOptions = [
    { key: "round", label: t("accessoryProfile.faceShape.round") },
    { key: "oval", label: t("accessoryProfile.faceShape.oval") },
    { key: "square", label: t("accessoryProfile.faceShape.square") },
    { key: "heart", label: t("accessoryProfile.faceShape.heart") },
    { key: "long", label: t("accessoryProfile.faceShape.long") },
    { key: "other", label: t("profile.other") },
  ];

  const hatStyleOptions = [
    { key: "casual", label: t("accessoryProfile.hatStyle.casual") },
    { key: "sporty", label: t("accessoryProfile.hatStyle.sporty") },
    { key: "elegant", label: t("accessoryProfile.hatStyle.elegant") },
    { key: "street", label: t("accessoryProfile.hatStyle.street") },
    { key: "vintage", label: t("accessoryProfile.hatStyle.vintage") },
    { key: "other", label: t("profile.other") },
  ];

  const legShapeOptions = [
    { key: "straight", label: t("accessoryProfile.legShape.straight") },
    { key: "o_leg", label: t("accessoryProfile.legShape.oLeg") },
    { key: "x_leg", label: t("accessoryProfile.legShape.xLeg") },
    { key: "long", label: t("accessoryProfile.legShape.long") },
    { key: "short", label: t("accessoryProfile.legShape.short") },
    { key: "other", label: t("profile.other") },
  ];

  const shoeStyleOptions = [
    { key: "sneakers", label: t("accessoryProfile.shoeStyle.sneakers") },
    { key: "boots", label: t("accessoryProfile.shoeStyle.boots") },
    { key: "loafers", label: t("accessoryProfile.shoeStyle.loafers") },
    { key: "heels", label: t("accessoryProfile.shoeStyle.heels") },
    { key: "sandals", label: t("accessoryProfile.shoeStyle.sandals") },
    { key: "other", label: t("profile.other") },
  ];

  const bagUsageOptions = [
    { key: "commute", label: t("accessoryProfile.bagUsage.commute") },
    { key: "travel", label: t("accessoryProfile.bagUsage.travel") },
    { key: "casual", label: t("accessoryProfile.bagUsage.casual") },
    { key: "formal", label: t("accessoryProfile.bagUsage.formal") },
    { key: "other", label: t("profile.other") },
  ];

  const bagStyleOptions = [
    { key: "minimal", label: t("accessoryProfile.bagStyle.minimal") },
    { key: "luxury", label: t("accessoryProfile.bagStyle.luxury") },
    { key: "sporty", label: t("accessoryProfile.bagStyle.sporty") },
    { key: "casual", label: t("accessoryProfile.bagStyle.casual") },
    { key: "vintage", label: t("accessoryProfile.bagStyle.vintage") },
    { key: "other", label: t("profile.other") },
  ];

  const skinToneOptions = [
    { key: "warm", label: t("accessoryProfile.skinTone.warm") },
    { key: "cool", label: t("accessoryProfile.skinTone.cool") },
    { key: "neutral", label: t("accessoryProfile.skinTone.neutral") },
    { key: "unknown", label: t("accessoryProfile.skinTone.unknown") },
  ];

  const jewelryStyleOptions = [
    { key: "delicate", label: t("accessoryProfile.jewelryStyle.delicate") },
    { key: "bold", label: t("accessoryProfile.jewelryStyle.bold") },
    { key: "classic", label: t("accessoryProfile.jewelryStyle.classic") },
    { key: "modern", label: t("accessoryProfile.jewelryStyle.modern") },
    { key: "bohemian", label: t("accessoryProfile.jewelryStyle.bohemian") },
    { key: "other", label: t("profile.other") },
  ];

  const getConcernsPlaceholder = () => {
    switch (category) {
      case "hat": return t("accessoryProfile.concerns.hat");
      case "shoes": return t("accessoryProfile.concerns.shoes");
      case "bag": return t("accessoryProfile.concerns.bag");
      case "jewelry": return t("accessoryProfile.concerns.jewelry");
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case "hat": return <User className="w-4 h-4 text-primary" />;
      case "shoes": return <Footprints className="w-4 h-4 text-primary" />;
      case "bag": return <ShoppingBag className="w-4 h-4 text-primary" />;
      case "jewelry": return <Gem className="w-4 h-4 text-primary" />;
    }
  };

  const renderMultiSelect = (
    label: string,
    icon: React.ReactNode,
    options: { key: string; label: string }[],
    field: keyof AccessoryStyleProfile,
    otherField: keyof AccessoryStyleProfile
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="text-base font-semibold">{label}</Label>
        <span className="text-xs text-muted-foreground">({t("profile.multiSelect")})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ChipButton
            key={option.key}
            selected={(value[field] as string[]).includes(option.key)}
            onClick={() => toggleSelection(field, option.key)}
          >
            {option.label}
          </ChipButton>
        ))}
      </div>
      {(value[field] as string[]).includes("other") && (
        <Input
          type="text"
          placeholder={t("profile.otherPlaceholder")}
          value={value[otherField] as string}
          onChange={(e) => onChange({ ...value, [otherField]: e.target.value })}
          className="bg-card mt-2"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-8 pt-4">
      {/* Section Title */}
      <div className="text-center">
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          {t("accessoryProfile.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("accessoryProfile.subtitle")}
        </p>
      </div>

      {/* Style Report Notice */}
      <div className="bg-accent border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          ⚠️ {t("profile.reportNotice")}
        </p>
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.gender.label")}</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["male", "female", "other"] as const).map((g) => (
            <ChipButton
              key={g}
              selected={value.gender === g}
              onClick={() => onChange({ ...value, gender: g })}
            >
              {t(`profile.gender.${g}`)}
            </ChipButton>
          ))}
        </div>
      </div>


      {/* Category-specific fields */}
      {category === "hat" && (
        <>
          {renderMultiSelect(
            t("accessoryProfile.faceShape.label"),
            getCategoryIcon(),
            faceShapeOptions,
            "faceShape",
            "faceShapeOther"
          )}
          {renderMultiSelect(
            t("accessoryProfile.hatStyle.label"),
            <Shirt className="w-4 h-4 text-primary" />,
            hatStyleOptions,
            "hatStyles",
            "hatStyleOther"
          )}
        </>
      )}

      {category === "shoes" && (
        <>
          {renderMultiSelect(
            t("accessoryProfile.legShape.label"),
            getCategoryIcon(),
            legShapeOptions,
            "legShape",
            "legShapeOther"
          )}
          {renderMultiSelect(
            t("accessoryProfile.shoeStyle.label"),
            <Shirt className="w-4 h-4 text-primary" />,
            shoeStyleOptions,
            "shoeStyles",
            "shoeStyleOther"
          )}
        </>
      )}

      {category === "bag" && (
        <>
          {renderMultiSelect(
            t("accessoryProfile.bagUsage.label"),
            getCategoryIcon(),
            bagUsageOptions,
            "bagUsage",
            "bagUsageOther"
          )}
          {renderMultiSelect(
            t("accessoryProfile.bagStyle.label"),
            <Shirt className="w-4 h-4 text-primary" />,
            bagStyleOptions,
            "bagStyles",
            "bagStyleOther"
          )}
        </>
      )}

      {category === "jewelry" && (
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getCategoryIcon()}
              <Label className="text-base font-semibold">{t("accessoryProfile.skinTone.label")}</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {skinToneOptions.map((option) => (
                <ChipButton
                  key={option.key}
                  selected={value.skinTone === option.key}
                  onClick={() => onChange({ ...value, skinTone: option.key })}
                >
                  {option.label}
                </ChipButton>
              ))}
            </div>
          </div>
          {renderMultiSelect(
            t("accessoryProfile.jewelryStyle.label"),
            <Shirt className="w-4 h-4 text-primary" />,
            jewelryStyleOptions,
            "jewelryStyles",
            "jewelryStyleOther"
          )}
        </>
      )}

      {/* Occasion (common) */}
      {renderMultiSelect(
        t("profile.occasion.label"),
        <Shirt className="w-4 h-4 text-primary" />,
        occasionOptions,
        "occasions",
        "occasionOther"
      )}

      {/* Country */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.country.label")}</Label>
          <span className="text-xs text-muted-foreground">({t("upload.optional")})</span>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">{t("profile.country.hint")}</p>
        <Input
          type="text"
          placeholder={t("profile.country.placeholder")}
          value={value.country}
          onChange={(e) => onChange({ ...value, country: e.target.value })}
          className="bg-card"
        />
      </div>

      {/* Concerns */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">{t("profile.concerns.label")}</Label>
          <span className="text-xs text-muted-foreground">({t("upload.optional")})</span>
        </div>
        <Textarea
          placeholder={getConcernsPlaceholder()}
          value={value.concerns}
          onChange={(e) => onChange({ ...value, concerns: e.target.value })}
          className="bg-card resize-none min-h-[100px]"
        />
      </div>
    </div>
  );
};

export default AccessoryStyleProfileForm;
