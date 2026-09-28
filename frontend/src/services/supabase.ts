import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default to the project's public Supabase URL and public anon key (safe for client bundle)
// Can be overridden by environment variables in Vercel or local .env
const defaultSupabaseUrl = 'https://oncdnapacnzayvqxyubf.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uY2RuYXBhY256YXl2cXh5dWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MDc4MTUsImV4cCI6MjEwNjE4MzgxNX0.Vuape54WXWtusIg-9TfxI5AlwrrnzFFTTo3JAl_yMfk';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-supabase-anon-key') &&
    !supabaseUrl.includes('placeholder')
  );
};

// Initialize Supabase client with active session persistence
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    );
  }

  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) {
    throw error;
  }
  return data;
};

export const signOut = async () => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out of Supabase:', error);
    }
  }
  localStorage.removeItem('cycleclub_auth_token');
  localStorage.removeItem('cycleclub_user');
};
