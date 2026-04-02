# OLX Automation — Dokumentacja techniczna

Aplikacja webowa do automatyzacji tworzenia i zarządzania ogłoszeniami na OLX.pl.
Użytkownik wrzuca zdjęcia przedmiotu, Claude AI analizuje je i generuje tytuł + opis po polsku,
sugeruje cenę na podstawie podobnych ogłoszeń, a następnie publikuje ogłoszenie na OLX przez ich API.

---

## Stack technologiczny

### Backend
| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| Node.js | 22+ | Runtime |
| TypeScript | 5.x | Język |
| Express | 4.x | HTTP serwer |
| PostgreSQL | 16 | Baza danych |
| `pg` | — | PostgreSQL driver |
| Zod | — | Walidacja danych wejściowych |
| Sharp | — | Resize/kompresja zdjęć |
| Multer | — | Upload plików |
| jsonwebtoken | — | JWT dla autoryzacji użytkowników |
| bcryptjs | — | Hashowanie haseł |
| node-cron | — | Harmonogram automatycznej redukcji cen |
| Axios | — | HTTP klient (zewnętrzne API) |
| Cheerio | — | Scraping OLX i stron producentów |
| Anthropic SDK | — | Komunikacja z Claude API |

### Frontend
| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| Vue 3 | 3.x | Framework UI (Composition API) |
| Vite | 5.x | Bundler + dev server |
| TypeScript | 5.x | Język |
| Pinia | 2.x | State management |
| Vue Router | 4.x | Routing |
| Axios | — | HTTP klient |
| `uuid` | — | Generowanie session ID dla gości |

### Infrastruktura
| Usługa | Zastosowanie |
|--------|--------------|
| **Railway.app** | Hosting backendu (Docker) |
| **Netlify** | Hosting frontendu (SPA) |
| **PostgreSQL** (Railway) | Baza danych produkcyjna |
| **Anthropic Claude API** | Analiza zdjęć + generowanie opisów |

---

## Architektura systemu

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Netlify)                │
│                Vue 3 + Pinia + Vue Router            │
│                                                      │
│  AuthView → DashboardView → NewListingView (wizard)  │
│                          → ListingDetailView         │
│                          → SettingsView              │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS / REST API
                    │ Header: Authorization: Bearer <jwt>
                    │      lub X-Session-Id: <uuid>
