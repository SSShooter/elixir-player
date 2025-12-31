import { NextRequest } from "next/server";
import { z } from "zod";
import Meting from "@/meting/meting.js";
import { getMetingCookie } from "@/lib/cookie-helper";

const BodySchema = z.object({
  provider: z.enum(["netease", "tencent", "kugou", "baidu", "kuwo"]),
  value: z.string().min(1), // can be ID or URL
  cookie: z.string().optional(),
});

type Provider = z.infer<typeof BodySchema>["provider"];

function parseIdFromUrl(provider: Provider, url: string): string {
  try {
    // If it's just digits (or w+ for tencent), assume it's an ID
    // But strictly speaking, some IDs might look like URLs? Unlikely.
    if (!/^https?:\/\//.test(url)) return url;

    const u = new URL(url);
    if (provider === "netease") {
      const id = u.searchParams.get("id");
      if (id) return id;
      if (u.hash) {
        const m = u.hash.match(/playlist\/(\d+)/) || u.hash.match(/id=(\d+)/);
        if (m) return m[1];
      }
    }
    if (provider === "tencent") {
      // y.qq.com/n/ryqq/playlist/8622636594
      // or similar patterns
      const path = u.pathname;
      const m = path.match(/playlist\/(\d+)/);
      if (m) return m[1];
      const id = u.searchParams.get("id");
      if (id) return id;
    }
    // Fallback: return original if we can't parse, hoping the provider can handle it or it functions as ID
    return url;
  } catch {
    return url;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "invalid_body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { provider, value, cookie } = parsed.data;
    const id = parseIdFromUrl(provider, value);

    const meting = new Meting(provider);
    const metingCookie = getMetingCookie(provider, cookie);
    if (metingCookie) {
      meting.cookie(metingCookie);
    }
    meting.format(true);

    const result = await meting.playlist(id);

    try {
      const data = JSON.parse(result);
      return Response.json(data);
    } catch (parseError) {
      console.error(`[playlist API] JSON parse error:`, parseError);
      return Response.json(
        {
          error: "parse_error",
          message: "Failed to parse playlist results",
          raw: result,
        },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error(`[playlist API] Request error:`, e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
