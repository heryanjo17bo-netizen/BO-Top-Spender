# BLACK OWL — TOP SPENDER

A production-grade, real-time leaderboard and broadcast overlay application engineered for Black Owl venue FOH (Front-of-House) staff and high-resolution LED video walls across six independent outlets.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed with the user during Phase 1:
> - **Real-time Backend**: Full-stack Express server with Server-Sent Events (SSE) streaming and atomic JSON file persistence (`/api/outlets/:id`), providing instant zero-latency cross-device synchronization between mobile admin phones and venue LED display computers without third-party setup.
> - **Staff Security**: Quick 4-digit venue PIN authorization (default `8888`, customizable in settings) for sensitive admin mutations (save, delete, reset) to prevent accidental taps on floor phones.
> - **LED Display Readability**: Pure transparent root background (`rgba(0,0,0,0)`) with subtle dark translucent row fills (`rgba(0, 0, 0, 0.6)`) and gold hairline strokes, ensuring high contrast on venue LED panels with an instant toggle for pure transparent or solid black background modes.

---

### 1. Overview & Core Concept

**BLACK OWL — TOP SPENDER** is an internal nightlife operational tool purpose-built for VIP hostesses and managers to manage real-time guest spending rankings on mobile phones, instantly reflected on high-resolution stage LED video walls.

- **Primary Goal**: Flawless, dark-room phone operation for staff and broadcast-grade, transparent LED output with smooth ranking promotions.
- **Six Independent Outlets**:
  - `BOPIK` — Black Owl PIK
  - `BOKG` — Black Owl Kelapa Gading
  - `BOGS` — Black Owl Gading Serpong
  - `BOSCBD` — Black Owl SCBD (default canvas: 8704 × 2305 px)
  - `BOSBY` — Black Owl Surabaya
  - `BOMDN` — Black Owl Medan
- **Strict Isolation**: Each outlet maintains isolated participants, settings, tie-break orders, and broadcast feeds.
- **Routes**:
  - `/admin`: Floor staff management panel (phone-optimized, dark theme, gold accents).
  - `/display/:outletId`: Clean, headless, broadcast-grade transparent LED display overlay.

---

### 2. User Experience & Visual Design

#### A. FOH Mobile Admin (`/admin`)
- **Theme**: Premium nightlife aesthetic: Deep pitch-black canvas (`#0A0A0B`), warm gold accents (`#D4AF37`, `#F59E0B`), crisp white typography (`#F9FAFB`), soft dark cards (`#141416`), and subtle gold borders (`rgba(212, 175, 55, 0.2)`).
- **Dark-Room Ergonomics**: High-contrast, large touch hitboxes ($\ge 44\text{px}$), tactile numeric input formatted with Indonesian thousand separators (`230.000.000`), and live LED preview (`LED: 230K`).
- **Layout Flow**:
  1. **Top Bar**: Minimalist Black Owl wordmark + Outlet switcher dropdown + Connection status badge + Quick Settings modal trigger.
  2. **Outlet Overview**: Selected outlet banner, active participant count (`X / 10 slots`), and "Open LED Display" quick launcher button.
  3. **Participant List (1–10)**: Sorted by spending descending.
     - Rank badge (Ranks 1–5 feature an illuminated "LIVE TOP 5" gold tag).
     - Guest name, table label, full Rupiah amount (`Rp230.000.000`), and LED preview (`230K`).
     - Quick Edit and Delete actions.
  4. **Action Bar**: "Add Participant" button (disabled when 10 slots are full, with clear notification) + "Simulate Rank Change" demo trigger.
  5. **Modals & Drawers**: Mobile bottom drawer for Adding/Editing participant with real-time numeric validation and deliberate Save confirmation.

#### B. Broadcast LED Display (`/display/:outletId`)
- **Canvas & Transparency**:
  - `html`, `body`, `#root`, and wrappers set to `background: rgba(0, 0, 0, 0)`.
  - Configurable translucent dark row fill (`rgba(0,0,0,0.6)`) or pure transparency, with subtle gold hairline separators.
  - Zero admin chrome, zero scrollbars, zero cursors, zero debug watermarks.
