import { createClient } from '@supabase/supabase-js';

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta?.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process?.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Limpieza defensiva contra comillas agregadas accidentalmente en Cloudflare Dashboard
const clean = (val) => {
  if (!val) return '';
  return String(val).trim().replace(/^['"]|['"]$/g, '');
};

const CANONICAL_URL = 'https://vmuezpofboixfymeinld.supabase.co';
const CANONICAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdWV6cG9mYm9peGZ5bWVpbmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjk4ODgsImV4cCI6MjEwNzg0NTg4OH0.f6S1npD_Hd13CqS0NOTTWScU_WrFREgUu1UZhQ8mNwQ';

const supabaseUrl = clean(getEnv('VITE_SUPABASE_URL')) || CANONICAL_URL;
const supabaseAnonKey = clean(getEnv('VITE_SUPABASE_ANON_KEY')) || CANONICAL_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