┌───────────────────▼─────────────────────────────────┐
│                   BACKEND (Railway)                  │
│               Express + TypeScript                   │
│                                                      │
│  /api/users     — rejestracja, logowanie (JWT)       │
│  /api/upload    — upload + resize zdjęć              │
│  /api/analyze   — Claude AI analiza zdjęć            │
│  /api/listings  — CRUD ogłoszeń + publish/verify     │
│  /api/categories — drzewo kategorii OLX              │
│  /api/search    — podobne ogłoszenia + sugestia ceny │
│  /api/auth/olx  — OAuth 2.0 do OLX Partner API      │
│  /api/health    — healthcheck dla Railway            │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
┌──────────▼──┐  ┌────────▼────┐  ┌─────▼──────────┐
│  PostgreSQL  │  │ Claude API  │  │  OLX Partner   │
│  (Railway)   │  │ (Anthropic) │  │  API + scraper │
└─────────────┘  └─────────────┘  └────────────────┘
```

---

## Struktura katalogów

```
OlxAutomation/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── AppConfig.ts          # Wszystkie env zmienne w jednym miejscu
│   │   ├── db/
│   │   │   ├── database.ts           # Pool PostgreSQL + automatyczne migracje
│   │   │   ├── migrations/           # SQL migracje (wykonywane raz przy starcie)
│   │   │   │   ├── 001_initial.sql   # listings, olx_tokens
│   │   │   │   ├── 002_price_history.sql
│   │   │   │   ├── 003_extra_fields.sql  # condition, city, negotiable, shipping
│   │   │   │   └── 004_auth.sql     # users, session_id/user_id w listings
│   │   │   └── repositories/
│   │   │       ├── ListingRepository.ts      # CRUD + filtrowanie po owner
│   │   │       ├── OlxTokenRepository.ts     # OAuth tokeny
│   │   │       └── PriceHistoryRepository.ts # Historia zmian cen
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts     # JWT lub session ID → req.userId / req.sessionId
│   │   │   └── errorHandler.ts      # Globalny handler błędów Express
│   │   ├── routes/
│   │   │   ├── userAuthRoutes.ts    # POST /users/register, /users/login, GET /users/me
│   │   │   ├── uploadRoutes.ts      # POST /upload/photos, DELETE /upload/photos/:id
│   │   │   ├── analyzeRoutes.ts     # POST /analyze, POST /analyze/documents
│   │   │   ├── listingRoutes.ts     # CRUD + publish/verify/regenerate/price
│   │   │   ├── categoryRoutes.ts    # GET /categories, POST /categories/suggest
│   │   │   ├── searchRoutes.ts      # GET /search/similar, GET /search/descriptions
│   │   │   └── authRoutes.ts        # OLX OAuth: /auth/olx/url, /callback, /status
│   │   ├── services/
│   │   │   ├── ClaudeVisionService.ts   # Cała logika AI (analiza, weryfikacja, regeneracja)
│   │   │   ├── ImageStorageService.ts   # Upload + Sharp resize
│   │   │   ├── ListingPublisher.ts      # Publikacja na OLX przez Partner API
│   │   │   ├── OlxApiClient.ts          # HTTP klient do OLX API (z auto-refresh tokenu)
│   │   │   ├── OlxAuthService.ts        # OAuth exchange + przechowywanie tokenów
│   │   │   ├── OlxCategoryService.ts    # Pobieranie drzewa kategorii z OLX API
│   │   │   ├── OlxSearchService.ts      # Web scraping wyników OLX
│   │   │   ├── PricingService.ts        # Sugestia ceny ze statystyk podobnych ofert
│   │   │   └── WebSearchService.ts      # DuckDuckGo + Bing do znajdowania info o produkcie
│   │   ├── jobs/
│   │   │   └── PriceReductionJob.ts     # Cron: automatyczna redukcja cen o X% co N dni
│   │   ├── types/
│   │   │   ├── Listing.types.ts
│   │   │   ├── Claude.types.ts
│   │   │   └── OlxApi.types.ts
│   │   ├── server.ts                # Express setup: CORS, middleware, router mounting
│   │   └── main.ts                  # Punkt wejścia: DB init → server start
│   ├── uploads/                     # Pliki zdjęć (UUID.jpg) — serwowane jako /uploads/
│   ├── Dockerfile                   # Multi-stage build (builder → runtime Alpine)
│   ├── railway.toml                 # Railway: DOCKERFILE builder, healthcheck
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── ApiClient.ts         # Axios instance: base URL + auth interceptory
│   │   │   ├── listingsApi.ts       # CRUD ogłoszeń
│   │   │   ├── uploadApi.ts         # Upload zdjęć
│   │   │   ├── analyzeApi.ts        # Analiza AI
│   │   │   └── searchApi.ts         # Wyszukiwanie podobnych
│   │   ├── stores/
│   │   │   ├── useAuthStore.ts      # Token JWT + guest sessionId + computed isLoggedIn/isGuest
│   │   │   ├── useWizardStore.ts    # Stan 6-krokowego kreatora nowego ogłoszenia
│   │   │   ├── useListingsStore.ts  # Lista ogłoszeń + operacje
│   │   │   └── useNotificationStore.ts  # Toast powiadomienia (auto-dismiss 4s)
│   │   ├── views/
│   │   │   ├── AuthView.vue         # Strona startowa: gość / zaloguj / rejestracja
│   │   │   ├── DashboardView.vue    # Lista ogłoszeń użytkownika
│   │   │   ├── NewListingView.vue   # Kontener kreatora (6 kroków)
│   │   │   ├── ListingDetailView.vue # Szczegóły ogłoszenia + edycja + weryfikacja
│   │   │   └── SettingsView.vue     # Połączenie z kontem OLX (OAuth)
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── AppButton.vue
│   │   │   │   └── LoadingSpinner.vue
│   │   │   ├── listing/
│   │   │   │   ├── ListingCard.vue          # Karta ogłoszenia na dashboardzie
│   │   │   │   ├── StatusBadge.vue          # Badge: draft/active/sold
│   │   │   │   ├── PriceHistoryChart.vue    # Wykres historii cen
│   │   │   │   ├── VerifyPanel.vue          # Panel weryfikacji AI (score + sugestie)
│   │   │   │   └── RegeneratePanel.vue      # Panel regeneracji opisu z instrukcją
│   │   │   └── wizard/
│   │   │       ├── StepDocumentUpload.vue   # Krok 1: zdjęcia paragonów/faktur
│   │   │       ├── StepPhotoUpload.vue      # Krok 2: zdjęcia przedmiotu
│   │   │       ├── StepMetadata.vue         # Krok 3: dodatkowe info (opcjonalne)
│   │   │       ├── StepAnalysis.vue         # Krok 4: AI generuje opis + hints/regeneracja
│   │   │       ├── StepPricing.vue          # Krok 5: cena + sugestia z rynku
│   │   │       ├── StepReview.vue           # Krok 6: podsumowanie + tworzenie draftu
│   │   │       ├── CategoryPicker.vue       # Picker kategorii OLX (z AI sugestią)
│   │   │       └── SampleDescriptionsPanel.vue  # Panel z przykładowymi opisami z OLX
│   │   ├── router/index.ts
│   │   ├── types/Types.ts
│   │   ├── App.vue                  # Root: nawigacja + toasty
│   │   └── main.ts
│   ├── vite.config.ts
│   └── package.json
│
├── netlify.toml                     # Frontend build + SPA redirects
├── package.json                     # npm workspaces (root)
└── ARCHITECTURE.md                  # Ten plik
```

---

## Baza danych

### Schemat (4 migracje)

```sql
-- Migracje wykonywane automatycznie przy starcie backendu
-- Tabela `migrations` śledzi co już zostało wykonane

