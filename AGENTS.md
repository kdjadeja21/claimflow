<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Architecture conventions

- **Route groups** — Organizer pages live under `app/(organizer)/` with a shared `AuthGate` layout. Public volunteer pages live under `app/(public)/e/[slug]/`. Parentheses are omitted from URLs.
- **Providers** — React context providers (`AuthProvider`, `ThemeProvider`, `PublicEventProvider`) belong in `components/providers/`, not route files or `lib/`.
- **Layout shell** — `AppShell`, `BottomNav`, `UserMenu`, and `ThemeToggle` live in `components/layout/`.
- **Hooks** — Reusable client logic (active event bootstrap, Firestore subscriptions, stats derivation, scan flow) belongs in `hooks/`.
- **Data layer** — Firestore access is split under `lib/db/` by domain (`events`, `attendees`, `claims`, `subscriptions`). Import from `@/lib/db` (barrel re-export).
- **Constants** — Magic numbers (scan timeouts, vibration patterns, defaults) go in `lib/constants.ts`.
- **Pages stay thin** — Route `page.tsx` files compose hooks + feature components; avoid duplicating business logic across organizer and public routes.
