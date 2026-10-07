/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Initial Nagios target when no settings are stored; '/' means same origin. */
  readonly VITE_DEFAULT_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}