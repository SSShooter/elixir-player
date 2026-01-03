# Elixir Player

A modern music player web application built with Next.js, featuring AI-powered lyrics analysis and language learning tools. It integrates with various music platforms to provide a seamless playback and learning experience.

## Features
- **Multi-platform Support**: Unified access to music from Netease, Tencent, Kugou, and more.
- **AI Lyrics Appreciation**: Get deep insights into song meanings, themes, and artistic expressions.
- **AI Language Learning**: Specialized AI analysis for vocabulary and grammar based on song lyrics.
- **Dynamic Song Cards**: Generate and share beautiful cards or embed them in your website.
- **Playlist Management**: Easily import and explore tracks from external playlist links.

## Song Card

```html
<iframe height="83px" width="100%" src="https://elixia-player.koyeb.app/embed/tencent/001ATfEL0kn2NA"></iframe>
<iframe height="83px" width="100%" src="https://elixia-player.koyeb.app/card?url=https://music.163.com/song?id=610149"></iframe>
<iframe height="83px" width="100%" src="https://elixia-player.koyeb.app/card/netease/610149"></iframe>
```

### Image

```html
<img src="https://elixia-player.koyeb.app/card/tencent/001ATfEL0kn2NA/image" />
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages

- **Home (`/`)**: The main player interface. Features include playback control, lyrics display, and AI analysis tabs. It supports auto-loading via query parameters: `/?id=SONG_ID&provider=PROVIDER`.
- **Search (`/search`)**: Find tracks across different providers using keywords.
- **Playlist (`/playlist`)**: Import tracks from playlist URLs or IDs to quickly build your queue.
- **Share (`/share`)**: Create customizable, high-quality images for the current song, perfect for sharing on social media.
- **AI Configuration (`/ai-config`)**: Configure your preferred AI model and API keys for the analysis features.
- **Card (`/card`)**: Preview and interact with song-specific landing pages.
- **Embed (`/embed`)**: Specialized compact view optimized for embedding the player or cards in iframes on external websites.

## API Reference

### Music Data

#### `POST /api/lyrics`
Fetch lyrics and metadata for a specific track.
- **Body**: `{ provider: string, source: "url" | "id", value: string, cookie?: string }`
- **Response**: Lyrics (LRC), translation, and song metadata (name, artist, album, cover).

#### `POST /api/search`
Search for songs.
- **Body**: `{ provider: string, keyword: string, page?: number, limit?: number }`
- **Response**: Array of search results.

#### `POST /api/playlist`
Retrieve tracks from a playlist.
- **Body**: `{ provider: string, value: string }`
- **Response**: Array of songs in the playlist.

#### `POST /api/url`
Get the direct audio stream URL.
- **Body**: `{ provider: string, id: string }`
- **Response**: Playback URL and quality info.

### Utilities

#### `GET /api/proxy-image?url=...`
A proxy endpoint to bypass CORS restrictions for external album art.

#### `GET /card/image?url=...&width=...`
Utility endpoint that parses a music platform URL and redirects to the appropriate dynamic card image.

#### `GET /app/card/[provider]/[id]/image?width=...`
Generates a dynamic Open Graph (OG) image for a specific song, optimized for sharing.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **Music API**: MetingJS integration
- **AI Integration**: OpenAI-compatible API support
- **Fonts**: Geist & Noto Sans CJK SC

## Acknowledgments

- [MetingJS](https://github.com/metowolf/MetingJS)