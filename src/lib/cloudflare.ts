import { getDb } from "./db";
import type { DB } from "./db";

export interface CloudflareServices {
  db: DB;
  r2: R2Bucket;
  kv: KVNamespace;
}

export function getServices(locals: App.Locals): CloudflareServices {
  const env = locals.runtime.env;
  return {
    db: getDb(env.DB),
    r2: env.R2,
    kv: env.KV,
  };
}

export function getDbFromLocals(locals: App.Locals): DB {
  return getDb(locals.runtime.env.DB);
}