- **Header Block**:
  - Monogram/wordmark: `BLACK OWL` in gold tracking.
  - Heading: `TOP SPENDER` in heavy display typography with restrained gold back-glow.
- **5-Row Grid Structure**:
  - Fixed-ratio grid to guarantee column alignment regardless of text length:
    - **Rank**: Bold gold tabular numerals (`01` through `05`), Rank 1 with enhanced gold aura.
    - **Guest Name**: Crisp white, bold, truncated with ellipsis if exceeding container width.
    - **Table**: Softer muted gold/white (`TABLE 08`, `VIP 02`).
    - **Spending**: Right-aligned gold custom LED notation (`230K`, `1000K`, `2.5K`).
- **Placeholder Handling**: If fewer than 5 guests are registered, clean muted dashed placeholder rows maintain grid stability without phantom text.

---

### 3. Key Product Decisions & Business Logic

#### A. Custom LED Spending Convention
- **Formula**: `LED Value = (Rupiah / 1,000,000)` formatted up to 2 decimal places with trailing zeros stripped, appended with `K`.
- **Verified Examples**:
  - `Rp2.000.000` $\rightarrow$ `2K`
  - `Rp2.500.000` $\rightarrow$ `2.5K`
  - `Rp25.000.000` $\rightarrow$ `25K`
  - `Rp230.000.000` $\rightarrow$ `230K`
  - `Rp230.500.000` $\rightarrow$ `230.5K`
  - `Rp1.000.000.000` $\rightarrow$ `1000K`
  - `Rp0` $\rightarrow$ `0K`
- **Implementation**: Single shared utility `formatLedSpending(rp: number): string` tested against all reference test cases.

#### B. Authoritative Ranking & Stable Tie-Breaking
- **Primary Sort**: Actual integer Rupiah spending descending.
- **Tie-Breaker**: Persistent `tieBreakOrder` timestamp assigned on creation. Modifying guest name or table does not alter tie-break order.
- **Scope**: Top 10 tracked by admin; only top 5 broadcast on LED screen.

#### C. Smooth Ranking Movement & Highlight Rules
- **Row Motion**: Driven by `motion/react` with persistent participant IDs. Layout transitions take 1.2–1.4 seconds with ease-in-out physics.
- **Counter Animation**: Animated numeric roll from previous amount to new amount.
- **5-Second Gold Stroke Highlight**:
  - Triggered **only** when a participant's rank genuinely improves (e.g. Rank 4 $\rightarrow$ Rank 1, or Rank 7 enters visible Rank 5).
  - Highlight includes a glowing gold border, soft drop-shadow aura, and a single light sweep.
  - Duration: Exactly 5.0 seconds before smoothly fading out.
  - Rank upgrades during active highlight reset the 5-second timer.
  - **No false highlights**: Initial page load, reconnections, spending updates with unchanged rank, name edits, or downward shifts NEVER trigger highlights.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BLACK OWL ARCHITECTURE                          │
└────────────────────────────────────────────────────────────────────────┘

    📱 FOH Admin Phone (/admin)             🖥️ Venue LED Display (/display/BOSCBD)
   ┌───────────────────────────┐           ┌────────────────────────────────┐
   │ • Outlet Picker (6 venues)│           │ • Transparent Overlay Canvas   │
   │ • Mobile Numeric Pad (IDR)│           │ • 5-Row FLIP Motion Grid       │
   │ • 4-Digit Staff PIN Auth  │           │ • Animated Number Counters     │
   │ • Live Rank Top 5 Preview │           │ • 5s Gold Promotion Glow       │
   └─────────────┬─────────────┘           └───────────────▲────────────────┘
                 │ POST /api/outlets/:id/update            │ SSE Stream
                 ▼                                         │ GET /api/outlets/:id/stream
   ┌───────────────────────────────────────────────────────┴────────────────┐
   │                 Node.js / Express Backend (Port 3000)                  │
   │                                                                        │
   │  • SSE Broadcast Manager (isolated per outlet channel)                 │
   │  • Atomic In-Memory State Cache + Persistent JSON File Store           │
   │  • 4-Digit PIN Validation & Request Sanitization                       │
   │  • Authoritative Rank & Tie-Break Computation Engine                   │
   │  • Demo Mode Simulator (triggers verified promotion sequences)         │
   └────────────────────────────────────────────────────────────────────────┘
