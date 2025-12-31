import { useState, useEffect } from "react";
import { useShareLink } from "@/hooks/useShareLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gift, Share2, Copy, Check, Sparkles, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareRewardSectionProps {
  taskId: string | null;
  resultImageUrl?: string;
}

const ShareRewardSection = ({ taskId, resultImageUrl }: ShareRewardSectionProps) => {
  const { t } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const { 
    shareLink, 
    loading, 
    getOrCreateShareLink, 
    getShareUrl, 
    refreshShareLink,
    REWARD_THRESHOLD 
  } = useShareLink(taskId);
  
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const clickCount = shareLink?.click_count ?? 0;
  const rewardGiven = shareLink?.reward_given ?? false;
  const progress = Math.min((clickCount / REWARD_THRESHOLD) * 100, 100);

  // Check for reward completion and show celebration
  useEffect(() => {
    if (rewardGiven && !showCelebration) {
      setShowCelebration(true);
      refreshProfile();
    }
  }, [rewardGiven]);

  const handleCreateShareLink = async () => {
    const link = await getOrCreateShareLink();
    if (link) {
      const url = getShareUrl(link.share_code);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("share.linkCopied"));
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    
    const url = getShareUrl(shareLink.share_code);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("share.linkCopied"));
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyShareText = async () => {
    if (!shareLink) return;
    
    const url = getShareUrl(shareLink.share_code);
    const shareText = t("share.shareTemplate").replace("{url}", url);
    await navigator.clipboard.writeText(shareText);
    toast.success(t("share.textCopied"));
  };

  const handleRefresh = async () => {
    await refreshShareLink();
    toast.success(t("share.refreshed"));
  };

  if (!user || !taskId) return null;

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      rewardGiven 
        ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
        : "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10"
    )}>
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            rewardGiven 
              ? "bg-green-500/20" 
              : "bg-primary/20"
          )}>
            {rewardGiven ? (
              <PartyPopper className="w-6 h-6 text-green-600" />
            ) : (
              <Gift className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {rewardGiven ? t("share.rewardComplete") : t("share.earnCredits")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {rewardGiven 
                ? t("share.rewardCompleteDesc") 
                : t("share.earnCreditsDesc")}
            </p>
          </div>
        </div>

        {/* Progress Section */}
        {shareLink && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("share.clicks")}</span>
              <span className="font-medium">
                {clickCount} / {REWARD_THRESHOLD}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            {!rewardGiven && clickCount > 0 && clickCount < REWARD_THRESHOLD && (
              <p className="text-xs text-muted-foreground text-center">
                {t("share.clicksRemaining").replace("{n}", String(REWARD_THRESHOLD - clickCount))}
              </p>
            )}
          </div>
        )}

        {/* Reward Badge */}
        {rewardGiven && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <Sparkles className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-700 dark:text-green-400">
              {t("share.creditEarned")}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {!shareLink ? (
          <Button 
            onClick={handleCreateShareLink}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {loading ? t("share.creating") : t("share.createLink")}
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Share Link Display */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <code className="flex-1 text-sm truncate">
                {getShareUrl(shareLink.share_code)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCopyShareText}
              >
                <Copy className="w-4 h-4 mr-2" />
                {t("share.copyText")}
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t("share.checkStatus")}
              </Button>
            </div>

            {/* Instructions */}
            {!rewardGiven && (
              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                <p>📱 {t("share.instruction1")}</p>
                <p>🔗 {t("share.instruction2")}</p>
                <p>🎁 {t("share.instruction3")}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShareRewardSection;
