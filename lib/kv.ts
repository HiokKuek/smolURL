import { getRequestContext } from "@cloudflare/next-on-pages";

function getKV(): KVNamespace {
  return getRequestContext().env.URL_SHORTENER_KV;
}

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function getUrl(code: string): Promise<string | null> {
  return getKV().get(code);
}

export async function putUrl(code: string, url: string): Promise<void> {
  await getKV().put(code, url, { expirationTtl: TTL_SECONDS });
}
