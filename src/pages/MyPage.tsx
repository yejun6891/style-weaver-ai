import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitch from "@/components/LanguageSwitch";
import { ArrowLeft, CreditCard, User, Mail, Calendar, Sparkles } from "lucide-react";

const MyPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const creditPackages = [
    { credits: 5, price: "$4.99", popular: false },
    { credits: 15, price: "$9.99", popular: true, discount: "33% OFF" },
    { credits: 30, price: "$14.99", popular: false, discount: "50% OFF" },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-display font-bold text-xl gradient-text">
              FitVision
            </span>
          </div>
          <LanguageSwitch />
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {t("mypage.title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("mypage.subtitle")}
            </p>
          </div>

          {/* Profile Section */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t("mypage.profile")}
            </h2>

            <div className="flex items-center gap-6 mb-6">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(profile.display_name || profile.email)?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {profile.display_name || profile.email?.split('@')[0]}
                </h3>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border">
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("mypage.currentCredits")}</p>
                  <p className="font-display text-2xl font-bold text-foreground">{profile.credits}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("mypage.memberSince")}</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Packages */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t("mypage.buyCredits")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("mypage.buyCreditsDesc")}
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {creditPackages.map((pkg, index) => (
                <div 
                  key={index}
                  className={`relative rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${
                    pkg.popular 
                      ? "border-primary bg-gradient-to-b from-primary/10 to-transparent" 
                      : "border-border bg-background"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-primary text-xs font-bold text-white">
                      {t("mypage.popular")}
                    </div>
                  )}
                  {pkg.discount && (
                    <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-accent text-xs font-bold text-accent-foreground">
                      {pkg.discount}
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <p className="font-display text-4xl font-bold text-foreground mb-1">
                      {pkg.credits}
                    </p>
                    <p className="text-muted-foreground">{t("mypage.credits")}</p>
                  </div>
                  <p className="text-center font-display text-2xl font-bold text-foreground mb-6">
                    {pkg.price}
                  </p>
                  <Button 
                    variant={pkg.popular ? "gradient" : "outline"}
                    className="w-full"
                  >
                    {t("mypage.purchase")}
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              {t("mypage.paymentNote")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyPage;
