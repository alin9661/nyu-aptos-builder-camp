# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project loosely
follows [Semantic Versioning](https://semver.org/) extended with a fourth `MICRO`
digit (`MAJOR.MINOR.PATCH.MICRO`) to allow fast iteration on docs/config.

## [0.1.0.0] - 2026-05-16

First formally-versioned release. Pre-0.1.0.0 history is available via `git log`.

### Removed
- Backend SSE event service (`backend/src/services/events.ts`) and `/api/events/*`
  routes, including the indexer-side `eventService.emit*` callsites for treasury
  deposits, reimbursement lifecycle, governance elections, and proposal events.
- Frontend `useServerEvents` hook and its four consumer subscriptions
  (`TreasuryBalance`, `DashboardStats`, `ReimbursementsList`, `NotificationCenter`).
- Legacy `frontend/components/landing/NavBar.tsx` — replaced by the global
  `SiteHeader` (gated to app routes via `ConditionalSiteHeader`).
- Orphan `/features` route — Treasury is the primary destination from that nav slot.

### Changed
- Components migrated from SSE push to interval polling. `useNotifications`
  polls every 15s, `useUnreadCount` every 10s, `useReimbursements` every 30s.
- `SiteHeader` moved from per-page mounts (in seven `app/<route>/page.tsx` files)
  to a single mount in `app/layout.tsx`, wrapped in `ConditionalSiteHeader` which
  hides it on `/` and `/auth/*`.
- `NotificationCenter` returns `null` when `useAuth()` reports no user, and
  disables polling — defense in depth against unauthenticated 401-loops.
- Landing badge text now derives from `NEXT_PUBLIC_APTOS_NETWORK` rather than
  being hardcoded.
- Top nav: `Features` → `Treasury` (linking to `/treasury`).

### API contract notes
- `GET /health` no longer returns the `events: { connected, activeConnections,
  totalConnections, totalEvents }` block. External monitors that asserted on
  `health.events.connected` should drop that assertion.
- `GET /api/events/*` endpoints (stream, poll, metrics, channels) now return
  `404`. There is no deprecation/redirect period.
