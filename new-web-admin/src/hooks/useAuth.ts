import * as Api from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

export type AppRole = 'admin' | 'inspector';

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

  const signUp = async (_email: string, _password: string, _name: string, _role: AppRole = 'inspector') => {
    // Admin creation should be handled via controlled provisioning in FastAPI.
    // Keep method for compatibility with existing UI, but disallow to avoid opening admin registration.
    return { error: new Error('Sign up is disabled. Please contact an administrator.') };
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
