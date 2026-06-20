# Deploying to Vercel

This project is a TanStack Start app (SSR + server functions + Supabase). It deploys to Vercel as a full serverless app — **not** as a static SPA.

## One-time setup

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New Project** → import the repo.
3. **Framework Preset:** Other (leave as auto-detected).
4. **Build Command:** `npm run build` (default).
5. **Output Directory:** leave **blank** (Nitro writes to `.vercel/output/` using the Vercel Build Output API v3 — Vercel auto-detects it).
6. **Install Command:** `npm install` (or `bun install`).

## Required environment variables (Vercel → Project Settings → Environment Variables)

Add these to **Production, Preview, and Development**:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | from this project's `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | from this project's `.env` |
| `VITE_SUPABASE_PROJECT_ID` | from this project's `.env` |
| `SUPABASE_URL` | same as `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | same as `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | from Lovable Cloud backend secrets |
| `LOVABLE_API_KEY` | from Lovable Cloud backend secrets (only if using Lovable AI) |

> The `VITE_*` ones are exposed to the browser bundle (safe — they're the publishable key). The unprefixed ones are only read inside server functions.

## Deploy

Push to your main branch and Vercel will build + deploy automatically. Server functions (admin CRUD, etc.) run as serverless functions; static assets are served from Vercel's CDN.

## How it works

- `vite.config.ts` pins Nitro's preset to `vercel` for non-Lovable builds.
- Nitro emits `.vercel/output/` (Build Output API v3). No `vercel.json` rewrites are needed — Nitro generates the routing config itself.
- Inside Lovable's own preview/published builds, the preset is forced to Cloudflare and this `vercel` override is ignored, so previews keep working.
