# OLX Automation

Automatyzacja sprzedaży na OLX.pl — dodaj zdjęcia, AI tworzy opis, system publikuje ogłoszenie i automatycznie obniża cenę co 2 tygodnie.

## Stack

- **Frontend**: Vue 3 + Vite + TypeScript + Pinia
- **Backend**: Node.js 25 + Express + TypeScript
- **Baza danych**: Node.js built-in `node:sqlite` (brak kompilacji natywnej)
- **AI**: Claude API (Anthropic) — analiza zdjęć, opis po polsku
- **OLX**: OLX Partner API (OAuth 2.0)

## Instalacja

```bash
# Wymagania: Node.js >= 22.5
git clone ...
cd OlxAutomation
npm install
cp .env.example .env
```

Uzupełnij `.env`:

```bash
OLX_CLIENT_ID=...       # z developer.olx.pl
OLX_CLIENT_SECRET=...
ANTHROPIC_API_KEY=...   # z console.anthropic.com
PUBLIC_BASE_URL=http://localhost:3001  # zmień na ngrok URL przed publikacją!
```

## Uruchomienie

```bash
npm run dev           # uruchamia backend (3001) i frontend (5173) jednocześnie
npm run dev:backend   # sam backend
npm run dev:frontend  # sam frontend
```

Otwórz http://localhost:5173

## Przepływ użytkownika

1. **Dashboard** — widok wszystkich ogłoszeń
2. **+ Nowe ogłoszenie** — kreator 4-krokowy:
   - Dodaj zdjęcia (drag-and-drop, max 8)
   - Claude analizuje zdjęcia i generuje tytuł + opis po polsku
   - Edytujesz opis, system pobiera podobne oferty z OLX i sugeruje cenę
   - Podgląd i publikacja na OLX
3. **Automatyczna obniżka** — co 14 dni (domyślnie) cena spada o 10% aż do sprzedaży

## Ważne: zdjęcia i OLX API

OLX API przyjmuje **URL zdjęć**, nie dane binarne. Backend serwuje zdjęcia pod `/uploads/`, ale OLX musi mieć do nich dostęp z internetu.

**Rozwiązanie (lokalne):**

```bash
npx localtunnel --port 3001
# Skopiuj URL (np. https://abc123.loca.lt) do .env:
PUBLIC_BASE_URL=https://abc123.loca.lt
# Zrestartuj backend
```

Alternatywnie: **ngrok** (wymaga konta):

```bash
ngrok http 3001
# Skopiuj URL Forwarding do PUBLIC_BASE_URL
```

## Rejestracja aplikacji OLX

1. Wejdź na https://developer.olx.pl
2. Utwórz aplikację, wpisz Redirect URI: `http://localhost:3001/api/auth/olx/callback`
3. Skopiuj `Client ID` i `Client Secret` do `.env`
4. W aplikacji wejdź w **Ustawienia** → **Połącz z OLX**

## Struktura projektu

```
OlxAutomation/
├── backend/         Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/     Konfiguracja (env vars)
│   │   ├── db/         SQLite: migracje + repozytoria
│   │   ├── services/   OLX API, Claude, wyszukiwanie, ceny
│   │   ├── routes/     REST API endpoints
│   │   └── jobs/       Cron: automatyczna obniżka cen
│   └── uploads/        Przesłane zdjęcia (serwowane statycznie)
└── frontend/        Vue 3 + Vite
    └── src/
        ├── api/         Klient HTTP (axios)
        ├── stores/      Pinia: listings, wizard, notifications
        ├── views/       Dashboard, kreator, szczegóły, ustawienia
        └── components/  Wizard steps, karty ogłoszeń, wykresy
```

## Endpoints API

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/olx/url` | URL do autoryzacji OLX |
| GET | `/api/auth/olx/callback` | Callback OAuth |
| GET | `/api/auth/olx/status` | Status połączenia |
| POST | `/api/upload/photos` | Upload zdjęć (multipart) |
| POST | `/api/analyze` | Analiza zdjęć przez Claude |
| GET | `/api/search/similar` | Wyszukiwanie podobnych ofert + cena |
| GET | `/api/listings` | Lista ogłoszeń |
| POST | `/api/listings` | Utwórz szkic |
| POST | `/api/listings/:id/publish` | Publikuj na OLX |
| POST | `/api/listings/:id/price` | Ręczna zmiana ceny |
| POST | `/api/listings/:id/mark-sold` | Oznacz jako sprzedane |
