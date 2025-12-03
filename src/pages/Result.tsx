import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, Sparkles, Share2 } from "lucide-react";

const BACKEND_BASE_URL = "https://tyron-backend-8yaa.onrender.com";

type Status = "loading" | "success" | "error";

const Result = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("AI가 옷을 입히는 중...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!taskId) {
      navigate("/upload");
      return;
    }

    let isCancelled = false;
    let progressInterval: NodeJS.Timeout;

    // Simulated progress for UX
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    const pollResult = async () => {
      const intervalMs = 5000; // API recommends 5 seconds

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
            setStatusText("완료!");
            clearInterval(progressInterval);
            return;
          } else if (taskStatus === 0) {
            setStatusText("대기열에서 처리 중...");
            setTimeout(check, intervalMs);
          } else if (taskStatus === 1) {
            setStatusText("AI가 열심히 작업 중...");
            setTimeout(check, intervalMs);
          } else {
            console.error("Unexpected status:", data);
            setStatus("error");
            setStatusText("처리 중 오류가 발생했습니다.");
            clearInterval(progressInterval);
          }
        } catch (err) {
          console.error(err);
          if (!isCancelled) {
            setStatus("error");
            setStatusText("결과를 불러오는 중 오류가 발생했습니다.");
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
  }, [taskId, navigate]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `virtual-tryon-${taskId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: open in new tab
      window.open(imageUrl, "_blank");
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Virtual Try-On 결과",
          text: "AI로 가상 피팅한 결과를 확인해보세요!",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/upload" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">다시 시도</span>
          </Link>
          <h1 className="font-display text-lg font-semibold gradient-gold-text">Virtual Try-On</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {status === "loading" && (
          <div className="text-center py-20 animate-fade-in">
            {/* Loading Animation */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              {/* Progress ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * progress) / 100}
                  className="transition-all duration-500"
                />
              </svg>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>

            <h2 className="font-display text-2xl font-semibold mb-2">
              {statusText}
            </h2>
            <p className="text-muted-foreground mb-4">
              잠시만 기다려주세요. 보통 30초~1분 정도 소요됩니다.
            </p>
            <p className="text-sm text-muted-foreground">
              Task ID: {taskId}
            </p>

            {/* Progress bar */}
            <div className="mt-8 max-w-xs mx-auto">
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-gold rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(progress)}% 완료
              </p>
            </div>
          </div>
        )}

        {status === "success" && imageUrl && (
          <div className="animate-scale-in">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
                🎉 피팅 완료!
              </h2>
              <p className="text-muted-foreground">
                AI가 생성한 가상 피팅 결과입니다
              </p>
            </div>

            {/* Result Image */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-2xl mb-8">
              <img
                src={imageUrl}
                alt="Virtual Try-On Result"
                className="w-full h-auto"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="hero"
                size="lg"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5" />
                다운로드
              </Button>
              <Button
                variant="elegant"
                size="lg"
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
                공유하기
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
                다른 옷 입어보기
              </Button>
            </div>

            {/* Notice */}
            <p className="text-xs text-center text-muted-foreground mt-8">
              * 생성된 이미지는 24시간 후 삭제됩니다. 필요한 이미지는 다운로드해주세요.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-4xl">😢</span>
            </div>
            <h2 className="font-display text-2xl font-semibold mb-2">
              처리 실패
            </h2>
            <p className="text-muted-foreground mb-8">
              {statusText}
            </p>
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate("/upload")}
              className="gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              다시 시도하기
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Result;
