# CLAUDE.md — DuoGym AI Assistant Guide

This file provides context for AI assistants working on the **DuoGym** codebase. Read it before making any changes.

---

## Project Overview

**DuoGym** is a real-time workout tracker for gym partners. Key traits:

- **Offline-first**: All data lives in `localStorage`; cloud sync happens in the background when authenticated.
- **Duo Mode**: Partners connect via a room code and see each other's workout progress live via Socket.io.
- **PWA**: Installable on mobile, works offline, keeps screen awake during workouts (`nosleep.js`).
- **Multi-user**: Each user has isolated data; the backend stores per-user JSON blobs.

---

## Repository Structure

```
gymFamily/
├── src/                        # React frontend (Vite)
│   ├── App.jsx                 # Root component; view-state router
│   ├── main.jsx                # Entry point
│   ├── components/             # Feature-based component folders
│   │   ├── Analytics/          # Charts and performance stats
│   │   ├── Dashboard/          # Home screen
│   │   ├── History/            # Past workout browser
│   │   ├── Landing/            # Auth screens (login/register)
│   │   ├── Layout/             # Nav bar, shell
│   │   ├── Planner/            # Workout creation/editing
│   │   ├── Profile/            # Settings, data backup/restore
│   │   ├── Tracker/            # Active workout session
│   │   └── common/             # Reusable UI (Loading, ErrorBoundary, etc.)
│   ├── context/                # Global state providers
│   │   ├── AuthContext.jsx     # JWT token, login/logout
│   │   ├── StoreContext.jsx    # Primary app data (workouts, history, profiles)
│   │   ├── LanguageContext.jsx # i18n strings
│   │   └── DuoContext.jsx      # Socket.io partner session
│   ├── hooks/                  # Custom hooks (useAuth, useStore, useLanguage, useDuo)
│   ├── utils/                  # Utility modules
│   │   ├── uuid.ts             # UUID generation (wraps crypto)
│   │   ├── gamification.ts     # Level/achievement calculations
│   │   ├── recovery.js         # Muscle group recovery tracking
│   │   ├── progression.js      # Auto weight suggestions
│   │   ├── plateCalculator.js  # Barbell plate math
│   │   └── translations.js     # i18n string table
│   ├── types/                  # TypeScript interfaces (index.ts)
│   ├── data/                   # Static JSON (exercise library, templates)
│   └── styles/                 # Global CSS
├── backend/                    # Node.js + Express API
│   ├── server.js               # Express app + Socket.io bootstrap
│   ├── socket.js               # Socket.io event handlers
│   ├── routes/
│   │   └── auth.js             # Auth endpoints + sync endpoints
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (User + UserData)
│   └── server.test.js          # Backend integration tests (Jest + supertest)
├── tests/
│   └── e2e/                    # Playwright end-to-end tests
├── .github/workflows/
│   ├── ci.yml                  # Lint → test → build
│   └── cd.yml                  # Build Docker images → deploy on the Optiflex (self-hosted runner)
├── public/                     # PWA icons, favicon
├── Dockerfile                  # Frontend: multi-stage (Node build → Nginx serve)
├── backend/Dockerfile          # Backend: Node 20
├── docker-compose.yml          # Dev compose (builds locally)
├── docker-compose.prod.yml     # Prod compose (pulls from ghcr.io)
├── nginx.conf                  # Reverse proxy + SPA routing
└── vite.config.js              # Vite + PWA plugin + /api proxy
```

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2.0 | UI framework |
| Vite | 7.2.4 | Build tool + dev server |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| Socket.io-client | 4.8.1 | Real-time partner sync |
| Recharts | 3.5.1 | Analytics charts |
| Lucide-react | 0.554.0 | Icon library |
| nosleep.js | 0.12.0 | Wake lock during workouts |
| clsx | 2.1.1 | Conditional classNames |

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Express | 4.18.2 | HTTP server |
| Prisma | 5.10.2 | ORM (SQLite) |
| Socket.io | 4.8.1 | Real-time server |
| jsonwebtoken | 9.0.2 | Auth tokens |
| bcryptjs | 2.4.3 | Password hashing |

