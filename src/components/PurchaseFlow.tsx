import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Check, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Lemon Squeezy checkout URLs for each credit package (Live mode)
const lemonSqueezyCheckoutUrls: Record<number, string> = {
  12: 'https://trupickai.lemonsqueezy.com/checkout/buy/0a310f07-5a74-4538-a2d7-7d794baaa471',
  30: 'https://trupickai.lemonsqueezy.com/checkout/buy/13e8e780-6cb8-4010-818c-1930571a5d8f',
  60: 'https://trupickai.lemonsqueezy.com/checkout/buy/17e65cf2-1805-44da-9020-804367e94a50',
};

export interface CreditPackage {
  credits: number;
  price: number;
  popular?: boolean;
  discount?: string;
  name?: string;
}

export const creditPackages: CreditPackage[] = [
  { credits: 12, price: 9.99, name: 'Starter' },
  { credits: 30, price: 19.99, popular: true, name: 'Plus', discount: 'Save 20%' },
  { credits: 60, price: 29.99, name: 'Pro', discount: 'Save 40%' },
];

interface PurchaseFlowProps {
  open: boolean;
  onClose: () => void;
  selectedPackage: CreditPackage | null;
}

const PurchaseFlow = ({ open, onClose, selectedPackage }: PurchaseFlowProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  const handleClose = () => {
    onClose();
  };

  const handleLemonSqueezyCheckout = () => {
    if (!selectedPackage || !user) return;
    
    const baseUrl = lemonSqueezyCheckoutUrls[selectedPackage.credits];
    if (!baseUrl) {
      toast.error('Invalid package selected');
      return;
    }
    
    setProcessing(true);
    
    const params = new URLSearchParams();
    params.set('locale', 'en');
    params.set('checkout[email]', user.email || '');
    params.set('checkout[custom][user_id]', user.id);
    
    const checkoutUrl = `${baseUrl}?${params.toString()}`;
    window.open(checkoutUrl, '_blank');
    
    toast.info(t('purchase.redirecting') || '결제 페이지로 이동합니다. 결제 완료 후 크레딧이 충전됩니다.');
    setProcessing(false);
    
    setTimeout(() => {
      handleClose();
    }, 1000);
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {t('purchase.confirmTitle') || '주문 확인'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('purchase.dialogDescription') || '크레딧 구매 확인'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Selected Package Confirmation */}
          <div className="p-5 rounded-xl bg-primary/5 border-2 border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-display font-bold text-foreground text-lg">
                  {selectedPackage.name}
                </span>
              </div>
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-3xl font-bold text-foreground">
                  {selectedPackage.credits}
                </p>
                <p className="text-sm text-muted-foreground">{t('mypage.credits')}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-primary">
                  ${selectedPackage.price}
                </p>
                {selectedPackage.discount && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {selectedPackage.discount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Promo code guidance */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              🎟️ {t('purchase.promoInCheckout') || '프로모션 코드가 있으시면 결제창에서 입력해 주세요.'}
            </p>
          </div>

          {/* Payment Methods Info - English only */}
          {language === 'en' && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-center text-muted-foreground">
                💳 Apple Pay, Cash App Pay, and all major cards accepted
              </p>
            </div>
          )}

          {/* Checkout Button */}
          <Button 
            variant="gradient" 
            className="w-full"
            onClick={handleLemonSqueezyCheckout}
            disabled={processing}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('purchase.pay') || '결제하기'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t('purchase.lemonSqueezyNote') || '결제 완료 후 크레딧이 자동으로 충전됩니다.'}
          </p>

          {processing && (
            <div className="text-center py-4 text-muted-foreground">
              {t('purchase.processing')}...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseFlow;
