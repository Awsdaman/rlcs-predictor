# Design tokens — current state

Everything below is live in `src/App.jsx`. The app is styled with **inline React
style objects**, no CSS framework, no stylesheet beyond a reset. Any redesign has
to be expressible as plain CSS properties.

## Palette

Sampled from esportsworldcup.com by reading its computed styles — these are the
real EWC brand values, not approximations. **Do not introduce a new accent hue.**

### Brand
| Token | Value | Use |
|---|---|---|
| `gold` | `#C8A86A` | Primary accent — active nav, selected card, winner emphasis |
| `goldLight` | `#F2C575` | Winner names, top gradient stop, highest-emphasis text |
| `goldDark` | `#987C4B` | Gradient bottom stop |
| `goldDeep` | `#4E442D` | Deep gradient stop, rarely used |
| `orange` | `#FF5A1F` | Live / urgent states only |
| `red` | `#F4425C` | Wrong picks, destructive actions (delete, clear) |
| `blue` | `#5B8CFF` | "You" markers, informational |
| `green` | `#3ECF8E` | Exact-score success |

Source gradient on the real EWC site (their trophy/ranking bar):
`radial-gradient(122% 179% at 50% 0%, #F2C575 0%, #987C4B 40.5%, #4E442D 92.88%)`
Their hot accent: `linear-gradient(90deg, #FF3600 0%, #D1B26E 100%)`

### Ink ramp
Surfaces step **up** in lightness with elevation, so depth reads from value
rather than glow.

| Token | Value | Use |
|---|---|---|
| `bg` | `#1A1A1D` | Page base |
| `bgDeep` | `#141417` | Header bar, wells, page gradient bottom |
| `surface` | `#232327` | Cards |
| `surfaceHi` | `#2C2C31` | Card hover |
| `line` | `rgba(255,255,255,0.10)` | Standard hairline border |
| `lineSoft` | `rgba(255,255,255,0.06)` | Internal dividers |

Page background:
```css
radial-gradient(1200px 600px at 50% -10%, rgba(200,168,106,0.10) 0%, transparent 60%),
linear-gradient(180deg, #1A1A1D 0%, #141417 100%)
```

### Text
| Token | Value | Use |
|---|---|---|
| `white` | `#F7F7F8` | Primary text |
| `muted` | `#A0A0A6` | Secondary text |
| `dim` | `#6E6E76` | Labels, metadata, TBD placeholders |

## Typography

Two Google fonts, loaded via `<link>`:

```
Rajdhani  600,700   → headings, labels, team names, scores, all UI chrome
Inter     400,600   → body copy and longer prose
```

Rajdhani is a squarish condensed face that carries the esports tone. Current
usage:

| Context | Size | Weight | Tracking |
|---|---|---|---|
| Page wordmark | 20 | 700 | 3 |
| Round label | 10 | 700 | 1.6 uppercase |
| Round sub-label (date) | 9 | 700 | 1.2 uppercase |
| Card header label | 9.5 | 700 | 1.4 uppercase |
| Team name | 13.5 | 700 | 0.3 |
| Score | 20 | 700 | tabular-nums |
| Nav item | 12 | 700 | 1.5 uppercase |

Scores use `font-variant-numeric: tabular-nums` so digits don't shift as results
land. Keep that.

## Layout

| Constant | Value | Meaning |
|---|---|---|
| Shell max width | `1440px` | Page container |
| `CARD_W` | `320px` | Bracket match card — fixed; connectors absorb slack |
| `QUALIFY_W` | `104px` | "Advance" marker column |
| Card radius | `6px` | |
| Card shadow | `0 1px 3px rgba(0,0,0,0.25)` | Selected: `0 6px 18px rgba(0,0,0,0.35)` |

### How the bracket geometry works

This is load-bearing — it took real effort to get exact, so understand it before
changing it.

A round is a flex column of N equal `flex:1` slots. With N slots, card centres
land at `(2i+1)/2N` of the column height. A round with half as many slots
therefore lands **exactly** on each pair's midpoint, with no hard-coded card
height anywhere. That matters because card height varies (admin mode adds a debug
line; long team names wrap).

Connectors are real elbows drawn from those same percentages, inside a `flex:1`
column between rounds:

```
in-stub   left:0    width:50%  top:25%   height:1
in-stub   left:0    width:50%  top:75%   height:1
vertical  left:50%  width:1    top:25%   height:50%
out-stub  left:50%  width:50%  top:50%   height:1
```

**Critical:** slots must not use `gap`. A 4-slot column accumulates three gaps
while its 2-unit connector column accumulates one, which throws the joins off by
~2.5px. Cards are spaced with symmetric `padding: 7px 0` on the slot, which
spaces without moving a centre.

For 1:1 progressions (LB round 1 → round 2, or a round → its "Advance" marker) a
single centred horizontal line is used instead of an elbow.

## Component inventory

| Component | Role |
|---|---|
| `CountdownPill` | Countdown → `LOCKED` → `LIVE` on match cards |
| `BracketTeamRow` | One team row: gutter bar, logo chip, name, score/pick chip |
| `BracketCard` | Header (label + status) + two team rows |
| `PredictPanel` | Score inputs + two winner buttons, opens under a selected card |
| `GroupStagePage` | Group A/B brackets + by-day schedule list |
| `PlayoffsPage` | QF → SF → GF + 3rd-place match |
| `MatchCard` | List-style row used by the schedule and admin results |
| `RoundCol` / `Slot` / `ElbowCol` / `LineCol` | Bracket layout primitives |
| `QualifyTag` | "Qualified" marker at the end of a qualifying round |
| Leaderboard rows | Rank, name, group badge, prediction count, points |

## Data shapes

```js
match  = { id, group?, round, label, team1, team2, startTime /* UTC ISO */, bo }
result = { winner, score1, score2 }
pred   = { winner, score1, score2 }        // score1/2 nullable
player = { id, nickname, group_id, joined_at, last_seen }
```

Scoring: exact score `3`, correct winner only `1`, wrong `0`. Total = prediction
points + bonus adjustments.

Match times are stored UTC and always displayed in **KSA (Asia/Riyadh, UTC+3)**.
Lock time is derived as `startTime − 30min` and never stored.

Series length: group stage is Bo5 (first to 3), playoffs Bo7 (first to 4).

## Real tournament data

**Group A:** Twisted Minds, FUT Esports, Shopify Rebellion, Ninjas in Pyjamas,
Vitality, FURIA Esports, NRG Esports, TSM

**Group B:** Karmine Corp, Wildcard, MIBR, Spacestation Gaming, R8 Esports,
Team Falcons, Gentle Mates, Five Fears

Team names are long and several share their last word — three teams end in
"Esports". Never truncate a team name to its last word; the design must handle
full names like "Spacestation Gaming" and "Ninjas in Pyjamas" at card width.

Format: two 8-team double-elimination groups (Aug 12–14, Bo5), top 4 from each
advance to an 8-team single-elim playoff (Aug 15–16, Bo7) with a 3rd-place match.
