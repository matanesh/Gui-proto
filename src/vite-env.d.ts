/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Editable system name shown in the boot splash and sidebar. */
  readonly VITE_SYSTEM_NAME?: string;
  /** Optional shorter system name for tight spaces. */
  readonly VITE_SYSTEM_SHORT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
