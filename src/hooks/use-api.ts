import { useQuery } from "@tanstack/react-query";
import { Provider } from "@/components/provider-selector";

// --- Types ---
export interface SongResult {
  id: string | number;
  name: string;
  artist: string[];
  album: string;
  url_id?: string | number;
  pic_id?: string | number;
}

// Re-export specific song info structure used in page.tsx if needed
// but SongResult covers most list items.

interface LyricsData {
  lrc: string;
  tlyric: string;
  coverUrl: string;
  songInfo?: {
    name: string;
    artist: string[];
    album: string;
  };
  error?: string;
}

// --- Fetcher Functions ---

function getUserCookie(provider: Provider): string | undefined {
  if (typeof window !== "undefined") {
    return localStorage.getItem(`meting_cookie_${provider}`) || undefined;
  }
  return undefined;
}

async function fetchSearch(
  keyword: string,
  provider: Provider,
  page: number = 1,
  limit: number = 30
): Promise<SongResult[]> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      keyword,
      page,
      limit,
      cookie: getUserCookie(provider),
    }),
  });
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchPlaylist(
  id: string,
  provider: Provider
): Promise<SongResult[]> {
  const res = await fetch("/api/playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      value: id,
      cookie: getUserCookie(provider),
    }),
  });
  if (!res.ok) throw new Error("Playlist lookup failed");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return Array.isArray(data) ? data : [];
}

async function fetchLyrics(
  value: string,
  provider: Provider
): Promise<LyricsData> {
  const source = /^https?:\/\//.test(value) ? "url" : "id";
  const res = await fetch("/api/lyrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      source,
      value,
      cookie: getUserCookie(provider),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(String(data?.error || "lyrics_fetch_failed"));
  }
  return data;
}

// --- Hooks ---

export function useSearchSongs(keyword: string, provider: Provider) {
  return useQuery({
    queryKey: ["search", provider, keyword],
    queryFn: () => fetchSearch(keyword, provider),
    enabled: !!keyword, // Only fetch if keyword exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlaylistSongs(id: string, provider: Provider) {
  return useQuery({
    queryKey: ["playlist", provider, id],
    queryFn: () => fetchPlaylist(id, provider),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLyrics(value: string, provider: Provider) {
  return useQuery({
    queryKey: ["lyrics", provider, value],
    queryFn: () => fetchLyrics(value, provider),
    enabled: !!value,
    staleTime: Infinity, // Lyrics rarely change, cache essentially forever (or until memory clear)
    retry: 1, // Don't retry too much for failed lyrics
  });
}