-- 001: Rdzeń
listings (id, title, description, category_id, category_name, price, status,
          condition, city, negotiable, shipping, photos[], olx_listing_id,
          price_reduction_enabled, price_reduction_percent, price_reduction_interval_days,
          next_reduction_at, min_price, created_at, updated_at)

olx_tokens (id, access_token, refresh_token, expires_at, created_at)

-- 002: Historia cen
price_history (id, listing_id, price, reason, recorded_at)
-- reason: 'initial' | 'manual' | 'auto_reduction' | 'sold'

-- 003: Dodatkowe pola
listings += condition, city, negotiable, shipping

-- 004: Autoryzacja użytkowników
users (id, email, password_hash, created_at)
listings += session_id, user_id  (+ indeksy)
```

### Izolacja danych (multi-user)

Każde ogłoszenie ma albo `user_id` (zalogowany) albo `session_id` (gość).
`ListingRepository.findAll()` filtruje automatycznie po właścicielu na podstawie `Owner` przekazanego przez middleware.

---

## Autoryzacja

### Dwa tryby dostępu

```
Gość:        localStorage.sessionId = UUID → header X-Session-Id
Zalogowany:  localStorage.authToken = JWT  → header Authorization: Bearer <token>
```

### Przepływ

```
1. AuthView → "Wypróbuj bez logowania" → auth.initGuest() → sessionId zapisany w localStorage
2. AuthView → "Zaloguj się" → POST /api/users/login → JWT zapisany w localStorage
3. ApiClient interceptor → dodaje odpowiedni header do każdego żądania
4. authMiddleware → dekoduje JWT lub przepisuje X-Session-Id → req.userId / req.sessionId
5. ListingRepository → filtruje ogłoszenia po owner
```

---

## Kreator ogłoszenia (6 kroków)

Stan zarządzany przez `useWizardStore` (Pinia).

```
Krok 1 — StepDocumentUpload
  → Upload zdjęć dokumentów (paragon, faktura, tabliczka)
  → POST /api/upload/photos → fileIds zapisane jako documentFileIds

Krok 2 — StepPhotoUpload
  → Upload zdjęć przedmiotu (max 8)
  → POST /api/upload/photos → fileIds zapisane jako uploadedFileIds

