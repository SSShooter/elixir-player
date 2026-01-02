import { NextRequest } from "next/server";
import { z } from "zod";
import Meting from "@/meting/meting.js";
import { getMetingCookie } from "@/lib/cookie-helper";

const BodySchema = z.object({
  provider: z.enum(["netease", "tencent", "kugou", "baidu", "kuwo"]),
  keyword: z.string().min(1),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(30),
  cookie: z.string().optional(),
});

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

    const { provider, keyword, page, limit, cookie } = parsed.data;

    const meting = new Meting(provider);
    const metingCookie = getMetingCookie(provider, cookie);
    if (metingCookie) {
      meting.cookie(metingCookie);
    }
    meting.format(true);

    const result = await meting.search(keyword, { page, limit });

    try {
      const data = JSON.parse(result);
      // Debug log to check if cover_url is present
      if (data && data.length > 0) {
        console.log('[API Debug] First result item:', JSON.stringify(data[0], null, 2));
      }
      return Response.json(data);
    } catch (parseError) {
      console.error(`[search API] JSON parse error:`, parseError);
      return Response.json(
        {
          error: "parse_error",
          message: "Failed to parse search results",
          raw: result,
        },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error(`[search API] Request error:`, e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
