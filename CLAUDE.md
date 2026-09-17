# RLCS Predictor — Developer Reference

A single-page React app that lets a friend group predict match scores for Rocket League esports tournaments. Currently configured for the **RLCS World Championship 2026** (Sep 15–20, Fort Worth, TX). All state lives in Supabase with realtime push to every connected browser. No build-step routing — everything is in one file (`src/App.jsx`).

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 19, Vite 8 (ES modules)       |
| Backend     | Supabase (Postgres + Realtime)      |
| Client lib  | `@supabase/supabase-js` v2          |
| Fonts       | Google Fonts — Rajdhani / Inter (loaded via `<link>` in JSX) |
| Deployment  | Vercel — auto-deploys on `git push origin main` |

---

## Project Structure

```
rlcs-predictor/
├── src/
│   ├── App.jsx        # Entire application — all components, data, logic
│   ├── App.css        # Minimal global resets (most styling is inline)
│   ├── index.css      # Body/html base styles
│   └── main.jsx       # ReactDOM.createRoot entry point
├── public/logos/      # Team logo PNGs (referenced as /logos/*.png)
├── index.html         # Vite entry HTML (loads main.jsx)
├── vite.config.js     # Vite config with @vitejs/plugin-react
├── package.json
└── .env               # Local secrets (gitignored)
```

**Everything is in `src/App.jsx`.** Scroll through the file using the section comments (e.g., `─── TEAMS`, `─── GROUP STAGE`, `─── MAIN APP`).

### Components defined in App.jsx (top to bottom)

| Component         | Purpose                                                                 |
|-------------------|-------------------------------------------------------------------------|
| `CountdownPill`   | Lock countdown / 🔒 LOCKED / ● LIVE pill on match cards                 |
| `TeamBadge`       | Renders team logo + name with team-color border                         |
| `BracketCard`     | Compact match card used in all bracket grids                            |
| `PredictPanel`    | Score-entry + winner-button panel shown below a selected bracket card   |
| `PlayInsPage`     | Single 8-team double-elim bracket (Bracket view) + Schedule list view    |
| `GroupStagePage`  | Group A/B/C/D round-robin standings tables + per-group Schedule list     |
| `PlayoffsPage`    | 12-team double-elim bracket: UB QF, LB R1→R2→QF, Semis, Grand Final     |
| `MatchCard`       | List-style match card with prediction inputs and admin result setter    |
| `BonusPointsPanel`| Admin UI to add/delete bonus/penalty point entries                      |
| `BracketEditor`   | Admin UI to set team names for every group + playoff slot (datalist suggestions) |
| `LoginScreen`     | Register / Login / Admin tabs (hashed passwords)                        |
| `LoadingScreen`   | Spinner shown during initial data fetch                                 |
| `App` (default)   | Root: holds all state, loads data, subscribes to realtime, renders pages|

---

## Environment Variables

Create `.env` in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both are exposed to the browser (Vite `import.meta.env`). The anon key is safe to expose — Supabase RLS enforces access control server-side.

---

## Running Locally

```bash
npm install
# create .env with the two vars above
npm run dev          # starts at http://localhost:5173
```

---

## Deployment

Push to `main` → Vercel auto-deploys. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project environment variables dashboard.

---

## Supabase Schema

### `players`
| Column          | Type        | Notes                        |
|-----------------|-------------|------------------------------|
| `id`            | text        | PK — format: `p_{timestamp}_{random4}` generated client-side |
| `nickname`      | text        | Display name, case-insensitive login match |
| `password_hash` | text        | SHA-256 of password + salt `rlcs2026salt`; null for legacy players |
| `group_id`      | text        | FK → groups.id, default `public` |
| `joined_at`     | timestamptz |                              |
| `last_seen`     | timestamptz |                              |
| `created_at`    | timestamptz | Default: `now()`             |

### `groups`
| Column          | Type        | Notes                             |
|-----------------|-------------|-----------------------------------|
| `id`            | text        | PK — the group code (e.g. `the-squad`) |
| `name`          | text        |                                   |
| `password_hash` | text        | Hashed group password             |
| `is_private`    | boolean     |                                   |
| `invite_token`  | uuid        | One-click invite link token       |
| `created_at`    | timestamptz |                                   |

