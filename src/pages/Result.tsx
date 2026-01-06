import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import Logo from "@/components/Logo";
import StyleAnalysisReport from "@/components/StyleAnalysisReport";
import ShareRewardSection from "@/components/ShareRewardSection";
import { StyleProfile } from "@/components/StyleProfileForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, RefreshCw, Sparkles, Share2, Image, FileText, Check, Shirt } from "lucide-react";

type Status = "loading" | "success" | "error";

const defaultStyleProfile: StyleProfile = {
  height: "",
  bodyTypes: [],
  bodyTypeOther: "",
  occasions: [],
  occasionOther: "",
  styles: [],
  styleOther: "",
  concerns: "",
};

const Result = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [styleProfile, setStyleProfile] = useState<StyleProfile>(defaultStyleProfile);
  
  // 전신 모드 2단계 진행률 상태
  const mode = searchParams.get("mode") || "top";
  const isFullMode = mode === "full";
  const [currentStep, setCurrentStep] = useState(isFullMode ? 2 : 1); // full 모드면 2단계부터 시작 (1단계는 백엔드에서 완료)

  useEffect(() => {
    // Load style profile from sessionStorage
    const stored = sessionStorage.getItem("styleProfile");
    if (stored) {
      try {
        setStyleProfile(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse style profile:", e);
      }
    }
  }, []);

  useEffect(() => {
    setStatusText(t("result.processing"));
  }, [t]);

  useEffect(() => {
    if (!taskId) {
      navigate("/upload");
      return;
    }

    if (!session?.access_token) {
      navigate("/auth");
      return;
    }

    let isCancelled = false;
    let progressInterval: ReturnType<typeof setInterval>;

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
          // 직접 fetch() 사용 - Authorization 헤더 명시적으로 전송
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-proxy?action=result&taskId=${taskId}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[Result] fetch error:", response.status, errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const data = await response.json();

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
  }, [taskId, navigate, t, session]);

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

  const hasStyleProfile = styleProfile.bodyTypes.length > 0 || 
    styleProfile.occasions.length > 0 || 
    styleProfile.styles.length > 0 || 
    styleProfile.concerns;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/upload" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t("result.retry")}</span>
          </Link>
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {status === "loading" && (
          <div className="text-center py-20 animate-fade-in">
            {/* 전신 모드 2단계 표시 */}
            {isFullMode && (
              <div className="flex items-center justify-center gap-4 mb-8">
                {/* Step 1 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {t("result.step1") || "상의 교체"}
                  </span>
                </div>
                
                {/* Connector */}
                <div className="w-12 h-0.5 bg-primary" />
                
                {/* Step 2 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center animate-pulse">
                    <Shirt className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {t("result.step2") || "하의 교체"}
                  </span>
                </div>
              </div>
            )}

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
              {isFullMode 
                ? (t("result.fullModeProcessing") || "전신 스타일링 중...") 
                : statusText}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isFullMode 
                ? (t("result.fullModeWait") || "상의와 하의를 순차적으로 교체하고 있어요") 
                : t("result.wait")}
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
                {isFullMode ? `2단계: ${Math.round(progress)}%` : `${Math.round(progress)}%`}
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

            {/* Tabs for Image and Report */}
            {hasStyleProfile ? (
              <Tabs defaultValue="image" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="image" className="gap-2">
                    <Image className="w-4 h-4" />
                    {t("result.imageTab")}
                  </TabsTrigger>
                  <TabsTrigger value="report" className="gap-2">
                    <FileText className="w-4 h-4" />
                    {t("result.reportTab")}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="image">
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
                </TabsContent>

                <TabsContent value="report">
                  <StyleAnalysisReport profile={styleProfile} />
                </TabsContent>
              </Tabs>
            ) : (
              <>
                {/* Result Image (No tabs if no profile) */}
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
              </>
            )}

            {/* Share Reward Section */}
            <div className="mt-8">
              <ShareRewardSection taskId={taskId || null} resultImageUrl={imageUrl} />
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
