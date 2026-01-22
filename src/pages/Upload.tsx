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
import { ArrowLeft, ArrowRight, Loader2, Check, X, AlertCircle, Shirt, PanelBottom, Layers } from "lucide-react";
import { toast } from "sonner";
import { preprocessPersonImage, preprocessTopGarment, preprocessBottomGarment } from "@/utils/imagePreprocess";

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
type FullModeType = "separate" | "single";

const Upload = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, profile, loading, refreshProfile } = useAuth();
  const [mode, setMode] = useState<TryonMode>("top");
  const [fullModeType, setFullModeType] = useState<FullModeType>("separate");
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
  });

  // 로그인 상태 확인 - 로그인 안 된 경우 리다이렉트
  useEffect(() => {
    if (!loading && !session) {
      toast.error("로그인이 필요합니다.");
      navigate("/auth");
    }
  }, [loading, session, navigate]);

  // Get required credits based on mode and fullModeType
  const getRequiredCredits = () => {
    if (mode === "full") {
      return fullModeType === "single" ? 1 : 2;
    }
    return 1;
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

    if (mode === "full") {
      if (fullModeType === "separate" && (!topFile || !bottomFile)) {
        toast.error(t("upload.fullModeRequired"));
        return;
      }
      if (fullModeType === "single" && !outfitFile) {
        toast.error(t("upload.outfitRequired"));
        return;
      }
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
      
      // Full mode handling
      if (mode === "full") {
        formData.append("fullModeType", fullModeType);
        
        if (fullModeType === "single" && outfitFile) {
          // Single outfit image mode
          const processedOutfit = await preprocessTopGarment(outfitFile);
          formData.append("top_garment", processedOutfit);
        } else {
          // Separate mode: top and bottom
          if (processedTop) {
            formData.append("top_garment", processedTop);
          }
          if (processedBottom) {
            formData.append("bottom_garment", processedBottom);
          }
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
      console.log("[Upload] Calling tryon-proxy via supabase.functions.invoke()...", { mode, fullModeType });

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
      sessionStorage.setItem("styleProfile", JSON.stringify(styleProfile));
      sessionStorage.setItem("tryonMode", mode);
      sessionStorage.setItem("fullModeType", fullModeType);

      // Full mode returns needsContinue: true from backend
      const responseData = data as any;
      if (responseData.needsContinue && responseData.mode === "full") {
        // Navigate with step1TaskId for 2-step flow
        navigate(`/result/${responseData.taskId}?mode=full&needsContinue=true&step1TaskId=${responseData.taskId}`);
      } else {
        navigate(`/result/${responseData.taskId}?mode=${mode}`);
      }
    } catch (err) {
      console.error("[Upload Error]", err);
      toast.error("Request failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Check credits before showing confirm dialog
  const handleOpenConfirm = async () => {
    if (!canSubmit) return;
    
    // Refresh profile to get latest credits
    await refreshProfile();
    
    const requiredCredits = getRequiredCredits();
    if (profile && profile.credits < requiredCredits) {
      setShowNoCreditsDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  // Determine if form can be submitted based on mode
  const getCanSubmit = () => {
    if (!personFile || isSubmitting || !session?.access_token) return false;
    
    if (mode === "top") return !!topFile;
    if (mode === "bottom") return !!bottomFile;
    if (mode === "full") {
      if (fullModeType === "single") return !!outfitFile;
      return !!topFile && !!bottomFile;
    }
    
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

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    handleSubmit();
  };

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
      credits: 2,
      desc: t("upload.mode.fullDesc")
    },
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
      <div className="max-w-2xl mx-auto px-4 py-8 pb-36">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 tracking-tight">
            {t("upload.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("upload.subtitle")}
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-8">
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

        <div className="space-y-8">
          {/* Person Image - Always shown */}
          <ImageUploadZone
            label={t("upload.person.label")}
            description={t("upload.person.desc")}
            requirements={[
              t("upload.person.req1"),
              t("upload.person.req2"),
              t("upload.person.req3"),
              t("upload.person.req4"),
              t("upload.person.req5"),
            ]}
            file={personFile}
            onFileChange={setPersonFile}
            showPersonNotice
          />

          {/* Top Garment - Show for "top" mode only */}
          {mode === "top" && (
            <ImageUploadZone
              label={t("upload.top.label")}
              description={t("upload.top.desc")}
              requirements={[
                t("upload.top.req1"),
                t("upload.top.req2"),
                t("upload.top.req3"),
                t("upload.top.req4"),
              ].filter(Boolean)}
              file={topFile}
              onFileChange={setTopFile}
              garmentType="top"
            />
          )}

          {/* Bottom Garment - Show for "bottom" mode only */}
          {mode === "bottom" && (
            <ImageUploadZone
              label={t("upload.bottom.label")}
              description={t("upload.bottom.desc")}
              requirements={[
                t("upload.bottom.req1"),
                t("upload.bottom.req2"),
              ]}
              file={bottomFile}
              onFileChange={setBottomFile}
              garmentType="bottom"
            />
          )}

          {/* Full Mode - Sub-selection */}
          {mode === "full" && (
            <>
              {/* Full Mode Type Selection */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  {t("upload.fullMode.typeTitle")}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFullModeType("separate")}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      fullModeType === "separate"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${fullModeType === "separate" ? "text-primary" : "text-foreground"}`}>
                      {t("upload.fullMode.separate")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("upload.fullMode.separateDesc")}
                    </p>
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      fullModeType === "separate" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      2 {t("upload.mode.credit")}
                    </div>
                  </button>
                  <button
                    onClick={() => setFullModeType("single")}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      fullModeType === "single"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${fullModeType === "single" ? "text-primary" : "text-foreground"}`}>
                      {t("upload.fullMode.single")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("upload.fullMode.singleDesc")}
                    </p>
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      fullModeType === "single" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      1 {t("upload.mode.credit")}
                    </div>
                  </button>
                </div>
              </div>

              {/* Separate Mode: Top and Bottom */}
              {fullModeType === "separate" && (
                <>
                  <ImageUploadZone
                    label={t("upload.top.label")}
                    description={t("upload.top.desc")}
                    requirements={[
                      t("upload.top.req1"),
                      t("upload.top.req2"),
                      t("upload.top.req3"),
                      t("upload.top.req4"),
                    ].filter(Boolean)}
                    file={topFile}
                    onFileChange={setTopFile}
                    garmentType="top"
                  />
                  <ImageUploadZone
                    label={t("upload.bottom.label")}
                    description={t("upload.bottom.descFull")}
                    requirements={[
                      t("upload.bottom.req1"),
                      t("upload.bottom.req2"),
                    ]}
                    file={bottomFile}
                    onFileChange={setBottomFile}
                    garmentType="bottom"
                  />
                </>
              )}

              {/* Single Mode: One Outfit Image */}
              {fullModeType === "single" && (
                <ImageUploadZone
                  label={t("upload.outfit.label")}
                  description={t("upload.outfit.desc")}
                  requirements={[
                    t("upload.outfit.req1"),
                    t("upload.outfit.req2"),
                  ]}
                  file={outfitFile}
                  onFileChange={setOutfitFile}
                />
              )}
            </>
          )}

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
              {mode === "full" ? t("upload.fullModeRequired") : t("upload.required")}
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
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
            
            {/* Full Mode - Separate */}
            {mode === "full" && fullModeType === "separate" && (
              <>
                <CheckItem label={t("upload.confirm.top")} isReady={!!topFile} />
                <CheckItem label={t("upload.confirm.bottom")} isReady={!!bottomFile} />
              </>
            )}
            
            {/* Full Mode - Single Outfit */}
            {mode === "full" && fullModeType === "single" && (
              <CheckItem label={t("upload.confirm.outfit")} isReady={!!outfitFile} />
            )}
            
            <CheckItem label={t("upload.confirm.profile")} isReady={isProfileFilled} isOptional />
          </div>
          
          {/* Accuracy Tips - Show for top/bottom/separate modes */}
          {(mode === "top" || mode === "bottom" || (mode === "full" && fullModeType === "separate")) && (
            <div className="bg-primary/10 rounded-lg p-3 text-xs text-foreground border border-primary/20 mb-3">
              <p className="font-medium mb-1">💡 {t("upload.confirm.accuracyTitle")}</p>
              {(mode === "top" || (mode === "full" && fullModeType === "separate")) && (
                <p>• {t("upload.confirm.topAccuracyTip")}</p>
              )}
              {(mode === "bottom" || (mode === "full" && fullModeType === "separate")) && (
                <p>• {t("upload.confirm.bottomAccuracyTip")}</p>
              )}
            </div>
          )}
          
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
            <Button variant="gradient" onClick={handleConfirmSubmit}>
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
