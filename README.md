# ⚡️ **VibeStream — The Bhindi × Spotify Super-Agent**  
*Your AI side-kick that turns Bhindi into a fully-fledged music studio in one prompt.*

---

## 🎸 Why VibeStream?
Bhindi is an awesome playground for creating & running AI agents, but until today your agents have been… **quiet**.  
Music discovery, curation & playback is still locked away in browser tabs and Spotify apps.

> **VibeStream injects high-octane Spotify super-powers straight into Bhindi.**  
> Search tracks & artists, build playlists, get recommendations or inspect the current playback — all without ever leaving your chat.

### 🔥 What makes it magical?
• **Hands-free playlist management** – tell the agent the vibe and it keeps your queue fresh while you code.  
• **Lyric-to-song lookup** – can't remember the title? Just type a line from the song and watch it drop into your playlist.  
• **Instant party mode** – summon a high-energy banger list in seconds so you can DJ _and_ host.  
• **Contextual soundtracks** – weather, time of day, even your meeting calendar can shape the tracks it serves.  
• **Focus on shipping** – let AI sweat the music decisions while you crush features.

### The Problem we are solving
1. Context-switching between Bhindi and Spotify kills flow‐state 😵‍💫.  
2. Manual playlist curation is slow & uninspired.  
3. Developers want a *programmable* way to mash music into their workflows.

### What we built
• A type-safe Node.js API that wraps Spotify's Web API and exposes it as **Bhindi tools**.  
• Secure OAuth 2.0 flow with refresh logic so your tokens never expire mid-jam.  
• A plug-and-play agent registry – today we ship a `spotify` agent, tomorrow any service you like.  
• A React/Next.js playground (see "Try it out") where you can author prompts and watch the music appear.

---

## 🚀 Quick Start
1. Clone & install:
```bash
pnpm i # or npm install
```
2. Set the required environment variables (see `.env.example`).
3. Run locally:
```bash
pnpm dev # nodemon app.ts
```
4. Hit `localhost:3000/health` ➜ `{ "message": "Works bhai! Healthy" }`

---

## 🌐 REST API Reference
Base URL: `https://vibe-stream-be.vercel.app`

### Health
| Verb | Endpoint | Purpose |
|------|----------|---------|
| GET  | `/health` | Liveness probe. |

### Spotify OAuth
| Verb | Endpoint | Description |
|------|----------|-------------|
| GET | `/api/spotify-login` | Redirects the browser to Spotify's consent screen. |
| GET | `/api/callback?code=…&state=…` | Spotify redirects back here; exchanges the code for `access_token` + `refresh_token` and then forwards to your frontend. |
| GET | `/api/user-info` | Returns the current Spotify profile. Requires `Authorization: Bearer <access_token>`. |

### Bhindi Agent Endpoints
| Verb | Endpoint | Notes |
|------|----------|-------|
| GET | `/:agent` | Simple existence check for an agent (currently only `spotify`). |
| GET | `/:agent/tools` | Returns the JSON schema of all tools the agent exposes. |
| POST | `/:agent/tools/:toolName` | Executes a tool.  
Headers:  
`x-spotify-access` – Spotify **access_token**  
`x-spotify-refresh` – Spotify **refresh_token**  
Body: JSON matching the tool's parameter schema |

---

## 🛠️ Exposed Tools (`spotify` agent)
| Tool | Purpose | Required Params | Optional Params |
|------|---------|-----------------|-----------------|
| `search_tracks` | Search tracks by text | `query` | `limit`, `offset` |
| `search_artists` | Search artists by text | `query` | `limit`, `offset` |
| `create_playlist` | Create a playlist in the current user's library | `name` | `description`, `public` |
| `add_tracks_to_playlist` | Push tracks into a playlist | `playlist_id`, `track_ids` | `position` |
| `remove_tracks_from_playlist` | Delete tracks from a playlist | `playlist_id`, `track_ids` | – |
| `get_playlist_items` | List tracks inside a playlist | `playlist_id` | `limit`, `offset` |
| `get_current_playback` | Inspect what the user is currently listening to | – | – |
| `get_recommendations` | Get Spotify's track recommendations | `seed_genres` | `limit`, `market` |
| `get_recently_played` | Fetch the user's last played tracks | – | `limit` |
| `get_user_profile` | Grab the current user's profile object | – | – |

> **All tools require the two headers mentioned above for authentication.**

---

## 🌟 Try it Live
Head over to **[VibeStream Frontend](https://vibestream-frontend.vercel.app)**, sign-in with Spotify and summon the agent straight from Bhindi.

---

## 📜 License
[MIT](LICENSE)

---

### Built with 🤖 by **Silvanites** 