Krok 3 — StepMetadata
  → Opcjonalne pola: nazwa, model, rok produkcji, kategoria, dodatkowe info
  → Dane zapisane jako wizard.metadata

Krok 4 — StepAnalysis
  → Jeśli są dokumenty: wysyła documentFileIds do Claude
  → W przeciwnym razie: pierwsze 3 zdjęcia przedmiotu
  → POST /api/analyze { fileIds, metadata, hints? }
  → Claude zwraca: title, description, condition, category, keywords, priceRange, officialUrl
  → Użytkownik może edytować lub wpisać hints i kliknąć "Regeneruj opis"

Krok 5 — StepPricing
  → GET /api/search/similar?keywords=...&categoryId=...
  → Backend scrape'uje OLX → PricingService → sugestia ceny
  → Użytkownik ustawia cenę (z podpowiedzią), negocjacje, wysyłkę, miasto

Krok 6 — StepReview
  → Podsumowanie wszystkiego
  → POST /api/listings → tworzy draft
  → Opcjonalnie: POST /api/listings/:id/publish → publikuje na OLX
```

---

## Analiza AI (ClaudeVisionService)

Serwis używa **tool use** (structured output) Claude — zamiast parsować tekst, Claude wypełnia zdefiniowany schemat JSON.

### `analyzePhotos(fileIds, metadata?, hints?)`
- Wczytuje zdjęcia jako base64
- Opcjonalnie wywołuje `WebSearchService.searchProduct()` → DuckDuckGo/Bing po metadane produktu
- Buduje prompt z kontekstem (metadane, info z sieci, wskazówki użytkownika)
- Claude wypełnia tool `analyze_item` → title, description (PL), condition, category, keywords, priceRange, officialUrl

### `extractFromDocuments(fileIds)`
- OCR paragonów/faktur/tabliczek
- Claude wypełnia tool `extract_product_info` → nazwa, marka, model, rok, numer seryjny, cena zakupu, data zakupu

### `verifyListing(listing)`
- Analizuje gotowe ogłoszenie
- Claude wypełnia tool `verify_listing` → score (0-100) + lista sugestii z gotowymi wartościami (newValue)

### `regenerateDescription(fileIds, existing, changeRequest)`
- Przepisuje opis na podstawie instrukcji użytkownika (np. "krótszy opis, bez emotikon")

---

## Integracja z OLX Partner API

### OAuth 2.0 Flow

```
1. GET /api/auth/olx/url → backend generuje URL do OLX z state + redirect_uri
2. Użytkownik loguje się na OLX → redirect do /api/auth/olx/callback?code=...
3. Backend wymienia code → access_token + refresh_token (zapisane w DB)
4. OlxApiClient auto-refreshuje token gdy wygasa (expires_at - 5 min)
```

### Publikacja ogłoszenia

`ListingPublisher.publishListing(listing)`:
1. Pobiera aktywny token z DB
2. Mapuje dane: stan, kategorię, zdjęcia, miasto (nazwa → ID), cenę
3. POST do OLX API — zwraca `olx_listing_id`
4. Aktualizuje status w DB na `active`

### Automatyczna redukcja cen

`PriceReductionJob` — cron co godzinę:
- Pobiera ogłoszenia z `next_reduction_at <= NOW()` i `price_reduction_enabled = true`
- Obniża cenę o `price_reduction_percent`% (min: `min_price`)
- Aktualizuje cenę przez OLX API
- Ustawia nowe `next_reduction_at` + zapisuje w `price_history`

---

## Zmienne środowiskowe

### Backend (Railway)

| Zmienna | Opis |
|---------|------|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://...`) |
| `PORT` | Port serwera (Railway ustawia automatycznie) |
| `PUBLIC_BASE_URL` | Publiczny URL backendu (np. `https://xyz.up.railway.app`) |
| `FRONTEND_URL` | URL frontendu Netlify (dla CORS) |
| `JWT_SECRET` | Sekret do podpisywania JWT (losowy string) |
| `ANTHROPIC_API_KEY` | Klucz API Claude |
| `OLX_CLIENT_ID` | OLX Partner API Client ID |
| `OLX_CLIENT_SECRET` | OLX Partner API Client Secret |
| `OLX_REDIRECT_URI` | Callback URL OAuth (musi się zgadzać z OLX dashboard) |

