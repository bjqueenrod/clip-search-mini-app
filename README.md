# Clip Search Mini App

Telegram Mini App for browsing, searching, filtering, and previewing a paid clip library. The frontend is a React/Vite Mini App and the backend is a FastAPI service that reads the existing `clips` table, validates Telegram init data, and serves only safe preview metadata.

## Structure

- `apps/web`: Telegram Mini App frontend
- `apps/api`: FastAPI backend
- `../payment-system`: upstream clip admin/schema changes for `bunny_stream_preview_id`

## Features

- Telegram-aware mobile-first UI with browser fallback banner
- Search, filters, sort, load-more pagination, recent searches
- Bunny Stream player preview on the clip detail sheet
- Exact Telegram bot deep links for stream/download purchase actions
- FastAPI API with server-side Telegram init data validation
- Flexible clip field mapping centered on the real payment-system schema

## Environment

Copy `.env.example` and provide real values.

Backend values:

- `PORT`
- `APP_ENV`
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `FRONTEND_URL`
- `SESSION_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `BUNNY_STREAM_LIBRARY_ID`
- `BUNNY_STREAM_API_KEY`
- `BUNNY_STREAM_CDN_HOST`
- `BUNNY_STREAM_EMBED_TOKEN_KEY`
- `BUNNY_PREVIEW_COLLECTION_ID`

Frontend values:

- `VITE_API_BASE_URL`
- `VITE_APP_NAME`

## Local Development

### API

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Web

```bash
corepack enable
pnpm install
pnpm dev:web
```

The Vite dev server runs on `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

## Telegram Browser Fallback

Outside Telegram, the app shows a `Telegram preview mode` banner and can still browse the safe public catalog. In `development`, posting to `/api/auth/telegram` with a `devUser` payload creates a mock session for local testing.

## Bunny Preview Flow

The Mini App does not use Telegram `file_id` for previews. Instead it expects `clips.bunny_stream_preview_id` to point at a Bunny Stream preview video. The backend uses Bunny metadata plus the configured CDN host to generate:

- `thumbnailUrl`
- `previewWebpUrl`
- `previewEmbedUrl`

The frontend uses the Bunny Stream player in the clip detail view.

## Paid Delivery Safety

The Mini App never exposes paid stream or download URLs. Purchase actions deep-link back into the Telegram bot using your existing format:

- `https://t.me/mistressbjqueenbot?start=stream_<ID>`
- `https://t.me/mistressbjqueenbot?start=download_<ID>`

## Telegram Setup

1. Deploy the app on HTTPS.
2. Set the bot menu button to open the Mini App URL.
3. Ensure `TELEGRAM_BOT_TOKEN` matches the bot serving the menu button.
4. The frontend posts Telegram `initData` to `/api/auth/telegram`.
5. The backend validates `initData` before issuing a signed session cookie.

## Railway Deployment

This repo is designed for a single Railway service.

1. Create a new Railway service from this repo.
2. Add the environment variables from `.env.example`.
3. Railway builds the React frontend, then runs FastAPI via the root `Dockerfile`.
4. Set your public domain as the Mini App URL in BotFather.

## Upstream `payment-system` Changes

This implementation also updates `../payment-system` so clip admin can manage `bunny_stream_preview_id`.

- `db.py` adds the schema column.
- `app.py` accepts/saves the field.
- clip admin UI loads preview videos from Bunny collection `281a5ee9-db7e-41a2-bce0-97e16a7fd7b9`.
- add/edit forms try to auto-match preview videos by filename and still allow manual override.

## Notes

- The data mapping is centralized in `apps/api/app/db/clip_mapping.py`.
- Alembic is included for future app-owned migrations, but this service treats the existing `clips` table as externally managed.
