import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // If the provider returns an error, surface it.
  const params = new URLSearchParams(location.search);
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  useEffect(() => {
    // 로그인 완료 후 항상 초기화면(/)으로 이동
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <section className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-lg">
          <h1 className="font-display text-xl font-bold text-foreground">로그인에 실패했어요</h1>
          <p className="text-sm text-muted-foreground mt-2 break-words">
            {errorDescription ?? error}
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="default" onClick={() => navigate("/auth", { replace: true })}>
              다시 로그인
            </Button>
            <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
              홈으로
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground animate-pulse">로그인 처리 중…</div>
    </main>
  );
};

export default AuthCallback;
