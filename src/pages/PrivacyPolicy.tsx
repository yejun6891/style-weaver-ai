import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: January 1, 2026",
      sections: [
        {
          title: "1. Introduction",
          content: `Trukin (Korean business name: 트루킨) ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use TrupickAI (our virtual try-on service).`
        },
        {
          title: "2. Information We Collect",
          content: `We collect information you provide directly to us, including:
• Account information (email address, name, profile picture via Google Sign-In)
• Photos you upload for virtual try-on
• Payment information (processed securely through Lemon Squeezy)
• Usage data and interaction with our services

We automatically collect certain information when you use our service:
• Device information (browser type, operating system)
• IP address and general location
• Usage patterns and preferences`
        },
        {
          title: "3. How We Use Your Information",
          content: `We use the information we collect to:
• Provide and maintain our virtual try-on service
• Process transactions and send related information
• Send promotional communications (with your consent)
• Respond to your comments and questions
• Analyze usage patterns to improve our service
• Detect and prevent fraud or abuse`
        },
        {
          title: "4. Information Sharing and Processing Delegation",
          content: `We do not sell or share your personal information without authorization. However, to perform core service functions—such as virtual try-on image generation, AI-based style analysis reports, secure payment processing, and data storage—we delegate certain tasks to specialized external technology partners within the minimum necessary scope. Information provided in this process is used only for the limited purpose of achieving these objectives.`
        },
        {
          title: "5. Data Retention and Deletion Policy",
          content: `Original images for try-on: Photos used for virtual try-on processing are completely deleted from the processing engine within a maximum of 72 hours after completion, in accordance with the security policies of our specialized technology partners.

Service usage records: Generated try-on results and analysis reports are retained until your account is maintained so you can continuously access them within the service. However, if you request deletion directly or withdraw your account, they will be destroyed without delay.`
        },
        {
          title: "6. Your Rights (California Residents - CCPA)",
          content: `If you are a California resident, you have the right to:
• Know what personal information we collect about you
• Request deletion of your personal information
• Opt-out of the sale of personal information (we do not sell your data)
• Non-discrimination for exercising your privacy rights

To exercise these rights, contact us at admin@trukin.app`
        },
        {
          title: "7. Children's Privacy (COPPA)",
          content: `Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.`
        },
        {
          title: "8. Security",
          content: `We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.`
        },
        {
          title: "9. Changes to This Policy",
          content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.`
        },
        {
          title: "10. Contact Us",
          content: `If you have questions about this policy or wish to exercise your privacy rights, you can reach us anytime through the following channels:

Email: admin@trukin.app

In-service inquiry: Click the 'Contact Us' button at the bottom of the website to leave a message in real-time.

Owner: Yejoon Jeong`
        }
      ]
    },
    ko: {
      title: "개인정보처리방침",
      lastUpdated: "최종 수정일: 2026년 1월 1일",
      sections: [
        {
          title: "1. 소개",
          content: `트루킨(이하 "회사")은 귀하의 개인정보 보호를 위해 최선을 다하고 있습니다. 본 개인정보처리방침은 TrupickAI(당사의 가상 피팅 서비스) 이용 시 귀하의 정보를 어떻게 수집, 사용, 공개 및 보호하는지 설명합니다.`
        },
        {
          title: "2. 수집하는 정보",
          content: `귀하가 직접 제공하는 정보:
• 계정 정보 (이메일 주소, 이름, Google 로그인을 통한 프로필 사진)
• 가상 피팅을 위해 업로드하는 사진
• 결제 정보 (Lemon Squeezy를 통해 안전하게 처리)
• 서비스 이용 데이터

자동으로 수집되는 정보:
• 기기 정보 (브라우저 유형, 운영 체제)
• IP 주소 및 대략적인 위치
• 사용 패턴 및 선호도`
        },
        {
          title: "3. 정보 이용 목적",
          content: `수집된 정보는 다음 목적으로 사용됩니다:
• 가상 피팅 서비스 제공 및 유지
• 거래 처리 및 관련 정보 전송
• 프로모션 커뮤니케이션 발송 (동의 시)
• 문의 및 질문 응답
• 서비스 개선을 위한 사용 패턴 분석
• 부정 행위 탐지 및 방지`
        },
        {
          title: "4. 정보 공유 및 위탁",
          content: `당사는 귀하의 개인정보를 외부에 판매하거나 무단으로 공유하지 않습니다. 다만, 가상 피팅 이미지 생성, AI 기반 스타일 분석 리포트 제공, 안전한 결제 처리 및 데이터 보관 등 서비스의 핵심 기능을 수행하기 위해 필요한 최소한의 범위 내에서 전문 외부 기술 협력사에 업무를 위탁하고 있습니다. 이 과정에서 제공되는 정보는 해당 목적을 달성하기 위한 용도로만 제한적으로 사용됩니다.`
        },
        {
          title: "5. 데이터 보존 및 삭제 정책",
          content: `피팅용 원본 이미지: 가상 피팅 처리를 위해 사용된 사진은 전문 기술 협력사의 보안 정책에 따라 처리 완료 후 최대 72시간 이내에 해당 엔진에서 완전히 삭제됩니다.

서비스 이용 기록: 생성된 피팅 결과 및 분석 리포트는 사용자가 서비스 내에서 지속적으로 확인하실 수 있도록 계정 유지 시까지 보관됩니다. 단, 사용자가 직접 삭제를 요청하거나 계정을 탈퇴할 경우 지체 없이 파기합니다.`
        },
        {
          title: "6. 귀하의 권리 (캘리포니아 거주자 - CCPA)",
          content: `캘리포니아 거주자인 경우 다음과 같은 권리가 있습니다:
• 수집되는 개인정보에 대해 알 권리
• 개인정보 삭제 요청 권리
• 개인정보 판매 거부 권리 (당사는 데이터를 판매하지 않음)
• 개인정보 보호 권리 행사에 따른 차별 금지

이러한 권리를 행사하려면 admin@trukin.app으로 연락하세요.`
        },
        {
          title: "7. 아동 개인정보 보호 (COPPA)",
          content: `당사 서비스는 13세 미만 아동을 대상으로 하지 않습니다. 13세 미만 아동의 개인정보를 고의로 수집하지 않습니다. 13세 미만 아동의 정보가 수집되었다고 생각되시면 즉시 연락해 주세요.`
        },
        {
          title: "8. 보안",
          content: `당사는 귀하의 개인정보 보호를 위해 적절한 기술적, 조직적 조치를 시행합니다. 그러나 인터넷을 통한 전송 방법이 100% 안전하지는 않습니다.`
        },
        {
          title: "9. 정책 변경",
          content: `본 개인정보처리방침은 수시로 업데이트될 수 있습니다. 변경 사항이 있을 경우 이 페이지에 새로운 개인정보처리방침을 게시하고 "최종 수정일"을 업데이트하여 알려드립니다.`
        },
        {
          title: "10. 문의하기",
          content: `본 방침에 관한 질문이나 개인정보 관련 권리 행사는 다음 채널을 통해 언제든지 요청하실 수 있습니다.

이메일: admin@trukin.app

서비스 내 문의: 웹사이트 하단의 '문의하기' 버튼을 클릭하여 실시간으로 메시지를 남겨주세요.

대표자: 정예준 (Yejoon Jeong)`
        }
      ]
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === "en" ? "Back" : "뒤로가기"}
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.lastUpdated}</p>

        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {section.title}
              </h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
