import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LanguageSwitch from "@/components/LanguageSwitch";
import Logo from "@/components/Logo";
import { Sparkles } from "lucide-react";

const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const isInAppBrowser = (): boolean => {
  const ua = (navigator.userAgent || "").toLowerCase();
  const referrer = (document.referrer || "").toLowerCase();

  const knownInApp = /(instagram|threads|fban|fbav|fbios|fb_iab|line|kakaotalk|naver|snapchat|messenger)/i.test(ua);
  const knownInAppReferrer = /(threads\.net|instagram\.com|l\.instagram\.com|facebook\.com|m\.facebook\.com)/i.test(referrer);
  const androidWebView = /; wv\)|\bwv\b|version\/[\d.]+\s+chrome\/[\d.]+\s+mobile\s+safari\/[\d.]+/.test(ua);
  const iosWebView = /iphone|ipad|ipod/.test(ua) && /applewebkit/.test(ua) && (!/safari/.test(ua) || knownInApp);

  // NOTE: iframe 여부는 인앱 브라우저 판별과 분리합니다.
  return knownInApp || knownInAppReferrer || androidWebView || iosWebView;
};

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, loading, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const inApp = useMemo(() => isInAppBrowser(), []);
  const embedded = useMemo(() => isInIframe(), []);

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  type ExternalOpenResult = "opened" | "copied" | "failed";

  const copyUrlToClipboard = async (url: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  };

  const openInExternalBrowser = async (url: string): Promise<ExternalOpenResult> => {
    const normalizedUrl = new URL(url, window.location.origin).toString();
    const ua = (navigator.userAgent || "").toLowerCase();
    const isAndroid = /android/.test(ua);
    const isIOS = /iphone|ipad|ipod/.test(ua);

    if (isAndroid) {
      const intentPath = normalizedUrl.replace(/^https?:\/\//i, "");
      const intentUrl = `intent://${intentPath}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(normalizedUrl)};end`;
      window.location.href = intentUrl;
      const copied = await copyUrlToClipboard(normalizedUrl);
      return copied ? "copied" : "opened";
    }

    if (isIOS) {
      const safariUrl = normalizedUrl
        .replace(/^https:\/\//i, "x-safari-https://")
        .replace(/^http:\/\//i, "x-safari-http://");
      window.location.href = safariUrl;

      const chromeUrl = normalizedUrl
        .replace(/^https:\/\//i, "googlechromes://")
        .replace(/^http:\/\//i, "googlechrome://");

      window.setTimeout(() => {
        window.location.href = chromeUrl;
      }, 350);

      const copied = await copyUrlToClipboard(normalizedUrl);
      return copied ? "copied" : "opened";
    }

    const opened = window.open(normalizedUrl, "_blank", "noopener,noreferrer");
    if (opened) return "opened";

    const copied = await copyUrlToClipboard(normalizedUrl);
    return copied ? "copied" : "failed";
  };

  const handleGoogleLogin = async () => {
    const authUrl = `${window.location.origin}/auth`;

    // 미리보기 iframe/인앱 브라우저는 외부 브라우저로 우선 탈출 시도
    if (embedded || inApp) {
      const result = await openInExternalBrowser(authUrl);

      if (result === "copied") {
        toast({
          title: t("auth.linkCopiedTitle") || "로그인 링크를 복사했어요",
          description: t("auth.linkCopiedDesc") || "Safari/Chrome 주소창에 붙여넣어 열어주세요.",
        });
      } else if (result === "failed") {
        toast({
          title: t("auth.openBrowser") || "브라우저에서 열기",
          description:
            t("auth.openBrowserFallback") ||
            "외부 브라우저 실행이 막혀 있어요. 링크 복사 후 Safari/Chrome에서 열어주세요.",
          variant: "destructive",
        });
      }

      return;
    }

    const { error } = await signInWithGoogle();
    if (error) {
      console.error("Login error:", error.message);
      toast({
        title: t("auth.loginErrorTitle") || "Google 로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <LanguageSwitch />
        </div>
      </header>

      {/* Login Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 right-[10%] w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-32 left-[10%] w-96 h-96 bg-accent rounded-full blur-3xl animate-float" style={{ animationDelay: "-2.5s" }} />
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-lg">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">{t("auth.badge")}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
              {t("auth.title")}
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              {t("auth.subtitle")}
            </p>

            {/* Google Button */}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-3 h-14 text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("auth.google")}
            </Button>
          </div>

          {/* Footer text */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            {t("auth.terms")}
          </p>
        </div>
      </section>
    </main>
  );
};

export default Auth;

