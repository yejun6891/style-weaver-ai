import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderMenu from "@/components/HeaderMenu";
import Logo from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, ArrowRight, Check, Zap, User, FileText } from "lucide-react";

// Before/After images
import beforeMale from "@/assets/before-male.png";
import afterMale from "@/assets/after-male.jpg";
import beforeFemale from "@/assets/before-female.png";
import afterFemale from "@/assets/after-female.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: Zap, text: t("feature.speed") },
    { icon: User, text: t("feature.face") },
    { icon: FileText, text: t("feature.report") },
  ];

  const benefits = [
    t("benefits.1"),
    t("benefits.2"),
    t("benefits.3"),
    t("benefits.4"),
  ];

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 right-[10%] w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-32 left-[10%] w-96 h-96 bg-accent rounded-full blur-3xl animate-float" style={{ animationDelay: "-2.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("hero.badge")}</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 animate-fade-up tracking-tight leading-tight" style={{ animationDelay: "0.1s" }}>
            {t("hero.title1")}
            <br />
            <span className="gradient-text">{t("hero.title2")}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up leading-relaxed" style={{ animationDelay: "0.2s" }}>
            {t("hero.subtitle")}
          </p>

          {/* CTA Button */}
          <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button 
              variant="gradient" 
              size="xl"
              onClick={() => navigate("/upload")}
              className="group"
            >
              {t("hero.cta")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mt-14 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-card border border-border">
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-accent/20 to-background overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              {t("beforeAfter.title") || "AI 가상 피팅 체험"}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("beforeAfter.subtitle") || "원하는 옷을 입어보세요"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Male Before/After */}
            <div className="group">
              <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-500">
                <div className="grid grid-cols-2">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img 
                      src={beforeMale} 
                      alt="Before - Male" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold text-foreground">
                      BEFORE
                    </div>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img 
                      src={afterMale} 
                      alt="After - Male" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full gradient-primary text-xs font-semibold text-white">
                      AFTER
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-lg z-10">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Female Before/After */}
            <div className="group">
              <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-500">
                <div className="grid grid-cols-2">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img 
                      src={beforeFemale} 
                      alt="Before - Female" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold text-foreground">
                      BEFORE
                    </div>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img 
                      src={afterFemale} 
                      alt="After - Female" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full gradient-primary text-xs font-semibold text-white">
                      AFTER
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-lg z-10">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-background to-accent/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              {t("benefits.title")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("benefits.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-medium text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              {t("howto.title")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("howto.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: t("howto.step1.title"), desc: t("howto.step1.desc") },
              { step: "02", title: t("howto.step2.title"), desc: t("howto.step2.desc") },
              { step: "03", title: t("howto.step3.title"), desc: t("howto.step3.desc") },
              { step: "04", title: t("howto.step4.title"), desc: t("howto.step4.desc") },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <span className="font-display text-xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-t from-accent/50 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {t("cta.title")}
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            {t("cta.subtitle")}
          </p>
          <Button 
            variant="gradient" 
            size="xl"
            onClick={() => navigate("/upload")}
            className="group"
          >
            {t("cta.button")}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          {/* Policy Links */}
          <div className="flex flex-wrap justify-center gap-4 mb-4 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
              {t("footer.privacy")}
            </Link>
            <span className="text-muted-foreground/50">·</span>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
              {t("footer.terms")}
            </Link>
            <span className="text-muted-foreground/50">·</span>
            <Link to="/refund-policy" className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
              {t("footer.refund")}
            </Link>
          </div>
          
          {/* Copyright */}
          <p className="text-center text-sm text-muted-foreground mb-3">© 2024 Trukin. All rights reserved.</p>
          
          {/* Company Info */}
          <p className="text-center text-xs text-muted-foreground/70">
            {t("footer.companyInfo")}
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
