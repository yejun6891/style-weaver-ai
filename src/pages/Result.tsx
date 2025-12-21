import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LanguageSwitch from "@/components/LanguageSwitch";
import StyleAnalysisReport from "@/components/StyleAnalysisReport";
import { StyleProfile } from "@/components/StyleProfileForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Sparkles,
  Share2,
  Image,
  FileText,
} from "lucide-react";

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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, loading } = useAuth();

  const [status, setStatus] = useState<Status>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [styleProfile, setStyleProfile] =
    useState<StyleProfile>(defaultStyleProfile);

  /** 스타일 프로필 복원 */
  useEffect(() => {
    const stored = sessionStorage.getItem("styleProfile");
    if (stored) {
      try {
        setStyleProfile(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  /** 기본 문구 */
  useEffect(() => {
    setStatusText(t("result.processing"));
  }, [t]);

  /** 핵심 로직 */
  useEffect(() => {
    if (loading) return;

    // taskId 없으면 업로드로
    if (!taskId) {
      navigate("/upload", { replace: true });
      return;
    }

    // 로그인 안 되어 있으면 auth로
    if (!session?.access_token) {
      navigate("/auth", { replace: true });
      return;
    }

    let cancelled = false;
    let progressTimer: ReturnType<typeof setInterval>;

    // 가짜 진행률
    progressTimer = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.random() * 8));
    }, 500);

    const poll = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-proxy?action=result&taskId=${encodeURIComponent(
            taskId
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );

        const data = await res.json();
        if (cancelled) return;

        /**
         * status 의미
         * 0,1 : 진행 중
         * 2   : 완료
         */
        if (data.status === 2 && data.imageUrl) {
          clearInterval(progressTimer);
          setProgress(100);
          setImageUrl(data.imageUrl);
          setStatus("success");
          return;
        }

        if (data.status === 0 || data.status === 1) {
          setTimeout(poll, 5000);
          return;
        }

        throw new Error("Unexpected status");
      } catch (e) {
        if (!cancelled) {
          clearInterval(progressTimer);
          setStatus("error");
          setStatusText(t("result.error"));
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearInterval(progressTimer);
    };
  }, [taskId, session, loading, navigate, t]);

  /** 다운로드 */
  const handleDownload = async () => {
    if (!imageUrl) return;
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `fitvision-${taskId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /** 공유 */
  const handleShare = async () => {
    if (!imageUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "FitVision",
          text: "My virtual try-on result",
          url: window.location.href,
        });
      } catch {
        /* ignore */
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const hasStyleProfile =
    styleProfile.bodyTypes.length ||
    styleProfile.occasions.length ||
    styleProfile.styles.length ||
    styleProfile.concerns;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Link
            to="/upload"
            className="flex items-center gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("result.retry")}
          </Link>
          <div className="font-bold">FitVision</div>
          <LanguageSwitch />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* LOADING */}
        {status === "loading" && (
          <div className="text-center py-20">
            <Sparkles className="w-10 h-10 mx-auto mb-6 animate-pulse" />
            <h2 className="text-xl font-bold mb-2">{statusText}</h2>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs mt-2">{Math.round(progress)}%</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && imageUrl && (
          <>
            {hasStyleProfile ? (
              <Tabs defaultValue="image">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="image">
                    <Image className="w-4 h-4 mr-1" /> Image
                  </TabsTrigger>
                  <TabsTrigger value="report">
                    <FileText className="w-4 h-4 mr-1" /> Report
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="image">
                  <img
                    src={imageUrl}
                    alt="Result"
                    className="rounded-xl mb-6"
                  />
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-1" /> Download
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-1" /> Share
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="report">
                  <StyleAnalysisReport profile={styleProfile} />
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <img
                  src={imageUrl}
                  alt="Result"
                  className="rounded-xl mb-6"
                />
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" /> Share
                  </Button>
                </div>
              </>
            )}

            <div className="text-center mt-8">
              <Button variant="ghost" onClick={() => navigate("/upload")}>
                <RefreshCw className="w-4 h-4 mr-1" />
                {t("result.new")}
              </Button>
            </div>
          </>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold mb-4">
              {t("result.error")}
            </h2>
            <Button onClick={() => navigate("/upload")}>
              다시 시도
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Result;