```

#### A. Backend Endpoints
- `GET /api/outlets`: Returns summary of all 6 outlets.
- `GET /api/outlets/:id`: Returns full state (participants, settings, active rankings) for an outlet.
- `GET /api/outlets/:id/stream`: Server-Sent Events (SSE) live connection emitting real-time state changes and heartbeat pings.
- `POST /api/outlets/:id/participants`: Add new participant (max 10 limit enforced).
- `PUT /api/outlets/:id/participants/:pId`: Update name, table, or spending.
- `DELETE /api/outlets/:id/participants/:pId`: Remove participant.
- `POST /api/outlets/:id/reset`: Reset outlet list with PIN check.
- `POST /api/outlets/:id/settings`: Update display settings (canvas size, font scale, colors, background mode).
- `POST /api/outlets/:id/simulate`: Trigger realistic demo overtakes for venue testing.

#### B. Component Decomposition
1. `src/types/index.ts`: Shared data structures (`Participant`, `OutletState`, `DisplaySettings`, `RankChange`).
2. `src/utils/formatters.ts`: `formatLedSpending`, `formatRupiahInput`, `parseRupiahInput`.
3. `src/services/api.ts`: API client + robust SSE listener with auto-reconnect and state reconciliation.
4. `src/components/admin/`:
   - `AdminHeader.tsx`: Wordmark, outlet selector, live status, settings trigger.
   - `ParticipantCard.tsx`: Rank badge, LED preview, touch-friendly edit/delete triggers.
   - `ParticipantFormModal.tsx`: Mobile numeric keypad input with Indonesian grouping (`230.000.000`), validation, and save debounce.
   - `DisplaySettingsDrawer.tsx`: Canvas dimensions (preset SCBD 8704x2305, 1080p, etc.), colors, opacity, alignment.
   - `PinModal.tsx`: 4-digit numeric pad for administrative verification.
5. `src/components/display/`:
   - `LedCanvas.tsx`: Responsive aspect-ratio scaler ensuring pixel-accurate proportions on ultra-wide LED walls without scrollbars.
   - `LedLeaderboard.tsx`: Top 5 grid with FLIP motion (`motion/react`), entry/exit animations, and placeholder rows.
   - `LedRow.tsx`: Individual row with tabular numerals, truncated names, animated spending odometer, and 5-second gold glow sweep.
   - `TransparencyNotice.tsx`: Informative venue engineer guide for OBS/vMix/processor browser alpha capture.

---

### 5. Verification Plan

- [ ] **Custom LED Formatting**: Verify exact outputs for all test values (`2.000.000` $\rightarrow$ `2K`, `230.500.000` $\rightarrow$ `230.5K`, `1.000.000.000` $\rightarrow$ `1000K`, `0` $\rightarrow$ `0K`).
- [ ] **Outlet Isolation**: Validate that updating `BOSCBD` does not modify `BOPIK` or any other venue.
- [ ] **Admin Ergonomics**: Verify 10-slot limit with warning when full, mobile numeric input formatting, and 4-digit PIN verification.
- [ ] **Real-Time Cross-Device Sync**: Test mutations in Admin instantly streaming via SSE to the LED display URL without manual refresh.
- [ ] **FLIP Animation & Promotion Highlights**:
  - Test Rank 4 moving to Rank 1 (1.4s smooth glide + 5-second gold glowing outline).
  - Test Rank 7 moving into visible Top 5 (displacing previous Rank 5).
  - Confirm spending edits that do not change rank do NOT trigger gold promotion glow.
  - Confirm page reload/reconnection does NOT trigger false promotion glow.
- [ ] **Transparency Test**: Verify `rgba(0,0,0,0)` on `html`, `body`, and container without simulated checkerboards on the live LED route.
- [ ] **Build & Compilation**: Run `compile_applet` and verify zero errors.
