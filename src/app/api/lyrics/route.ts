import { NextRequest } from "next/server";
import { z } from "zod";
import Meting from "@/meting/meting.js";
import { getMetingCookie } from "@/lib/cookie-helper";

const BodySchema = z.object({
  provider: z.enum(["netease", "tencent", "kugou", "baidu", "kuwo"]),
  source: z.enum(["url", "id"]),
  value: z.string().min(1),
  cookie: z.string().optional(),
});

type Provider = z.infer<typeof BodySchema>["provider"];

function parseIdFromUrl(provider: Provider, url: string): string | null {
  try {
    const u = new URL(url);
    if (provider === "netease") {
      const id = u.searchParams.get("id");
      if (id) return id;
      if (u.hash) {
        const m = u.hash.match(/id=(\d+)/);
        if (m) return m[1];
      }
      return null;
    }
    if (provider === "tencent") {
      const path = u.pathname;
      const m = path.match(/songDetail\/(\w+)/);
      if (m) return m[1];
      const id = u.searchParams.get("songmid");
      return id;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { provider, source, value, cookie } = parsed.data;

  const id = source === "id" ? value : parseIdFromUrl(provider, value);
  if (!id) {
    return Response.json({ error: "invalid_id_or_url" }, { status: 400 });
  }

  try {
    const meting = new Meting(provider);
    const metingCookie = getMetingCookie(provider, cookie);
    if (metingCookie) {
      meting.cookie(metingCookie);
    }
    meting.format(true);
    const result = await meting.lyric(id);
    let lyricData;
    try {
      lyricData = JSON.parse(result);
    } catch (parseError) {
      console.error(`[lyrics API] JSON parse error: ${parseError}`);
      console.error(`[lyrics API] Full raw result: ${result}`);
      return Response.json(
        {
          error: "parse_error",
          message: "Failed to parse lyric data",
          rawPreview: result?.substring(0, 500),
        },
        { status: 502 }
      );
    }

    let songInfo = null;
    let coverUrl = "";
    try {
      const songResult = await meting.song(id);
      const songData = JSON.parse(songResult);
      if (Array.isArray(songData) && songData.length > 0) {
        songInfo = songData[0];
        if (songInfo.pic_id) {
          const picResult = await meting.pic(songInfo.pic_id, 500);
          const picData = JSON.parse(picResult);
          coverUrl = picData.url || "";
        }
      }
    } catch (e) {
      console.error(`[lyrics API] Failed to fetch song info:`, e);
    }

    return Response.json({
      provider,
      id,
      lrc: lyricData.lyric ?? "",
      tlyric: lyricData.tlyric ?? "",
      coverUrl,
      songInfo: songInfo
        ? {
            name: songInfo.name,
            artist: songInfo.artist,
            album: songInfo.album,
          }
        : null,
    });
  } catch (e) {
    console.error(`[lyrics API] Request error:`, e);
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
