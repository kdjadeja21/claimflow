# ClaimFlow

QR-based claim verification for event teams. Scan attendee tickets to distribute snacks, meals, swag, and other perks while preventing duplicate claims and tracking inventory in real time.

Built with Next.js 16, React 19, and Tailwind CSS. Data is stored locally in the browser—no backend or database required.

## Features

- **Volunteer scanner** — Camera-first QR scanning with manual ticket entry fallback, haptic feedback, and instant approval states (approved, already claimed, invalid)
- **Organizer dashboard** — Live stats, inventory velocity, duplicate attempt tracking, and a claim activity feed that refreshes every second
- **Event setup** — Configure event name, claim types, inventory limits, and organizer PIN
- **Attendee management** — Add attendees manually, import via CSV, search, and link Luma ticket URLs
- **Luma integration** — Parses Luma check-in QR codes and guest ticket URLs automatically
- **PIN-protected admin** — Dashboard, setup, and attendee pages require an organizer PIN (default: `1234`)
- **Dark mode** — System-aware theme with manual toggle

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | React 19, [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) |
| QR scanning | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |
| Icons | [Lucide React](https://lucide.dev) |
| Notifications | [Sonner](https://sonner.emilkowal.ski) |
| Storage | Browser `localStorage` |

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

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

### 1. Set up your event

Go to **Setup** (`/setup`) and enter the organizer PIN (`1234` by default). Configure:

- Event name
- Claim types (e.g. Snacks, Lunch, Swag) with inventory counts
- Organizer PIN for admin access

### 2. Add attendees

Go to **Attendees** (`/attendees`) and add ticket IDs manually or paste a CSV with columns: `ticketId`, `name`, `email`.

### 3. Scan claims

Volunteers open **Scanner** (`/scan`), select a claim type, and scan attendee QR codes. Results show immediately:

| Status | Meaning |
|--------|---------|
| Approved | First-time claim recorded successfully |
| Already claimed | This ticket already claimed this item |
| Invalid QR | Missing ticket ID or no active event |

### 4. Monitor activity

Organizers open **Dashboard** (`/dashboard`) for live inventory usage, stats, and claim history.

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home / command center with quick stats and navigation |
| `/scan` | Public | Volunteer QR scanner and manual entry |
| `/dashboard` | PIN | Live analytics, inventory, and claim feed |
| `/setup` | PIN | Event configuration and claim type management |
| `/attendees` | PIN | Attendee list, CSV import, and search |

## QR Code Formats

ClaimFlow accepts several QR payload formats:

- **Plain text** — Raw ticket ID
- **JSON** — `{ "ticketId": "..." }` (also supports `ticket_id`, `id`, `code`)
- **URL** — Ticket ID extracted from query params or path
- **Luma check-in** — `lu.ma/check-in/...?pk=...` URLs are parsed automatically

## Project Structure

```
app/
  page.tsx              # Home / command center
  scan/page.tsx         # Volunteer scanner
  dashboard/page.tsx    # Organizer dashboard
  setup/page.tsx        # Event configuration
  attendees/page.tsx    # Attendee management
  layout.tsx            # Root layout and theme provider
components/
  dashboard/            # StatsGrid, InventoryBar, ClaimFeed
  scanner/              # QRScanner, ManualEntry, ClaimResult
  shared/               # AppShell, BottomNav, PinGate, ThemeToggle
  ui/                   # shadcn/ui primitives
lib/
  storage.ts            # localStorage persistence and claim validation
  types.ts              # TypeScript interfaces
  utils.ts              # QR parsing, formatting, helpers
```

## Data Storage

All data persists in the browser via `localStorage`:

| Key | Contents |
|-----|----------|
| `claimflow:events` | Event definitions and claim types |
| `claimflow:attendees` | Registered attendees |
| `claimflow:claims` | Successful claim records |
| `claimflow:scan-attempts` | All scan attempts (including duplicates and failures) |
| `claimflow:settings` | Organizer PIN, volunteer name, active event ID |

On first load, ClaimFlow seeds a demo event ("Community Meetup") with default claim types. PIN unlock state is stored in `sessionStorage` for the current browser session.

## Default Demo Data

| Setting | Default |
|---------|---------|
| Event name | Community Meetup |
| Organizer PIN | `1234` |
| Claim types | Snacks (100), Lunch (100), Swag (75), T-shirts (50) |

## License

Private project.