### Testing
| Tool | Scope | Runner |
|------|-------|--------|
| Vitest | Frontend unit tests | `npm test` |
| Jest + supertest | Backend integration | `cd backend && npm test` |
| Playwright | E2E (Chromium) | `npm run test:e2e` |

---

## Development Setup

### Prerequisites
- Node.js 20+
- npm

### Run Locally

**Terminal 1 — Backend:**
```bash
cd backend
cp .env.example .env   # or create manually (see env vars below)
npm install
npm run prisma:generate
npm run prisma:push    # creates SQLite DB
npm run dev            # nodemon on port 3002
```

**Terminal 2 — Frontend:**
```bash
npm install
npm run dev            # Vite on port 5173; /api proxied to :3002
```

App: `http://localhost:5173`

### Docker (alternative)
```bash
docker-compose up -d --build   # frontend :8081, backend :3002
```

---

## Key Commands

### Frontend (root)
```bash
npm run dev          # dev server (port 5173)
npm run build        # production build → dist/
npm run preview      # preview production build
npm run lint         # ESLint
npm test             # Vitest unit tests (watch mode)
npm run test:e2e     # Playwright E2E tests
```

### Backend (`cd backend`)
```bash
npm run dev              # nodemon (port 3002)
npm start                # node (production)
npm test                 # Jest integration tests
npm run prisma:generate  # regenerate Prisma client
npm run prisma:push      # sync schema → SQLite (no migration files)
```

---

## Architecture

### Routing — State-Based (NOT URL-based)
Navigation is managed by `currentView` state in `src/App.jsx`. **Do not use React Router or URL params.**

```jsx
// App.jsx — how navigation works
const [currentView, setCurrentView] = useState('dashboard');

// Views: 'dashboard' | 'planner' | 'workout' | 'history' | 'profile'
// Pass onViewChange(view, data?) down to child components
```

Views are lazy-loaded with `React.lazy()` + `Suspense`.

### State Management — Context API
Four providers wrap the app (order matters):

```
AuthProvider → StoreProvider → LanguageProvider → DuoProvider → AppContent
```

| Context | Hook | Responsibility |
|---------|------|---------------|
| `AuthContext` | `useAuth()` | JWT token, login, logout |
| `StoreContext` | `useStore()` | All app data; persists to localStorage + server |
| `LanguageContext` | `useLanguage()` | i18n translation strings |
| `DuoContext` | `useDuo()` | Socket.io partner session |

### Data Flow — Offline-First Sync
`StoreContext` is the single source of truth:

1. On mount: load from `localStorage` instantly (offline works immediately)
2. If authenticated: fetch latest from `GET /api/sync` and merge
3. On any data change: write to `localStorage` AND `POST /api/sync`

Data types stored in `UserData.type`: `workouts`, `profiles`, `history`, `weightHistory`

### LocalStorage Keys
All keys use the `duogym-` prefix:
- `duogym-current-view` — persisted active view
- `duogym-view-data` — data passed to the current view
- `duogym-token` — JWT auth token (managed by AuthContext)
- Additional keys managed by StoreContext for each data type

---

## Database

**SQLite via Prisma.** Schema: `backend/prisma/schema.prisma`

```prisma
model User {
  id               String     @id @default(uuid())
  username         String     @unique
  password         String     // bcrypt hash
  securityQuestion String?
  securityAnswer   String?    // bcrypt hash
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  data             UserData[]
}

model UserData {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // 'workouts' | 'profiles' | 'history' | 'weightHistory'
  data      String   // JSON string — flexible blob storage
  updatedAt DateTime @updatedAt

  @@unique([userId, type])
}
```

**Key design**: `UserData.data` stores arbitrary JSON strings. This avoids schema migrations when app data structures evolve. Each user has one row per data type (upsert pattern).

