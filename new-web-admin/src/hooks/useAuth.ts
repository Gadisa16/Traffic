import * as Api from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

export type AppRole = 'admin' | 'super_admin' | 'inspector';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole | null;
}

export function useSupabaseAuth() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const token = Api.getAccessToken();
      if (!token) {
        setAuthUser(null);
        return;
      }

      try {
        const me = await Api.getCurrentUser();

        // Map backend -> UI auth user.
        // Backend login uses username, but this UI uses an "email" input.
        // We store whatever backend returns in a compatible shape.
        setAuthUser({
          id: String(me.id),
          email: me.email || me.username,
          name: me.username,
          role: (me.role as AppRole) || null,
        });
      } catch (err) {
        // If token expired, try refresh once.
        try {
          await Api.refreshToken();
          const me = await Api.getCurrentUser();
          setAuthUser({
            id: String(me.id),
            email: me.email || me.username,
            name: me.username,
            role: (me.role as AppRole) || null,
          });
        } catch {
          Api.logout();
          setAuthUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      // Backend expects username, not email.
      // We accept whatever the UI provides and pass it through.
      await Api.login(emailOrUsername, password);
      await loadMe();
      return { error: null as Error | null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signUp = async (emailOrUsername: string, password: string, name: string, role: AppRole = 'inspector') => {
    try {
      // Check if admin signup is enabled via env var
      const enableAdminSignup = import.meta.env.VITE_ENABLE_ADMIN_SIGNUP === 'true';

      if (!enableAdminSignup) {
        return { error: new Error('Admin sign up is disabled. Please contact an administrator.') };
      }

      // Call admin registration endpoint
      await Api.registerAdmin(name, password, emailOrUsername);
      await loadMe();
      return { error: null as Error | null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    Api.logout();
    setAuthUser(null);
    return { error: null as Error | null };
  };

  return {
    user: null,
    session: null,
    authUser,
    isLoading,
    isAuthenticated: !!authUser,
    signIn,
    signUp,
    signOut,
  };
}
