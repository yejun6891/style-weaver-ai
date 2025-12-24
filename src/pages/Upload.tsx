import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ImageUploadZone from "@/components/ImageUploadZone";
import StyleProfileForm, { StyleProfile } from "@/components/StyleProfileForm";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Loader2, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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

const Upload = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, profile, loading, refreshProfile } = useAuth();
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);
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

  const handleSubmit = async () => {
    if (!personFile || !topFile) {
      toast.error(t("upload.required"));
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

      const formData = new FormData();
      formData.append("person_image", personFile);
      formData.append("top_garment", topFile);
      if (bottomFile) {
        formData.append("bottom_garment", bottomFile);
      }

      // ✅ 공식 SDK 호출 사용
      // - 일부 브라우저/환경에서 setAuth가 즉시 반영되지 않는 경우가 있어,
      //   사용자 토큰을 x-user-token으로도 함께 전달합니다(프록시에서 이를 우선 사용).
      // - headers를 완전히 덮어쓰지 않기 위해(= apikey 유지) x-user-token만 추가합니다.
      console.log("[Upload] Calling tryon-proxy via supabase.functions.invoke()...");

      supabase.functions.setAuth(freshSession.access_token);

      const { data, error } = await supabase.functions.invoke("tryon-proxy", {
        body: formData,
        headers: {
          "x-user-token": freshSession.access_token,
        },
        // FormData일 경우 Content-Type을 설정하지 않음 (브라우저가 boundary 포함 자동 설정)
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

      navigate(`/result/${(data as any).taskId}`);
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
    
    if (profile && profile.credits <= 0) {
      setShowNoCreditsDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const canSubmit = personFile && topFile && !isSubmitting && !!session?.access_token;

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

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t("upload.back")}</span>
          </Link>
          <div className="font-display font-bold text-lg gradient-text">FitVision</div>
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

        <div className="space-y-8">
          {/* Person Image */}
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
          />

          {/* Top Garment */}
          <ImageUploadZone
            label={t("upload.top.label")}
            description={t("upload.top.desc")}
            requirements={[
              t("upload.top.req1"),
              t("upload.top.req2"),
              t("upload.top.req3"),
              t("upload.top.req4"),
              t("upload.top.req5"),
            ]}
            file={topFile}
            onFileChange={setTopFile}
          />

          {/* Bottom Garment (Optional) */}
          <ImageUploadZone
            label={t("upload.bottom.label")}
            description={t("upload.bottom.desc")}
            requirements={[
              t("upload.bottom.req1"),
              t("upload.bottom.req2"),
            ]}
            file={bottomFile}
            onFileChange={setBottomFile}
            optional
          />

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
                {t("upload.submit")}
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
            <CheckItem label={t("upload.confirm.person")} isReady={!!personFile} />
            <CheckItem label={t("upload.confirm.top")} isReady={!!topFile} />
            <CheckItem label={t("upload.confirm.bottom")} isReady={!!bottomFile} isOptional />
            {!bottomFile && (
              <p className="text-xs text-amber-500 mt-1 mb-2 pl-1">
                ⚠️ {t("upload.confirm.bottomNotice")}
              </p>
            )}
            <CheckItem label={t("upload.confirm.profile")} isReady={isProfileFilled} isOptional />
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            💡 {t("upload.confirm.qualityNotice")}
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
