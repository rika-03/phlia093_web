/// <reference types="@astrojs/cloudflare" />

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  NODE_ENV: string;
}

export type { Env };
