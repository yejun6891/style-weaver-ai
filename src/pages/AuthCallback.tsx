import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ✅ Supabase/Provider 에러는 query로 오기도 하고 hash로 오기도 해서 둘 다 파싱
  const { queryError, queryErrorDesc, code } = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return {
      queryError: qs.get("error"),
      queryErrorDesc: qs.get("error_description"),
      code: qs.get("code"),
    };
  }, [location.search]);

  const { hashError, hashErrorDesc } = useMemo(() => {
    const hs = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    return {
      hashError: hs.get("error"),
      hashErrorDesc: hs.get("error_description"),
    };
  }, [location.hash]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      // 1) provider error 먼저 처리
      const e = queryError || hashError;
      const d = queryErrorDesc || hashErrorDesc;
      if (e) {
        if (!alive) return;
        setErrMsg(d ?? e);
        setStatus("error");
        return;
      }

      try {
        // 2) PKCE: ?code=... 로 돌아오면 반드시 exchange 해야 세션이 저장됩니다.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // 3) Implicit: #access_token=... 로 돌아오는 케이스(프로젝트 설정/환경에 따라)
          // supabase-js가 자동으로 세션을 잡기도 하지만,
          // 안전하게 현재 세션을 한번 확인해서 없으면 오류 처리.
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            throw new Error("세션이 생성되지 않았습니다. (callback 파라미터/라우팅 확인 필요)");
          }
        }

        // 4) 세션이 확정되면 원하는 페이지로 이동
        if (!alive) return;
        navigate("/", { replace: true });
      } catch (err: any) {
        if (!alive) return;
        setErrMsg(err?.message ?? "로그인 처리 중 오류가 발생했습니다.");
        setStatus("error");
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [code, queryError, queryErrorDesc, hashError, hashErrorDesc, navigate]);

  if (status === "error") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <section className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-lg">
          <h1 className="font-display text-xl font-bold text-foreground">로그인에 실패했어요</h1>
          <p className="text-sm text-muted-foreground mt-2 break-words">
            {errMsg}
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
