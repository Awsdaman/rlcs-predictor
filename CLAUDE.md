# RLCS Predictor — Developer Reference

A single-page React app that lets a friend group predict match scores for RLCS (Rocket League Championship Series) tournaments. All state lives in Supabase with realtime push to every connected browser. No build-step routing — everything is in one file (`src/App.jsx`).

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 19, Vite 8 (ES modules)       |
| Backend     | Supabase (Postgres + Realtime)      |
| Client lib  | `@supabase/supabase-js` v2          |
| Fonts       | Google Fonts — Barlow / Barlow Condensed (loaded via `<link>` in JSX) |
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
├── index.html         # Vite entry HTML (loads main.jsx)
├── vite.config.js     # Vite config with @vitejs/plugin-react
├── package.json
└── .env               # Local secrets (gitignored)
```

**Everything is in `src/App.jsx`.** There are no separate route files, no component files, no state management library. Scroll through the file using the section comments (e.g., `─── TEAMS`, `─── GROUP MATCHES`, `─── MAIN APP`).

### Components defined in App.jsx (top to bottom)

| Component         | Purpose                                                                 |
|-------------------|-------------------------------------------------------------------------|
| `TeamBadge`       | Renders team logo + abbreviated name with team-color border             |
| `BracketCard`     | Compact match card for the playoffs bracket grid                        |
| `PredictPanel`    | Score-entry + winner-button panel shown below a selected bracket card   |
| `PlayoffsPage`    | Full bracket layout: UB → LB → QF → SF → GF columns                   |
| `MatchCard`       | Group-stage match card with prediction inputs and admin result setter   |
| `BonusPointsPanel`| Admin UI to add/delete bonus/penalty point entries                      |
| `BracketEditor`   | Admin UI to set team names for each playoff slot                        |
| `LoginScreen`     | Nickname picker (player) or password field (admin)                      |
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
| Column       | Type        | Notes                        |
|--------------|-------------|------------------------------|
| `id`         | text        | PK — format: `p_{timestamp}_{random4}` generated client-side |
| `nickname`   | text        | Display name, case-insensitive login match |
| `created_at` | timestamptz | Default: `now()`             |

### `predictions`
| Column       | Type        | Notes                                   |
|--------------|-------------|-----------------------------------------|
| `player_id`  | text        | FK → players.id                         |
| `match_id`   | text        | e.g. `ga1`, `p_ubm1` (see Match IDs)   |
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
| `match_id` | text  | PK — playoff match ID (e.g. `p_ubm1`)   |
| `team1`    | text  | Team name or `"TBD"`                     |
| `team2`    | text  | Team name or `"TBD"`                     |

Upserted on conflict when admin saves bracket team names. Overrides the hardcoded `DEFAULT_PLAYOFF` constant in the frontend at runtime.

### RLS Policies

All tables have Row Level Security enabled. Typical setup:
- **SELECT**: public (anon) read allowed on all tables
- **INSERT / UPDATE / DELETE**: allowed for anon role (this app has no real auth — the anon key is used for all writes)

If writes fail with RLS errors, verify the anon role has INSERT/UPDATE/DELETE grants on each table.

### Indexes (performance)

Add these for 200+ player scale:

```sql
CREATE INDEX ON predictions (player_id);
CREATE INDEX ON predictions (match_id);
CREATE INDEX ON bonus_points (player_id);
```

---

## Auth System

**No real authentication.** Everything is stored in `localStorage`.

| Session type | How it works                                                              |
|--------------|---------------------------------------------------------------------------|
| Player       | User picks their nickname from the list; `players` table is queried, match is case-insensitive. `id` stored in `localStorage` as `rlcs_auth`. |
| Admin        | User types the hardcoded password `rlcs2026`. `localStorage` key `rlcs_admin` is set to `"1"`. |

Both persist across page refreshes. Logout clears both keys.

**To change the admin password:** edit `ADMIN_PASSWORD` constant at the top of `src/App.jsx`.

---

## Key Constants (src/App.jsx top section)

### `ADMIN_PASSWORD`
```js
const ADMIN_PASSWORD = "rlcs2026";
```

### `TEAMS`
Object mapping full team name → `{ abbr, color, bg, logo }`. 16 teams for the current tournament:

| Team                  | Abbr  | Color     |
|-----------------------|-------|-----------|
| Vitality              | VIT   | `#f5c518` |
| Karmine Corp          | KC    | `#00d4ff` |
| Wildcard              | WC    | `#ff4500` |
| FUT Esports           | FUT   | `#e74c3c` |
| NRG Esports           | NRG   | `#ff6900` |
| Manchester City       | MCFC  | `#6cabdd` |
| MIBR                  | MIBR  | `#00a651` |
| Five Fears            | 5F    | `#e74c3c` |
| Twisted Minds         | TM    | `#9b59b6` |
| Ninjas in Pyjamas     | NIP   | `#e0e0e0` |
| Shopify Rebellion     | SR    | `#96bf48` |
| TSM                   | TSM   | `#3498db` |
| Gentle Mates          | GM    | `#ff6b35` |
| Spacestation Gaming   | SSG   | `#ff4500` |
| R8 Esports            | R8    | `#c0392b` |
| FURIA Esports         | FUR   | `#ff0000` |

