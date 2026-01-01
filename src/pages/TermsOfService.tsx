import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last Updated: January 1, 2026",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: `By accessing or using Trukin's virtual try-on service ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.`
        },
        {
          title: "2. Description of Service",
          content: `Trukin provides an AI-powered virtual try-on service that allows users to see how clothing items look on their photos. The Service uses advanced AI technology to generate realistic virtual fitting results.`
        },
        {
          title: "3. User Accounts",
          content: `To use our Service, you must create an account using Google Sign-In. You are responsible for:
• Maintaining the confidentiality of your account
• All activities that occur under your account
• Providing accurate and complete information
• Notifying us immediately of any unauthorized access`
        },
        {
          title: "4. Credits and Payments",
          content: `Our Service operates on a credit-based system:
• 5 Credits: $9.99
• 10 Credits: $14.99 (25% discount)
• 15 Credits: $19.99 (33% discount)
• 25 Credits: $29.99 (40% discount)

Each virtual try-on uses 1 credit. Payments are processed securely through PayPal. All prices are in USD.`
        },
        {
          title: "5. User Content",
          content: `By uploading photos to our Service, you:
• Grant us a limited license to process your images for providing the Service
• Confirm you have the right to use and upload such images
• Agree not to upload images containing illegal, harmful, or inappropriate content
• Understand that uploaded images may be processed by AI systems

We do not claim ownership of your uploaded content.`
        },
        {
          title: "6. Prohibited Uses",
          content: `You agree not to:
• Use the Service for any illegal purpose
• Upload images of minors or without consent of the person in the image
• Attempt to reverse engineer or compromise the Service
• Use automated systems to access the Service
• Violate any applicable laws or regulations
• Upload inappropriate, offensive, or harmful content`
        },
        {
          title: "7. Intellectual Property",
          content: `The Service, including its original content, features, and functionality, is owned by Trukin and is protected by international copyright, trademark, and other intellectual property laws. Our AI technology and virtual try-on results remain our intellectual property.`
        },
        {
          title: "8. Disclaimer of Warranties",
          content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. We do not guarantee that:
• The Service will meet your specific requirements
• Virtual try-on results will be 100% accurate
• The Service will be uninterrupted or error-free`
        },
        {
          title: "9. Limitation of Liability",
          content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRUKIN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.`
        },
        {
          title: "10. Termination",
          content: `We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately. Unused credits may be forfeited upon termination for Terms violations.`
        },
        {
          title: "11. Governing Law",
          content: `These Terms shall be governed by and construed in accordance with the laws of the Republic of Korea, without regard to its conflict of law provisions.`
        },
        {
          title: "12. Changes to Terms",
          content: `We reserve the right to modify these Terms at any time. We will notify users of significant changes by posting the updated Terms on this page. Continued use of the Service after changes constitutes acceptance of the new Terms.`
        },
        {
          title: "13. Contact Us",
          content: `If you have questions about these Terms of Service, please contact us at:
Email: admin@trukin.app
Company: Trukin`
        }
      ]
    },
    ko: {
      title: "이용약관",
      lastUpdated: "최종 수정일: 2026년 1월 1일",
      sections: [
        {
          title: "1. 약관 동의",
          content: `트루킨의 가상 피팅 서비스(이하 "서비스")에 접속하거나 이용함으로써 귀하는 본 이용약관(이하 "약관")에 동의하게 됩니다. 본 약관에 동의하지 않으시면 서비스를 이용하지 마세요.`
        },
        {
          title: "2. 서비스 설명",
          content: `트루킨은 AI 기반 가상 피팅 서비스를 제공하여 사용자가 자신의 사진에 의류 아이템이 어떻게 보이는지 확인할 수 있게 합니다. 서비스는 고급 AI 기술을 사용하여 사실적인 가상 피팅 결과를 생성합니다.`
        },
        {
          title: "3. 사용자 계정",
          content: `서비스를 이용하려면 Google 로그인을 통해 계정을 생성해야 합니다. 귀하는 다음 사항에 대해 책임을 집니다:
• 계정의 기밀 유지
• 계정에서 발생하는 모든 활동
• 정확하고 완전한 정보 제공
• 무단 접근 시 즉시 알림`
        },
        {
          title: "4. 이용권 및 결제",
          content: `서비스는 이용권(크레딧) 기반 시스템으로 운영됩니다:
• 5 이용권: $9.99
• 10 이용권: $14.99 (25% 할인)
• 15 이용권: $19.99 (33% 할인)
• 25 이용권: $29.99 (40% 할인)

각 가상 피팅은 1 이용권을 사용합니다. 결제는 PayPal을 통해 안전하게 처리됩니다. 모든 가격은 USD 기준입니다.`
        },
        {
          title: "5. 사용자 콘텐츠",
          content: `서비스에 사진을 업로드함으로써 귀하는:
• 서비스 제공을 위해 이미지를 처리할 수 있는 제한적 라이선스를 당사에 부여합니다
• 해당 이미지를 사용하고 업로드할 권리가 있음을 확인합니다
• 불법, 유해 또는 부적절한 콘텐츠가 포함된 이미지를 업로드하지 않기로 동의합니다
• 업로드된 이미지가 AI 시스템에 의해 처리될 수 있음을 이해합니다

당사는 귀하가 업로드한 콘텐츠에 대한 소유권을 주장하지 않습니다.`
        },
        {
          title: "6. 금지 사항",
          content: `귀하는 다음 행위를 하지 않기로 동의합니다:
• 불법적인 목적으로 서비스 사용
• 미성년자 또는 이미지 속 인물의 동의 없이 이미지 업로드
• 서비스를 역설계하거나 훼손하려는 시도
• 자동화된 시스템으로 서비스 접근
• 관련 법률 또는 규정 위반
• 부적절하거나 공격적이거나 유해한 콘텐츠 업로드`
        },
        {
          title: "7. 지적 재산권",
          content: `서비스 및 원본 콘텐츠, 기능은 트루킨이 소유하며 국제 저작권, 상표권 및 기타 지적 재산권 법률에 의해 보호됩니다. AI 기술 및 가상 피팅 결과는 당사의 지적 재산으로 유지됩니다.`
        },
        {
          title: "8. 보증 부인",
          content: `서비스는 명시적이든 묵시적이든 어떠한 종류의 보증 없이 "있는 그대로" 및 "이용 가능한 대로" 제공됩니다. 당사는 다음을 보장하지 않습니다:
• 서비스가 귀하의 특정 요구 사항을 충족할 것
• 가상 피팅 결과가 100% 정확할 것
• 서비스가 중단 없이 또는 오류 없이 제공될 것`
        },
        {
          title: "9. 책임 제한",
          content: `법률이 허용하는 최대 범위 내에서, 트루킨은 서비스 이용으로 인한 간접적, 우발적, 특별, 결과적 또는 징벌적 손해(이익, 데이터 또는 기타 무형의 손실 포함)에 대해 책임을 지지 않습니다.`
        },
        {
          title: "10. 계약 해지",
          content: `당사는 본 약관 위반을 포함한 어떤 이유로든 사전 통지 없이 귀하의 계정을 즉시 해지하거나 정지할 수 있습니다. 해지 시 서비스 이용 권한은 즉시 종료됩니다. 약관 위반으로 인한 해지 시 미사용 이용권은 몰수될 수 있습니다.`
        },
        {
          title: "11. 준거법",
          content: `본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.`
        },
        {
          title: "12. 약관 변경",
          content: `당사는 언제든지 본 약관을 수정할 권리를 보유합니다. 중요한 변경 사항이 있을 경우 이 페이지에 업데이트된 약관을 게시하여 사용자에게 알립니다. 변경 후 서비스를 계속 이용하면 새로운 약관에 동의하는 것으로 간주됩니다.`
        },
        {
          title: "13. 문의하기",
          content: `본 이용약관에 관한 질문이 있으시면 다음으로 연락해 주세요:
이메일: admin@trukin.app
회사명: 트루킨 (Trukin)`
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

export default TermsOfService;
