import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const RefundPolicy = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "Refund Policy",
      lastUpdated: "Last Updated: January 1, 2026",
      sections: [
        {
          title: "1. Overview",
          content: `At Trukin, we strive to provide the best virtual try-on experience. We understand that sometimes things don't work out as expected, and we want to ensure your satisfaction with our Service.`
        },
        {
          title: "2. Credit Packages",
          content: `Our credit packages and pricing:
• 5 Credits: $9.99
• 10 Credits: $14.99 (25% discount)
• 15 Credits: $19.99 (33% discount)
• 25 Credits: $29.99 (40% discount)

All payments are processed securely through PayPal.`
        },
        {
          title: "3. Refund Eligibility",
          content: `You may be eligible for a refund in the following cases:

Full Refund:
• Technical issues that prevent the service from functioning
• Duplicate charges or billing errors
• Unused credits within 14 days of purchase

Partial Refund:
• Service quality issues (case-by-case basis)
• Partially used credits within 14 days (refund for unused portion)`
        },
        {
          title: "4. Non-Refundable Cases",
          content: `Refunds will NOT be provided in the following situations:
• Credits that have already been used
• Purchases made more than 14 days ago
• Dissatisfaction with AI-generated results (as results may vary)
• Account termination due to Terms of Service violations
• Promotional or bonus credits`
        },
        {
          title: "5. How to Request a Refund",
          content: `To request a refund:
1. Email us at admin@trukin.app
2. Include your account email address
3. Provide your purchase date and transaction ID (from PayPal)
4. Describe the reason for your refund request

We will review your request and respond within 3-5 business days.`
        },
        {
          title: "6. Refund Processing",
          content: `Once approved, refunds will be processed as follows:
• Refunds are issued through the original payment method (PayPal)
• Processing time: 5-10 business days
• You will receive an email confirmation when the refund is processed
• The refunded amount will appear on your PayPal account or linked payment method`
        },
        {
          title: "7. Disputes",
          content: `If you have a dispute regarding your purchase, please contact us first at admin@trukin.app before initiating a dispute through PayPal. We are committed to resolving issues fairly and promptly.`
        },
        {
          title: "8. Changes to This Policy",
          content: `We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting on this page. It is your responsibility to review this policy periodically.`
        },
        {
          title: "9. Contact Us",
          content: `For refund requests or questions about this policy, please contact us at:
Email: admin@trukin.app
Company: Trukin
Owner: Yejoon Jeong

We aim to respond to all inquiries within 24-48 hours.`
        }
      ]
    },
    ko: {
      title: "환불정책",
      lastUpdated: "최종 수정일: 2026년 1월 1일",
      sections: [
        {
          title: "1. 개요",
          content: `트루킨은 최고의 가상 피팅 경험을 제공하기 위해 노력합니다. 때로는 기대한 대로 되지 않을 수 있음을 이해하며, 서비스에 대한 귀하의 만족을 보장하고자 합니다.`
        },
        {
          title: "2. 이용권 패키지",
          content: `이용권 패키지 및 가격:
• 5 이용권: $9.99
• 10 이용권: $14.99 (25% 할인)
• 15 이용권: $19.99 (33% 할인)
• 25 이용권: $29.99 (40% 할인)

모든 결제는 PayPal을 통해 안전하게 처리됩니다.`
        },
        {
          title: "3. 환불 자격",
          content: `다음의 경우 환불을 받으실 수 있습니다:

전액 환불:
• 서비스 작동을 방해하는 기술적 문제
• 중복 청구 또는 결제 오류
• 구매 후 14일 이내 미사용 이용권

부분 환불:
• 서비스 품질 문제 (개별 검토)
• 14일 이내 부분 사용된 이용권 (미사용 부분에 대한 환불)`
        },
        {
          title: "4. 환불 불가 사항",
          content: `다음의 경우 환불이 제공되지 않습니다:
• 이미 사용된 이용권
• 14일 이전에 이루어진 구매
• AI 생성 결과에 대한 불만족 (결과는 다를 수 있음)
• 이용약관 위반으로 인한 계정 해지
• 프로모션 또는 보너스 이용권`
        },
        {
          title: "5. 환불 요청 방법",
          content: `환불을 요청하려면:
1. admin@trukin.app으로 이메일을 보내주세요
2. 계정 이메일 주소를 포함해 주세요
3. 구매 날짜와 거래 ID(PayPal에서 확인)를 제공해 주세요
4. 환불 요청 사유를 설명해 주세요

요청을 검토하고 3-5 영업일 이내에 답변드리겠습니다.`
        },
        {
          title: "6. 환불 처리",
          content: `승인되면 다음과 같이 환불이 처리됩니다:
• 원래 결제 수단(PayPal)을 통해 환불됩니다
• 처리 시간: 5-10 영업일
• 환불이 처리되면 이메일 확인을 받으실 수 있습니다
• 환불 금액은 PayPal 계정 또는 연결된 결제 수단에 표시됩니다`
        },
        {
          title: "7. 분쟁",
          content: `구매에 관한 분쟁이 있는 경우, PayPal을 통해 분쟁을 제기하기 전에 먼저 admin@trukin.app으로 연락해 주세요. 저희는 문제를 공정하고 신속하게 해결하기 위해 최선을 다하겠습니다.`
        },
        {
          title: "8. 정책 변경",
          content: `당사는 언제든지 본 환불정책을 수정할 권리를 보유합니다. 변경 사항은 이 페이지에 게시되는 즉시 적용됩니다. 정기적으로 이 정책을 검토하는 것은 귀하의 책임입니다.`
        },
        {
          title: "9. 문의하기",
          content: `환불 요청이나 이 정책에 관한 질문은 다음으로 연락해 주세요:
이메일: admin@trukin.app
회사명: Trukin
대표자: 정예준 (Yejoon Jeong)

모든 문의에 24-48시간 이내에 답변드리는 것을 목표로 합니다.`
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

export default RefundPolicy;
