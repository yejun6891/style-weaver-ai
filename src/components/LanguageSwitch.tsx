import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "ko" ? "en" : "ko")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
    >
      <Globe className="w-4 h-4" />
      <span>{language === "ko" ? "EN" : "한국어"}</span>
    </button>
  );
};

export default LanguageSwitch;