**Schema changes**: Use `npm run prisma:push` (no migration files generated — fine for SQLite). For production breaking changes, handle migration manually.

---

## API Routes

Base URL: `/api` (proxied from Vite dev server to `localhost:3002`)

### Auth (`backend/routes/auth.js`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Create account (username, password, optional security Q) |
| `POST` | `/api/auth/login` | No | Login → returns JWT |
| `GET` | `/api/auth/get-security-question/:username` | No | Fetch security question for password reset |
| `POST` | `/api/auth/reset-password` | No | Reset password via security answer |
| `POST` | `/api/auth/update-security` | **Yes** | Update security question/answer |

### Sync (`backend/server.js`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/sync` | **Yes** | Fetch all UserData for current user |
| `POST` | `/api/sync` | **Yes** | Upsert a data type (body: `{ type, data }`) |
| `GET` | `/api/health` | No | Health check |

### Auth Middleware
Protected routes expect `Authorization: Bearer <token>` header. The middleware verifies the JWT AND confirms the user still exists in the DB (orphan check).

---

## Real-time — Duo Mode

Handled by `DuoContext.jsx` (client) and `backend/socket.js` (server). Partners join a shared room via a room code.

### Socket.io Events
| Event | Direction | Purpose |
|-------|-----------|---------|
| `join_room` | Client → Server | Join a partner room |
| `workout_update` | Client → Server (broadcast) | Broadcast exercise progress |
| `nudge_partner` | Client → Server (broadcast) | Send emoji nudge |
| `partner_sync` | Server → Client | Push partner's current state |
| `request_sync` | Client → Server | Ask partner to send their state |

---

## Frontend Conventions

### File Naming
- Components: `PascalCase.jsx` (e.g., `WorkoutCard.jsx`)
- Hooks: `camelCase.js` (e.g., `useWorkoutTimer.js`)
- Contexts: `*Context.jsx` (e.g., `StoreContext.jsx`)
- Utilities: `camelCase.js` or `camelCase.ts`
- Tests: `*.test.jsx` (unit), `*.spec.js` (E2E)

### Component Structure
```
src/components/FeatureName/
  FeatureName.jsx         # Main component
  SubComponent.jsx        # Sub-components in same folder
  __tests__/
    FeatureName.test.jsx  # Unit tests
```

Reusable cross-feature components go in `src/components/common/`.

### Path Aliases
`@/` maps to `src/`. Use it for imports:
```js
import { generateId } from '@/utils/uuid';
import { useStore } from '@/context/StoreContext';
```

### UUID Generation
Always use the custom wrapper — do NOT call `crypto.randomUUID()` directly:
```js
import { generateId } from '@/utils/uuid';
const id = generateId();
```

### Styling
- **Tailwind CSS** only — no custom CSS files except `src/styles/` for globals.
- Custom theme colors (defined in `tailwind.config.js`): `electric`, `acid`, `neon`, `cyber`
- Dark background base: `#020617`
- Mobile-first; custom `xs: 375px` breakpoint below Tailwind's `sm`
- Custom animations available: `enter`, `pulse-fast`, `pulse-slow`, `glow`, `slide-up`, `slide-down`, `shake`

### TypeScript
The project uses JS with TypeScript type definitions for key data structures in `src/types/index.ts` (Exercise, Workout, WorkoutSession, Profile, GamificationStats, etc.). New data structures should be typed there.

---

## Testing

### Frontend Unit Tests (Vitest)
```bash
npm test              # watch mode
npm test -- --run     # single run
```
- Config: `vite.config.js` (vitest section) + `src/setupTests.js`
- Environment: jsdom
- Test locations: `src/components/**/__tests__/*.test.jsx`, `src/context/__tests__/`, `src/utils/__tests__/`

