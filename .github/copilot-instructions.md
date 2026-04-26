# Copilot Instructions — InstaOffer

## Project Overview
InstaOffer is a **Next.js 16 / React 19** car-selling marketplace for Qatar. Sellers get instant valuations; dealers bid on offer requests. The frontend talks to an external FastAPI backend at `http://174.165.78.29:8090/api`.

## Architecture

### Mixed-Content Proxy Pattern (critical)
Browser requests **cannot** call the HTTP backend directly from an HTTPS page. All API calls route through:
- **Browser** → `/api/proxy/[...path]` (Next.js route handler) → backend
- **Server-side (SSR)** → backend directly via `API_BASE_URL`

`lib/api.ts` handles this automatically — `BASE_URL` switches based on `typeof window`. **Never** hardcode the backend URL in components.

```ts
// lib/api.ts — correct pattern
const BASE_URL = typeof window === 'undefined' ? BACKEND_URL : '/api/proxy';
```

### Auth Flow
- `lib/auth-context.tsx` wraps the app as `<AuthProvider>` in `app/layout.tsx`
- Tokens stored in `localStorage`: `instaoffer_token`, `instaoffer_refresh`
- **Guest sessions** are automatically bootstrapped (`guestLogin()`) and kept alive with proactive refresh every 55 minutes
- Guest tokens stored separately: `instaoffer_guest_token`, `instaoffer_guest_refresh`
- Use `useAuth()` hook to access `user`, `token`, `signIn`, `signOut`, `ensureGuestToken`
- `ensureGuestToken()` must be called before any unauthenticated API calls that still require a bearer token

### API Layer (`lib/api.ts`)
- Single `apiFetch<T>()` function handles all HTTP calls, auth headers, and error normalisation
- Errors follow `{ error: "..." }` from backend, or FastAPI 422 `{ detail: [...] }` — both handled
- Image URLs from listings **must** go through `imgProxyUrl()` helper, not used directly

## Key Conventions

### File Structure
- `app/` — Next.js App Router pages (all routes)
- `lib/api.ts` — all backend API functions (add new endpoints here)
- `lib/api-types.ts` — types for features gated on upcoming backend issues (BE-002+)
- `lib/utils.ts` — shared utilities: `formatQAR()`, `formatKM()`, `formatDate()`, `CAR_MAKES` list
- `components/` — shared UI components (`Navbar`, `Footer`)

### Styling
- Tailwind CSS v4 (PostCSS plugin, no `tailwind.config.js` needed)
- Brand colors: `#003087` (navy blue), `#ff6600` (orange)
- Mobile-first responsive design

### Status Badges
Use `OFFER_REQUEST_STATUS_CONFIG` from `lib/api-types.ts` for consistent badge classes:
```ts
import { OFFER_REQUEST_STATUS_CONFIG } from '@/lib/api-types';
const { label, badgeClass } = OFFER_REQUEST_STATUS_CONFIG[status];
```

### Deploy Time
`NEXT_PUBLIC_DEPLOY_TIME` is injected at build time in `next.config.ts` and shown in the Navbar for quick verification of deployed version.

## Dev Workflow
```bash
npm run dev      # development server on :3000
npm run build    # production build
npm run lint     # ESLint
```

Set `API_BASE_URL` env var to override the backend (default: `http://174.165.78.29:8090/api`).

## Upcoming Backend Features
`lib/api-types.ts` contains forward-declared types for features not yet live:
- **BE-002**: `pending` offer status
- **BE-003**: dealer subscription (`DealerSubscription`)
- **BE-004/005**: additional planned features

When the backend ships, move types from `api-types.ts` into `api.ts` and wire up real endpoints.