Teams without a Liquipedia logo (Five Fears, R8 Esports) have `logo: null` and fall back to the `abbr` text.

### `GROUP_MATCHES`
Array of 24 group-stage match objects:
```js
{ id, group, team1, team2, startTime (ISO UTC), phase: "Group Stage" }
```
Match ID format: `g{group_letter}{match_number}` — e.g. `ga1`, `gc6`.

Groups A–D, 6 matches each. All Bo5.

### `DEFAULT_PLAYOFF`
Array of 13 playoff match objects:
```js
{ id, label, round, startTime, team1, team2, bo: 7 }
```

| ID         | Label               | Round | Day        |
|------------|---------------------|-------|------------|
| `p_lb1`    | LB ROUND 1 M1       | LBR1  | Fri May 22 |
| `p_lb2`    | LB ROUND 1 M2       | LBR1  | Fri May 22 |
| `p_lb3`    | LB ROUND 1 M3       | LBR1  | Fri May 22 |
| `p_lb4`    | LB ROUND 1 M4       | LBR1  | Fri May 22 |
| `p_lb5`    | LB ROUND 2 M1       | LBR2  | Fri May 22 |
| `p_lb6`    | LB ROUND 2 M2       | LBR2  | Fri May 22 |
| `p_ubqf1`  | UB QUARTER FINAL 1  | UBQF  | Fri May 22 |
| `p_ubqf2`  | UB QUARTER FINAL 2  | UBQF  | Fri May 22 |
| `p_lbqf1`  | LB QUARTER FINAL 1  | LBQF  | Sat May 23 |
| `p_lbqf2`  | LB QUARTER FINAL 2  | LBQF  | Sat May 23 |
| `p_sf1`    | SEMI FINAL 1        | SF    | Sun May 24 |
| `p_sf2`    | SEMI FINAL 2        | SF    | Sun May 24 |
| `p_gf`     | GRAND FINAL         | GF    | Sun May 24 |

All teams start as `"TBD"` and are overridden at runtime from the `bracket_teams` Supabase table via the admin Bracket Editor.

**Bracket columns in `PlayoffsPage`:**
- Col 0: LBR1 (4 matches) + UBQF (2 matches)
- Col 1: LBR2 (2 matches) + LBQF (2 matches)
- Col 2: SF (2 matches)
- Col 3: GF (1 match)

---

## Scoring System

Calculated by `calcScore(pred, result)`:

| Outcome               | Points |
|-----------------------|--------|
| Exact score (both numbers match) | **3 pts** |
| Correct winner only   | **1 pt**  |
| Wrong winner          | **0 pts** |
| No prediction         | **0 pts** |

Total score = prediction points across all matches + sum of `bonus_points.amount` for that player.

Bonus points can be negative (penalties). Shown separately on the leaderboard and breakdown table.

---

## Realtime Sync

A single Supabase channel `"rlcs-live"` subscribes to `postgres_changes` on all 5 tables:

```
players       → INSERT/UPDATE/DELETE → updates players list
predictions   → INSERT/UPDATE        → updates others' predictions (skips own player_id)
results       → INSERT/UPDATE/DELETE → updates results map
bonus_points  → INSERT/DELETE        → updates bonus list
bracket_teams → INSERT/UPDATE        → updates playoff match team names live
```

**Critical quirk:** The predictions listener skips events where `p.player_id === myIdRef.current`. This prevents the realtime echo from overwriting the user's optimistic local update with the (potentially slightly stale) server echo. `myIdRef` is a ref (not state) so the closure inside the subscription always sees the current value.

---

## localStorage Keys

| Key                        | Value                                        |
|----------------------------|----------------------------------------------|
| `rlcs_auth`                | The logged-in player's `id` string           |
| `rlcs_admin`               | `"1"` if admin session is active             |
| `rlcs_preds_{playerId}`    | JSON object `{ [matchId]: { winner, score1, score2 } }` — backup of the player's predictions |

