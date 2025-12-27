// Supabase client stub - new-web-admin now uses FastAPI backend exclusively.
// This stub prevents import errors from legacy code that hasn't been migrated yet.
// The actual Supabase instance is only used by the backend for storage.


// Stub client to prevent initialization errors
// Real data queries now go through FastAPI at VITE_API_URL
export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: new Error('Use FastAPI backend') }),
    update: () => Promise.resolve({ data: null, error: new Error('Use FastAPI backend') }),
    delete: () => Promise.resolve({ data: null, error: new Error('Use FastAPI backend') }),
  }),
  auth: {
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Use FastAPI /auth/login') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Use FastAPI /auth/admin/register') }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
  },
} as any;