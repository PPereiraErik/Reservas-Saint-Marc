/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço do projeto no Supabase, ex.: https://abcdefgh.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Chave pública (anon / publishable) do projeto no Supabase. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
