import { NextRequest, NextResponse } from "next/server";
import { getUrl } from "@/lib/kv";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const url = await getUrl(code);

  if (!url) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.redirect(url, 301);
}
