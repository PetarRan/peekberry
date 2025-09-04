/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
// Global constants injected by Vite
declare const __VITE_SUPABASE_URL__: string;
declare const __VITE_SUPABASE_ANON_KEY__: string;
