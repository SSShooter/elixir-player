import { NextRequest } from "next/server";
import { z } from "zod";
import Meting from "@/meting/meting.js";
import { getMetingCookie } from "@/lib/cookie-helper";

const BodySchema = z.object({
  provider: z.enum(["netease", "tencent", "kugou", "baidu", "kuwo"]),
  id: z.string().min(1),
  cookie: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { provider, id, cookie } = parsed.data;

  try {
    const meting = new Meting(provider);
    const metingCookie = getMetingCookie(provider, cookie);
    if (metingCookie) {
      meting.cookie(metingCookie);
    }
    meting.format(true);

    // Default 320k, but maybe we could make it configurable later
    const result = await meting.url(id, 320);

    let urlData;
    try {
      urlData = JSON.parse(result);
    } catch (parseError) {
      console.error(`[url API] JSON parse error: ${parseError}`);
      return Response.json(
        { error: "parse_error", message: "Failed to parse url data" },
        { status: 502 }
      );
    }

    if (!urlData.url) {
      return Response.json({ error: "no_url_found" }, { status: 404 });
    }

    return Response.json({
      url: urlData.url,
      size: urlData.size,
      br: urlData.br,
    });
  } catch (e) {
    console.error(`[url API] Request error:`, e);
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
