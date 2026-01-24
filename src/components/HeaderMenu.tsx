import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, LayoutDashboard, User, LogOut, MessageCircle, ShieldCheck } from "lucide-react";

const HeaderMenu = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingTicketCount, setPendingTicketCount] = useState(0);

  // Fetch pending ticket count for admin
  useEffect(() => {
    if (!isAdmin) {
      setPendingTicketCount(0);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from("feedback_tickets")
          .select("*", { count: "exact", head: true })
          .in("status", ["open", "in_progress"]);

        if (error) {
          console.error("Error fetching pending tickets:", error);
          return;
        }

        setPendingTicketCount(count || 0);
      } catch (err) {
        console.error("Failed to fetch pending ticket count:", err);
      }
    };

    fetchPendingCount();
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/");
  };

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
        {t("nav.login")}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
        className="relative"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        {/* Admin notification badge on menu button */}
        {isAdmin && pendingTicketCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {pendingTicketCount > 9 ? "9+" : pendingTicketCount}
          </span>
        )}
      </Button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-2 animate-fade-up z-50">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs text-muted-foreground">{t("nav.loggedIn")}</p>
            <p className="text-sm font-medium text-foreground truncate">
              {user.email ?? "Google 사용자"}
            </p>
          </div>
          <div className="border-t border-border my-1" />

          {/* Admin Dashboard - only visible to admins */}
          {isAdmin && (
            <button
              onClick={() => {
                navigate("/admin");
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">{t("nav.admin")}</span>
              {pendingTicketCount > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-2 py-0.5">
                  {pendingTicketCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              navigate("/dashboard");
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="font-medium">{t("nav.dashboard")}</span>
          </button>
          <button
            onClick={() => {
              navigate("/mypage");
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="font-medium">{t("nav.mypage")}</span>
          </button>
          <button
            onClick={() => {
              navigate("/feedback");
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">{t("nav.feedback")}</span>
          </button>
          <div className="border-t border-border my-1" />
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">{t("nav.logout")}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderMenu;
