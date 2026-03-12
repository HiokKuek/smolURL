import { NextRequest, NextResponse } from "next/server";
import { putUrl } from "@/lib/kv";

export const runtime = "edge";

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode(length: number): string {
  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array, (byte) => CHARS[byte % CHARS.length]).join("");
}

export async function POST(request: NextRequest) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const longUrl = body.url;
  if (
    !longUrl ||
    typeof longUrl !== "string" ||
    (!longUrl.startsWith("http://") && !longUrl.startsWith("https://"))
  ) {
    return NextResponse.json(
      { error: "Invalid URL. Must start with http:// or https://" },
      { status: 400 }
    );
  }

  const code = generateCode(2);
  await putUrl(code, longUrl);

  const host = request.headers.get("host") ?? "yourdomain.com";
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  const short = `${protocol}://${host}/${code}`;

  return NextResponse.json({ short, code });
}