### `predictions`
| Column       | Type        | Notes                                   |
|--------------|-------------|-----------------------------------------|
| `player_id`  | text        | FK → players.id                         |
| `match_id`   | text        | e.g. `pi_ubqf1`, `ga_m3`, `p_gf` (see Match IDs) |
| `winner`     | text        | Full team name string                   |
| `score1`     | int4        | Team 1 score (nullable if only winner picked) |
| `score2`     | int4        | Team 2 score (nullable)                 |
| `updated_at` | timestamptz |                                         |

Primary key: `(player_id, match_id)` — upserted on conflict.

### `results`
| Column      | Type        | Notes                              |
|-------------|-------------|------------------------------------|
| `match_id`  | text        | PK — same ID format as predictions |
| `winner`    | text        | Full team name of winner           |
| `score1`    | int4        | Team 1 final score                 |
| `score2`    | int4        | Team 2 final score                 |
| `set_at`    | timestamptz |                                    |

### `bonus_points`
| Column      | Type        | Notes                         |
|-------------|-------------|-------------------------------|
| `id`        | uuid        | PK — default `gen_random_uuid()` |
| `player_id` | text        | FK → players.id               |
| `amount`    | int4        | Positive or negative          |
| `reason`    | text        | Nullable                      |
| `created_at`| timestamptz |                               |

### `bracket_teams`
| Column     | Type  | Notes                                    |
|------------|-------|------------------------------------------|
| `match_id` | text  | PK — ANY match ID (group or playoff)    |
| `team1`    | text  | Team name or `"TBD"`                     |
| `team2`    | text  | Team name or `"TBD"`                     |

Upserted on conflict when admin saves bracket team names. Overrides all hardcoded match constants at runtime, including the 1v1 and 2v2 finals that are auto-filled from semifinal winners.

### `app_settings`
| Column  | Type | Notes                                        |
|---------|------|----------------------------------------------|
| `key`   | text | PK — currently only `admin_password_hash`    |
| `value` | text |                                              |

### RLS Policies

All tables have Row Level Security enabled with public (anon) SELECT and anon INSERT/UPDATE/DELETE (no real server-side auth). If writes fail with RLS errors, verify the anon role grants.

---

## Auth System

Client-side only, stored in `localStorage`.

| Session type | How it works                                                              |
|--------------|---------------------------------------------------------------------------|
| Player       | Register (username + password, hashed client-side with SHA-256 + salt `rlcs2026salt`) or Login. Legacy players without `password_hash` can log in with username only. `id` stored as `rlcs_auth`. |
| Admin        | Password checked against `admin_password_hash` in `app_settings` (fallback constant `ADMIN_PASSWORD_HASH` in App.jsx). `rlcs_admin` set to `"1"`. Password changeable from the admin panel. |

Private groups: join at registration, via invite link (`/join/{uuid}`), or the Change Group modal. Admin manages groups in the Groups sub-tab.

---

## Current Tournament — RLCS World Championship 2026 (Rocket League)

```
ROCKET LEAGUE WORLDS
SEP 15–20 · FORT WORTH, TX · DICKIES ARENA · $1,200,000 · 20 TEAMS
```

