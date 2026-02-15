import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Image, Share2 } from "lucide-react";

interface UsageHistory {
  id: string;
  action_type: string;
  credits_used: number;
  result_url: string | null;
  task_id: string | null;
  created_at: string;
}

interface ShareLink {
  click_count: number;
  reward_given: boolean;
}

interface UsageHistoryItemProps {
  item: UsageHistory;
  userId: string;
}

const REWARD_THRESHOLD = 3;

const UsageHistoryItem = ({ item, userId }: UsageHistoryItemProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);

  // Calculate expiration
  const createdAt = new Date(item.created_at);
  const expiresAt = new Date(createdAt.getTime() + 72 * 60 * 60 * 1000);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000)));
  const isExpired = hoursLeft <= 0;

  useEffect(() => {
    const fetchShareLink = async () => {
      if (!item.task_id) return;

      const { data } = await supabase
        .from('share_links')
        .select('click_count, reward_given')
        .eq('user_id', userId)
        .eq('task_id', item.task_id)
        .maybeSingle();

      if (data) {
        setShareLink(data);
      }
    };

    fetchShareLink();
  }, [item.task_id, userId]);

  const getActionLabel = () => {
    if (item.action_type === 'virtual_tryon') return t("dashboard.tryonAction");
    if (item.action_type === 'credit_purchase') return t("dashboard.purchaseAction");
    if (item.action_type.startsWith('virtual_tryon_accessory_')) {
      const category = item.action_type.replace('virtual_tryon_accessory_', '');
      if (category === 'hat') return t("dashboard.fitting.hat");
      if (category === 'shoes') return t("dashboard.fitting.shoes");
      if (category === 'bag') return t("dashboard.fitting.bag");
      if (category === 'jewelry') return t("dashboard.fitting.jewelry");
      return t("dashboard.fitting.accessory");
    }
    if (item.action_type.startsWith('virtual_tryon_')) {
      const mode = item.action_type.replace('virtual_tryon_', '');
      if (mode === 'top') return t("dashboard.fitting.top");
      if (mode === 'bottom') return t("dashboard.fitting.bottom");
      if (mode === 'full') return t("dashboard.fitting.full");
    }
    return item.action_type;
  };

  const getResultUrl = () => {
    if (!item.task_id) return '';
    if (item.action_type.startsWith('virtual_tryon_accessory_')) {
      const category = item.action_type.replace('virtual_tryon_accessory_', '');
      return `/result/${item.task_id}?mode=accessory&category=${category}&from=dashboard`;
    }
    return `/result/${item.task_id}?from=dashboard`;
  };

  return (
    <div 
      className={`flex flex-col gap-3 p-4 rounded-xl bg-background border border-border transition-colors ${
        item.task_id && !isExpired ? 'hover:border-primary/30 cursor-pointer' : 'opacity-60'
      }`}
      onClick={() => item.task_id && !isExpired && navigate(getResultUrl())}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          <Image className="w-6 h-6 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {getActionLabel()}
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString()} • 
            {item.credits_used < 0 ? ` +${Math.abs(item.credits_used)}` : ` -${item.credits_used}`} {t("dashboard.credit")}
            {item.task_id && !isExpired && (
              <span className="ml-2 text-primary">
                ({t("dashboard.hoursLeft").replace("{n}", String(hoursLeft))})
              </span>
            )}
            {item.task_id && isExpired && (
              <span className="ml-2 text-destructive">
                ({t("dashboard.expired")})
              </span>
            )}
          </p>
        </div>
        {item.task_id && !isExpired && (
          <Button variant="outline" size="sm">
            {t("dashboard.view")}
          </Button>
        )}
      </div>

      {/* Badges Row - Only share status, no style report badge */}
      {item.task_id && !isExpired && shareLink && (
        <div className="flex flex-wrap gap-2 ml-16">
          {/* Share Status Badge */}
          <Badge 
            variant={shareLink.reward_given ? "default" : "outline"} 
            className={`gap-1 text-xs ${shareLink.reward_given ? 'bg-green-500/90 hover:bg-green-500' : ''}`}
          >
            <Share2 className="w-3 h-3" />
            {shareLink.reward_given 
              ? t("dashboard.shareRewardEarned")
              : t("dashboard.shareProgress")
                  .replace("{n}", String(shareLink.click_count))
                  .replace("{total}", String(REWARD_THRESHOLD))
            }
          </Badge>
        </div>
      )}
    </div>
  );
};

export default UsageHistoryItem;