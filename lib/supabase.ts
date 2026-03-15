import { createClient } from '@supabase/supabase-js';

// Helper to ensure we always have a valid URL format for Supabase
const getValidUrl = (url: string | undefined) => {
  if (!url) return 'https://placeholder.supabase.co';
  try {
    new URL(url);
    return url;
  } catch (e) {
    console.warn(`Invalid Supabase URL provided: "${url}". Falling back to placeholder.`);
    return 'https://placeholder.supabase.co';
  }
};

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
);

const supabaseUrl = getValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Initialize the Supabase client for Postgres database access
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