### Backend Integration Tests (Jest)
```bash
cd backend && npm test
```
- Uses `NODE_ENV=test` → SQLite `file:./test.db` (auto-created/destroyed)
- Tests HTTP endpoints via `supertest`
- Test file: `backend/server.test.js`

### E2E Tests (Playwright)
```bash
npm run test:e2e
```
- Config: `playwright.config.js`
- Browser: Chromium only
- Auto-starts both servers (frontend :5173, backend :3002)
- Test files: `tests/e2e/*.spec.js`

---

## Deployment

### Docker
```bash
# Development (builds from source)
docker-compose up -d --build

# Production (pulls pre-built images from ghcr.io)
docker-compose -f docker-compose.prod.yml up -d
```

Ports: frontend on `8081`, backend on `3002`. Nginx proxies `/api` and `/socket.io` to the backend.

### CI/CD (GitHub Actions)
- **CI** (`ci.yml`): Triggered on push/PR → frontend lint + test + build, backend test, E2E tests
- **CD** (`cd.yml`): Triggered on push to `main` → build multi-arch Docker images (amd64/arm64) → push to `ghcr.io` → deploy with the self-hosted runner `optiflex-runner` (Optiflex host, `~/actions-runner`, user kikoflexo)

### Live production on the Optiflex
- Prod lives in **`~/projects/duo-gym/deploy/`** (gitignored, excluded from the Docker build context). Before 11/11/2026 it was `~/stacks/duo-gym`; that folder no longer exists. See `deploy/README.md`.
- `deploy/docker-compose.prod.yml` is **rewritten by `cd.yml` on every deploy**: edit the heredoc in `cd.yml`, not the file. Keep its `name: duo-gym` line, otherwise compose derives the project name `deploy` and clashes with the existing `container_name`s.
- `/srv/duo-gym/data/dev.db` (outside the repo since 12/11/2026; previously `deploy/data/`) = **the real users' SQLite database**. Never delete, overwrite or commit it; back it up before any schema change; stop the backend before moving it.
- Manual ops: `cd ~/projects/duo-gym/deploy && docker compose -f docker-compose.prod.yml ps|logs|up -d`. `duogym.home` goes through Nginx Proxy Manager (`~/projects/nginx-proxy-manager`). Map of all host projects: `~/projects/README.md`.

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=file:./prisma/dev.db   # SQLite file path
JWT_SECRET=your-secret-here          # REQUIRED in production; no fallback
PORT=3002                            # Default port
NODE_ENV=development                 # development | test | production
```

`JWT_SECRET` will throw at startup if missing (except in test mode where it falls back to a test value).

### Frontend
No `.env` required for development. Vite proxies `/api/*` to `http://localhost:3002`.

---

## Key Gotchas

1. **No URL router** — Navigation is `currentView` state in `App.jsx`. Never add React Router.

2. **Flexible JSON schema** — `UserData.data` is a JSON string. Parse/stringify carefully. Don't assume fixed structure when reading from DB.

3. **`JWT_SECRET` is mandatory** — The backend will crash on startup if `JWT_SECRET` is unset in non-test environments.

4. **Offline users** — The app must work without a backend. Guard all API calls so failures degrade gracefully (fall back to localStorage).

5. **Gamification is derived** — Achievement/level data is computed from history on the fly (`src/utils/gamification.ts`). Never store it persistently.

6. **Prisma binary targets** — `schema.prisma` includes `linux-musl-openssl-3.0.x` for Alpine/Docker builds. Don't remove it.

7. **Test isolation** — Backend tests use a separate `test.db`. The `beforeEach`/`afterEach` hooks in `server.test.js` handle cleanup; don't rely on DB state between tests.

8. **Socket.io in tests** — E2E tests exercise Socket.io. Unit tests should mock the `DuoContext`.

9. **`duogym-` prefix** — All localStorage keys must use this prefix to avoid collisions.

10. **Security answers** — Stored as bcrypt hashes (lowercased before hashing). Compare with `bcrypt.compare(answer.toLowerCase(), hash)`.
