import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromoCodes, UserPromoCode } from '@/hooks/usePromoCodes';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, ArrowRight, Search, Gift, Check, Percent, Ticket, CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Lemon Squeezy checkout URLs for each credit package
const lemonSqueezyCheckoutUrls: Record<number, string> = {
  8: 'https://fitvision.lemonsqueezy.com/checkout/buy/b3f87edb-3cb0-4004-9f50-a962d46da837',
  18: 'https://fitvision.lemonsqueezy.com/checkout/buy/217de21b-8677-4829-9887-a6583a42e856',
  30: 'https://fitvision.lemonsqueezy.com/checkout/buy/463213df-b0d9-4976-858d-b15d67e35fee',
};

interface CreditPackage {
  credits: number;
  price: number;
  popular?: boolean;
  discount?: string;
  name?: string;
}

const creditPackages: CreditPackage[] = [
  { credits: 8, price: 9.99, name: 'Starter' },
  { credits: 18, price: 19.99, popular: true, name: 'Plus' },
  { credits: 30, price: 29.99, name: 'Pro' },
];

interface PurchaseFlowProps {
  open: boolean;
  onClose: () => void;
  initialPromo?: UserPromoCode | null;
}

const PurchaseFlow = ({ open, onClose, initialPromo }: PurchaseFlowProps) => {
  const { t, language } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const { userPromoCodes, searchPromoCode, claimPromoCode } = usePromoCodes();
  const [step, setStep] = useState<'promo' | 'package' | 'payment'>('promo');
  const [selectedPromo, setSelectedPromo] = useState<UserPromoCode | null>(initialPromo || null);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundCode, setFoundCode] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const unusedDiscountPromoCodes = userPromoCodes.filter(
    upc => !upc.used && (upc.promo_code.discount_type === 'percentage' || upc.promo_code.discount_type === 'fixed')
  );

  useEffect(() => {
    if (initialPromo) {
      setSelectedPromo(initialPromo);
    }
  }, [initialPromo]);

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    
    setSearching(true);
    const code = await searchPromoCode(searchCode.trim());
    setFoundCode(code);
    setSearching(false);
    
    if (!code) {
      toast.error(t('promo.notFound'));
    }
  };

  const handleClaim = async (promoCodeId: string) => {
    const result = await claimPromoCode(promoCodeId);
    if (result.success) {
      toast.success(result.message);
      setFoundCode(null);
      setSearchCode('');
    } else {
      toast.error(result.message);
    }
  };

  const calculateFinalPrice = (): number => {
    if (!selectedPackage) return 0;
    
    let price = selectedPackage.price;
    
    if (selectedPromo) {
      if (selectedPromo.promo_code.discount_type === 'percentage') {
        price = price * (1 - selectedPromo.promo_code.discount_value / 100);
      } else if (selectedPromo.promo_code.discount_type === 'fixed') {
        price = Math.max(0, price - selectedPromo.promo_code.discount_value);
      }
    }
    
    return Math.round(price * 100) / 100;
  };

  const getPromoIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'fixed':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getPromoLabel = (promo: any) => {
    switch (promo.discount_type) {
      case 'percentage':
        return `${promo.discount_value}% ${t('promo.discount')}`;
      case 'fixed':
        return `$${promo.discount_value} ${t('promo.discount')}`;
      default:
        return promo.code;
    }
  };

  const handleClose = () => {
    setStep('promo');
    setSelectedPromo(null);
    setSelectedPackage(null);
    setFoundCode(null);
    setSearchCode('');
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
    
    // Build checkout URL with custom data for webhook processing
    const params = new URLSearchParams();

    // Force checkout language to English (Lemon Squeezy is for international customers only)
    params.set('locale', 'en');

    params.set('checkout[email]', user.email || '');
    params.set('checkout[custom][user_id]', user.id);
    if (selectedPromo) {
      params.set('checkout[custom][promo_id]', selectedPromo.id);
      params.set('checkout[custom][promo_code]', selectedPromo.promo_code.code);
    }
    
    const checkoutUrl = `${baseUrl}?${params.toString()}`;
    
    // Open Lemon Squeezy checkout in new tab
    window.open(checkoutUrl, '_blank');
    
    toast.info(t('purchase.redirecting') || '결제 페이지로 이동합니다. 결제 완료 후 크레딧이 충전됩니다.');
    setProcessing(false);
    
    // Close dialog after redirecting
    setTimeout(() => {
      handleClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'promo' && (
              <>
                <Gift className="w-5 h-5 text-primary" />
                {t('purchase.promoStep')}
              </>
            )}
            {step === 'package' && (
              <>
                <Ticket className="w-5 h-5 text-primary" />
                {t('purchase.packageStep')}
              </>
            )}
            {step === 'payment' && (
              <>
                <CreditCard className="w-5 h-5 text-primary" />
                {t('purchase.paymentStep')}
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('purchase.dialogDescription') || '프로모션 코드 및 이용권 구매'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Promo Code */}
        {step === 'promo' && (
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('promo.searchLabel')}
              </label>
              <div className="flex gap-2">
                <Input
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder={t('promo.searchPlaceholder')}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  variant="outline" 
                  onClick={handleSearch}
                  disabled={searching || !searchCode.trim()}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Found Code */}
            {foundCode && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white">
                      {getPromoIcon(foundCode.discount_type)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{foundCode.code}</p>
                      <p className="text-sm text-muted-foreground">{getPromoLabel(foundCode)}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="gradient"
                    onClick={() => handleClaim(foundCode.id)}
                  >
                    {t('promo.claim')}
                  </Button>
                </div>
              </div>
            )}

            {/* My Discount Codes */}
            {unusedDiscountPromoCodes.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('promo.selectDiscount')}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {unusedDiscountPromoCodes.map((upc) => (
                    <div 
                      key={upc.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedPromo?.id === upc.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background border-border hover:border-primary/30'
                      }`}
                      onClick={() => setSelectedPromo(selectedPromo?.id === upc.id ? null : upc)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getPromoIcon(upc.promo_code.discount_type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{upc.promo_code.code}</p>
                          <p className="text-xs text-muted-foreground">{getPromoLabel(upc.promo_code)}</p>
                        </div>
                      </div>
                      {selectedPromo?.id === upc.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Promo Display */}
            {selectedPromo && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {selectedPromo.promo_code.code} {t('promo.applied')}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedPromo(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('package')}>
                {t('purchase.skip')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              {selectedPromo && (
                <Button variant="gradient" className="flex-1" onClick={() => setStep('package')}>
                  {t('purchase.next')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step: Select Package */}
        {step === 'package' && (
          <div className="space-y-4">
            {selectedPromo && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {selectedPromo.promo_code.code}: {getPromoLabel(selectedPromo.promo_code)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {creditPackages.map((pkg, index) => {
                let displayPrice = pkg.price;
                if (selectedPromo) {
                  if (selectedPromo.promo_code.discount_type === 'percentage') {
                    displayPrice = pkg.price * (1 - selectedPromo.promo_code.discount_value / 100);
                  } else if (selectedPromo.promo_code.discount_type === 'fixed') {
                    displayPrice = Math.max(0, pkg.price - selectedPromo.promo_code.discount_value);
                  }
                }
                displayPrice = Math.round(displayPrice * 100) / 100;

                return (
                  <div 
                    key={index}
                    className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                      selectedPackage?.credits === pkg.credits 
                        ? 'border-primary bg-primary/10' 
                        : pkg.popular 
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full gradient-primary text-[10px] font-bold text-white">
                        {t('mypage.popular')}
                      </div>
                    )}
                    {pkg.discount && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-accent text-[10px] font-bold text-accent-foreground">
                        {pkg.discount}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-display text-2xl font-bold text-foreground">{pkg.credits}</p>
                      <p className="text-xs text-muted-foreground mb-2">{t('mypage.credits')}</p>
                      {selectedPromo ? (
                        <div>
                          <p className="text-sm text-muted-foreground line-through">${pkg.price}</p>
                          <p className="font-display text-lg font-bold text-primary">${displayPrice.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="font-display text-lg font-bold text-foreground">${pkg.price}</p>
                      )}
                    </div>
                    {selectedPackage?.credits === pkg.credits && (
                      <div className="absolute top-2 left-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('promo')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('purchase.back')}
              </Button>
              <Button 
                variant="gradient" 
                className="flex-1"
                disabled={!selectedPackage}
                onClick={() => setStep('payment')}
              >
                {t('purchase.next')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && selectedPackage && (
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="p-4 rounded-xl bg-background border border-border">
              <h3 className="font-medium text-foreground mb-3">{t('purchase.summary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{selectedPackage.credits} {t('mypage.credits')}</span>
                  <span className="text-foreground">${selectedPackage.price}</span>
                </div>
                {selectedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>{selectedPromo.promo_code.code}</span>
                    <span>
                      -{selectedPromo.promo_code.discount_type === 'percentage' 
                        ? `${selectedPromo.promo_code.discount_value}%`
                        : `$${selectedPromo.promo_code.discount_value}`
                      }
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span className="text-foreground">{t('purchase.total')}</span>
                  <span className="text-primary">${calculateFinalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Lemon Squeezy Checkout Button */}
            <Button 
              variant="gradient" 
              className="w-full"
              onClick={handleLemonSqueezyCheckout}
              disabled={processing}
            >
              <CreditCard className="w-4 h-4 mr-2" />
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

            <Button variant="outline" className="w-full" onClick={() => setStep('package')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('purchase.back')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseFlow;