### Frontend (Netlify)

| Zmienna | Opis |
|---------|------|
| `VITE_API_BASE_URL` | URL backendu (np. `https://xyz.up.railway.app`) |

---

## Uruchomienie lokalnie

```bash
# 1. Zainstaluj zależności (root workspace)
npm install

# 2. Skonfiguruj backend
cp backend/.env.example backend/.env
# Ustaw DATABASE_URL, ANTHROPIC_API_KEY itp.

# 3. Uruchom PostgreSQL lokalnie (lub użyj Railway)
# DATABASE_URL=postgresql://user:pass@localhost:5432/olxautomation

# 4. Uruchom dev (backend + frontend równolegle)
npm run dev

# Backend: http://localhost:3001
# Frontend: http://localhost:5173 (proxy /api → localhost:3001)
```

### Build produkcyjny

```bash
# Backend (TypeScript → dist/)
cd backend && npm run build
# Kompiluje TS + kopiuje migracje SQL do dist/db/migrations/

# Frontend (Vite → dist/)
cd frontend && npm run build
```

---

## Deployment

### Backend → Railway

- Builder: **Dockerfile** (multi-stage, Node 22 Alpine)
- Start: `node dist/main.js`
- Healthcheck: `GET /api/health`
- Railway automatycznie deployuje przy push na `main`

### Frontend → Netlify

- Build: `npm run build` w katalogu `frontend/`
- Publish: `frontend/dist/`
- Redirects: wszystkie ścieżki → `index.html` (SPA)
- Netlify automatycznie deployuje przy push na `main`

---

## Funkcjonalności

| Feature | Status | Opis |
|---------|--------|------|
| Upload zdjęć | ✅ | Max 8 zdjęć, resize do 1200x1200, format JPEG |
| OCR dokumentów | ✅ | Ekstrakcja danych z paragonów i faktur przez Claude |
| AI analiza zdjęć | ✅ | Claude Vision → tytuł + opis po polsku |
| Wskazówki dla AI | ✅ | Pole hints + przycisk "Regeneruj opis" |
| Sugestia ceny | ✅ | Scraping OLX + statystyki (mediana -5%) |
| Przykładowe opisy | ✅ | Panel z opisami podobnych ogłoszeń z OLX |
| Zarządzanie kategoriami | ✅ | Drzewo kategorii OLX + AI sugestia kategorii |
| Weryfikacja ogłoszenia | ✅ | Claude sprawdza jakość (score 0-100 + sugestie) |
| Regeneracja opisu | ✅ | Przepisanie opisu z instrukcją użytkownika |
| Publikacja na OLX | ✅ | OLX Partner API (wymaga połączonego konta) |
| Automatyczna redukcja cen | ✅ | Cron job: -X% co N dni |
| Historia cen | ✅ | Wykres zmian ceny na stronie ogłoszenia |
| Dezaktywacja/wznowienie | ✅ | Pauza i wznowienie ogłoszenia na OLX |
| Oznaczanie jako sprzedane | ✅ | Zmiana statusu + aktualizacja OLX |
| Tryb gościa | ✅ | Bez rejestracji — dane izolowane per przeglądarka (sessionId) |
| Konto użytkownika | ✅ | Rejestracja + logowanie JWT |
| Toast powiadomienia | ✅ | Auto-dismiss po 4 sekundach |

---

## Konwencje kodu

- **Backend**: każdy plik serwisu to `const Service = { async method() {} }` — singleton object
- **Backend**: zod do walidacji body w każdym route handlerze
- **Backend**: `next(err)` do propagacji błędów do `errorHandler`
- **Frontend**: Pinia stores jako `use*Store()` — Composition API style
- **Frontend**: API calls w dedykowanych plikach `src/api/*.ts` — nie bezpośrednio w komponentach
- **Frontend**: komponenty `Step*.vue` nie mają własnego stanu — czytają/piszą przez `useWizardStore`
- **Izolacja własności**: każde zapytanie do listings przechodzi przez `authMiddleware` → owner z JWT lub sessionId
