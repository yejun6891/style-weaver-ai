import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromoCodes, UserPromoCode } from '@/hooks/usePromoCodes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Search, Gift, Check, Percent, Ticket, CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PAYPAL_CLIENT_ID = 'AdbDO8R26aoLknygY-5ZJxjsgEMysvJQ4dAzBZFBQUVMWoK2b484TiZ_mSFUUjhycOHlsraFHHC_6JO3';

interface CreditPackage {
  credits: number;
  price: number;
  popular?: boolean;
  discount?: string;
}

const creditPackages: CreditPackage[] = [
  { credits: 5, price: 9.99 },
  { credits: 10, price: 14.99, popular: true, discount: '25% OFF' },
  { credits: 15, price: 19.99, discount: '33% OFF' },
  { credits: 25, price: 29.99, discount: '40% OFF' },
];

interface PurchaseFlowProps {
  open: boolean;
  onClose: () => void;
  initialPromo?: UserPromoCode | null;
}

const PurchaseFlow = ({ open, onClose, initialPromo }: PurchaseFlowProps) => {
  const { t } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const { userPromoCodes, searchPromoCode, claimPromoCode } = usePromoCodes();
  const [step, setStep] = useState<'promo' | 'package' | 'payment'>('promo');
  const [selectedPromo, setSelectedPromo] = useState<UserPromoCode | null>(initialPromo || null);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundCode, setFoundCode] = useState<any>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  const unusedDiscountPromoCodes = userPromoCodes.filter(
    upc => !upc.used && (upc.promo_code.discount_type === 'percentage' || upc.promo_code.discount_type === 'fixed')
  );

  useEffect(() => {
    if (initialPromo) {
      setSelectedPromo(initialPromo);
    }
  }, [initialPromo]);

  useEffect(() => {
    if (step === 'payment' && selectedPackage) {
      // Wait for DOM to be ready before loading PayPal
      const timer = setTimeout(() => {
        loadPayPalScript();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, selectedPackage]);

  const loadPayPalScript = () => {
    if (document.getElementById('paypal-script')) {
      setPaypalLoaded(true);
      renderPayPalButtons();
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => {
      setPaypalLoaded(true);
      renderPayPalButtons();
    };
    document.body.appendChild(script);
  };

  const renderPayPalButtons = () => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const container = document.getElementById('paypal-button-container');
      if (!container || !window.paypal || !selectedPackage) return;

      container.innerHTML = '';

      const finalPrice = calculateFinalPrice();

      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: finalPrice.toFixed(2),
              },
              description: `FitVision ${selectedPackage.credits} Credits`,
            }],
          });
        },
        onApprove: async (data: any, actions: any) => {
          setProcessing(true);
          try {
            const order = await actions.order.capture();
            console.log('Payment successful:', order);

            // Add credits to user
            if (user) {
              const { data: currentProfile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('user_id', user.id)
                .single();

              if (currentProfile) {
                await supabase
                  .from('profiles')
                  .update({ credits: currentProfile.credits + selectedPackage.credits })
                  .eq('user_id', user.id);
              }

              // Mark promo code as used if applied
              if (selectedPromo) {
                await (supabase
                  .from('user_promo_codes' as any)
                  .update({ used: true, used_at: new Date().toISOString() })
                  .eq('id', selectedPromo.id) as any);
              }

              // Record purchase in usage history
              await supabase.from('usage_history').insert({
                user_id: user.id,
                action_type: 'credit_purchase',
                credits_used: -selectedPackage.credits, // Negative means credits added
              });

              await refreshProfile();
            }

            toast.success(t('purchase.success'));
            onClose();
          } catch (error) {
            console.error('Payment error:', error);
            toast.error(t('purchase.error'));
          } finally {
            setProcessing(false);
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          toast.error(t('purchase.paypalError'));
        },
      }).render('#paypal-button-container');
    }, 50);
  };

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

            {/* PayPal Button */}
            <div id="paypal-button-container" className="min-h-[45px]">
              {!paypalLoaded && (
                <div className="text-center py-4 text-muted-foreground">
                  {t('purchase.loadingPaypal')}...
                </div>
              )}
            </div>

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

// Add PayPal type declaration
declare global {
  interface Window {
    paypal: any;
  }
}
