export async function putToR2(
  r2: R2Bucket,
  key: string,
  data: BodyInit,
  options?: R2PutOptions,
): Promise<R2Object> {
  return await r2.put(key, data, options);
}

export async function getFromR2(
  r2: R2Bucket,
  key: string,
): Promise<R2ObjectBody | null> {
  const obj = await r2.get(key);
  return obj?.body ?? null;
}

export async function deleteFromR2(
  r2: R2Bucket,
  key: string,
): Promise<void> {
  await r2.delete(key);
}

export function generateImageKey(fileName: string): string {
  const ext = fileName.split(".").pop() || "png";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `images/${timestamp}-${random}.${ext}`;
}
