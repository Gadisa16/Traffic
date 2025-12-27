import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth, AuthUser, AppRole } from '@/hooks/useAuth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role?: AppRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  return (
    <AuthContext.Provider
      value={{
        user: auth.authUser,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        signIn: auth.signIn,
        signUp: auth.signUp,
        signOut: auth.signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export types
export type { AuthUser, AppRole };
