# OLX Automation

> Full-stack tool that automates OLX.pl listings — upload photos, Claude Vision writes the title and description, the app publishes to OLX and automatically drops the price every two weeks until sold.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Vue 3](https://img.shields.io/badge/Vue-3-42b883)
![Deployed on Railway](https://img.shields.io/badge/backend-Railway-blueviolet)

## Features

- **AI-powered listing creation** — Claude Vision analyses your photos and generates a Polish title, description, and category suggestion
- **6-step wizard** — photo upload → AI analysis → edit metadata → pricing → review → publish
- **OLX OAuth 2.0** — connect your OLX account directly; listings published via the OLX Partner API
- **Automatic price reduction** — cron job drops price by a configurable % every N days until the item sells
- **Price history chart** — visualises price changes over time per listing
- **Verification & regenerate** — re-run AI analysis on any listing; Claude scores quality 0–100 and suggests improvements
- **Multi-user support** — JWT auth for registered users, session-based guest mode
- **Document OCR** — upload a receipt and Claude extracts metadata automatically

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 · Vite · TypeScript · Pinia |
| Backend | Node.js 22 · Express · TypeScript |
| Database | PostgreSQL (4 versioned SQL migrations) |
| Auth | JWT (bcryptjs) + OLX OAuth 2.0 |
| AI | Claude Vision (tool use / structured output) |
| Deployment | Railway (backend) · Netlify (frontend) |

## Quick Start

```bash
git clone https://github.com/Waldisurfer/olx-automation.git
cd olx-automation
npm install
cp .env.example .env
```

Fill in `.env`:

```bash
OLX_CLIENT_ID=...           # from developer.olx.pl
OLX_CLIENT_SECRET=...
ANTHROPIC_API_KEY=...       # from console.anthropic.com
DATABASE_URL=postgresql://...
PUBLIC_BASE_URL=http://localhost:3001  # use ngrok URL before publishing
```

```bash
npm run dev    # starts backend (3001) + frontend (5173) concurrently
```

Open http://localhost:5173

### OLX API Registration

1. Go to https://developer.olx.pl and create an application
2. Set Redirect URI: `http://localhost:3001/api/auth/olx/callback`
3. Copy Client ID and Client Secret to `.env`
4. In the app go to **Settings → Connect with OLX**

> **Note:** OLX requires publicly accessible image URLs. For local development use `npx localtunnel --port 3001` and set `PUBLIC_BASE_URL` to the tunnel URL.

## Project Structure

```
olx-automation/
├── backend/
│   └── src/
│       ├── services/      # ClaudeVision, OlxApiClient, pricing, search
│       ├── db/
│       │   ├── migrations/    # 4 versioned SQL files
│       │   └── repositories/  # ListingRepository, PriceHistoryRepository
│       ├── routes/        # auth, listings, upload, analyze, search, categories
│       ├── middleware/    # JWT auth, error handler
│       └── jobs/          # PriceReductionJob (node-cron)
└── frontend/
    └── src/
        ├── views/         # Dashboard, wizard, detail, auth, settings
        ├── components/
        │   ├── wizard/    # 6 step components + CategoryPicker
        │   └── listing/   # ListingCard, PriceHistoryChart, VerifyPanel
        ├── stores/        # Pinia: auth, wizard, listings, notifications
        └── api/           # Typed axios wrappers per domain
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/user-auth/register` | Register |
| POST | `/api/user-auth/login` | Login |
| GET | `/api/auth/olx/url` | OLX OAuth URL |
| GET | `/api/auth/olx/callback` | OLX OAuth callback |
| POST | `/api/upload/photos` | Upload photos (multipart) |
| POST | `/api/analyze` | Claude Vision analysis |
| GET | `/api/search/similar` | Similar listings + suggested price |
| GET | `/api/listings` | List all user listings |
| POST | `/api/listings` | Create draft |
| POST | `/api/listings/:id/publish` | Publish to OLX |
| POST | `/api/listings/:id/price` | Manual price change |
| POST | `/api/listings/:id/mark-sold` | Mark as sold |

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for full system design, database schema, auth flow, and Claude tool-use specification.

## License

MIT © 2026 Waldisurfer
