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

  // 로그인 체크
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

    if (!session?.access_token) {
      toast.error("로그인이 필요합니다.");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("person_image", personFile);
      formData.append("top_garment", topFile);
      if (bottomFile) formData.append("bottom_garment", bottomFile);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-proxy?action=start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("[Upload Error]", data);
        toast.error(data.error || "요청 처리에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }

      sessionStorage.setItem("styleProfile", JSON.stringify(styleProfile));
      navigate(`/result/${data.taskId}`);
    } catch (err) {
      console.error("[Upload Error]", err);
      toast.error("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !!personFile && !!topFile && !isSubmitting && !!session?.access_token;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </main>
    );
  }

  const isProfileFilled =
    styleProfile.height.trim() ||
    styleProfile.bodyTypes.length ||
    styleProfile.occasions.length ||
    styleProfile.styles.length ||
    styleProfile.concerns.trim();

  const CheckItem = ({
    label,
    isReady,
    isOptional = false,
  }: {
    label: string;
    isReady: boolean;
    isOptional?: boolean;
  }) => (
    <div className="flex justify-between py-2 border-b">
      <span>{label}</span>
      {isReady ? (
        <Check className="text-green-500 w-4 h-4" />
      ) : (
        <X className="text-muted-foreground w-4 h-4" />
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("upload.back")}
          </Link>
          <div className="font-bold">FitVision</div>
          <LanguageSwitch />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-32 space-y-8">
        <ImageUploadZone
          label={t("upload.person.label")}
          description={t("upload.person.desc")}
          file={personFile}
          onFileChange={setPersonFile}
        />
        <ImageUploadZone
          label={t("upload.top.label")}
          description={t("upload.top.desc")}
          file={topFile}
          onFileChange={setTopFile}
        />
        <ImageUploadZone
          label={t("upload.bottom.label")}
          description={t("upload.bottom.desc")}
          file={bottomFile}
          onFileChange={setBottomFile}
          optional
        />

        <StyleProfileForm value={styleProfile} onChange={setStyleProfile} />
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-background border-t">
        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={() => setShowConfirmDialog(true)}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {t("upload.submit")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("upload.confirm.title")}</DialogTitle>
            <DialogDescription>
              {t("upload.confirm.description")}
            </DialogDescription>
          </DialogHeader>

          <CheckItem label="인물 사진" isReady={!!personFile} />
          <CheckItem label="상의" isReady={!!topFile} />
          <CheckItem label="하의" isReady={!!bottomFile} isOptional />
          <CheckItem label="스타일 프로필" isReady={!!isProfileFilled} isOptional />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>시작</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Upload;
