import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  credits: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitializedRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  };

  const ensureProfile = async (currentUser: User) => {
    const existing = await fetchProfile(currentUser.id);
    if (existing) return existing;

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        user_id: currentUser.id,
        email: currentUser.email ?? null,
        display_name: (currentUser.user_metadata as any)?.full_name ?? null,
        avatar_url: (currentUser.user_metadata as any)?.avatar_url ?? null,
      })
      .select("*")
      .maybeSingle();

    if (insertError) {
      console.error("Error creating profile:", insertError);
      return null;
    }

    return inserted ?? null;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await ensureProfile(user);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // IMPORTANT:
    // 초기 마운트 시에는 getSession()이 완료되기 전까지는 loading을 false로 만들지 않습니다.
    // 그렇지 않으면 일부 환경에서 잠깐 session=null 상태가 되어 보호 페이지가 "로그인 필요"로 오인할 수 있습니다.

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Keep Functions client auth token in sync
      if (session?.access_token) {
        supabase.functions.setAuth(session.access_token);
      } else {
        supabase.functions.setAuth("");
      }

      // Defer profile fetch with setTimeout to avoid deadlock
      if (session?.user) {
        setTimeout(() => {
          ensureProfile(session.user).then(setProfile);
        }, 0);
      } else {
        setProfile(null);
      }

      if (isInitializedRef.current) {
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.access_token) {
        supabase.functions.setAuth(session.access_token);
      } else {
        supabase.functions.setAuth("");
      }

      if (session?.user) {
        ensureProfile(session.user).then(setProfile);
      }

      isInitializedRef.current = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
