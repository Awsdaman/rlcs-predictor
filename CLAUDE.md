# RLCS Predictor — Developer Reference

A single-page React app that lets a friend group predict match scores for Rocket League esports tournaments. Currently configured for the **Esports World Cup 2026** (Aug 12–16, Riyadh). All state lives in Supabase with realtime push to every connected browser. No build-step routing — everything is in one file (`src/App.jsx`).

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
| `GroupStagePage`  | Group A/B double-elim mini-brackets + a by-day Schedule list view       |
| `PlayoffsPage`    | Single-elim playoff bracket: QF → SF → GF, plus 3rd-place match        |
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
| `match_id`   | text        | e.g. `a_ubqf1`, `p_gf` (see Match IDs) |
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

Upserted on conflict when admin saves bracket team names. Overrides the hardcoded `DEFAULT_GROUP_MATCHES` **and** `DEFAULT_PLAYOFF` constants at runtime — group-stage progression matches (LB rounds, UB semis) are TBD until the admin fills them in.

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

## Current Tournament — EWC 2026 (Rocket League)

```
EWC 2026 · ROCKET LEAGUE
AUG 12–16 · RIYADH · $1,000,000 · 16 TEAMS
```

All match times stored as UTC, displayed in **KSA time (UTC+3, Asia/Riyadh)** via `fmtTime`. Lock time = startTime − 5 min (derived from `LOCK_LEAD_MIN`, never stored).

### Format
- **Group stage (Aug 12–14, all Bo5):** two groups of 8, each a **double-elimination bracket**:
  - UB Quarter Finals (4) → UB Semi Finals (2, winners qualify)
  - LB Round 1 (2, UB QF losers; losers eliminated) → LB Round 2 (2, vs UB SF losers; winners qualify)
  - Top 4 per group advance.
- **Playoffs (Aug 15–16, all Bo7):** single-elim 8-team bracket — QF ×4 (Aug 15), SF ×2, 3rd-place match, Grand Final (Aug 16).

### Groups
- **Group A:** Twisted Minds, FUT Esports, Shopify Rebellion, Ninjas in Pyjamas, Vitality, FURIA Esports, NRG Esports, TSM
- **Group B:** Karmine Corp, Wildcard, MIBR, Spacestation Gaming, R8 Esports, Team Falcons, Gentle Mates, Five Fears

Day 1 (Aug 12) times are confirmed (from blast.tv + @ZEEZ0_rl); day 2–5 times are estimates on the correct days.

### Match IDs
- Group stage: `{a|b}_{ubqf1..4 | ubsf1..2 | lbr1m1..2 | lbr2m1..2}` — e.g. `a_ubqf1`, `b_lbr2m2`
- Playoffs: `p_qf1..4`, `p_sf1`, `p_sf2`, `p_3rd`, `p_gf`

### Key constants (top of App.jsx)
- `TEAMS` — 16 team entries `{ abbr, color, bg, logo }`; logos in `public/logos/`.
- `DEFAULT_GROUP_MATCHES` — 20 group matches with `{ id, group, round, label, team1, team2, startTime, bo:5 }`. TBD progression slots.
- `DEFAULT_PLAYOFF` — 8 playoff matches, `bo:7`, all TBD.
- Both arrays live in state (`groupMatches` / `playoffMatches`) and get team-name overrides from `bracket_teams`.
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

Total score = prediction points across all 28 matches + sum of `bonus_points.amount`.

---

## Realtime Sync

A single Supabase channel `"rlcs-live"` subscribes to `postgres_changes` on: `players`, `predictions`, `results`, `bonus_points`, `bracket_teams` (updates **both** groupMatches and playoffMatches), `groups`, `app_settings`.

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
| Group Stage   | `predict`    | Group A/B double-elim brackets (click card → PredictPanel) + Schedule view (by-day MatchCard list) |
| Playoffs      | `playoffs`   | Single-elim bracket QF→SF→GF + 3rd-place match            |
| My Group      | `mygroup`    | Only for private-group members: group standings, breakdown, members' picks, invite link |
| Standings     | `leaderboard`| Ranked list + (admin) match-by-match breakdown table       |
| Others' Picks | `others`     | View any player's predictions (locked matches only)        |
| Admin         | `admin`      | Six sub-tabs: Players, Groups, Bracket, Results, Bonus, Activity |

---

## How to Update for a New Tournament

1. **Teams** — edit `TEAMS`; drop logo PNGs in `public/logos/`.
2. **Matches** — replace `DEFAULT_GROUP_MATCHES` and `DEFAULT_PLAYOFF` (keep unique IDs; `group`/`round` drive the bracket layouts — if the format changes, `GroupStagePage`/`PlayoffsPage` layouts need matching edits).
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