Sourced from [blast.tv](https://blast.tv/rl/tournaments/rlcs-world-championship-2026) (Liquipedia blocks automated fetches with a Cloudflare CAPTCHA). All match times stored as UTC, displayed in **KSA time (UTC+3, Asia/Riyadh)** via `fmtTime` — an app-wide holdover from EWC, unrelated to this tournament's actual venue. Lock time = startTime − 5 min (derived from `LOCK_LEAD_MIN`, never stored).

### Format — three stages
1. **Play-ins (Sep 15, Bo5):** 8 teams, one double-elim bracket (UB QF ×4 → UB SF ×2 + LB R1 ×2 → LB R2 ×2). The 2 UB SF winners + 2 LB R2 winners (4 total) advance to the Group Stage; everyone else is eliminated (17th–20th).
2. **Group Stage (Sep 16–17, Bo5):** the 4 Play-in survivors join the 12 teams that qualified directly, split into **4 groups of 4** playing a **single round robin** (6 matches/group, no elimination). 1st place per group advances to the Playoffs Upper Bracket; 2nd/3rd advance to the Lower Bracket; 4th is eliminated (13th–16th). The draw, all 24 pairings, and both days' exact stream times are confirmed in `DEFAULT_GROUPS`.
3. **Playoffs (Sep 18–20, Bo7):** 12 teams, double-elim — 4 UB byes (group winners) start at UB Quarter Final; 8 LB entrants (group runners-up) start at LB Round 1 → LB Round 2 → LB Quarter Final (merging with UB QF losers) → Semi Finals (merging with UB QF winners) → Grand Final.

### Side Events
- **1v1 Worlds (Sep 16 & 18, Bo7):** Nwpo vs kv1 and nass vs diaz in the semifinals; both winners advance automatically to the Grand Final. Prize pool: $85,000.
- **2v2 Worlds (Sep 17 & 19, Bo7):** Team Falcons (Rw9 & Kiileerrz) vs Backyardigans (yANXNZ & swiftt.), and No Miss Just Fake (zen & Atow.) vs Spacestation Gaming (reveal & zach); both winners advance automatically to the Grand Final. Prize pool: $170,000.
- The September 16 1v1 semifinals and September 17 2v2 semifinals are confirmed for 5 PM and 6 PM Central (22:00 and 23:00 UTC). The two Grand Finals still use `timeTbd:true`, display "Time TBD", and stay open for predictions until their exact start times are added.

### Teams (20)
- **Direct to Group Stage (12):** Karmine Corp, Gentle Mates, Vitality, Ninjas in Pyjamas, Manchester City (EU) · NRG Esports, Shopify Rebellion, Spacestation Gaming (NA) · MIBR, FURIA Esports (SAM) · Twisted Minds (MENA) · Wildcard (OCE)
- **Play-ins (8):** Virtus.Pro vs Bigodes · Five Fears vs Mate y Tapa · Team Falcons vs FUT Esports · TSM vs R8 Esports (UB Quarter Finals, Sep 15)

Play-in Day 1 matchups + times are confirmed by blast.tv. The Group Stage draw and both daily run orders are confirmed by blast.tv and the official @RLEsports schedules. Playoff bracket wiring (who plays whom beyond "group winners" / "runners-up") is this app's best reconstruction from blast.tv's schedule + prize-tier breakdown, not an official bracket graphic — expect to adjust it once seeding is announced after groups conclude.

### Match IDs
- Play-ins: `pi_{ubqf1..4 | ubsf1..2 | lbr1m1..2 | lbr2m1..2}` — e.g. `pi_ubqf1`, `pi_lbr2m2`
- Group Stage: `g{a|b|c|d}_m{1..6}` - e.g. `ga_m1`, `gd_m6`
- 1v1: `1v1_sf1`, `1v1_sf2`, `1v1_gf`
- 2v2: `2v2_sf1`, `2v2_sf2`, `2v2_gf`
- Playoffs: `p_ubqf1..2`, `p_lbr1m1..4`, `p_lbr2m1..2`, `p_lbqf1..2`, `p_sf1..2`, `p_gf`

### Key constants (top of App.jsx)
- `TEAMS` — 3v3 teams plus 1v1-player and 2v2-duo display entries `{ abbr, color, bg, logo }`; logos in `public/logos/` and missing artwork falls back to the abbreviation badge.
- `DEFAULT_PLAYINS` — 10 matches, `bo:5`, TBD progression slots past UB QF.
- `DEFAULT_GROUPS` — 24 confirmed matches (4 groups × 6), `bo:5`, with exact September 16–17 stream times.
- `DEFAULT_1V1` — 2 semifinals + Grand Final, `bo:7`; exact times are TBD.
- `DEFAULT_2V2` — 2 semifinals + Grand Final, `bo:7`; exact times are TBD.
- `DEFAULT_PLAYOFF` — 13 matches, `bo:7`, all TBD (no seeding yet).
- All five arrays resolve against results and team-name overrides from `bracket_teams`. `groupAdvancement(g)` generates the Play-in routing, `ADVANCEMENT` sends the 1v1/2v2 semifinal winners to their finals, and `playoffAdvancement` handles the 12-team bracket.
- `maxWins(m)` — score input cap: Bo5 → 3, Bo7 → 4.

---

## Scoring System

Calculated by `calcScore(pred, result)`:

| Outcome               | Points |
|-----------------------|--------|
| Exact score (both numbers match) | **3 pts** |
| Correct winner only   | **1 pt**  |
| Wrong winner          | **0 pts** |
| No prediction         | **0 pts** |

Total score = prediction points across all 53 matches (10 Play-in + 24 Group Stage + 3 1v1 + 3 2v2 + 13 Playoffs) + sum of `bonus_points.amount`.

---

## Realtime Sync

A single Supabase channel `"rlcs-live"` subscribes to `postgres_changes` on: `players`, `predictions`, `results`, `bonus_points`, `bracket_teams` (updates all five match collections), `groups`, `app_settings`.

**Critical quirk:** The predictions listener skips events where `p.player_id === myIdRef.current` to avoid the realtime echo clobbering the user's optimistic local update. `myIdRef` is a ref so the subscription closure always sees the current value.

---

## localStorage Keys

| Key                        | Value                                        |
|----------------------------|----------------------------------------------|
| `rlcs_auth`                | The logged-in player's `id` string           |
| `rlcs_admin`               | `"1"` if admin session is active             |
| `rlcs_preds_{playerId}`    | JSON backup of the player's predictions      |
| `rlcs_reg_attempts`        | Registration rate-limit bookkeeping          |

---

## Navigation Pages

| Page          | Key          | Description                                                |
|---------------|--------------|------------------------------------------------------------|
| Play-Ins      | `playins`    | Single 8-team double-elim bracket (click card → PredictPanel) + Schedule view |
| Group Stage   | `predict`    | Group A/B/C/D tabs - standings table (computed from results) + round-robin Schedule list |
| 1v1           | `onevone`    | Four-player single-elimination bracket: semifinals and Grand Final |
| 2v2           | `twovtwo`    | Four-duo single-elimination bracket: semifinals and Grand Final |
| Playoffs      | `playoffs`   | 12-team double-elim bracket: UB QF, LB R1→R2→QF, Semis, Grand Final |
| My Group      | `mygroup`    | Only for private-group members: group standings, breakdown, members' picks, invite link |
| Standings     | `leaderboard`| Ranked list + (admin) match-by-match breakdown table       |
| Others' Picks | `others`     | View any player's predictions (locked matches only)        |
| Hall of Fame  | `halloffame` | Past events' champions + top predictors (static list)      |
| Admin         | `admin`      | Six sub-tabs: Players, Groups, Bracket, Results, Bonus, Activity |

---

## How to Update for a New Tournament

1. **Teams** — edit `TEAMS`; drop logo PNGs in `public/logos/`.
2. **Matches** — replace the relevant `DEFAULT_PLAYINS`, `DEFAULT_GROUPS`, `DEFAULT_1V1`, `DEFAULT_2V2`, and `DEFAULT_PLAYOFF` arrays (keep unique IDs; `group`/`round` drive the layouts — if the format changes, the corresponding page component needs matching edits, and `ADVANCEMENT` needs matching win/lose routing for any elimination stage).
3. **UI strings** — search App.jsx for the tournament name/dates/venue/prize (header, LoginScreen, LoadingScreen, footer).
4. **Reset Supabase data:**
   ```sql
   TRUNCATE predictions;
   TRUNCATE results;
   TRUNCATE bonus_points;
   TRUNCATE bracket_teams;
   -- Optionally: TRUNCATE players;
   ```
5. **Deploy** — `git push origin main`.
