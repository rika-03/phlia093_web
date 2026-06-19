export async function getFromKV<T>(
  kv: KVNamespace,
  key: string,
): Promise<T | null> {
  try {
    const value = await kv.get(key, "json");
    return value as T | null;
  } catch (err) {
    console.error("KV get failed:", key, err);
    return null;
  }
}

export async function setToKV(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  try {
    const options: KVNamespacePutOptions = {};
    if (ttlSeconds) {
      options.expirationTtl = ttlSeconds;
    }
    await kv.put(key, JSON.stringify(value), options);
  } catch (err) {
    console.error("KV set failed:", key, err);
  }
}

export async function deleteFromKV(
  kv: KVNamespace,
  key: string,
): Promise<void> {
  try {
    await kv.delete(key);
  } catch (err) {
    console.error("KV delete failed:", key, err);
  }
}

export async function withCache<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600,
): Promise<T> {
  const cached = await getFromKV<T>(kv, key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  await setToKV(kv, key, data, ttlSeconds);
  return data;
}
