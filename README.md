# ClaimFlow

QR-based claim verification for event teams. Scan attendee tickets to distribute snacks, meals, swag, and other perks while preventing duplicate claims and tracking inventory in real time.

Built with Next.js 16, React 19, and Tailwind CSS. Event data syncs through Firebase Firestore so organizers and volunteers see live updates across devices.

## Features

- **Volunteer scanner** — Camera-first QR scanning with manual ticket entry fallback, haptic feedback, and instant approval states (approved, already claimed, invalid)
- **Organizer dashboard** — Live stats, inventory velocity, duplicate attempt tracking, and a claim activity feed via real-time Firestore subscriptions
- **Multi-event management** — Create and switch between events; each organizer account owns its events
- **Event setup** — Configure event name, claim types, inventory limits, and public sharing
- **Attendee management** — Add attendees manually, import via CSV, search, and link Luma ticket URLs
- **Luma integration** — Parses Luma check-in QR codes and guest ticket URLs automatically
- **Public volunteer links** — Share a slug-based URL (`/e/[slug]`) with a volunteer PIN for team scanning without Google sign-in
- **Google Sign-In for organizers** — Admin pages require Firebase Authentication
- **Dark mode** — System-aware theme with manual toggle

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | React 19, [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) |
| Backend | [Firebase](https://firebase.google.com) (Auth + Firestore) |
| QR scanning | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |
| Icons | [Lucide React](https://lucide.dev) |
| Notifications | [Sonner](https://sonner.emilkowal.ski) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun
- A [Firebase](https://console.firebase.google.com) project with **Google Sign-In** enabled and a **Firestore** database

### Environment variables

Create `.env.local` in the project root with your Firebase web app config (Firebase console → Project settings → Your apps):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Deploy the included Firestore security rules before using the app in production:

```bash
firebase deploy --only firestore:rules
```

(Rules file: `firestore.rules`.)

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts

```bash
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Usage

### 1. Sign in and create an event

Open **Login** (`/login`) and sign in with Google. If you have no active event, you are sent to **Dashboard** (`/dashboard`) to create or select one. New events start with a default **Snacks** claim type (inventory: 100).

### 2. Configure your event

Go to **Setup** (`/setup`) and configure:

- Event name
- Claim types (e.g. Snacks, Lunch, Swag) with inventory counts
- **Volunteer access** — make the event public, set a volunteer PIN, and copy the share link (`/e/[slug]`)

### 3. Add attendees

Go to **Attendees** (`/attendees`) and add ticket IDs manually or paste a CSV with columns: `ticketId`, `name`, `email`.

### 4. Scan claims

**Volunteers (recommended):** Open the public link from Setup (e.g. `/e/your-event-slug/scan`), enter the volunteer PIN, select a claim type, and scan QR codes.

**Organizers:** Signed-in organizers can also scan from **Scan** (`/scan`) on their active event without the volunteer PIN.

Results show immediately:

| Status | Meaning |
|--------|---------|
| Approved | First-time claim recorded successfully |
| Already claimed | This ticket already claimed this item |
| Invalid QR | Missing ticket ID or no active event |

### 5. Monitor activity

Organizers open **Stats** (`/stats`) for live inventory usage, stats, and claim history. Public event stats are also available at `/e/[slug]/stats`.

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Google Sign-In for organizers |
| `/dashboard` | Auth | Event picker when no active event is set |
| `/` | Auth | Home / command center for the active event |
| `/events` | Auth | Switch between events or create a new one |
| `/scan` | Auth | Organizer QR scanner and manual entry |
| `/stats` | Auth | Live analytics, inventory, and claim feed |
| `/setup` | Auth | Event configuration, claim types, and public sharing |
| `/attendees` | Auth | Attendee list, CSV import, and search |
| `/e/[slug]` | Public | Volunteer home for a published event |
| `/e/[slug]/scan` | Public + PIN | Volunteer QR scanner |
| `/e/[slug]/stats` | Public | Live stats for a published event |

## QR Code Formats

ClaimFlow accepts several QR payload formats:

- **Plain text** — Raw ticket ID
- **JSON** — `{ "ticketId": "..." }` (also supports `ticket_id`, `id`, `code`)
- **URL** — Ticket ID extracted from query params or path
- **Luma check-in** — `lu.ma/check-in/...?pk=...` URLs are parsed automatically

## Project Structure

```
app/
  page.tsx                  # Home / command center (active event)
  login/page.tsx            # Google Sign-In
  dashboard/page.tsx        # Event picker landing page
  events/page.tsx           # Event list and creation
  scan/page.tsx             # Organizer scanner
  stats/page.tsx            # Live analytics dashboard
  setup/page.tsx            # Event configuration and sharing
  attendees/page.tsx        # Attendee management
  e/[slug]/                 # Public volunteer routes (home, scan, stats)
  layout.tsx                # Root layout, auth, and theme providers
components/
  dashboard/                # StatsGrid, InventoryBar, ClaimFeed
  events/                   # EventCard
  scanner/                  # QRScanner, ManualEntry, ClaimResult
  shared/                   # AppShell, BottomNav, AuthGate, VolunteerPinGate, ThemeToggle
  ui/                       # shadcn/ui primitives
lib/
  firebase.ts               # Firebase app, auth, and Firestore init
  db.ts                     # Firestore CRUD, subscriptions, claim validation
  auth.tsx                  # Google Sign-In context
  types.ts                  # TypeScript interfaces
  utils.ts                  # QR parsing, formatting, helpers
firestore.rules             # Firestore security rules
```

## Data Storage

Event data is stored in **Cloud Firestore** and synced in real time. The client also uses Firestore persistent local cache for offline-friendly reads.

| Collection / path | Contents |
|-------------------|----------|
| `users/{uid}` | Active event ID per organizer |
| `events/{eventId}` | Event name, claim types, owner, public slug, PIN hash |
| `events/{eventId}/attendees/{ticketId}` | Registered attendees |
| `events/{eventId}/claims/{claimId}` | Successful claim records |
| `events/{eventId}/attempts/{attemptId}` | All scan attempts (including duplicates and failures) |

Volunteer PIN unlock state for a public event is stored in `sessionStorage` for the current browser session (`claimflow:vol-pin:[slug]`).

## New Event Defaults

| Setting | Default |
|---------|---------|
| Claim types | Snacks (100) |
| Public access | Private until published from Setup |
| Volunteer PIN | Set by organizer when making the event public |

## License

Private project.
