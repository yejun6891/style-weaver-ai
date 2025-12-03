import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Download, RefreshCw, Sparkles, Share2 } from "lucide-react";

const BACKEND_BASE_URL = "https://tyron-backend-8yaa.onrender.com";

type Status = "loading" | "success" | "error";

const Result = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setStatusText(t("result.processing"));
  }, [t]);

  useEffect(() => {
    if (!taskId) {
      navigate("/upload");
      return;
    }

    let isCancelled = false;
    let progressInterval: NodeJS.Timeout;

    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    const pollResult = async () => {
      const intervalMs = 5000;

      const check = async () => {
        if (isCancelled) return;

        try {
          const res = await fetch(
            `${BACKEND_BASE_URL}/api/tryon/result?taskId=${taskId}`
          );
          const data = await res.json();

          if (isCancelled) return;

          const taskStatus = data.status;

          if (taskStatus === 2 && data.imageUrl) {
            setProgress(100);
            setImageUrl(data.imageUrl);
            setStatus("success");
            clearInterval(progressInterval);
            return;
          } else if (taskStatus === 0 || taskStatus === 1) {
            setStatusText(t("result.processing"));
            setTimeout(check, intervalMs);
          } else {
            console.error("Unexpected status:", data);
            setStatus("error");
            setStatusText(t("result.error"));
            clearInterval(progressInterval);
          }
        } catch (err) {
          console.error(err);
          if (!isCancelled) {
            setStatus("error");
            setStatusText(t("result.error"));
            clearInterval(progressInterval);
          }
        }
      };

      check();
    };

    pollResult();

    return () => {
      isCancelled = true;
      clearInterval(progressInterval);
    };
  }, [taskId, navigate, t]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitvision-${taskId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(imageUrl, "_blank");
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FitVision - AI Virtual Try-On",
          text: "Check out my virtual try-on result!",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/upload" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t("result.retry")}</span>
          </Link>
          <div className="font-display font-bold text-lg gradient-text">FitVision</div>
          <LanguageSwitch />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {status === "loading" && (
          <div className="text-center py-20 animate-fade-in">
            {/* Loading Animation */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * progress) / 100}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(252, 100%, 60%)" />
                    <stop offset="100%" stopColor="hsl(320, 100%, 60%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold mb-2">
              {statusText}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("result.wait")}
            </p>

            {/* Progress bar */}
            <div className="mt-8 max-w-xs mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(progress)}%
              </p>
            </div>
          </div>
        )}

        {status === "success" && imageUrl && (
          <div className="animate-scale-in">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {t("result.complete")} 🎉
              </h2>
              <p className="text-muted-foreground">
                {t("result.title")}
              </p>
            </div>

            {/* Result Image */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-lg mb-8">
              <img
                src={imageUrl}
                alt="Virtual Try-On Result"
                className="w-full h-auto"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="gradient"
                size="lg"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5" />
                {t("result.download")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
                {t("result.share")}
              </Button>
            </div>

            {/* Try Again */}
            <div className="text-center mt-8">
              <Button
                variant="ghost"
                onClick={() => navigate("/upload")}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t("result.new")}
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <span className="text-4xl">😢</span>
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">
              {t("result.error")}
            </h2>
            <p className="text-muted-foreground mb-8">
              {statusText}
            </p>
            <Button
              variant="gradient"
              size="lg"
              onClick={() => navigate("/upload")}
              className="gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              {t("result.retry")}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Result;
