import { useEffect, useState, useCallback } from 'react';
import { supabase, signInWithEmail as sbSignIn, signUpWithEmail as sbSignUp, signOut as sbSignOut, type LocalUser } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email! } : null);
      setLoading(false);
    });

    // Listen for auth state changes (e.g. token refresh, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email! } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const u = await sbSignIn(email, password);
    setUser(u);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const u = await sbSignUp(email, password);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await sbSignOut();
    setUser(null);
  }, []);

  return { user, loading, signInWithEmail, signUpWithEmail, signOut };
}
