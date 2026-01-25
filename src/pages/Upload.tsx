import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ImageUploadZone from "@/components/ImageUploadZone";
import StyleProfileForm, { StyleProfile } from "@/components/StyleProfileForm";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import Logo from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Loader2, Check, X, AlertCircle, Shirt, PanelBottom, Layers, Image, Zap } from "lucide-react";
import { toast } from "sonner";
import { preprocessPersonImage, preprocessTopGarment, preprocessBottomGarment } from "@/utils/imagePreprocess";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TryonMode = "top" | "bottom" | "full";
type GarmentPhotoType = "flat-lay" | "model" | null;
type RunMode = "performance" | "quality" | null;

const Upload = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, profile, loading, refreshProfile } = useAuth();
  const [mode, setMode] = useState<TryonMode>("top");
  const [garmentPhotoType, setGarmentPhotoType] = useState<GarmentPhotoType>(null);
  const [runMode, setRunMode] = useState<RunMode>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);
  const [outfitFile, setOutfitFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
  
  const [styleProfile, setStyleProfile] = useState<StyleProfile>({
    height: "",
    bodyTypes: [],
    bodyTypeOther: "",
    occasions: [],
    occasionOther: "",
    styles: [],
    styleOther: "",
    concerns: "",
    runMode: "performance",
    garmentPhotoType: "flat-lay",
  });

  // 로그인 상태 확인 - 로그인 안 된 경우 리다이렉트
  useEffect(() => {
    if (!loading && !session) {
      toast.error("로그인이 필요합니다.");
      navigate("/auth");
    }
  }, [loading, session, navigate]);

  // Get required credits based on mode
  const getRequiredCredits = () => {
    return 1; // All modes now cost 1 credit
  };

  const handleSubmit = async () => {
    // Validate based on mode
    if (!personFile) {
      toast.error(t("upload.required"));
      return;
    }

    if (mode === "top" && !topFile) {
      toast.error(t("upload.required"));
      return;
    }

    if (mode === "bottom" && !bottomFile) {
      toast.error(t("upload.required"));
      return;
    }

    if (mode === "full" && !outfitFile) {
      toast.error(t("upload.outfitRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      // 제출 직전에 세션을 강제로 갱신하여 최신 access_token 확보
      console.log("[Upload] Refreshing session before submit...", {
        currentOrigin: window.location.origin,
      });

      // 세션 강제 갱신
      const { data: { session: freshSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("[Upload] Session refresh failed:", refreshError.message);
        toast.error("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
        setIsSubmitting(false);
        navigate("/auth");
        return;
      }

      if (!freshSession?.access_token) {
        console.error("[Upload] No access token after refresh");
        toast.error("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
        setIsSubmitting(false);
        navigate("/auth");
        return;
      }

      // 디버그: 토큰 상태 확인
      console.log("[Upload] Token check:", {
        hasToken: !!freshSession.access_token,
        tokenLength: freshSession.access_token?.length,
        expiresAt: freshSession.expires_at,
        userId: freshSession.user?.id,
      });

      // ✅ 클라이언트 측 이미지 전처리 (병렬 처리로 성능 최적화)
      console.log("[Upload] 이미지 전처리 시작 (병렬)...");
      const preprocessStart = performance.now();
      
      // Promise.all()로 병렬 처리하여 2-3초 단축
      const [processedPerson, processedTop, processedBottom] = await Promise.all([
        preprocessPersonImage(personFile),
        topFile ? preprocessTopGarment(topFile) : Promise.resolve(null),
        bottomFile ? preprocessBottomGarment(bottomFile) : Promise.resolve(null),
      ]);
      
      const preprocessTime = Math.round(performance.now() - preprocessStart);
      console.log(`[Upload] 이미지 전처리 완료 (${preprocessTime}ms)`);

      const formData = new FormData();
      formData.append("person_image", processedPerson);
      formData.append("mode", mode);
      
      // Append runMode and garmentPhotoType for Fashn.ai API
      formData.append("runMode", runMode);
      formData.append("garmentPhotoType", garmentPhotoType);
      
      // Full mode handling
      if (mode === "full") {
        formData.append("fullModeType", "single");
        
        if (outfitFile) {
          const processedOutfit = await preprocessTopGarment(outfitFile);
          formData.append("top_garment", processedOutfit);
        }
      } else {
        // Top or Bottom mode
        if (processedTop) {
          formData.append("top_garment", processedTop);
        }
        if (processedBottom) {
          formData.append("bottom_garment", processedBottom);
        }
      }

      // ✅ 공식 SDK 호출 사용
      console.log("[Upload] Calling tryon-proxy via supabase.functions.invoke()...", { mode, runMode, garmentPhotoType });

      supabase.functions.setAuth(freshSession.access_token);

      const { data, error } = await supabase.functions.invoke("tryon-proxy", {
        body: formData,
        headers: {
          "x-user-token": freshSession.access_token,
        },
      });

      if (error) {
        const status = (error as any)?.context?.status as number | undefined;
        console.error("[Upload Error] invoke failed:", status, error);

        if (status === 402) {
          setIsSubmitting(false);
          setShowNoCreditsDialog(true);
          return;
        }

        const is401 = status === 401;
        toast.error(
          is401
            ? "로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인해주세요."
            : (error as any)?.message || "요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요."
        );
        setIsSubmitting(false);
        if (is401) navigate("/auth");
        return;
      }

      if ((data as any)?.error) {
        console.error("[Upload Error]", data);
        toast.error("Unable to process your request. Please try again later.");
        setIsSubmitting(false);
        return;
      }

      // Store style profile in sessionStorage for the result page
      const updatedStyleProfile = { ...styleProfile, runMode, garmentPhotoType };
      sessionStorage.setItem("styleProfile", JSON.stringify(updatedStyleProfile));
      sessionStorage.setItem("tryonMode", mode);
      sessionStorage.setItem("fullModeType", "single");

      const responseData = data as any;
      navigate(`/result/${responseData.taskId}?mode=${mode}`);
    } catch (err) {
      console.error("[Upload Error]", err);
      toast.error("Request failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Check credits before showing confirm dialog
  const handleOpenConfirm = async () => {
    if (!canSubmit) return;
    
    // Validate garmentPhotoType selection
    if (!garmentPhotoType) {
      toast.error(t("upload.validation.garmentPhotoType"));
      return;
    }
    
    // Refresh profile to get latest credits
    await refreshProfile();
    
    const requiredCredits = getRequiredCredits();
    if (profile && profile.credits < requiredCredits) {
      setShowNoCreditsDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };
  
  // Handle confirm submit with runMode validation
  const handleConfirmSubmitWithValidation = () => {
    if (!runMode) {
      toast.error(t("upload.validation.runMode"));
      return;
    }
    setShowConfirmDialog(false);
    handleSubmit();
  };

  // Determine if form can be submitted based on mode
  const getCanSubmit = () => {
    if (!personFile || isSubmitting || !session?.access_token) return false;
    
    if (mode === "top") return !!topFile;
    if (mode === "bottom") return !!bottomFile;
    if (mode === "full") return !!outfitFile;
    
    return false;
  };

  const canSubmit = getCanSubmit();

  // 로딩 중일 때 로딩 UI 표시
  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  const isProfileFilled = 
    styleProfile.height.trim() !== "" ||
    styleProfile.bodyTypes.length > 0 ||
    styleProfile.occasions.length > 0 ||
    styleProfile.styles.length > 0 ||
    styleProfile.concerns.trim() !== "";


  const CheckItem = ({ label, isReady, isOptional = false }: { label: string; isReady: boolean; isOptional?: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <span className="font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {isReady ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">{t("upload.confirm.ready")}</span>
          </>
        ) : (
          <>
            <X className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isOptional ? t("upload.confirm.optional") : t("upload.confirm.notReady")}
            </span>
          </>
        )}
      </div>
    </div>
  );

  const modeOptions = [
    { 
      id: "top" as TryonMode, 
      icon: Shirt, 
      label: t("upload.mode.top"), 
      credits: 1,
      desc: t("upload.mode.topDesc")
    },
    { 
      id: "bottom" as TryonMode, 
      icon: PanelBottom, 
      label: t("upload.mode.bottom"), 
      credits: 1,
      desc: t("upload.mode.bottomDesc")
    },
    { 
      id: "full" as TryonMode, 
      icon: Layers, 
      label: t("upload.mode.full"), 
      credits: 1,
      desc: t("upload.mode.fullDescSingle") || t("upload.mode.fullDesc")
    },
  ];

  const garmentPhotoOptions = [
    { value: "flat-lay" as GarmentPhotoType, label: t("profile.garmentType.flatLay"), desc: t("profile.garmentType.flatLayDesc") },
    { value: "model" as GarmentPhotoType, label: t("profile.garmentType.model"), desc: t("profile.garmentType.modelDesc") },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t("upload.back")}</span>
          </Link>
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-36" id="upload-section">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 tracking-tight">
            {t("upload.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("upload.subtitle")}
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-foreground mb-3 font-display">
            {t("upload.mode.title")}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {modeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setMode(option.id)}
                className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                  mode === option.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <option.icon className={`w-6 h-6 mb-2 ${mode === option.id ? "text-primary" : "text-muted-foreground"}`} />
                <p className={`text-sm font-semibold ${mode === option.id ? "text-primary" : "text-foreground"}`}>
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {option.desc}
                </p>
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  mode === option.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {option.credits} {t("upload.mode.credit")}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Person Image with Mode-specific notice */}
          <ImageUploadZone
            label={t("upload.person.label")}
            description={t("upload.person.desc")}
            file={personFile}
            onFileChange={setPersonFile}
            modeNotice={
              mode === "top" ? t("upload.person.guide.top") :
              mode === "bottom" ? t("upload.person.guide.bottom") :
              t("upload.person.guide.full")
            }
          />
          
          {/* Person Photo Tips - Visible directly */}
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
            <p className="text-xs font-bold text-foreground mb-2">{t("upload.guide.personSection")}</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• {t("upload.guide.person.pose")}</li>
              <li>• {t("upload.guide.person.attire")}</li>
              <li>• {t("upload.guide.person.background")}</li>
              <li>• {t("upload.guide.person.size")}</li>
              <li>• {t("upload.guide.person.noGroup")}</li>
              <li>• {t("upload.guide.person.noHolding")}</li>
            </ul>
          </div>

          {/* Garment Photo Type Selection - Between person and garment photos */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{t("profile.garmentType.label")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {garmentPhotoOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGarmentPhotoType(option.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    garmentPhotoType === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <p className={`text-sm font-semibold ${garmentPhotoType === option.value ? "text-primary" : "text-foreground"}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Top Garment - Show for "top" mode only */}
          {mode === "top" && (
            <ImageUploadZone
              label={t("upload.top.label")}
              description={t("upload.top.desc")}
              file={topFile}
              onFileChange={setTopFile}
              garmentType="top"
            />
          )}

          {/* Bottom Garment - Show for "bottom" mode only */}
          {mode === "bottom" && (
            <ImageUploadZone
              label={t("upload.bottom.label")}
              description={t("upload.bottom.descFull")}
              file={bottomFile}
              onFileChange={setBottomFile}
              garmentType="bottom"
            />
          )}

          {/* Full Mode - Single Outfit Image */}
          {mode === "full" && (
            <ImageUploadZone
              label={t("upload.outfit.label")}
              description={t("upload.outfit.desc")}
              file={outfitFile}
              onFileChange={setOutfitFile}
            />
          )}
          
          {/* Garment Photo Tips - Visible directly after garment upload */}
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
            <p className="text-xs font-bold text-foreground mb-2">{t("upload.guide.garmentSection")}</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• {t("upload.guide.garment.flatLay")}</li>
              <li>• {t("upload.guide.garment.noOverlap")}</li>
              <li>• {t("upload.guide.garment.frontView")}</li>
              <li>• {t("upload.guide.garment.wrinkle")}</li>
            </ul>
          </div>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                {t("profile.title")}
              </span>
            </div>
          </div>

          {/* Style Profile Form */}
          <StyleProfileForm
            value={styleProfile}
            onChange={setStyleProfile}
          />
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="gradient"
            size="lg"
            className="w-full group"
            disabled={!canSubmit}
            onClick={handleOpenConfirm}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("upload.submitting")}
              </>
            ) : (
              <>
                {t("upload.submit")} ({getRequiredCredits()} {t("upload.mode.credit")})
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
          {!canSubmit && !isSubmitting && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {t("upload.required")}
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog with Fitting Mode Selection */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("upload.confirm.title")}</DialogTitle>
            <DialogDescription>
              {t("upload.confirm.description") || "업로드 항목을 확인하세요."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="font-medium text-foreground">{t("upload.mode.title")}</span>
              <span className="text-sm text-primary font-semibold">
                {modeOptions.find(m => m.id === mode)?.label} ({getRequiredCredits()} {t("upload.mode.credit")})
              </span>
            </div>
            <CheckItem label={t("upload.confirm.person")} isReady={!!personFile} />
            
            {/* Top Only Mode */}
            {mode === "top" && (
              <CheckItem label={t("upload.confirm.top")} isReady={!!topFile} />
            )}
            
            {/* Bottom Only Mode */}
            {mode === "bottom" && (
              <CheckItem label={t("upload.confirm.bottom")} isReady={!!bottomFile} />
            )}
            
            {/* Full Mode */}
            {mode === "full" && (
              <CheckItem label={t("upload.confirm.outfit")} isReady={!!outfitFile} />
            )}
            
            <CheckItem label={t("upload.confirm.profile")} isReady={isProfileFilled} isOptional />
          </div>
          
          {/* Fitting Mode Selection in Dialog */}
          <div className="space-y-3 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{t("profile.runMode.label")}</span>
            </div>
            <RadioGroup
              value={runMode || ""}
              onValueChange={(val) => setRunMode(val as RunMode)}
              className="grid grid-cols-1 gap-2"
            >
              <label
                htmlFor="dialog-mode-performance"
                className={`relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  runMode === "performance"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="performance" id="dialog-mode-performance" />
                <div className="flex-1 flex items-center justify-between">
                  <span className={`text-sm font-semibold ${runMode === "performance" ? "text-primary" : "text-foreground"}`}>
                    {t("profile.runMode.performance")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    ~10s
                  </span>
                </div>
              </label>
              <label
                htmlFor="dialog-mode-quality"
                className={`relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  runMode === "quality"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="quality" id="dialog-mode-quality" />
                <div className="flex-1 flex items-center justify-between">
                  <span className={`text-sm font-semibold ${runMode === "quality" ? "text-primary" : "text-foreground"}`}>
                    {t("profile.runMode.quality")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground font-medium">
                    ~20s
                  </span>
                </div>
              </label>
            </RadioGroup>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground mb-3">
            💡 {t("upload.confirm.qualityNotice")}
          </div>
          <div className="bg-accent/50 rounded-lg p-3 text-xs text-accent-foreground border border-accent">
            📂 {t("upload.confirm.dashboardNotice")}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t("upload.confirm.cancel")}
            </Button>
            <Button variant="gradient" onClick={handleConfirmSubmitWithValidation}>
              {t("upload.confirm.start")}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Credits Alert Dialog */}
      <AlertDialog open={showNoCreditsDialog} onOpenChange={setShowNoCreditsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              {t("upload.noCredits.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("upload.noCredits.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowNoCreditsDialog(false)}>
              {t("upload.noCredits.cancel")}
            </Button>
            <AlertDialogAction asChild>
              <Button variant="gradient" onClick={() => navigate("/mypage")}>
                {t("upload.noCredits.purchase")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Upload;
