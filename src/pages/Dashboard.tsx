import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import Logo from "@/components/Logo";
import PromoCodeSection from "@/components/PromoCodeSection";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Image, Plus, CreditCard } from "lucide-react";

interface UsageHistory {
  id: string;
  action_type: string;
  credits_used: number;
  result_url: string | null;
  task_id: string | null;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [usageHistory, setUsageHistory] = useState<UsageHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchUsageHistory = async () => {
      if (!user) return;

      // Only fetch entries from last 48 hours (results expire after that)
      const expirationTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('usage_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', expirationTime)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching usage history:', error);
      } else {
        setUsageHistory(data || []);
      }
      setLoadingHistory(false);
    };

    if (user) {
      fetchUsageHistory();
      refreshProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <section className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-lg text-center">
          <h1 className="font-display text-xl font-bold text-foreground">대시보드 준비 중…</h1>
          <p className="text-sm text-muted-foreground mt-2">로그인 정보를 불러오는 중이에요. 잠시만 기다려 주세요.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
              홈으로
            </Button>
            <Button variant="default" onClick={() => navigate("/auth", { replace: true })}>
              다시 로그인
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {t("dashboard.welcome")}, {profile.display_name || profile.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("dashboard.subtitle")}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {/* Credits Card */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.credits")}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{profile.credits}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/mypage")}
              >
                {t("dashboard.buyCredits")}
              </Button>
            </div>

            {/* Usage Count */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Image className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.totalUsage")}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{usageHistory.length}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t("dashboard.usageDesc")}</p>
            </div>

            {/* New Try-On */}
            <div className="bg-gradient-to-br from-primary/10 to-accent border border-primary/20 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.newTryon")}</p>
                  <p className="font-display text-lg font-bold text-foreground">{t("dashboard.startNow")}</p>
                </div>
              </div>
              <Button 
                variant="gradient" 
                className="w-full"
                onClick={() => navigate("/upload")}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("dashboard.createNew")}
              </Button>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="mb-10">
            <PromoCodeSection />
          </div>

          {/* Usage History */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">
              {t("dashboard.history")}
            </h2>

            {loadingHistory ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : usageHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
                  <Image className="w-8 h-8 text-accent-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">{t("dashboard.noHistory")}</p>
                <Button variant="gradient" onClick={() => navigate("/upload")}>
                  {t("dashboard.createFirst")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {usageHistory.map((item) => {
                  // Calculate remaining time until expiration (48 hours from creation)
                  const createdAt = new Date(item.created_at);
                  const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
                  const now = new Date();
                  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000)));
                  const isExpired = hoursLeft <= 0;
                  
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-4 p-4 rounded-xl bg-background border border-border transition-colors ${
                        item.task_id && !isExpired ? 'hover:border-primary/30 cursor-pointer' : 'opacity-60'
                      }`}
                      onClick={() => item.task_id && !isExpired && navigate(`/result/${item.task_id}`)}
                    >
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                        <Image className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {item.action_type === 'virtual_tryon' ? t("dashboard.tryonAction") : 
                           item.action_type === 'credit_purchase' ? t("dashboard.purchaseAction") : 
                           item.action_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()} • 
                          {item.credits_used < 0 ? ` +${Math.abs(item.credits_used)}` : ` -${item.credits_used}`} {t("dashboard.credit")}
                          {item.task_id && !isExpired && (
                            <span className="ml-2 text-primary">
                              ({hoursLeft}h 남음)
                            </span>
                          )}
                          {item.task_id && isExpired && (
                            <span className="ml-2 text-destructive">
                              (만료됨)
                            </span>
                          )}
                        </p>
                      </div>
                      {item.task_id && !isExpired && (
                        <Button variant="outline" size="sm">
                          {t("dashboard.view")}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
