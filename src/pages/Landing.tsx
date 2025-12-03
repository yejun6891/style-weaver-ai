import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Check, ShieldCheck, Zap, Shirt } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Zap, text: "AI가 30초 만에 완성" },
    { icon: ShieldCheck, text: "원본 얼굴 그대로 유지" },
    { icon: Shirt, text: "상의 + 하의 조합 가능" },
  ];

  const benefits = [
    "온라인 쇼핑 전 가상 피팅",
    "쇼핑몰 상품 사진 제작",
    "SNS용 패션 콘텐츠 생성",
    "의류 브랜드 룩북 제작",
  ];

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI Virtual Try-On</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-foreground">옷을 입어보지 않아도</span>
            <br />
            <span className="gradient-gold-text">내 모습을 확인하세요</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-up font-body" style={{ animationDelay: "0.2s" }}>
            전신 사진 한 장과 원하는 옷만 있으면,<br className="hidden sm:block" />
            AI가 당신이 그 옷을 입은 모습을 보여드립니다.
          </p>

          {/* CTA Button */}
          <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate("/upload")}
              className="group"
            >
              지금 시작하기
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mt-16 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-muted-foreground">
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is this for Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              이런 분들을 위해 만들었어요
            </h2>
            <p className="text-muted-foreground">
              가상 피팅으로 더 스마트한 패션 라이프를 경험하세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              어떻게 작동하나요?
            </h2>
            <p className="text-muted-foreground">
              단 3단계로 가상 피팅을 완성하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "전신 사진 업로드", desc: "정면을 바라보는 전신 사진을 올려주세요" },
              { step: "02", title: "옷 사진 선택", desc: "입어보고 싶은 상의, 하의 이미지를 추가하세요" },
              { step: "03", title: "AI 합성 결과 확인", desc: "AI가 자연스럽게 옷을 입힌 결과를 받아보세요" },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
                  <span className="font-display text-2xl font-semibold gradient-gold-text">{item.step}</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
            지금 바로 체험해보세요
          </h2>
          <p className="text-muted-foreground mb-10">
            복잡한 회원가입 없이 바로 시작할 수 있습니다
          </p>
          <Button 
            variant="hero" 
            size="xl"
            onClick={() => navigate("/upload")}
            className="group"
          >
            가상 피팅 시작하기
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 AI Virtual Try-On. Powered by AILabTools.</p>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
