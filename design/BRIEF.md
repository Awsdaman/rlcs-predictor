# Design brief — EWC 2026 Rocket League Predictor

**Paste this whole file into Claude, and attach `preview.html` and `tokens.md`.**

---

## The prompt

> I have a live web app — a score-prediction game a friend group uses during the
> Esports World Cup 2026 Rocket League tournament. I want you to redesign its
> visual layer.
>
> I'm attaching `preview.html`, a self-contained static mock of the current UI
> with realistic data covering every visual state. Open it, look at it honestly,
> then redesign it and give it back to me as a single self-contained HTML
> artifact I can view.
>
> Do not restructure the product. Same screens, same information, same
> interactions. I want the visual craft raised, not the app rethought.
>
> Read `tokens.md` for the constraints — especially the brand palette, which is
> sampled from the real Esports World Cup site and is not up for reinvention.
>
> Work in two passes. **First**, before writing any code, tell me what's
> actually weak about the current design — be specific and blunt, name the
> elements, don't give me a list of generic UI advice. **Then** produce the
> redesign.

---

## What this app is

A private prediction game. Before each match locks (5 min before start), players
predict the score. Exact score = 3 pts, correct winner only = 1 pt. A leaderboard
ranks the group. One admin enters real results as they happen.

Roughly 7 players in one private group. It is used **on phones, during a live
tournament, while watching the stream** — often glancing at it between games.
That context should drive the design more than desktop polish does.

## The screens

| Screen | What it's for |
|---|---|
| **Group Stage** | Two 8-team double-elimination brackets (Group A/B), plus a by-day schedule list. The hero screen. |
| **Playoffs** | 8-team single-elim bracket: QF → SF → Grand Final, plus a 3rd-place match. |
| **Standings** | Ranked player list with points, prediction counts, bonus adjustments. |
| **My Group** | Private-group standings, a per-match breakdown grid, members' picks, invite link. |
| **Others' Picks** | Browse another player's predictions — only for matches already locked. |
| **Admin** | Six tabs: players, groups, bracket seeding, results entry, bonus points, activity feed. |

## The bracket is the product

Most of the value is in the bracket views, so that's where design effort pays.
A bracket has to make three things instantly legible:

1. **Who plays whom** — the pairing, via connectors that actually resolve.
2. **What's happening now** — locked / counting down / live / finished.
3. **How you did** — your pick versus the result, and the points it earned.

Every match card carries: round label, countdown-or-status, two teams with logos,
scores when finished, and a marker when it holds your pick. Cards can be `TBD`
before the bracket seeds.

## States that must survive the redesign

Design these explicitly — the current design handles them, and it's easy to lose
one in a restyle:

- **Countdown** — "Locks in 35h 17m", turning urgent under an hour
- **Live** — match in progress
- **Locked** — past the cutoff, no result yet
- **Finished** — scores shown, winner emphasised
- **Scored** — your pick was right: +3 (exact) or +1 (winner), or wrong: 0
- **TBD** — teams not yet known, not predictable
- **Your pick** — marked on a card before the result lands
- **Selected** — the card you're currently predicting on

## Constraints

- **Palette is fixed.** Champagne gold on dark, sampled from esportsworldcup.com.
  Exact values in `tokens.md`. You may adjust surface lightness and add neutral
  steps; do not introduce a new accent hue.
- **Dark theme only.** No light mode.
- **Self-contained.** Inline CSS/SVG only, no CDNs, no external images. Team
  logos are missing from the mock on purpose — use the coloured initial chips.
- **Mobile matters most.** Brackets scroll horizontally inside their own
  container; the page itself must never scroll sideways.
- **The stack is inline-styled React.** Anything you use should be expressible as
  plain CSS — avoid Tailwind classes, CSS frameworks, or build-step features.

## What I've already tried — don't hand it back to me

The current design was deliberately pulled away from generic "AI-looking" UI, so
these specific moves are regressions, not improvements:

- Glow / neon box-shadows on every surface
- Gradient-filled heading text
- Emoji standing in for structural labels
- Uniform heavy letter-spacing on all text
- Large border radii everywhere
- Purple-to-blue gradients of any kind

Depth currently reads from **value** (page `#1A1A1D` → card `#232327`) plus one
hairline border. Keep that principle or replace it with something better argued.

## Where I think it's still weak

My own read, for you to agree or disagree with:

- Match cards are visually monotonous — every card weighs the same regardless of
  whether it's a dead TBD slot or the Grand Final.
- Hierarchy between round labels, card headers and team names is thin.
- The schedule list view is plain next to the bracket view.
- Standings rows are tall and repetitive with weak rank emphasis.
- Nothing conveys *tournament momentum* — no sense of the event progressing.

## What I want back

1. A blunt critique first, naming specific elements.
2. A single self-contained HTML artifact of the redesign, covering the group
   bracket, playoff bracket, a schedule list, standings, and every state above.
3. A short note on what you changed and why — decisions, not a feature list.

Show both a wide layout and a narrow one if you can fit it in one page.
