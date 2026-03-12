# smolURL 🦈

I use TinyURL a lot. It works fine, but every other click they remind me I could be paying for "premium" features I don't need. I just want to shorten a URL. So I built my own.

smolURL is a self-hosted URL shortener that runs entirely on Cloudflare's free tier. No accounts, no upsells, no tracking.

## How it works

One Cloudflare Worker handles everything — the frontend, the API, and the redirects.

```
POST /api/shorten  →  generates a 2-char code, stores code→URL in KV
GET  /:code        →  looks up the code in KV, 301 redirects (or 404)
GET  /             →  serves the homepage
```

**Database:** Cloudflare KV. Each entry expires after 7 days.

**Domain:** Whatever domain your Worker runs on. By default that's `url-shortener.<account>.workers.dev`. You can attach a custom domain in the Cloudflare dashboard.

## Tech stack

- Next.js 16 (TypeScript, Tailwind CSS)
- Cloudflare Workers via [@opennextjs/cloudflare](https://opennext.js.org/cloudflare)
- Cloudflare KV for storage
- GitHub Actions for CI/CD

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a KV namespace

```bash
npx wrangler kv:namespace create URL_SHORTENER_KV
```

Paste the resulting ID into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "URL_SHORTENER_KV"
id = "<your-namespace-id>"
```

### 3. Local dev

```bash
npm run dev
```

### 4. Deploy

```bash
npm run pages:build
npm run pages:deploy
```

Or push to `main` — GitHub Actions handles it automatically. You'll need two repository secrets:

- `CLOUDFLARE_API_TOKEN` — create at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) with Workers Scripts (Edit), Workers KV Storage (Edit), and Account Settings (Read)
- `CLOUDFLARE_ACCOUNT_ID` — found on your Cloudflare dashboard overview page

## Project structure

```
app/
  [code]/route.ts       ← redirect handler
  api/shorten/route.ts  ← URL creation endpoint
  page.tsx              ← homepage UI
  layout.tsx
lib/
  kv.ts                 ← KV read/write helpers
wrangler.toml           ← Cloudflare Worker config
open-next.config.ts     ← OpenNext adapter config
```
