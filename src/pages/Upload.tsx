import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ImageUploadZone from "@/components/ImageUploadZone";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const BACKEND_BASE_URL = "https://tyron-backend-8yaa.onrender.com";

const Upload = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!personFile || !topFile) {
      alert(t("upload.required"));
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("person_image", personFile);
    formData.append("top_garment", topFile);
    if (bottomFile) {
      formData.append("bottom_garment", bottomFile);
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/tryon/start`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error(data);
        alert("Error: " + (data.error || "Unknown error"));
        setIsSubmitting(false);
        return;
      }

      navigate(`/result/${data.taskId}`);
    } catch (err) {
      console.error(err);
      alert("Request failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const canSubmit = personFile && topFile && !isSubmitting;

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
            onClick={handleSubmit}
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
    </main>
  );
};

export default Upload;
