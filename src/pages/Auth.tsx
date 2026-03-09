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

  const openInNewTabOrCopy = async (url: string): Promise<boolean> => {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) return true;

    // Popup blocked → copy link as fallback
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t("auth.linkCopiedTitle") || "링크를 복사했어요",
        description: t("auth.linkCopiedDesc") || "Safari/Chrome에 붙여넣어 열어주세요.",
      });
    } catch {
      toast({
        title: t("auth.openBrowser") || "브라우저에서 열기",
        description:
          t("auth.openBrowserFallback") ||
          "팝업이 차단되었어요. 주소창의 링크를 복사해 Safari/Chrome에서 열어주세요.",
      });
    }

    return false;
  };

  const handleGoogleLogin = async () => {
    const url = window.location.href;

    // Lovable 미리보기/에디터(iframe)에서는 OAuth 리다이렉트가 제한될 수 있어 새 탭에서 진행
    if (embedded) {
      const opened = await openInNewTabOrCopy(url);
      if (opened) {
        toast({
          title: t("auth.openNewTabTitle") || "새 탭에서 로그인해 주세요",
          description:
            t("auth.openNewTabDesc") ||
            "새 탭에서 로그인 완료 후, 이 화면으로 돌아오면 자동으로 반영돼요.",
        });
      }
      return;
    }

    // Google은 인앱 브라우저(WebView)에서 로그인이 차단되는 경우가 있어 외부 브라우저로 유도
    if (inApp) {
      const opened = await openInNewTabOrCopy(url);
      if (opened) {
        toast({
          title: t("auth.openBrowserTitle") || "Safari/Chrome에서 로그인해 주세요",
          description:
            t("auth.openBrowserDesc") || "인앱 브라우저에서는 Google 로그인이 막힐 수 있어요.",
        });
      }
      return;
    }

    const { error } = await signInWithGoogle();
    if (error) {
      console.error("Login error:", error.message);
      if (/disallowed_useragent|secure browsers/i.test(error.message)) {
        toast({
          title: "Google 로그인 차단",
          description: "인앱 브라우저에서는 차단됩니다. Safari 또는 Chrome에서 접속해 주세요.",
          variant: "destructive",
        });
      }
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

            {/* In-app browser warning */}
            {inApp ? (
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-foreground">
                  <p className="font-semibold mb-1">⚠️ {t("auth.inAppTitle") || "인앱 브라우저에서는 로그인이 제한됩니다"}</p>
                  <p className="text-muted-foreground">
                    {t("auth.inAppDesc") || "아래 버튼을 눌러 Safari 또는 Chrome에서 열어주세요."}
                  </p>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  className="w-full h-14 text-base gap-2"
                  onClick={() => {
                    const url = window.location.href;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="w-5 h-5" />
                  {t("auth.openBrowser") || "브라우저에서 열기"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("auth.inAppHint") || "열기가 안 되면 주소를 복사해 Safari/Chrome에 직접 붙여넣어 주세요."}
                </p>
              </div>
            ) : (
              <>
                {/* Google Button */}
                <Button 
                  onClick={handleGoogleLogin}
                  variant="outline"
                  size="lg"
                  className="w-full flex items-center justify-center gap-3 h-14 text-base"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t("auth.google")}
                </Button>
              </>
            )}
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

