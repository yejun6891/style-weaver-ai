import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromoCodes, UserPromoCode } from '@/hooks/usePromoCodes';
import { Search, Gift, Ticket, Check, Percent, CreditCard, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PromoCodeSectionProps {
  onUseDiscount?: (promoCode: UserPromoCode) => void;
}

const PromoCodeSection = ({ onUseDiscount }: PromoCodeSectionProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { userPromoCodes, loading, searchPromoCode, claimPromoCode, useCreditsPromoCode } = usePromoCodes();
  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundCode, setFoundCode] = useState<any>(null);

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

  const handleUseCredits = async (userPromoCode: UserPromoCode) => {
    const result = await useCreditsPromoCode(
      userPromoCode.id,
      userPromoCode.promo_code.id,
      userPromoCode.promo_code.discount_value
    );
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleUseDiscount = (userPromoCode: UserPromoCode) => {
    if (onUseDiscount) {
      onUseDiscount(userPromoCode);
    } else {
      // Navigate to purchase page with promo code
      navigate('/mypage', { state: { selectedPromo: userPromoCode } });
    }
  };

  const getPromoIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'fixed':
        return <CreditCard className="w-4 h-4" />;
      case 'credits':
        return <Ticket className="w-4 h-4" />;
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
      case 'credits':
        return `${promo.discount_value} ${t('promo.creditsBonus')}`;
      default:
        return promo.code;
    }
  };

  const unusedPromoCodes = userPromoCodes.filter(upc => !upc.used);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        {t('promo.title')}
      </h2>

      {/* Search Section */}
      <div className="flex gap-2 mb-6">
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

      {/* Found Code */}
      {foundCode && (
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
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

      {/* My Promo Codes */}
      <div>
        <h3 className="font-medium text-foreground mb-3">{t('promo.myPromoCodes')}</h3>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : unusedPromoCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t('promo.noPromoCodes')}</p>
            <p className="text-sm mt-1">{t('promo.searchHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unusedPromoCodes.map((upc) => (
              <div 
                key={upc.id}
                className="flex items-center justify-between p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    upc.promo_code.discount_type === 'credits' 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {getPromoIcon(upc.promo_code.discount_type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{upc.promo_code.code}</p>
                    <p className="text-sm text-muted-foreground">{getPromoLabel(upc.promo_code)}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant={upc.promo_code.discount_type === 'credits' ? 'default' : 'outline'}
                  onClick={() => {
                    if (upc.promo_code.discount_type === 'credits') {
                      handleUseCredits(upc);
                    } else {
                      handleUseDiscount(upc);
                    }
                  }}
                >
                  {t('promo.use')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCodeSection;