On login, the localStorage prediction backup is merged with server data (server takes precedence for conflicts).

---

## Optimistic Updates

Both `handlePredict` and `handleSetResult` follow the same pattern:
1. Update local React state immediately (optimistic)
2. Also write to `localStorage` backup (predictions only)
3. Fire the Supabase upsert/delete async
4. No rollback on error — assumes writes succeed (suitable for private friend group use)

---

## Features

**Navigation pages** (tab bar in header):

| Page          | Key          | Description                                                |
|---------------|--------------|------------------------------------------------------------|
| Group Stage   | `predict`    | 24 match cards, filterable by group A/B/C/D, prediction inputs visible before lock |
| Playoffs      | `playoffs`   | Visual bracket grid, click a card to open `PredictPanel`  |
| Standings     | `leaderboard`| Ranked list + match-by-match breakdown table (shows only if results exist) |
| Others' Picks | `others`     | View any other player's predictions (only for locked/started matches) |
| Admin         | `admin`      | Only shown when `isAdmin === true`. Four sub-tabs: Players, Bracket Teams, Results, Bonus Points |

**Admin sub-tabs:**
- **Players**: Add by nickname (generates `p_{ts}_{random}` id), rename, delete
- **Bracket Teams**: Set team names for each playoff slot (saved to `bracket_teams` table)
- **Results**: Set/edit/clear results for any match; score inputs determine winner automatically (`score1 > score2` → team1 wins)
- **Bonus Points**: Add positive or negative adjustments per player with optional reason; delete individual entries

---

## Current Tournament

The UI shows **RLCS 2026 Paris Major** — hardcoded in the header and loading screen:

```
RLCS 2026 · PARIS MAJOR
MAY 20–24 · PARIS LA DÉFENSE ARENA · $354,000
```

All match times are stored as UTC and displayed in **KSA time (UTC+3, Asia/Riyadh)** via `fmtTime`.

Group stage: Wed May 20 – Thu May 21. Three slots per day at 09:00, 12:00, 15:00 UTC (12:00, 15:00, 18:00 KSA).

Groups: A (Vitality, Karmine Corp, Wildcard, FUT Esports), B (NRG Esports, Manchester City, MIBR, Five Fears), C (Twisted Minds, NIP, Shopify Rebellion, TSM), D (Gentle Mates, Spacestation Gaming, R8 Esports, FURIA Esports).

Playoffs: Fri May 22 (LB R1 + LB R2 + UB QF), Sat May 23 (LB QF), Sun May 24 (SF + GF). All Bo7, all teams start as TBD.

---

## How to Update for a New Tournament

1. **Update team roster** — edit the `TEAMS` object. Add new teams with `{ abbr, color, bg, logo }`. Remove teams no longer participating.

2. **Update group stage matches** — replace the `GROUP_MATCHES` array. Each entry needs `{ id, group, team1, team2, startTime, phase }`. Keep the `g{letter}{number}` ID convention or choose your own — just must be unique and consistent with what's in Supabase.

3. **Update playoff structure** — edit `DEFAULT_PLAYOFF`. Set the known seeded teams for early rounds; leave later rounds as `"TBD"`.

4. **Update UI strings** — search `App.jsx` for `"BOSTON MAJOR"` and `"AGGANIS ARENA"` and `"FEB 19"` and update to the new tournament name, venue, dates, and prize pool.

5. **Reset Supabase data** — run these SQL statements in the Supabase SQL editor:
   ```sql
   TRUNCATE predictions;
   TRUNCATE results;
   TRUNCATE bonus_points;
   TRUNCATE bracket_teams;
   -- Optionally reset players too:
   -- TRUNCATE players;
   ```

6. **Deploy** — `git push origin main` triggers Vercel.

---

## Scaling Notes

- The leaderboard and Others' Picks pages both render all players; for 200+ players, both have search/filter capability (add a `useState` filter on the player button list — straightforward to add).
- Leaderboard score is computed client-side from the full `predictions` and `results` maps loaded at startup — works fine up to a few hundred players and ~33 matches.
- The `predictions` table should have a composite index on `(player_id, match_id)` (this is already enforced as the upsert conflict target). Add indexes on `(player_id)` and `(match_id)` separately if query plans show sequential scans.
- Realtime works well for small groups; for large concurrent users, consider debouncing the prediction upsert (e.g. 500ms after last keystroke) to reduce write load.
