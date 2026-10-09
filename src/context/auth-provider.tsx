import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/backend";
import { AuthContext, type AuthContextValue } from "./auth-context";

/**
 * 帳號狀態的唯一來源。
 *
 * 這裡同時保存 user 與 session（只留 user 會遺失 access token，重新整理就壞掉），
 * 並且「先註冊監聽、再讀既有 session」，否則會和首次還原競爭而漏接事件。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data: sessionData }) => {
        setSession(sessionData.session ?? null);
        setUser(sessionData.session?.user ?? null);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));

    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, isLoading, signIn, signUp, signOut }),
    [user, session, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
