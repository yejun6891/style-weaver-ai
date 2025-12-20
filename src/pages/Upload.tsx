import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ImageUploadZone from "@/components/ImageUploadZone";
import StyleProfileForm, { StyleProfile } from "@/components/StyleProfileForm";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const Upload = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, loading } = useAuth();
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
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
      // 제출 직전에 세션을 다시 확인하고 갱신
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !freshSession?.access_token) {
        console.error("[Upload] Session error:", sessionError);
        toast.error("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
        setIsSubmitting(false);
        navigate("/auth");
        return;
      }

      const formData = new FormData();
      formData.append("person_image", personFile);
      formData.append("top_garment", topFile);
      if (bottomFile) {
        formData.append("bottom_garment", bottomFile);
      }

      // Call the secure edge function proxy with fresh authentication token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-proxy?action=start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${freshSession.access_token}`,
          },
          body: formData,
        }
      );

      const responseData = await response.json();

      if (!response.ok || responseData.error) {
        console.error("[Upload Error]", responseData);
        toast.error("Unable to process your request. Please try again later.");
        setIsSubmitting(false);
        return;
      }

      // Store style profile in sessionStorage for the result page
      sessionStorage.setItem("styleProfile", JSON.stringify(styleProfile));

      navigate(`/result/${responseData.taskId}`);
    } catch (err) {
      console.error("[Upload Error]", err);
      toast.error("Request failed. Please try again.");
      setIsSubmitting(false);
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

  const handleOpenConfirm = () => {
    if (canSubmit) {
      setShowConfirmDialog(true);
    }
  };

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
          <LanguageSwitch />
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
    </main>
  );
};

export default Upload;
