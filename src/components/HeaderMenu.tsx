import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LayoutDashboard, User, LogOut } from "lucide-react";

const HeaderMenu = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg py-2 animate-fade-up z-50">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs text-muted-foreground">{t("nav.loggedIn") || "로그인됨"}</p>
            <p className="text-sm font-medium text-foreground truncate">
              {user.email ?? "Google 사용자"}
            </p>
          </div>
          <div className="border-t border-border my-1" />
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
