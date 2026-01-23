import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";

const Share = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [clickResult, setClickResult] = useState<{
    click_count?: number;
    reward_given?: boolean;
    duplicate?: boolean;
    credits_added?: number;
  } | null>(null);

  // Generate a simple browser fingerprint
  const generateFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
    }
    const canvasData = canvas.toDataURL();
    
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      canvasData.slice(-50),
    ].join('|');
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  };

  useEffect(() => {
    const trackClick = async () => {
      if (!code) {
        setStatus('error');
        return;
      }

      try {
        const fingerprint = generateFingerprint();
        
        const { data, error } = await supabase.functions.invoke('share-click', {
          body: {
            share_code: code,
            visitor_fingerprint: fingerprint
          }
        });

        if (error) throw error;
        
        setClickResult(data);
        setStatus('success');
      } catch (err) {
        console.error('Error tracking click:', err);
        setStatus('error');
      }
    };

    trackClick();
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-center">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-8">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">{t("share.loading")}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{t("share.title")}</h1>
                <p className="text-muted-foreground">
                  {t("share.subtitle")}
                </p>
              </div>

              {clickResult?.duplicate && (
                <p className="text-sm text-muted-foreground">
                  {t("share.alreadyVisited")}
                </p>
              )}

              <div className="pt-4 space-y-3">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate('/')}
                >
                  {t("share.tryNow")}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  {t("share.freeCredits")}
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{t("share.errorTitle")}</h1>
                <p className="text-muted-foreground">
                  {t("share.errorSubtitle")}
                </p>
              </div>

              <Button 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                {t("share.goHome")}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © 2025 Trukin. All rights reserved.
      </footer>
    </div>
  );
};

export default Share;
