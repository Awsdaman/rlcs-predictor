import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ─── INPUT SANITIZATION ──────────────────────────────────────────────────────
function sanitize(str, maxLen=100) {
  return String(str).replace(/<[^>]*>/g,'').trim().slice(0,maxLen);
}

// ─── PASSWORD HASHING ────────────────────────────────────────────────────────
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password + 'rlcs2026salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
// Current admin password: RL@Paris2026!#Admin (hash stored in app_settings table)
// Fallback hash used only if app_settings fetch fails at load time:
const ADMIN_PASSWORD_HASH = '8a0f9e483b972cabad08519542740c3bf80d754474abbd7eab16940a4d8e175e';

// ─── INVITE LINK BASE ────────────────────────────────────────────────────────
// Supabase: ALTER TABLE groups ADD COLUMN IF NOT EXISTS invite_token uuid UNIQUE DEFAULT gen_random_uuid();
//           UPDATE groups SET invite_token = gen_random_uuid() WHERE invite_token IS NULL;
const INVITE_BASE = "https://rlcs-predictor.vercel.app/join";
const INVITE_TOKEN_RE = /^\/join\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// ─── BRAND COLORS — sampled from esportsworldcup.com ─────────────────────────
// Champagne gold on near-black is the EWC signature; orange→gold is their hot
// accent gradient. Names kept stable (red/blue/purple) so existing call sites
// keep working — the values are now the EWC equivalents.
// Surfaces step *up* in lightness with elevation (page → card → hover) so depth
// reads from value, not from glow. Neutrals carry a faint warm cast to sit with
// the gold rather than fight it.
const C = {
  gold:      '#C8A86A',   // EWC primary — active nav, selected card, winner emphasis
  goldLight: '#F2C575',   // winner names, highest-emphasis text
  goldDark:  '#987C4B',
  goldDeep:  '#4E442D',
  orange:    '#FF5A1F',   // live / urgent only
  red:       '#F4425C',   // sub-hour countdown, wrong picks, destructive
  blue:      '#5B8CFF',   // "you" markers
  purple:    '#C8A86A',   // legacy alias → gold
  // ink ramp — surfaces pulled down so gold and the page washes have headroom
  bg:        '#17171A',   // page
  bgDeep:    '#121214',   // header, wells, TBD card fill
  surface:   '#1F1F23',   // standard cards
  surfaceHi: '#28282D',   // raised / selected / live cards
  navy:      '#17171A',   // legacy aliases
  navyLight: '#1F1F23',
  line:      'rgba(255,255,255,0.09)',
  lineSoft:  'rgba(255,255,255,0.05)',
  lineStrong:'rgba(255,255,255,0.18)',   // emphasised border (predict panel)
  conn:      'rgba(200,168,106,0.30)',   // bracket connector rules
  white:     '#F7F7F8',
  muted:     '#9C9CA3',   // secondary text, losing team names
  dim:       '#67676E',   // labels, metadata
  dimmer:    '#48484E',   // TBD placeholders — recessed below dim
  green:     '#3ECF8E',
};
const GOLD_GRAD  = `linear-gradient(135deg, ${C.goldLight} 0%, ${C.gold} 55%, ${C.goldDark} 100%)`;
const NUM        = { fontVariantNumeric: 'tabular-nums' };  // scores never jitter
// Directional light rather than a symmetric halo.
const PAGE_BG = `
  radial-gradient(1000px 520px at 15% -8%,  rgba(200,168,106,0.12) 0%, transparent 55%),
  radial-gradient(900px 620px at 100% 30%,  rgba(255,90,31,0.05)   0%, transparent 60%),
  radial-gradient(1100px 700px at 50% 120%, rgba(200,168,106,0.06) 0%, transparent 60%),
  linear-gradient(180deg, #18181B 0%, #101012 100%)`;

// ─── TEAMS — EWC 2026 (16 teams) ─────────────────────────────────────────────
const TEAMS = {
  "Vitality":            { abbr:"VIT",  color:"#FFD700", bg:"#1a1400", logo:"/logos/vitality.png" },
  "Karmine Corp":        { abbr:"KC",   color:"#00CFFF", bg:"#001a2e", logo:"/logos/karmine-corp.png" },
  "Wildcard":            { abbr:"WC",   color:"#1E90FF", bg:"#00091a", logo:"/logos/wildcard.png" },
  "FUT Esports":         { abbr:"FUT",  color:"#C8102E", bg:"#1a0000", logo:"/logos/fut.png" },
  "NRG Esports":         { abbr:"NRG",  color:"#FF6600", bg:"#1a0800", logo:"/logos/nrg.png" },
  "Team Falcons":        { abbr:"FLCN", color:"#00E693", bg:"#00170d", logo:"/logos/team-falcons.png" },
  "MIBR":                { abbr:"MIBR", color:"#00A651", bg:"#001a0d", logo:"/logos/mibr.png" },
  "Five Fears":          { abbr:"5F",   color:"#00BFFF", bg:"#001520", logo:"/logos/five-fears.png" },
  "Twisted Minds":       { abbr:"TM",   color:"#FF3D6E", bg:"#1a0010", logo:"/logos/twisted-minds.png" },
  "Ninjas in Pyjamas":   { abbr:"NIP",  color:"#CCFF00", bg:"#0d1400", logo:"/logos/nip.png" },
  "Shopify Rebellion":   { abbr:"SR",   color:"#96BF48", bg:"#0d1a00", logo:"/logos/shopify.png" },
  "TSM":                 { abbr:"TSM",  color:"#3498DB", bg:"#0a1628", logo:"/logos/tsm.png" },
  "Gentle Mates":        { abbr:"GM",   color:"#FF6B35", bg:"#1a0800", logo:"/logos/gentle-mates.png" },
  "Spacestation Gaming": { abbr:"SSG",  color:"#F5A623", bg:"#1a1000", logo:"/logos/spacestation.png" },
  "R8 Esports":          { abbr:"R8",   color:"#00BFFF", bg:"#001520", logo:"/logos/r8.png" },
  "FURIA Esports":       { abbr:"FUR",  color:"#FFFFFF", bg:"#0a0a0a", logo:"/logos/furia.png" },
};

// ─── GROUP STAGE — two double-elimination groups of 8, all Bo5 ───────────────
// Day 1 (Aug 12) times are confirmed from blast.tv / @ZEEZ0_rl.
// Day 2–3 times are estimates — matches are on the correct day, exact hour may shift.
// TBD slots fill in from the bracket_teams Supabase table (admin Bracket editor).
const DEFAULT_GROUP_MATCHES = [
  // GROUP A — UB Quarter Finals · Wed Aug 12
  { id:"a_ubqf1",  group:"A", round:"UBQF", label:"UB QUARTER FINAL 1", team1:"Twisted Minds",     team2:"FUT Esports",       startTime:"2026-08-12T15:10:00Z", bo:5 },
  { id:"a_ubqf2",  group:"A", round:"UBQF", label:"UB QUARTER FINAL 2", team1:"Shopify Rebellion", team2:"Ninjas in Pyjamas", startTime:"2026-08-12T16:50:00Z", bo:5 },
  { id:"a_ubqf3",  group:"A", round:"UBQF", label:"UB QUARTER FINAL 3", team1:"Vitality",          team2:"FURIA Esports",     startTime:"2026-08-12T16:00:00Z", bo:5 },
  { id:"a_ubqf4",  group:"A", round:"UBQF", label:"UB QUARTER FINAL 4", team1:"NRG Esports",       team2:"TSM",               startTime:"2026-08-12T14:20:00Z", bo:5 },
  // GROUP A — LB Round 1 · Thu Aug 13 (UB QF losers)
  { id:"a_lbr1m1", group:"A", round:"LBR1", label:"LB ROUND 1 M1",      team1:"TBD", team2:"TBD",  startTime:"2026-08-13T11:00:00Z", bo:5 },
  { id:"a_lbr1m2", group:"A", round:"LBR1", label:"LB ROUND 1 M2",      team1:"TBD", team2:"TBD",  startTime:"2026-08-13T11:50:00Z", bo:5 },
  // GROUP A — UB Semi Finals · Thu Aug 13 (winners qualify for playoffs)
  { id:"a_ubsf1",  group:"A", round:"UBSF", label:"UB SEMI FINAL 1",    team1:"TBD", team2:"TBD",  startTime:"2026-08-13T12:40:00Z", bo:5 },
  { id:"a_ubsf2",  group:"A", round:"UBSF", label:"UB SEMI FINAL 2",    team1:"TBD", team2:"TBD",  startTime:"2026-08-13T13:30:00Z", bo:5 },
  // GROUP A — LB Round 2 · Fri Aug 14 (winners qualify for playoffs)
  { id:"a_lbr2m1", group:"A", round:"LBR2", label:"LB ROUND 2 M1",      team1:"TBD", team2:"TBD",  startTime:"2026-08-14T12:40:00Z", bo:5 },
  { id:"a_lbr2m2", group:"A", round:"LBR2", label:"LB ROUND 2 M2",      team1:"TBD", team2:"TBD",  startTime:"2026-08-14T13:30:00Z", bo:5 },

  // GROUP B — UB Quarter Finals · Wed Aug 12
  { id:"b_ubqf1",  group:"B", round:"UBQF", label:"UB QUARTER FINAL 1", team1:"Karmine Corp",      team2:"Wildcard",            startTime:"2026-08-12T11:00:00Z", bo:5 },
  { id:"b_ubqf2",  group:"B", round:"UBQF", label:"UB QUARTER FINAL 2", team1:"MIBR",              team2:"Spacestation Gaming", startTime:"2026-08-12T13:30:00Z", bo:5 },
  { id:"b_ubqf3",  group:"B", round:"UBQF", label:"UB QUARTER FINAL 3", team1:"R8 Esports",        team2:"Team Falcons",        startTime:"2026-08-12T11:50:00Z", bo:5 },
  { id:"b_ubqf4",  group:"B", round:"UBQF", label:"UB QUARTER FINAL 4", team1:"Gentle Mates",      team2:"Five Fears",          startTime:"2026-08-12T12:40:00Z", bo:5 },
  // GROUP B — UB Semi Finals · Thu Aug 13 (winners qualify for playoffs)
  { id:"b_ubsf1",  group:"B", round:"UBSF", label:"UB SEMI FINAL 1",    team1:"TBD", team2:"TBD",  startTime:"2026-08-13T14:20:00Z", bo:5 },
  { id:"b_ubsf2",  group:"B", round:"UBSF", label:"UB SEMI FINAL 2",    team1:"TBD", team2:"TBD",  startTime:"2026-08-13T15:10:00Z", bo:5 },
  // GROUP B — LB Round 1 · Fri Aug 14 (UB QF losers)
  { id:"b_lbr1m1", group:"B", round:"LBR1", label:"LB ROUND 1 M1",      team1:"TBD", team2:"TBD",  startTime:"2026-08-14T11:00:00Z", bo:5 },
  { id:"b_lbr1m2", group:"B", round:"LBR1", label:"LB ROUND 1 M2",      team1:"TBD", team2:"TBD",  startTime:"2026-08-14T11:50:00Z", bo:5 },
  // GROUP B — LB Round 2 · Fri Aug 14 (winners qualify for playoffs)
  { id:"b_lbr2m1", group:"B", round:"LBR2", label:"LB ROUND 2 M1",      team1:"TBD", team2:"TBD",  startTime:"2026-08-14T14:20:00Z", bo:5 },
  { id:"b_lbr2m2", group:"B", round:"LBR2", label:"LB ROUND 2 M2",      team1:"TBD", team2:"TBD",  startTime:"2026-08-14T15:10:00Z", bo:5 },
];

// ─── PLAYOFFS — single elimination, top 4 per group qualify, all Bo7 ─────────
const DEFAULT_PLAYOFF = [
  { id:"p_qf1", round:"QF",  label:"QUARTER FINAL 1", startTime:"2026-08-15T11:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_qf2", round:"QF",  label:"QUARTER FINAL 2", startTime:"2026-08-15T12:30:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_qf3", round:"QF",  label:"QUARTER FINAL 3", startTime:"2026-08-15T14:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_qf4", round:"QF",  label:"QUARTER FINAL 4", startTime:"2026-08-15T15:30:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_sf1", round:"SF",  label:"SEMI FINAL 1",    startTime:"2026-08-16T11:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_sf2", round:"SF",  label:"SEMI FINAL 2",    startTime:"2026-08-16T12:30:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_3rd", round:"3RD", label:"3RD PLACE MATCH", startTime:"2026-08-16T14:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_gf",  round:"GF",  label:"GRAND FINAL",     startTime:"2026-08-16T15:30:00Z", team1:"TBD", team2:"TBD", bo:7 },
];

const ALL_MATCHES = [...DEFAULT_GROUP_MATCHES, ...DEFAULT_PLAYOFF];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const calcScore = (pred, result) => {
  if (!pred || !result) return 0;
  if (pred.score1 === result.score1 && pred.score2 === result.score2) return 3;
  if (pred.winner === result.winner) return 1;
  return 0;
};
// Lock time is always derived: startTime - 30 minutes. Never stored separately.
const getLockTime = (m) => new Date(new Date(m.startTime).getTime() - 30 * 60 * 1000);
const isLocked    = (m, now) => (now !== undefined ? now : Date.now()) >= getLockTime(m).getTime();
const fmtTime     = (iso) => new Date(iso).toLocaleString("en-US", { timeZone:"Asia/Riyadh", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
const timeAgo   = (iso) => { if(!iso)return"–"; const s=Math.floor((Date.now()-new Date(iso))/1000); if(s<60)return`${s}s ago`; const m=Math.floor(s/60); if(m<60)return`${m} min ago`; const h=Math.floor(m/60); if(h<24)return`${h} hr ago`; return`${Math.floor(h/24)}d ago`; };
const teamStyle = (n)   => TEAMS[n] || { abbr:(n||"?").slice(0,3).toUpperCase(), color:"#888", bg:"#111", logo:null };
const isTBDTeam = (n)   => !n || n === "TBD";
const maxWins   = (m)   => ((m.bo || 5) === 7 ? 4 : 3);   // Bo5 → first to 3, Bo7 → first to 4
const hasTBD    = (m)   => isTBDTeam(m.team1) || isTBDTeam(m.team2);
// Predictable = still open: teams known, not locked, no result yet.
const isPredictable = (m, res, now) => !hasTBD(m) && !res && !isLocked(m, now);
const F = { main:"'Rajdhani', sans-serif", body:"'Inter', sans-serif" };

// ─── SCORELINE RULES ─────────────────────────────────────────────────────────
// A series ends the moment a team reaches maxWins, so exactly one side can hold
// that number and the loser is strictly below it. 4–3 is a real Bo7; 3–3 is not
// a scoreline that can exist.
// The `max` attribute on a number input only gates the spinner — it does not
// stop typing — so every entry point clamps through here instead.
const clampScore = (raw, cap) => {
  if (raw === "" || raw == null) return "";
  const n = parseInt(raw, 10);
  if (isNaN(n)) return "";
  return String(Math.min(cap, Math.max(0, n)));
};
// Who the scoreline says won, or null while it is still undecided.
const impliedWinner = (m, a, b) => {
  const cap = maxWins(m);
  const n1 = parseInt(a, 10), n2 = parseInt(b, 10);
  if (n1 === cap && n2 !== cap) return m.team1;
  if (n2 === cap && n1 !== cap) return m.team2;
  return null;
};
// Applies a new score to one side and returns a legal pair: the edited side is
// clamped, and if it just hit the cap the other side is pulled below it.
const applyScore = (m, side, raw, s1, s2) => {
  const cap = maxWins(m);
  const v = clampScore(raw, cap);
  let a = side === 1 ? v : s1;
  let b = side === 2 ? v : s2;
  if (parseInt(v, 10) === cap) {
    if (side === 1 && parseInt(b, 10) === cap) b = String(cap - 1);
    if (side === 2 && parseInt(a, 10) === cap) a = String(cap - 1);
  }
  return [a, b];
};
const numOrNull = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };

// ─── SHARED INPUT STYLE ───────────────────────────────────────────────────────
const inputStyle = (extra={}) => ({
  background:"rgba(255,255,255,0.05)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:7,
  color:C.white,
  fontFamily:F.body,
  ...extra,
});

// ─── STATUS CHIP ─────────────────────────────────────────────────────────────
// Chips mean "something is happening or was earned". Locked-and-waiting is the
// absence of both, so it renders as plain text — previously it sat in the same
// chip family as countdowns and was hard to tell apart at a glance.
function CountdownPill({ lockTime, now, startTime }) {
  const ms = new Date(lockTime) - now;

  if (ms <= 0) {
    const live = startTime && now >= new Date(startTime).getTime();
    if (live) {
      return (
        <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,90,31,0.12)",
                      border:"1px solid rgba(255,90,31,0.4)", borderRadius:4, padding:"3px 8px",
                      fontSize:10, fontWeight:700, fontFamily:F.main, letterSpacing:0.5,
                      color:C.orange, whiteSpace:"nowrap" }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:C.orange,
                         animation:"ewcPulse 1.4s ease-in-out infinite" }} />
          LIVE
        </div>
      );
    }
    return (
      <span style={{ fontSize:9.5, fontWeight:700, fontFamily:F.main, letterSpacing:1,
                     textTransform:"uppercase", color:C.dim, whiteSpace:"nowrap" }}>
        Locked
      </span>
    );
  }

  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;
  const urgent = ms < 3_600_000;
  const text = hours > 0
    ? `Locks in ${hours}h ${String(mins).padStart(2,"0")}m`
    : `${mins}m ${String(secs).padStart(2,"0")}s`;
  return (
    <div style={{ background: urgent ? "rgba(244,66,92,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${urgent ? "rgba(244,66,92,0.4)" : C.line}`,
                  borderRadius:4, padding:"3px 8px", fontSize:10, fontWeight:700,
                  fontFamily:F.main, letterSpacing:0.5, color: urgent ? C.red : C.muted,
                  whiteSpace:"nowrap" }}>
      {text}
    </div>
  );
}

// Scored outcome chip — the border hue on the card already says how you did, this
// gives the number.
function ScoreChip({ score }) {
  const map = {
    3: { color:C.green, bg:"rgba(62,207,142,0.14)" },
    1: { color:C.gold,  bg:"rgba(200,168,106,0.14)" },
    0: { color:C.dim,   bg:"transparent" },
  }[score];
  return (
    <span style={{ fontSize:10, fontWeight:700, fontFamily:F.main, letterSpacing:0.5,
                   color:map.color, background:map.bg, borderRadius:4, padding:"3px 8px",
                   whiteSpace:"nowrap" }}>
      +{score}
    </span>
  );
}

// ─── TEAM BADGE ──────────────────────────────────────────────────────────────
function TeamBadge({ name, size="sm" }) {
  const t = teamStyle(name);
  const isTBD = isTBDTeam(name);
  const sz = size === "lg" ? 52 : 36;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{
        width: sz,
        height: sz,
        borderRadius: 7,
        background: isTBD ? C.surfaceHi : (["TSM", "R8 Esports", "Shopify Rebellion", "Vitality"].includes(name) ? "#FFFFFF" : t.bg),
        border: `2px solid ${isTBD ? "#3d3d3d" : t.color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: isTBD ? "none" : `0 0 8px ${t.color}80, 0 0 2px ${t.color}`,
      }}>
        {t.logo && !isTBD
          ? <>
              <img src={t.logo} alt={name} style={{ width:["TSM","R8 Esports","Shopify Rebellion"].includes(name)?"80%":"95%", height:["TSM","R8 Esports","Shopify Rebellion"].includes(name)?"80%":"95%", objectFit:"contain" }}
                onError={(e)=>{ e.target.onerror=null; e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
              <span style={{ display:"none", fontSize:sz*0.3, fontWeight:700, color:t.color, fontFamily:F.main, alignItems:"center", justifyContent:"center" }}>{t.abbr}</span>
            </>
          : <span style={{ fontSize:sz*0.3, fontWeight:700, color:isTBD?"rgba(255,255,255,0.2)":t.color, fontFamily:F.main }}>{isTBD?"?":t.abbr}</span>
        }
      </div>
      <span style={{ fontSize:size==="lg"?14:11, fontWeight:700, color:isTBD?"rgba(255,255,255,0.2)":C.white, fontFamily:F.main, letterSpacing:1, textTransform:"uppercase" }}>{name||"TBD"}</span>
    </div>
  );
}

// ─── BRACKET MATCH CARD ───────────────────────────────────────────────────────
// A real component so the logo's error state is a legal hook rather than a
// useState called inside a render callback.
function BracketTeamRow({ name, score, isWinner, isPick, hasResult, tbdCard, last, chip = 24, nameSize = 14, pickLabel = "Your pick" }) {
  const [imgErr, setImgErr] = useState(false);
  const tbd = isTBDTeam(name);
  const t = teamStyle(name);
  const lost = hasResult && !isWinner;
  return (
    <div style={{
      padding:"9px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
      borderTop: last ? `1px ${tbdCard ? "dashed" : "solid"} ${C.lineSoft}` : "none",
      background: isWinner ? "rgba(200,168,106,0.06)" : "transparent",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
        {tbd ? (
          <div style={{ width:chip, height:chip, borderRadius:4, border:`1px dashed ${C.lineSoft}`, flexShrink:0 }} />
        ) : (
          <div style={{ width:chip, height:chip, borderRadius:4, background:t.bg, border:`1px solid ${t.color}44`,
                        display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden",
                        flexShrink:0, opacity: lost ? 0.6 : 1 }}>
            {t.logo && !imgErr
              ? <img src={t.logo} style={{ width:"88%", height:"88%", objectFit:"contain" }} onError={()=>setImgErr(true)} alt="" />
              : <span style={{ fontSize:9, fontWeight:700, color:t.color, fontFamily:F.main }}>{t.abbr}</span>}
          </div>
        )}
        <span style={{
          fontSize:nameSize, fontWeight:700, fontFamily:F.main, letterSpacing:0.2,
          color: tbd ? C.dimmer : isWinner ? C.goldLight : lost ? C.muted : C.white,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{tbd ? "TBD" : name}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
        {!hasResult && isPick && (
          <span style={{ fontSize:9, fontWeight:700, fontFamily:F.main, letterSpacing:1, color:C.gold,
                         border:"1px solid rgba(200,168,106,0.45)", borderRadius:3, padding:"3px 7px", textTransform:"uppercase" }}>{pickLabel}</span>
        )}
        {hasResult && (
          <span style={{ ...NUM, fontSize:22, fontWeight:700, fontFamily:F.main, lineHeight:1,
                         color: isWinner ? C.goldLight : C.dim }}>{score}</span>
        )}
      </div>
    </div>
  );
}

function BracketCard({ match, result, pred, onClick, isSelected, now, isAdmin }) {
  const t1 = match.team1, t2 = match.team2;
  const res = result;
  const score = pred && res ? calcScore(pred, res) : null;
  const [hover, setHover] = useState(false);
  const tbd = hasTBD(match);
  const locked = isLocked(match, now);
  const live = !res && !tbd && locked && now >= new Date(match.startTime).getTime();
  // Only a card you can still predict on reacts to the cursor.
  const predictable = !tbd && !res && !locked;
  const hovering = hover && predictable;

  // Weight maps to stakes: a dead TBD slot sinks, a decided card carries its
  // outcome hue, a live one lifts. Depth is value + one hairline, never glow.
  const border =
      tbd        ? `1px dashed ${C.lineSoft}`
    : isSelected ? `1.5px solid ${C.gold}`
    : score===3  ? "1px solid rgba(62,207,142,0.4)"
    : score===1  ? "1px solid rgba(200,168,106,0.4)"
    : live       ? "1px solid rgba(255,90,31,0.4)"
    : hovering   ? `1px solid ${C.lineStrong}`
    :              `1px solid ${C.line}`;
  const fill = tbd ? C.bgDeep : (isSelected || live || hovering) ? C.surfaceHi : C.surface;

  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{
      background: fill,
      border,
      borderRadius:5, overflow:"hidden", width:"100%", cursor: predictable ? "pointer" : "default",
      transition:"background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease",
      boxShadow: tbd ? "none"
        : isSelected ? (hover ? "0 7px 22px rgba(0,0,0,0.5)" : "0 5px 16px rgba(0,0,0,0.4)")
        : "0 1px 2px rgba(0,0,0,0.3)",
    }}>
      <div style={{ padding:"6px 12px", background: tbd ? "transparent" : "rgba(0,0,0,0.22)",
                    borderBottom:`1px ${tbd ? "dashed" : "solid"} ${C.lineSoft}`,
                    display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, minHeight:26 }}>
        <span style={{ fontSize:9, color: tbd ? C.dimmer : isSelected ? C.gold : C.dim, fontFamily:F.main,
                       fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                       whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{match.label}</span>
        {score !== null && <ScoreChip score={score} />}
        {score === null && !res && !tbd && (
          <CountdownPill lockTime={getLockTime(match).toISOString()} now={now} startTime={match.startTime} />
        )}
      </div>
      {isAdmin && !tbd && (
        <div style={{ fontSize:8, color:C.dimmer, fontFamily:"monospace", padding:"3px 12px",
                      borderBottom:`1px solid ${C.lineSoft}` }}>
          {match.startTime} · locks {fmtTime(getLockTime(match).toISOString())}
        </div>
      )}
      <BracketTeamRow name={t1} score={res?.score1} isWinner={res?.winner===t1} isPick={pred?.winner===t1} hasResult={!!res} tbdCard={tbd} />
      <BracketTeamRow name={t2} score={res?.score2} isWinner={res?.winner===t2} isPick={pred?.winner===t2} hasResult={!!res} tbdCard={tbd} last />
    </div>
  );
}

// ─── PREDICT PANEL ────────────────────────────────────────────────────────────
function PredictPanel({ match, result, pred, onPredict, onClose }) {
  const locked = isLocked(match);
  const t1TBD = isTBDTeam(match.team1), t2TBD = isTBDTeam(match.team2);
  const [s1, setS1] = useState(pred?.score1 ?? "");
  const [s2, setS2] = useState(pred?.score2 ?? "");

  useEffect(() => { setS1(pred?.score1??""); setS2(pred?.score2??""); }, [pred?.score1, pred?.score2]);

  const save = (winner, a, b) => onPredict(match.id, { winner, score1:numOrNull(a), score2:numOrNull(b) });

  // Typing the winning score is the pick — no second step. Saves without closing
  // so the loser's score can still be filled in.
  const onScore = (side, raw) => {
    const [a, b] = applyScore(match, side, raw, s1, s2);
    setS1(a); setS2(b);
    const w = impliedWinner(match, a, b);
    if (w) save(w, a, b);
  };

  // Explicit pick still works (winner-only predictions are worth a point). If it
  // contradicts a decided scoreline, flip the scores rather than storing a
  // prediction whose winner and score disagree.
  const pickWinner = (team) => {
    let a = s1, b = s2;
    const w = impliedWinner(match, a, b);
    if (w && w !== team) { [a, b] = [b, a]; setS1(a); setS2(b); }
    save(team, a, b);
    onClose();
  };

  const cap = maxWins(match);
  const liveWinner = impliedWinner(match, s1, s2) || pred?.winner || null;

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.lineStrong}`, borderRadius:8, padding:"18px 20px", marginTop:12, maxWidth:520 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, fontFamily:F.main, color:C.white, letterSpacing:1, textTransform:"uppercase" }}>{match.group?`Group ${match.group} · `:""}{match.label} — Bo{match.bo}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16 }}>✕</button>
      </div>
      <div style={{ fontSize:10, color:C.dim, fontFamily:F.main, letterSpacing:1, marginBottom:16 }}>
        Starts {fmtTime(match.startTime)} KSA · Locks {fmtTime(getLockTime(match).toISOString())} KSA
      </div>

      {result ? (
        <div style={{ textAlign:"center", padding:"10px 0" }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:F.main, letterSpacing:2, marginBottom:8 }}>FINAL RESULT</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
            <span style={{ fontSize:13, fontWeight:700, fontFamily:F.main, color:result.winner===match.team1?C.green:C.dim, textTransform:"uppercase" }}>{match.team1}</span>
            <span style={{ fontSize:30, fontWeight:700, fontFamily:F.main, color:C.white }}>{result.score1}–{result.score2}</span>
            <span style={{ fontSize:13, fontWeight:700, fontFamily:F.main, color:result.winner===match.team2?C.green:C.dim, textTransform:"uppercase" }}>{match.team2}</span>
          </div>
          {pred && <div style={{ marginTop:8, fontSize:11, fontFamily:F.body, color:C.muted }}>Your pick: {pred.winner} {pred.score1!=null?`(${pred.score1}–${pred.score2})`:""}</div>}
        </div>
      ) : locked ? (
        <div style={{ textAlign:"center", color:C.muted, fontFamily:F.main, fontSize:12, padding:"10px 0", letterSpacing:1 }}>🔒 PREDICTIONS LOCKED</div>
      ) : t1TBD || t2TBD ? (
        <div style={{ textAlign:"center", color:C.muted, fontFamily:F.main, fontSize:12, padding:"10px 0" }}>Teams TBD — predictions open once teams are set</div>
      ) : (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, justifyContent:"center" }}>
            <span style={{ flex:1, textAlign:"right", fontSize:12, fontWeight:700, fontFamily:F.main, letterSpacing:0.5, color:liveWinner===match.team1?C.goldLight:C.muted }}>{match.team1}</span>
            <input type="number" min={0} max={cap} value={s1} onChange={e=>onScore(1, e.target.value)} placeholder="–"
              style={{ ...inputStyle({ ...NUM, width:52, textAlign:"center", fontSize:22, fontWeight:700, padding:"6px 0",
                border:`1px solid ${liveWinner===match.team1?C.gold:"rgba(255,255,255,0.1)"}` }) }} />
            <span style={{ color:"rgba(255,255,255,0.15)", fontSize:18 }}>:</span>
            <input type="number" min={0} max={cap} value={s2} onChange={e=>onScore(2, e.target.value)} placeholder="–"
              style={{ ...inputStyle({ ...NUM, width:52, textAlign:"center", fontSize:22, fontWeight:700, padding:"6px 0",
                border:`1px solid ${liveWinner===match.team2?C.gold:"rgba(255,255,255,0.1)"}` }) }} />
            <span style={{ flex:1, textAlign:"left", fontSize:12, fontWeight:700, fontFamily:F.main, letterSpacing:0.5, color:liveWinner===match.team2?C.goldLight:C.muted }}>{match.team2}</span>
          </div>
          <div style={{ textAlign:"center", fontSize:10, fontFamily:F.main, letterSpacing:1, marginBottom:12,
                        color: impliedWinner(match, s1, s2) ? C.gold : C.dim }}>
            {impliedWinner(match, s1, s2)
              ? `${impliedWinner(match, s1, s2)} wins — saved`
              : `First to ${cap} wins the series`}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {[match.team1, match.team2].map((team)=>(
              <button key={team} onClick={()=>pickWinner(team)} style={{
                flex:1, padding:"9px 0", borderRadius:7, border:`1px solid ${liveWinner===team?C.gold:"rgba(255,255,255,0.1)"}`,
                cursor:"pointer", fontFamily:F.main, fontWeight:700, fontSize:12, letterSpacing:0.5,
                background:liveWinner===team?C.gold:"rgba(255,255,255,0.04)",
                color:liveWinner===team?"#151515":C.muted,
                transition:"background 0.12s, border-color 0.12s",
              }}>
                {team} wins
              </button>
            ))}
          </div>
          {pred && <div style={{ marginTop:8, fontSize:10, color:C.dim, fontFamily:F.main, textAlign:"center", letterSpacing:1 }}>SAVED: {pred.winner} {pred.score1!=null?`(${pred.score1}–${pred.score2})`:""}</div>}
        </div>
      )}
    </div>
  );
}

// ─── MOMENTUM STRIP ──────────────────────────────────────────────────────────
// The brief noted nothing conveyed tournament momentum. Five day nodes with the
// current day pulsing, plus a progress line. Everything is derived from match
// data and the shared clock — no new state.
const EVENT_DAYS = [
  { d: 12, label: "Aug 12", stage: "Group Stage" },
  { d: 13, label: "Aug 13", stage: "Group Stage" },
  { d: 14, label: "Aug 14", stage: "Group Stage" },
  { d: 15, label: "Aug 15", stage: "Playoffs" },
  { d: 16, label: "Aug 16", stage: "Playoffs" },
];

function MomentumStrip({ now, results, totalMatches }) {
  // Which tournament day are we on, in KSA terms?
  const ksaDay = Number(new Date(now).toLocaleDateString("en-US", { timeZone:"Asia/Riyadh", day:"numeric" }));
  const ksaMonth = Number(new Date(now).toLocaleDateString("en-US", { timeZone:"Asia/Riyadh", month:"numeric" }));
  const beforeEvent = ksaMonth < 8 || (ksaMonth === 8 && ksaDay < 12);
  const afterEvent  = ksaMonth > 8 || (ksaMonth === 8 && ksaDay > 16);
  const currentIdx  = beforeEvent ? -1 : afterEvent ? EVENT_DAYS.length : EVENT_DAYS.findIndex(x => x.d === ksaDay);

  const decided = Object.keys(results).length;
  const stage   = currentIdx >= 0 && currentIdx < EVENT_DAYS.length ? EVENT_DAYS[currentIdx].stage : null;

  const statusLine = beforeEvent
    ? <>Starts <span style={{ color:C.white, fontWeight:600 }}>Aug 12</span> — {totalMatches} matches to predict</>
    : afterEvent
      ? <>Tournament complete — <span style={{ color:C.white, fontWeight:600 }}>{decided} of {totalMatches}</span> matches decided</>
      : <>Day {currentIdx+1} of {EVENT_DAYS.length} · <span style={{ color:C.white, fontWeight:600 }}>{stage}</span> — {decided} of {totalMatches} matches decided</>;

  return (
    <div style={{ borderBottom:`1px solid ${C.lineSoft}`, background:"rgba(0,0,0,0.15)", padding:"14px 20px" }}>
      <div style={{ maxWidth:1440, margin:"0 auto", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"flex-start" }}>
          {EVENT_DAYS.map((day, i) => {
            const past    = i < currentIdx;
            const current = i === currentIdx;
            const next    = i === currentIdx + 1;
            const dot = current
              ? { width:11, height:11, background:C.gold, border:"none",
                  boxShadow:"0 0 0 3px rgba(200,168,106,0.22)", animation:"ewcPulse 1.8s ease-in-out infinite" }
              : past
                ? { width:9, height:9, background:C.gold, border:"none" }
                : { width:9, height:9, background:"transparent",
                    border:`1px ${next ? "solid" : "dashed"} ${C.lineStrong}` };
            const labelColor = current ? C.goldLight : past ? C.muted : next ? C.dim : C.dimmer;
            return (
              <div key={day.d} style={{ display:"flex", alignItems:"flex-start" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{ ...dot, borderRadius:"50%", boxSizing:"border-box" }} />
                  <span style={{ fontSize:9, fontFamily:F.main, fontWeight: current?700:600, letterSpacing:1,
                                 textTransform:"uppercase", color:labelColor, whiteSpace:"nowrap" }}>{day.label}</span>
                </div>
                {i < EVENT_DAYS.length-1 && (
                  <div style={{ width:26, height:1, margin:"0 2px 17px",
                                background: past ? C.gold : C.lineStrong, alignSelf:"center" }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ width:1, height:22, background:C.lineSoft, flexShrink:0 }} />
        <div style={{ fontSize:12, fontFamily:F.body, color:C.muted }}>{statusLine}</div>
      </div>
    </div>
  );
}

// ─── BRACKET LAYOUT PRIMITIVES ───────────────────────────────────────────────
// Load-bearing geometry — do not change without reading design/tokens.md.
// A round is a flex column of N equal flex:1 slots, so card centres land at
// (2i+1)/2N of the column height. A round with half as many slots therefore
// lands exactly on each pair's midpoint, with no hard-coded card height — which
// matters because cards grow (long names wrap, admin adds a debug line).
//
// Slots must NOT use gap: a 4-slot column accumulates three gaps where its
// 2-unit connector column accumulates one, throwing the joins off by ~2.5px.
// Symmetric slot padding spaces the cards without moving a centre.
const CARD_W     = 300;
const PO_CARD_W  = 280;   // playoffs run four columns, so QF/SF are narrower
const PO_FINAL_W = 300;
const QUALIFY_W  = 104;
const HEAD_H     = 44;

function Slot({ children, pad = 7 }) {
  return <div style={{ flex:1, display:"flex", alignItems:"center", minHeight:0, padding:`${pad}px 0` }}>{children}</div>;
}

function RoundCol({ label, sub, color, w = CARD_W, children }) {
  return (
    <div style={{ flex:`0 0 ${w}px`, width:w, display:"flex", flexDirection:"column" }}>
      <div style={{ height:HEAD_H, display:"flex", flexDirection:"column", justifyContent:"flex-end", paddingBottom:10 }}>
        {label && <span style={{ fontSize:13, fontWeight:700, color:color||C.white, fontFamily:F.main, letterSpacing:0.4, textTransform:"uppercase" }}>{label}</span>}
        {sub && <span style={{ fontSize:9, color:C.dim, fontFamily:F.main, letterSpacing:1.5, textTransform:"uppercase", marginTop:3 }}>{sub}</span>}
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>{children}</div>
    </div>
  );
}

// Joins 2N slots down to N: two in-stubs at the source centres, a vertical join
// between them, one out-stub at the midpoint.
function ElbowCol({ pairs }) {
  return (
    <div style={{ flex:1, minWidth:44, display:"flex", flexDirection:"column" }}>
      <div style={{ height:HEAD_H }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        {Array.from({ length: pairs }).map((_, i) => (
          <div key={i} style={{ flex:1, position:"relative", minHeight:0 }}>
            <div style={{ position:"absolute", left:0,     width:"50%", top:"25%", height:1, background:C.conn }} />
            <div style={{ position:"absolute", left:0,     width:"50%", top:"75%", height:1, background:C.conn }} />
            <div style={{ position:"absolute", left:"50%", width:1, top:"25%", height:"50%", background:C.conn }} />
            <div style={{ position:"absolute", left:"50%", width:"50%", top:"50%", height:1, background:C.conn }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 1:1 progression (LB round 1 → round 2, or a round → its Advance marker).
function LineCol({ count }) {
  return (
    <div style={{ flex:1, minWidth:32, display:"flex", flexDirection:"column" }}>
      <div style={{ height:HEAD_H }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ flex:1, position:"relative", minHeight:0 }}>
            <div style={{ position:"absolute", left:0, right:0, top:"50%", height:1, background:C.conn }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketBanner({ text, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, margin:"0 0 8px" }}>
      <span style={{ fontSize:11, fontWeight:700, color, fontFamily:F.main, letterSpacing:2, textTransform:"uppercase", flexShrink:0 }}>{text}</span>
      <div style={{ height:1, flex:1, background:C.lineSoft }} />
    </div>
  );
}

function QualifyTag({ settled }) {
  return (
    <div style={{ border:`1px dashed ${settled ? "rgba(200,168,106,0.4)" : C.lineSoft}`, borderRadius:4,
                  padding:"8px 10px", textAlign:"center", width:"100%",
                  background: settled ? "rgba(200,168,106,0.05)" : "transparent" }}>
      <div style={{ fontSize:9, fontWeight:700, fontFamily:F.main, color: settled ? C.gold : C.dimmer,
                    letterSpacing:1.2, textTransform:"uppercase", whiteSpace:"nowrap" }}>
        {settled ? "Qualified" : "Pending"}
      </div>
    </div>
  );
}

// Directional wash so the two halves read as different zones without a new hue.
const washStyle = (grad) => ({
  background: grad, borderRadius:10, overflowX:"auto", paddingBottom:8,
});

// ─── GROUP STAGE PAGE ────────────────────────────────────────────────────────
function GroupStagePage({ groupMatches, predictions, results, playerId, onPredict, now, isAdmin }) {
  const [grp,      setGrp]      = useState("A");
  const [view,     setView]     = useState("bracket");
  const [selected, setSelected] = useState(null);

  const matches = groupMatches.filter(m => m.group === grp);
  const byRound = (r) => matches.filter(m => m.round === r);
  const selectedMatch = groupMatches.find(m => m.id === selected);

  const cp = (m) => ({
    match: m, result: results[m.id], pred: predictions[playerId]?.[m.id],
    onClick: () => { if (isPredictable(m, results[m.id], now)) setSelected(selected === m.id ? null : m.id); },
    isSelected: selected === m.id, now, isAdmin,
  });

  const ubqf = byRound("UBQF"), ubsf = byRound("UBSF"), lbr1 = byRound("LBR1"), lbr2 = byRound("LBR2");
  const lbDay = grp === "A" ? 13 : 14;

  const pillBtn = (active) => ({
    padding:"8px 20px", borderRadius:6, cursor:"pointer", fontFamily:F.main, fontWeight:700,
    fontSize:12, letterSpacing:1, textTransform:"uppercase", transition:"background-color 0.12s",
    border: active ? "none" : `1px solid ${C.line}`,
    background: active ? GOLD_GRAD : "rgba(255,255,255,0.03)",
    color: active ? "#151515" : C.muted,
  });

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:8 }}>
          {view==="bracket" && ["A","B"].map(g => (
            <button key={g} onClick={()=>{ setGrp(g); setSelected(null); }} style={pillBtn(grp===g)}>Group {g}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:3, background:C.surface, border:`1px solid ${C.line}`, borderRadius:8, padding:3 }}>
          {[{id:"bracket",label:"Bracket"},{id:"schedule",label:"Schedule"}].map(v => (
            <button key={v.id} onClick={()=>{ setView(v.id); setSelected(null); }} style={{
              padding:"6px 18px", borderRadius:6, border:"none", cursor:"pointer",
              background:view===v.id?"rgba(200,168,106,0.16)":"transparent",
              color:view===v.id?C.gold:C.muted, fontFamily:F.main, fontWeight:700, fontSize:11,
              letterSpacing:1.5, textTransform:"uppercase" }}>{v.label}</button>
          ))}
        </div>
      </div>

      {view==="bracket" && (
        <>
          <div style={{ fontSize:10, color:C.dim, marginBottom:20, fontFamily:F.main, letterSpacing:1.5, textTransform:"uppercase" }}>
            Group {grp} · Aug 12–14 · All Bo5 · Top 4 advance · <span style={{color:C.gold}}>Click any match to predict</span>
          </div>

          <BracketBanner text="Upper Bracket" color={C.gold} />
          <div style={washStyle("radial-gradient(700px 300px at 0% 0%, rgba(200,168,106,0.07) 0%, transparent 65%)")}>
            <div style={{ display:"flex", alignItems:"stretch", minWidth:900, padding:6 }}>
              <RoundCol label="Quarter Finals" sub="Aug 12">
                {ubqf.map(m => <Slot key={m.id}><BracketCard {...cp(m)} /></Slot>)}
              </RoundCol>
              <ElbowCol pairs={2} />
              <RoundCol label="Semi Finals" sub="Aug 13">
                {ubsf.map(m => <Slot key={m.id}><BracketCard {...cp(m)} /></Slot>)}
              </RoundCol>
              <LineCol count={2} />
              <RoundCol label="Advance" w={QUALIFY_W}>
                {ubsf.map(m => <Slot key={m.id}><QualifyTag settled={!!results[m.id]} /></Slot>)}
              </RoundCol>
            </div>
          </div>

          <div style={{ height:38 }} />

          <BracketBanner text="Lower Bracket — Elimination" color={C.orange} />
          <div style={washStyle("radial-gradient(700px 300px at 0% 0%, rgba(255,90,31,0.06) 0%, transparent 65%)")}>
            <div style={{ display:"flex", alignItems:"stretch", minWidth:900, padding:6 }}>
              <RoundCol label="Round 1" sub={`Aug ${lbDay}`} color={C.orange}>
                {lbr1.map(m => <Slot key={m.id}><BracketCard {...cp(m)} /></Slot>)}
              </RoundCol>
              <LineCol count={2} />
              <RoundCol label="Round 2" sub="Aug 14" color={C.orange}>
                {lbr2.map(m => <Slot key={m.id}><BracketCard {...cp(m)} /></Slot>)}
              </RoundCol>
              <LineCol count={2} />
              <RoundCol label="Advance" w={QUALIFY_W}>
                {lbr2.map(m => <Slot key={m.id}><QualifyTag settled={!!results[m.id]} /></Slot>)}
              </RoundCol>
            </div>
          </div>

          <div style={{ fontSize:10, color:C.dim, fontFamily:F.main, letterSpacing:1.2, marginTop:16, lineHeight:1.8 }}>
            UB QF losers drop to LB Round 1 · UB SF losers drop to LB Round 2 · LB Round 1 losers are eliminated
          </div>
        </>
      )}

      {view==="schedule" && (
        <ScheduleView matches={groupMatches} results={results} predictions={predictions}
          playerId={playerId} now={now} selected={selected} onSelect={setSelected} />
      )}

      {selected && selectedMatch && playerId && (
        <PredictPanel match={selectedMatch} result={results[selected]} pred={predictions[playerId]?.[selected]}
          onPredict={onPredict} onClose={() => setSelected(null)} />
      )}
      {selected && !playerId && (
        <div style={{ textAlign:"center", color:C.muted, fontFamily:F.main, fontSize:12, marginTop:12, letterSpacing:1 }}>Log in as a player to predict</div>
      )}
    </div>
  );
}

// ─── SCHEDULE VIEW — a timeline, not a stack of cards ────────────────────────
function ScheduleFixtureSide({ name, align, dimmed }) {
  const [imgErr, setImgErr] = useState(false);
  const tbd = isTBDTeam(name);
  const t = teamStyle(name);
  const chip = tbd
    ? <div style={{ width:24, height:24, borderRadius:4, border:`1px dashed ${C.lineSoft}`, flexShrink:0 }} />
    : <div style={{ width:24, height:24, borderRadius:4, background:t.bg, border:`1px solid ${t.color}44`,
                    display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden",
                    flexShrink:0, opacity: dimmed ? 0.6 : 1 }}>
        {t.logo && !imgErr
          ? <img src={t.logo} style={{ width:"88%", height:"88%", objectFit:"contain" }} onError={()=>setImgErr(true)} alt="" />
          : <span style={{ fontSize:9, fontWeight:700, color:t.color, fontFamily:F.main }}>{t.abbr}</span>}
      </div>;
  const label = (
    <span style={{ fontSize:13, fontWeight:700, fontFamily:F.main, letterSpacing:0.2,
                   color: tbd ? C.dimmer : dimmed ? C.muted : C.white,
                   whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
      {tbd ? "TBD" : name}
    </span>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0, flex:1,
                  justifyContent: align==="right" ? "flex-end" : "flex-start" }}>
      {align==="right" ? <>{label}{chip}</> : <>{chip}{label}</>}
    </div>
  );
}

function ScheduleView({ matches, results, now, selected, onSelect }) {
  const fmtDay  = (iso) => new Date(iso).toLocaleDateString("en-US", { timeZone:"Asia/Riyadh", weekday:"long", month:"short", day:"numeric" });
  const fmtHour = (iso) => new Date(iso).toLocaleTimeString("en-US", { timeZone:"Asia/Riyadh", hour:"2-digit", minute:"2-digit", hour12:false });

  const sorted = [...matches].sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
  const days = [];
  sorted.forEach(m => {
    const d = fmtDay(m.startTime);
    const last = days[days.length-1];
    if (!last || last.day !== d) days.push({ day:d, matches:[m] }); else last.matches.push(m);
  });

  return (
    <div>
      {days.map(d => (
        <div key={d.day} style={{ marginBottom:26 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.white, fontFamily:F.main, letterSpacing:2, textTransform:"uppercase", flexShrink:0 }}>{d.day}</span>
            <div style={{ height:1, flex:1, background:C.lineSoft }} />
            <span style={{ fontSize:9, color:C.dim, fontFamily:F.main, letterSpacing:1.5, textTransform:"uppercase", flexShrink:0 }}>
              {d.matches.length} matches · KSA
            </span>
          </div>

          {d.matches.map((m, i) => {
            const res    = results[m.id];
            const locked = isLocked(m, now);
            const live   = !res && locked && now >= new Date(m.startTime).getTime();
            const msLeft = getLockTime(m).getTime() - now;
            const urgent = !locked && msLeft < 3600000;
            const isSel  = selected === m.id;

            const statusWord  = res ? "Final" : live ? "Live" : locked ? "Locked" : urgent ? "Locking" : "Upcoming";
            const statusColor = res ? C.green : live ? C.orange : urgent ? C.red : C.muted;
            const timeColor   = res ? C.white : live ? C.orange : urgent ? C.red : C.white;

            return (
              <div key={m.id}
                onClick={()=>{ if(isPredictable(m, res, now)) onSelect(isSel ? null : m.id); }}
                style={{ display:"flex", gap:12, padding:"12px 0", cursor: isPredictable(m, res, now) ? "pointer" : "default",
                         borderBottom: i === d.matches.length-1 ? "none" : `1px solid ${C.lineSoft}` }}>
                <div style={{ width:64, flexShrink:0, textAlign:"right" }}>
                  <div style={{ ...NUM, fontSize:16, fontWeight:700, fontFamily:F.main, color:timeColor, lineHeight:1.2 }}>
                    {fmtHour(m.startTime)}
                  </div>
                  <div style={{ fontSize:9, fontWeight:700, fontFamily:F.main, letterSpacing:1,
                                textTransform:"uppercase", color:statusColor, marginTop:3 }}>
                    {statusWord}
                  </div>
                </div>
                <div style={{ width:1, background:C.lineSoft, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, fontFamily:F.main, fontWeight:700, letterSpacing:1,
                                textTransform:"uppercase", color: isSel ? C.gold : C.dim, marginBottom:6 }}>
                    {m.group?`Group ${m.group} · `:""}{m.label} · Bo{m.bo||5}{isSel?" · Selected":""}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"space-between" }}>
                    <ScheduleFixtureSide name={m.team1} align="left" dimmed={!!res && res.winner!==m.team1} />
                    {res ? (
                      <span style={{ ...NUM, fontSize:15, fontWeight:700, fontFamily:F.main, color:C.goldLight, flexShrink:0 }}>
                        {res.score1} – {res.score2}
                      </span>
                    ) : (
                      <span style={{ fontSize:12, fontFamily:F.main, color:C.dim, flexShrink:0 }}>vs</span>
                    )}
                    <ScheduleFixtureSide name={m.team2} align="right" dimmed={!!res && res.winner!==m.team2} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── PLAYOFFS BRACKET PAGE ───────────────────────────────────────────────────
// The Grand Final is the one card allowed extra weight: a gold top edge marks
// the terminal match without resorting to glow.
function FinalCard({ match, result, pred, onClick, isSelected, now, headerLabel, accent, nameSize, chip }) {
  const res = result;
  const score = pred && res ? calcScore(pred, res) : null;
  const tbd = hasTBD(match);
  return (
    <div onClick={onClick} style={{
      background: C.surfaceHi,
      borderTop: `2px solid ${accent}`,
      borderLeft:`1px solid ${isSelected ? C.gold : C.line}`,
      borderRight:`1px solid ${isSelected ? C.gold : C.line}`,
      borderBottom:`1px solid ${isSelected ? C.gold : C.line}`,
      borderRadius:5, overflow:"hidden", width:"100%", cursor: tbd ? "default" : "pointer",
      boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
      transition:"border-color 0.12s",
    }}>
      <div style={{ padding:"8px 14px", background:"rgba(200,168,106,0.08)", borderBottom:`1px solid ${C.lineSoft}`,
                    display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:10, fontWeight:700, fontFamily:F.main, color:accent, letterSpacing:1.5, textTransform:"uppercase" }}>
          {headerLabel}
        </span>
        {score !== null && <ScoreChip score={score} />}
        {score === null && !res && !tbd && (
          <CountdownPill lockTime={getLockTime(match).toISOString()} now={now} startTime={match.startTime} />
        )}
      </div>
      <div style={{ padding:"3px 0" }}>
        <div style={{ padding:"9px 14px" }}>
          <BracketTeamRow name={match.team1} score={res?.score1} isWinner={res?.winner===match.team1}
            isPick={pred?.winner===match.team1} hasResult={!!res} tbdCard={tbd} chip={chip} nameSize={nameSize} />
        </div>
        <div style={{ padding:"9px 14px" }}>
          <BracketTeamRow name={match.team2} score={res?.score2} isWinner={res?.winner===match.team2}
            isPick={pred?.winner===match.team2} hasResult={!!res} tbdCard={tbd} chip={chip} nameSize={nameSize} last />
        </div>
      </div>
    </div>
  );
}

function PlayoffsPage({ playoffMatches, predictions, results, playerId, onPredict, now, isAdmin }) {
  const [selected, setSelected] = useState(null);
  const byRound = (r) => playoffMatches.filter(m => m.round === r);
  const selectedMatch = playoffMatches.find(m => m.id === selected);

  const cp = (m) => ({
    match: m, result: results[m.id], pred: predictions[playerId]?.[m.id],
    onClick: () => { if (isPredictable(m, results[m.id], now)) setSelected(selected === m.id ? null : m.id); },
    isSelected: selected === m.id, now, isAdmin,
  });

  const qf = byRound("QF"), sf = byRound("SF"), gf = byRound("GF"), third = byRound("3RD");

  return (
    <div>
      <div style={{ fontSize:10, color:C.dim, marginBottom:20, fontFamily:F.main, letterSpacing:1.5, textTransform:"uppercase" }}>
        Playoffs · Aug 15–16 · Single elimination · All Bo7 · <span style={{color:C.gold}}>Click any match to predict</span>
      </div>

      <div style={washStyle("radial-gradient(900px 400px at 100% 0%, rgba(200,168,106,0.08) 0%, transparent 60%)")}>
        <div style={{ display:"flex", alignItems:"stretch", minWidth:1100, padding:6 }}>
          <RoundCol label="Quarter Finals" sub="Aug 15" w={PO_CARD_W}>
            {qf.map(m => <Slot key={m.id} pad={6}><BracketCard {...cp(m)} /></Slot>)}
          </RoundCol>
          <ElbowCol pairs={2} />
          <RoundCol label="Semi Finals" sub="Aug 16" w={PO_CARD_W}>
            {sf.map(m => <Slot key={m.id} pad={6}><BracketCard {...cp(m)} /></Slot>)}
          </RoundCol>
          <ElbowCol pairs={1} />
          <div style={{ flex:`0 0 ${PO_FINAL_W}px`, width:PO_FINAL_W, display:"flex", flexDirection:"column" }}>
            <div style={{ height:HEAD_H, display:"flex", flexDirection:"column", justifyContent:"flex-end", paddingBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.white, fontFamily:F.main, letterSpacing:0.4, textTransform:"uppercase" }}>Final</span>
              <span style={{ fontSize:9, color:C.dim, fontFamily:F.main, letterSpacing:1.5, textTransform:"uppercase", marginTop:3 }}>Aug 16</span>
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:14 }}>
              {gf.map(m => (
                <FinalCard key={m.id} {...cp(m)} headerLabel={`Grand Final · Bo${m.bo||7}`} accent={C.gold} nameSize={17} chip={28} />
              ))}
              {third.map(m => (
                <FinalCard key={m.id} {...cp(m)} headerLabel={`3rd Place Match · Bo${m.bo||7}`} accent={C.orange} nameSize={13} chip={24} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {selected && selectedMatch && playerId && (
        <PredictPanel match={selectedMatch} result={results[selected]} pred={predictions[playerId]?.[selected]}
          onPredict={onPredict} onClose={() => setSelected(null)} />
      )}
      {selected && !playerId && (
        <div style={{ textAlign:"center", color:C.muted, fontFamily:F.main, fontSize:12, marginTop:12, letterSpacing:1 }}>Log in as a player to predict</div>
      )}
    </div>
  );
}

// ─── MATCH CARD (Group Stage) ─────────────────────────────────────────────────
function MatchCard({ match, playerId, predictions, results, onPredict, onSetResult, isAdmin, readOnly, now }) {
  const pred   = predictions[playerId]?.[match.id];
  const result = results[match.id];
  const locked = isLocked(match, now);
  const tbd    = hasTBD(match);
  const score  = (pred && result) ? calcScore(pred, result) : null;
  const [s1,  setS1]  = useState(pred?.score1??"");
  const [s2,  setS2]  = useState(pred?.score2??"");
  const [as1, setAs1] = useState(result?.score1??"");
  const [as2, setAs2] = useState(result?.score2??"");
  const [hovered, setHovered] = useState(false);

  useEffect(()=>{ setS1(pred?.score1??""); setS2(pred?.score2??""); },[pred?.score1,pred?.score2]);
  useEffect(()=>{ setAs1(result?.score1??""); setAs2(result?.score2??""); },[result?.score1,result?.score2]);

  const cap = maxWins(match);

  // Reaching the winning score is the pick — same rule as the bracket panel.
  const onScore = (side, raw) => {
    const [a, b] = applyScore(match, side, raw, s1, s2);
    setS1(a); setS2(b);
    const w = impliedWinner(match, a, b);
    if (w) onPredict(match.id, { winner:w, score1:numOrNull(a), score2:numOrNull(b) });
  };
  const submitPred = (winner) => {
    let a = s1, b = s2;
    const w = impliedWinner(match, a, b);
    if (w && w !== winner) { [a, b] = [b, a]; setS1(a); setS2(b); }
    onPredict(match.id, { winner, score1:numOrNull(a), score2:numOrNull(b) });
  };

  // Admin result entry obeys the same series length, so an impossible scoreline
  // like a 5–2 Bo5 can't be recorded.
  const onAdminScore = (side, raw) => {
    const [a, b] = applyScore(match, side, raw, as1, as2);
    setAs1(a); setAs2(b);
  };
  const submitResult=()=>{ const n1=parseInt(as1),n2=parseInt(as2); if(isNaN(n1)||isNaN(n2)||n1===n2)return; onSetResult(match.id,{winner:n1>n2?match.team1:match.team2,score1:n1,score2:n2}); };

  const liveWinner = impliedWinner(match, s1, s2) || pred?.winner || null;

  const borderColor = score===3 ? "rgba(19,196,111,0.4)" : score===1 ? "rgba(190,158,89,0.4)" : score===0&&result ? "rgba(140,140,140,0.3)" : hovered ? "rgba(15,88,244,0.4)" : "rgba(255,255,255,0.08)";
  const glowShadow  = score===3 ? "0 0 15px rgba(19,196,111,0.2)" : score===1 ? "0 0 15px rgba(190,158,89,0.15)" : hovered && !result ? "0 0 20px rgba(15,88,244,0.15)" : "none";

  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{ background:C.surface, border:`1px solid ${borderColor}`, borderRadius:8, padding:"14px 16px", position:"relative", transition:"all 0.2s", boxShadow:glowShadow }}
    >
      {/* Score badge / countdown pill */}
      {score!==null&&<div style={{ position:"absolute",top:10,right:10,borderRadius:5,padding:"2px 9px",background:score===3?C.green:score===1?C.red:"rgba(140,140,140,0.4)",color:score===1?C.white:"#000",fontWeight:700,fontSize:11,fontFamily:F.main,letterSpacing:1 }}>+{score} PTS</div>}
      {score===null&&!result&&!isAdmin&&!readOnly&&!tbd&&<div style={{ position:"absolute",top:10,right:10 }}><CountdownPill lockTime={getLockTime(match).toISOString()} now={now} startTime={match.startTime} /></div>}

      {/* Match info */}
      <div style={{ fontSize:10,color:C.muted,marginBottom:2,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase" }}>
        {match.group?`Group ${match.group} · `:""}{match.label?`${match.label} · `:""}Bo{match.bo||5} · Starts {fmtTime(match.startTime)} KSA · Locks {fmtTime(getLockTime(match).toISOString())} KSA
      </div>
      {isAdmin&&<div style={{ fontSize:9,color:"rgba(255,100,0,0.6)",fontFamily:"monospace",letterSpacing:0,marginBottom:8 }}>⚙ UTC: {match.startTime}</div>}

      {/* Teams row */}
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <div style={{ flex:1 }}><TeamBadge name={match.team1} /></div>
        {result?(
          <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"4px 14px",flexShrink:0 }}>
            <span style={{ fontSize:22,fontWeight:700,fontFamily:F.main,color:result.winner===match.team1?C.green:C.dim }}>{result.score1}</span>
            <span style={{ color:"rgba(255,255,255,0.08)" }}>:</span>
            <span style={{ fontSize:22,fontWeight:700,fontFamily:F.main,color:result.winner===match.team2?C.green:C.dim }}>{result.score2}</span>
          </div>
        ):(
          <div style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0 }}>
            {!locked&&playerId&&!readOnly&&!tbd?(
              <>
                <input type="number" min={0} max={cap} value={s1} onChange={e=>onScore(1, e.target.value)} placeholder="–"
                  style={{ ...inputStyle({ ...NUM, width:38, textAlign:"center", fontSize:16, fontWeight:700, padding:"4px 0",
                    border:`1px solid ${liveWinner===match.team1?C.gold:"rgba(255,255,255,0.1)"}` }) }} />
                <span style={{ color:"rgba(255,255,255,0.08)" }}>:</span>
                <input type="number" min={0} max={cap} value={s2} onChange={e=>onScore(2, e.target.value)} placeholder="–"
                  style={{ ...inputStyle({ ...NUM, width:38, textAlign:"center", fontSize:16, fontWeight:700, padding:"4px 0",
                    border:`1px solid ${liveWinner===match.team2?C.gold:"rgba(255,255,255,0.1)"}` }) }} />
              </>
            ):(
              <span style={{ color:"rgba(255,255,255,0.08)",fontFamily:F.main,fontSize:14,padding:"0 8px" }}>vs</span>
            )}
          </div>
        )}
        <div style={{ flex:1,display:"flex",justifyContent:"flex-end" }}><TeamBadge name={match.team2} /></div>
      </div>

      {/* TBD note */}
      {tbd&&!result&&(
        <div style={{ marginTop:8,fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:1 }}>
          TEAMS TBD — PREDICTIONS OPEN ONCE THE BRACKET FILLS IN
        </div>
      )}

      {/* Win buttons */}
      {!locked&&!result&&playerId&&!readOnly&&!tbd&&(
        <div style={{ display:"flex",gap:6,marginTop:10 }}>
          {[match.team1, match.team2].map((team)=>(
            <button key={team} onClick={()=>submitPred(team)} style={{
              flex:1, padding:"7px 0", borderRadius:7, cursor:"pointer", fontFamily:F.main, fontWeight:700, fontSize:11, letterSpacing:1, textTransform:"uppercase", transition:"all 0.15s",
              background:liveWinner===team?C.gold:"rgba(255,255,255,0.04)",
              border:`1px solid ${liveWinner===team?C.gold:"rgba(255,255,255,0.1)"}`,
              color:liveWinner===team?"#151515":C.muted,
            }}>{team} wins</button>
          ))}
        </div>
      )}

      {pred&&!result&&!readOnly&&(
        <div style={{ marginTop:8,fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:1 }}>
          YOUR PICK: <span style={{ color:C.muted }}>{pred.winner}{pred.score1!=null?` (${pred.score1}–${pred.score2})`:""}</span>
        </div>
      )}

      {readOnly&&pred&&(
        <div style={{ marginTop:10,display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1 }}>PREDICTION:</div>
          <div style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"3px 10px",fontSize:12,fontFamily:F.main,fontWeight:700,
            color:result?(calcScore(pred,result)===3?C.green:calcScore(pred,result)===1?C.red:"rgba(255,255,255,0.3)"):C.muted }}>
            {pred.winner}{pred.score1!=null?` · ${pred.score1}–${pred.score2}`:""}
          </div>
          {result&&<div style={{ fontSize:10,fontFamily:F.main,color:C.dim,letterSpacing:1 }}>{calcScore(pred,result)===3?"✓ EXACT":calcScore(pred,result)===1?"✓ WINNER":"✗ WRONG"}</div>}
        </div>
      )}

      {/* Admin result setter */}
      {isAdmin&&!tbd&&(
        <div style={{ marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
          <span style={{ fontSize:10,color:result?C.red:C.muted,fontFamily:F.main,letterSpacing:1 }}>{result?"✎ EDIT:":"SET:"}</span>
          <input type="number" min={0} max={cap} value={as1} onChange={e=>onAdminScore(1, e.target.value)} placeholder="T1"
            style={{ ...inputStyle({ width:42, fontSize:13, padding:"4px 6px", border:`1px solid ${result?"rgba(190,158,89,0.4)":"rgba(255,255,255,0.1)"}` }) }} />
          <span style={{ color:"rgba(255,255,255,0.1)" }}>–</span>
          <input type="number" min={0} max={cap} value={as2} onChange={e=>onAdminScore(2, e.target.value)} placeholder="T2"
            style={{ ...inputStyle({ width:42, fontSize:13, padding:"4px 6px", border:`1px solid ${result?"rgba(190,158,89,0.4)":"rgba(255,255,255,0.1)"}` }) }} />
          <button onClick={submitResult} style={{ padding:"5px 12px",borderRadius:5,border:"none",cursor:"pointer",background:GOLD_GRAD,color:"#151515",fontFamily:F.main,fontWeight:700,fontSize:11,letterSpacing:1 }}>{result?"UPDATE ✓":"SET ✓"}</button>
          {result&&<button onClick={()=>onSetResult(match.id,null)} style={{ padding:"5px 10px",borderRadius:5,border:`1px solid rgba(244,15,48,0.35)`,cursor:"pointer",background:"rgba(244,15,48,0.1)",color:C.red,fontFamily:F.main,fontWeight:700,fontSize:11 }}>CLEAR ✕</button>}
        </div>
      )}
    </div>
  );
}

// ─── BONUS POINTS PANEL ───────────────────────────────────────────────────────
function BonusPointsPanel({ players, bonusPoints, onAdd, onDelete }) {
  const [sel,    setSel]    = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error,  setError]  = useState("");
  const getBonusTotal = (pid) => bonusPoints.filter(b=>b.player_id===pid).reduce((t,b)=>t+b.amount,0);
  const handleAdd = () => {
    const amt=parseInt(amount);
    if (!sel){setError("Select a player");return;}
    if (isNaN(amt)||amt===0){setError("Enter a non-zero number");return;}
    onAdd(sel,amt,reason.trim()); setAmount(""); setReason(""); setError("");
  };
  return (
    <div>
      <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.gold,letterSpacing:2,marginBottom:6,textTransform:"uppercase" }}>⭐ Bonus / Penalty Points</div>
      <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:16 }}>Use negative numbers to deduct points (e.g. -5).</div>
      <div style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px",marginBottom:20 }}>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end" }}>
          <div style={{ flex:1,minWidth:130 }}>
            <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,marginBottom:4,letterSpacing:1 }}>PLAYER</div>
            <select value={sel} onChange={e=>setSel(e.target.value)}
              style={{ ...inputStyle({ width:"100%", padding:"9px 10px", fontSize:13, cursor:"pointer", appearance:"none" }) }}>
              <option value="">— Select —</option>
              {players.map(p=><option key={p.id} value={p.id}>{p.nickname}</option>)}
            </select>
          </div>
          <div style={{ width:90 }}>
            <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,marginBottom:4,letterSpacing:1 }}>POINTS</div>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="+5 or -3"
              style={{ ...inputStyle({ width:"100%", padding:"9px 10px", fontSize:14, fontWeight:700, boxSizing:"border-box", color:parseInt(amount)<0?C.red:parseInt(amount)>0?C.green:C.white }) }} />
          </div>
          <div style={{ flex:2,minWidth:150 }}>
            <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,marginBottom:4,letterSpacing:1 }}>REASON (optional)</div>
            <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Tiebreaker bonus" onKeyDown={e=>e.key==="Enter"&&handleAdd()}
              style={{ ...inputStyle({ width:"100%", padding:"9px 10px", fontSize:13, boxSizing:"border-box" }) }} />
          </div>
          <button onClick={handleAdd} style={{ padding:"9px 18px",background:GOLD_GRAD,border:"none",borderRadius:7,cursor:"pointer",color:"#151515",fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:1 }}>ADD ✓</button>
        </div>
        {error&&<div style={{ color:C.red,fontSize:11,fontFamily:F.main,marginTop:8,letterSpacing:1 }}>⚠ {error}</div>}
      </div>
      {players.map(p=>{
        const myBonus=bonusPoints.filter(b=>b.player_id===p.id); const total=getBonusTotal(p.id);
        if(myBonus.length===0)return null;
        return (
          <div key={p.id} style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
              <div style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:C.white }}>{p.nickname}</div>
              <div style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:total>0?C.green:total<0?C.red:C.muted }}>{total>0?"+":""}{total} bonus pts</div>
            </div>
            {myBonus.map(b=>(
              <div key={b.id} style={{ display:"flex",alignItems:"center",gap:10,paddingTop:6,borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,width:42,textAlign:"center",color:b.amount>0?C.green:C.red }}>{b.amount>0?"+":""}{b.amount}</div>
                <div style={{ flex:1,fontSize:12,color:C.muted,fontFamily:F.body }}>{b.reason||<span style={{ color:C.dim,fontStyle:"italic" }}>No reason</span>}</div>
                <button onClick={()=>onDelete(b.id)} style={{ background:"rgba(244,15,48,0.1)",border:"1px solid rgba(244,15,48,0.35)",borderRadius:5,color:C.red,fontFamily:F.main,fontWeight:700,fontSize:10,padding:"3px 8px",cursor:"pointer" }}>✕</button>
              </div>
            ))}
          </div>
        );
      })}
      {bonusPoints.length===0&&<div style={{ textAlign:"center",color:C.dim,padding:30,fontFamily:F.main,fontSize:12,letterSpacing:1 }}>No adjustments yet</div>}
    </div>
  );
}

// ─── BRACKET TEAM EDITOR (Admin) — group-stage progression + playoffs ────────
function BracketEditor({ matches, onUpdateTeams, onSaved }) {
  const [teams, setTeams] = useState(() => {
    const map = {};
    matches.forEach(m => { map[m.id] = { team1: m.team1, team2: m.team2 }; });
    return map;
  });
  useEffect(() => {
    const map = {};
    matches.forEach(m => { map[m.id] = { team1: m.team1, team2: m.team2 }; });
    setTeams(map);
  }, [matches.map(m=>m.team1+m.team2).join()]);

  const save = async () => {
    for (const m of matches) {
      const t = teams[m.id];
      if (t.team1 !== m.team1 || t.team2 !== m.team2) {
        await onUpdateTeams(m.id, t.team1||"TBD", t.team2||"TBD");
      }
    }
    onSaved?.();
  };

  const sectionOf = (m) => m.group ? `Group ${m.group}` : "Playoffs";
  const rows = matches.map((m, i) => ({ m, header: i === 0 || sectionOf(m) !== sectionOf(matches[i-1]) ? sectionOf(m) : null }));

  return (
    <div>
      <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.gold,letterSpacing:2,marginBottom:6,textTransform:"uppercase" }}>🏆 Set Bracket Team Names</div>
      <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:16 }}>
        Fill in team names as the brackets progress (start typing for suggestions). Leave as TBD if not yet decided. Hit SAVE ALL when done.
      </div>
      <datalist id="ewc-teams">
        {Object.keys(TEAMS).map(t=><option key={t} value={t} />)}
        <option value="TBD" />
      </datalist>
      {rows.map(({m, header})=>{
        return (
        <div key={m.id}>
          {header&&(
            <div style={{ display:"flex",alignItems:"center",gap:10,margin:"18px 0 10px" }}>
              <span style={{ fontSize:11,fontWeight:700,color:C.blue,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase",flexShrink:0 }}>{header}</span>
              <div style={{ height:1,flex:1,background:"rgba(15,88,244,0.2)" }} />
            </div>
          )}
          <div style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 16px",marginBottom:10 }}>
            <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{m.label} · {fmtTime(m.startTime)} KSA</div>
            <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
              <input value={teams[m.id]?.team1||""} onChange={e=>setTeams(t=>({...t,[m.id]:{...t[m.id],team1:e.target.value}}))}
                placeholder="Team 1 (or TBD)" list="ewc-teams"
                style={{ ...inputStyle({ flex:1, minWidth:140, padding:"8px 12px", fontSize:13 }) }} />
              <span style={{ color:C.dim,fontFamily:F.main,fontWeight:700 }}>vs</span>
              <input value={teams[m.id]?.team2||""} onChange={e=>setTeams(t=>({...t,[m.id]:{...t[m.id],team2:e.target.value}}))}
                placeholder="Team 2 (or TBD)" list="ewc-teams"
                style={{ ...inputStyle({ flex:1, minWidth:140, padding:"8px 12px", fontSize:13 }) }} />
            </div>
          </div>
        </div>
        );
      })}
      <button onClick={save} style={{ width:"100%",padding:12,background:GOLD_GRAD,border:"none",borderRadius:10,cursor:"pointer",color:"#151515",fontFamily:F.main,fontWeight:700,fontSize:14,marginTop:8,letterSpacing:2,textTransform:"uppercase" }}>
        Save All Team Names ✓
      </button>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const NICK_RE = /^[a-zA-Z0-9_]{3,20}$/;

const pwStrength = (pw) => {
  if (!pw || pw.length < 8) return { label:"Weak",   color:C.red,     pct:"33%" };
  const complex = /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9!@#$%^&*_\-]/.test(pw);
  if (pw.length >= 12 && complex)  return { label:"Strong", color:C.green,   pct:"100%" };
  return                                  { label:"Medium", color:"#FF8C00", pct:"66%" };
};

function FieldErr({ msg }) {
  if (!msg) return null;
  return <div style={{ color:C.red, fontSize:11, fontFamily:F.main, marginTop:3, letterSpacing:0.5 }}>⚠ {msg}</div>;
}

function PwToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>
      {show ? "🙈" : "👁"}
    </button>
  );
}

// Admin login: compare entered password hash against adminHash from Supabase app_settings
function LoginScreen({ players, onLogin, onAdminLogin, adminHash }) {
  const [tab, setTab] = useState("register");

  // ── Register state ──
  const [regUser,      setRegUser]      = useState("");
  const [regPass,      setRegPass]      = useState("");
  const [regConfirm,   setRegConfirm]   = useState("");
  const [regShowP,     setRegShowP]     = useState(false);
  const [regShowC,     setRegShowC]     = useState(false);
  const [regGroup,     setRegGroup]     = useState(false);
  const [regGCode,     setRegGCode]     = useState("");
  const [regGPass,     setRegGPass]     = useState("");
  const [avail,        setAvail]        = useState(null); // null|"checking"|"available"|"taken"
  const [regErrs,      setRegErrs]      = useState({});
  const [regLoading,   setRegLoading]   = useState(false);
  const [regMsg,       setRegMsg]       = useState(null); // {ok, text}

  // ── Login state ──
  const [loginUser,    setLoginUser]    = useState("");
  const [loginPass,    setLoginPass]    = useState("");
  const [loginShowP,   setLoginShowP]   = useState(false);
  const [loginErr,     setLoginErr]     = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Admin state ──
  const [adminPass,    setAdminPass]    = useState("");
  const [adminShowP,   setAdminShowP]   = useState(false);
  const [adminErr,     setAdminErr]     = useState("");

  // ── Debounced availability check ──
  useEffect(() => {
    if (!NICK_RE.test(regUser.trim())) { setAvail(null); return; }
    setAvail("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase.from("players").select("id").ilike("nickname", regUser.trim()).limit(1);
      setAvail(data?.length ? "taken" : "available");
    }, 500);
    return () => clearTimeout(t);
  }, [regUser]);

  // ── Rate limit (3 attempts per 10 min) ──
  const RL_KEY = "rlcs_reg_attempts";
  const [rlCountdown, setRlCountdown] = useState(0);

  const getRlData = () => {
    try { return JSON.parse(localStorage.getItem(RL_KEY) || "null"); } catch { return null; }
  };
  const checkRateLimit = () => {
    const now = Date.now();
    const d = getRlData();
    if (!d || now - d.firstAttempt >= 600000) return null;
    if (d.count >= 3) {
      const secsLeft = Math.ceil((d.firstAttempt + 600000 - now) / 1000);
      return secsLeft > 0 ? secsLeft : null;
    }
    return null;
  };
  const recordAttempt = () => {
    const now = Date.now();
    const d = getRlData();
    if (!d || now - d.firstAttempt >= 600000) {
      localStorage.setItem(RL_KEY, JSON.stringify({ count:1, firstAttempt:now }));
    } else {
      localStorage.setItem(RL_KEY, JSON.stringify({ count:d.count+1, firstAttempt:d.firstAttempt }));
    }
  };
  const resetAttempts = () => localStorage.removeItem(RL_KEY);

  // Live countdown timer
  useEffect(() => {
    const secs = checkRateLimit();
    if (!secs) { setRlCountdown(0); return; }
    setRlCountdown(secs);
    const iv = setInterval(() => {
      const s = checkRateLimit();
      if (!s) { setRlCountdown(0); clearInterval(iv); }
      else setRlCountdown(s);
    }, 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Register submit ──
  const handleRegister = async () => {
    const errs = {};
    const nick = regUser.trim();
    if (!NICK_RE.test(nick))                           errs.user    = "3–20 chars, letters/numbers/underscores only.";
    else if (avail === "taken")                        errs.user    = "Username already taken.";
    else if (avail !== "available")                    errs.user    = "Wait for availability check.";
    if (regPass.length < 8)                            errs.pass    = "Password must be at least 8 characters.";
    if (regPass !== regConfirm)                        errs.confirm = "Passwords do not match.";
    if (regGroup && !regGCode.trim())                  errs.gcode   = "Enter a group code.";
    if (regGroup && !regGPass)                         errs.gpass   = "Enter the group password.";
    if (Object.keys(errs).length) { setRegErrs(errs); return; }

    const rlSecs = checkRateLimit();
    if (rlSecs) { setRegMsg({ ok:false, text:`Too many attempts. Try again in ${Math.ceil(rlSecs/60)} min.` }); return; }

    setRegLoading(true); setRegErrs({}); setRegMsg(null);
    try {
      const hash = await hashPassword(regPass);
      let group_id = "public";

      if (regGroup) {
        const { data:grp } = await supabase.from("groups").select("*").ilike("id", regGCode.trim()).single();
        if (!grp) { setRegErrs({ gcode:"Group not found." }); setRegLoading(false); return; }
        const gHash = await hashPassword(regGPass);
        if (gHash !== grp.password_hash) { setRegErrs({ gpass:"Wrong group password." }); setRegLoading(false); return; }
        group_id = grp.id;
      }

      recordAttempt();
      const id  = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const { error } = await supabase.from("players").insert({ id, nickname:nick, password_hash:hash, group_id, joined_at:now, last_seen:now });
      if (error) {
        if (error.code === "23505") setRegErrs({ user:"Username already taken." });
        else setRegMsg({ ok:false, text:"Registration failed: " + error.message });
        setRegLoading(false); return;
      }
      resetAttempts();
      localStorage.setItem("rlcs_auth", id);
      localStorage.removeItem("rlcs_admin");
      onLogin(id);
    } catch (e) {
      setRegMsg({ ok:false, text:"Unexpected error: " + e.message });
      setRegLoading(false);
    }
  };

  // ── Login submit ──
  const handleLogin = async () => {
    setLoginErr("");
    if (!loginUser.trim() || !loginPass) { setLoginErr("Enter your username and password."); return; }
    setLoginLoading(true);
    try {
      const { data:matches } = await supabase.from("players").select("*").ilike("nickname", loginUser.trim()).limit(5);
      const player = matches?.find(p => p.nickname.toLowerCase() === loginUser.trim().toLowerCase());
      if (!player) { setLoginErr("Wrong username or password."); setLoginLoading(false); return; }
      if (player.password_hash) {
        const h = await hashPassword(loginPass);
        if (h !== player.password_hash) { setLoginErr("Wrong username or password."); setLoginLoading(false); return; }
      }
      await supabase.from("players").update({ last_seen:new Date().toISOString() }).eq("id", player.id);
      localStorage.setItem("rlcs_auth", player.id);
      localStorage.removeItem("rlcs_admin");
      onLogin(player.id);
    } catch (e) {
      setLoginErr("Login failed: " + e.message);
      setLoginLoading(false);
    }
  };

  // ── Admin submit ──
  const handleAdminLogin = async () => {
    setAdminErr("");
    const h = await hashPassword(adminPass);
    if (h === adminHash) onAdminLogin(); else setAdminErr("Wrong password.");
  };

  const str  = pwStrength(regPass);
  const TABS = [
    { id:"register", label:"📝 Register" },
    { id:"login",    label:"🎮 Login" },
    { id:"admin",    label:"⚙️ Admin" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:PAGE_BG, backgroundAttachment:"fixed", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:#121214}::-webkit-scrollbar-thumb{background:#5c4d31;border-radius:4px}@keyframes ewcPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
      {/* Streaks */}
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"15%",left:"-10%",width:600,height:3,background:"linear-gradient(90deg,transparent,rgba(190,158,89,0.45),transparent)",transform:"rotate(-35deg)",filter:"blur(8px)" }} />
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"10%",right:"-5%",width:500,height:2,background:"linear-gradient(90deg,transparent,rgba(255,54,0,0.35),transparent)",transform:"rotate(35deg)",filter:"blur(6px)" }} />
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"55%",left:"5%",width:400,height:2,background:"linear-gradient(90deg,transparent,rgba(190,158,89,0.45),transparent)",transform:"rotate(-20deg)",filter:"blur(6px)" }} />

      <div style={{ position:"relative",zIndex:1,textAlign:"center",marginBottom:32 }}>
        <div style={{ fontSize:36,fontWeight:700,fontFamily:F.main,background:`linear-gradient(90deg, ${C.white} 0%, ${C.goldLight} 55%, ${C.gold} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:4,textTransform:"uppercase" }}>EWC 2026</div>
        <div style={{ fontSize:16,fontWeight:700,fontFamily:F.main,color:"rgba(255,255,255,0.4)",letterSpacing:4,marginTop:4,textTransform:"uppercase" }}>Rocket League Predictor</div>
        <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:3,marginTop:8,textTransform:"uppercase" }}>Aug 12–16 · Riyadh · $1,000,000 · 16 Teams</div>
      </div>

      <div style={{ position:"relative",zIndex:1,background:C.surface,border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:32,width:"100%",maxWidth:400,boxShadow:"0 0 60px rgba(0,0,0,0.25)" }}>
        {/* Tabs */}
        <div style={{ display:"flex",marginBottom:24,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:4 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{ setTab(t.id); setRegErrs({}); setRegMsg(null); setLoginErr(""); setAdminErr(""); }}
              style={{ flex:1,padding:"8px 0",borderRadius:7,border:"none",cursor:"pointer",background:tab===t.id?"rgba(190,158,89,0.15)":"transparent",color:tab===t.id?C.gold:C.muted,fontFamily:F.main,fontWeight:700,fontSize:12,letterSpacing:0.5,transition:"all 0.15s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── REGISTER TAB ── */}
        {tab==="register"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {/* Username */}
            <div>
              <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Username</div>
              <div style={{ position:"relative" }}>
                <input value={regUser} onChange={e=>{ setRegUser(e.target.value); setRegErrs(v=>({...v,user:null})); }}
                  placeholder="e.g. rocketlord_99" maxLength={20}
                  style={{ ...inputStyle({ width:"100%", padding:"11px 100px 11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.user?"rgba(190,158,89,0.5)":"rgba(255,255,255,0.1)"}` }) }} autoFocus />
                <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:11,fontFamily:F.main,fontWeight:700,pointerEvents:"none",
                  color:avail==="available"?C.green:avail==="taken"?C.red:C.dim }}>
                  {avail==="checking"?"…":avail==="available"?"✓ Available":avail==="taken"?"✗ Taken":""}
                </div>
              </div>
              <FieldErr msg={regErrs.user} />
            </div>

            {/* Password */}
            <div>
              <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Password</div>
              <div style={{ position:"relative" }}>
                <input type={regShowP?"text":"password"} value={regPass} onChange={e=>{ setRegPass(e.target.value); setRegErrs(v=>({...v,pass:null})); }}
                  placeholder="Min 8 characters"
                  style={{ ...inputStyle({ width:"100%", padding:"11px 40px 11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.pass?"rgba(190,158,89,0.5)":"rgba(255,255,255,0.1)"}` }) }} />
                <PwToggle show={regShowP} onToggle={()=>setRegShowP(v=>!v)} />
              </div>
              {regPass&&(
                <div style={{ marginTop:5 }}>
                  <div style={{ height:3,borderRadius:2,background:"rgba(255,255,255,0.08)",overflow:"hidden" }}>
                    <div style={{ height:"100%",width:str.pct,background:str.color,transition:"all 0.3s",borderRadius:2 }} />
                  </div>
                  <div style={{ fontSize:10,color:str.color,fontFamily:F.main,marginTop:3,letterSpacing:0.5 }}>{str.label}</div>
                </div>
              )}
              <FieldErr msg={regErrs.pass} />
            </div>

            {/* Confirm password */}
            <div>
              <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Confirm Password</div>
              <div style={{ position:"relative" }}>
                <input type={regShowC?"text":"password"} value={regConfirm} onChange={e=>{ setRegConfirm(e.target.value); setRegErrs(v=>({...v,confirm:null})); }}
                  placeholder="Re-enter password"
                  style={{ ...inputStyle({ width:"100%", padding:"11px 40px 11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.confirm?"rgba(190,158,89,0.5)":"rgba(255,255,255,0.1)"}` }) }} />
                <PwToggle show={regShowC} onToggle={()=>setRegShowC(v=>!v)} />
              </div>
              <FieldErr msg={regErrs.confirm} />
            </div>

            {/* Private group toggle */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <span style={{ fontSize:12,color:C.muted,fontFamily:F.main,letterSpacing:0.5 }}>Join a private group?</span>
              <div onClick={()=>setRegGroup(v=>!v)}
                style={{ width:40,height:22,borderRadius:11,background:regGroup?"rgba(190,158,89,0.3)":"rgba(255,255,255,0.08)",border:`1px solid ${regGroup?"rgba(190,158,89,0.5)":"rgba(255,255,255,0.12)"}`,cursor:"pointer",position:"relative",transition:"all 0.2s",flexShrink:0 }}>
                <div style={{ position:"absolute",top:2,left:regGroup?18:2,width:16,height:16,borderRadius:8,background:regGroup?C.red:"rgba(255,255,255,0.35)",transition:"all 0.2s",boxShadow:regGroup?`0 0 6px ${C.red}80`:"none" }} />
              </div>
            </div>

            {/* Group fields */}
            {regGroup&&(
              <>
                <div>
                  <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Group Code</div>
                  <input value={regGCode} onChange={e=>{ setRegGCode(e.target.value); setRegErrs(v=>({...v,gcode:null})); }}
                    placeholder="e.g. squad2026"
                    style={{ ...inputStyle({ width:"100%", padding:"11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.gcode?"rgba(190,158,89,0.5)":"rgba(255,255,255,0.1)"}` }) }} />
                  <FieldErr msg={regErrs.gcode} />
                </div>
                <div>
                  <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Group Password</div>
                  <input type="password" value={regGPass} onChange={e=>{ setRegGPass(e.target.value); setRegErrs(v=>({...v,gpass:null})); }}
                    placeholder="Group password"
                    style={{ ...inputStyle({ width:"100%", padding:"11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.gpass?"rgba(190,158,89,0.5)":"rgba(255,255,255,0.1)"}` }) }} />
                  <FieldErr msg={regErrs.gpass} />
                </div>
              </>
            )}

            {regMsg&&<div style={{ fontSize:12,fontFamily:F.main,letterSpacing:0.5,color:regMsg.ok?C.green:C.red }}>{regMsg.ok?"✓":"⚠"} {regMsg.text}</div>}

            <button onClick={handleRegister} disabled={regLoading||rlCountdown>0}
              style={{ padding:"13px 0",background:(regLoading||rlCountdown>0)?"rgba(190,158,89,0.4)":GOLD_GRAD,border:"none",borderRadius:8,color:"#151515",fontWeight:700,fontFamily:F.main,fontSize:14,cursor:(regLoading||rlCountdown>0)?"default":"pointer",letterSpacing:2,textTransform:"uppercase",marginTop:2 }}>
              {regLoading?"Creating account…":rlCountdown>0?`Wait ${Math.ceil(rlCountdown/60)}m ${rlCountdown%60}s`:"Create Account →"}
            </button>
          </div>
        )}

        {/* ── LOGIN TAB ── */}
        {tab==="login"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div>
              <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Username</div>
              <input value={loginUser} onChange={e=>{ setLoginUser(e.target.value); setLoginErr(""); }}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Your username…"
                style={{ ...inputStyle({ width:"100%", padding:"11px 14px", fontSize:14, boxSizing:"border-box" }) }} autoFocus />
            </div>

            <div>
              <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Password</div>
              <div style={{ position:"relative" }}>
                <input type={loginShowP?"text":"password"} value={loginPass} onChange={e=>{ setLoginPass(e.target.value); setLoginErr(""); }}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Password…"
                  style={{ ...inputStyle({ width:"100%", padding:"11px 40px 11px 14px", fontSize:14, boxSizing:"border-box" }) }} />
                <PwToggle show={loginShowP} onToggle={()=>setLoginShowP(v=>!v)} />
              </div>
            </div>

            {loginErr&&<div style={{ color:C.red,fontSize:12,fontFamily:F.main,letterSpacing:0.5 }}>⚠ {loginErr}</div>}

            <button onClick={handleLogin} disabled={loginLoading}
              style={{ padding:"13px 0",background:loginLoading?"rgba(190,158,89,0.4)":GOLD_GRAD,border:"none",borderRadius:8,color:"#151515",fontWeight:700,fontFamily:F.main,fontSize:14,cursor:loginLoading?"default":"pointer",letterSpacing:2,textTransform:"uppercase" }}>
              {loginLoading?"Logging in…":"Let's Predict →"}
            </button>
          </div>
        )}

        {/* ── ADMIN TAB ── */}
        {tab==="admin"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div>
              <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Admin Password</div>
              <div style={{ position:"relative" }}>
                <input type={adminShowP?"text":"password"} value={adminPass} onChange={e=>{ setAdminPass(e.target.value); setAdminErr(""); }}
                  onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()} placeholder="Password…"
                  style={{ ...inputStyle({ width:"100%", padding:"11px 40px 11px 14px", fontSize:14, boxSizing:"border-box" }) }} autoFocus />
                <PwToggle show={adminShowP} onToggle={()=>setAdminShowP(v=>!v)} />
              </div>
            </div>
            {adminErr&&<div style={{ color:C.red,fontSize:12,fontFamily:F.main,letterSpacing:0.5 }}>⚠ {adminErr}</div>}
            <button onClick={handleAdminLogin}
              style={{ padding:"13px 0",background:GOLD_GRAD,border:"none",borderRadius:8,color:"#151515",fontWeight:700,fontFamily:F.main,fontSize:14,cursor:"pointer",letterSpacing:2,textTransform:"uppercase" }}>
              Login as Admin →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", background:PAGE_BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
      <div style={{ fontSize:22,fontWeight:700,fontFamily:F.main,background:`linear-gradient(90deg, ${C.white} 0%, ${C.goldLight} 55%, ${C.gold} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:4,textTransform:"uppercase" }}>EWC 2026 · Rocket League</div>
      <div style={{ width:36,height:36,border:`3px solid rgba(255,255,255,0.08)`,borderTop:`3px solid ${C.red}`,borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:C.muted,fontSize:11,fontFamily:F.main,letterSpacing:3,textTransform:"uppercase" }}>Loading…</div>
    </div>
  );
}

// ─── STANDINGS ROW — shared by the global Standings screen and My Group ──────
function StandingsRow({ p, i, isMe, groupLabel, predCount, totalMatches, tintMe }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:18,
      padding: i===0 ? "18px 20px" : "16px 20px",
      borderTop: i===0 ? "none" : `1px solid ${C.lineSoft}`,
      background: i===0 ? "linear-gradient(90deg, rgba(200,168,106,0.10), transparent)"
                : (isMe && tintMe) ? "rgba(91,140,255,0.05)" : "transparent",
      borderLeft: (isMe && tintMe) ? `2px solid ${C.blue}` : "2px solid transparent",
    }}>
      <span style={{ ...NUM, width:34, textAlign:"center", fontFamily:F.main, fontWeight:700,
                     fontSize: i===0?26:22, color: i===0?C.gold : i<3?C.muted : C.dim }}>
        {String(i+1).padStart(2,"0")}
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontFamily:F.main, fontWeight:700, fontSize: i===0?16:15, color:C.white }}>{p.nickname}</span>
          {isMe && <Badge text="You" color={C.blue} fill="rgba(91,140,255,0.15)" line="rgba(91,140,255,0.35)" />}
          {groupLabel && <Badge text={groupLabel} color={C.gold} fill="rgba(200,168,106,0.15)" line="rgba(200,168,106,0.3)" />}
        </div>
        <div style={{ fontSize:11.5, fontFamily:F.body, color:C.muted, marginTop:3 }}>
          {predCount}/{totalMatches} predicted
          {p.bonus !== 0 && <span> · {p.bonus > 0 ? "+" : "−"}{Math.abs(p.bonus)} bonus</span>}
        </div>
      </div>
      <div style={{ ...NUM, fontFamily:F.main, fontWeight:700, fontSize: i===0?28:24,
                    color: i===0?C.gold:C.white, flexShrink:0 }}>
        {p.score}<span style={{ fontSize:11, color:C.dim, marginLeft:4, letterSpacing:1 }}>PTS</span>
      </div>
    </div>
  );
}

function Badge({ text, color, fill, line }) {
  return (
    <span style={{ fontSize:9, fontWeight:700, fontFamily:F.main, letterSpacing:1, padding:"2px 7px",
                   borderRadius:3, color, background:fill, border:`1px solid ${line}`,
                   textTransform:"uppercase", whiteSpace:"nowrap" }}>{text}</span>
  );
}

function StandingsList({ rows, authId, groupLabelFor, predCountFor, totalMatches, tintMe }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.line}`, borderRadius:8, overflow:"hidden" }}>
      {rows.map((p,i) => (
        <StandingsRow key={p.id} p={p} i={i} isMe={p.id===authId} tintMe={tintMe}
          groupLabel={groupLabelFor ? groupLabelFor(p) : null}
          predCount={predCountFor(p)} totalMatches={totalMatches} />
      ))}
      {rows.length===0 && (
        <div style={{ padding:30, textAlign:"center", color:C.dim, fontFamily:F.main, fontSize:12 }}>No players yet</div>
      )}
    </div>
  );
}

// ─── MY GROUP ────────────────────────────────────────────────────────────────
function StatBlock({ n, label, color }) {
  return (
    <div>
      <div style={{ ...NUM, fontSize:30, fontWeight:700, fontFamily:F.main, color, lineHeight:1 }}>{n}</div>
      <div style={{ fontSize:9, color:C.dim, fontFamily:F.main, fontWeight:700, letterSpacing:1.3,
                    textTransform:"uppercase", marginTop:6 }}>{label}</div>
    </div>
  );
}

function MyGroupPage({ myGroup, members, rows, authId, predictions, results, allMatches, now, inviteBase }) {
  const [copied, setCopied] = useState(false);
  const [hoverCopy, setHoverCopy] = useState(false);

  const myIdx  = rows.findIndex(r => r.id === authId);
  const me     = rows[myIdx];
  const behind = myIdx > 0 && me ? rows[0].score - me.score : 0;
  const ord    = (n) => { const s=["th","st","nd","rd"], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };

  // My run so far
  const myPreds = predictions[authId] || {};
  let exact=0, winner=0, missed=0;
  allMatches.forEach(m => {
    const pr = myPreds[m.id], rs = results[m.id];
    if (!pr || !rs) return;
    const sc = calcScore(pr, rs);
    if (sc===3) exact++; else if (sc===1) winner++; else missed++;
  });
  const decided   = exact + winner + missed;
  const predCount = Object.keys(myPreds).length;
  const pct = (n) => decided ? (n / decided) * 100 : 0;

  const link = myGroup.invite_token ? `${inviteBase}/${myGroup.invite_token}` : null;

  // Breakdown: decided matches plus anything currently live
  const liveOf = (m) => !results[m.id] && isLocked(m, now) && now >= new Date(m.startTime).getTime();
  const gridRows = allMatches.filter(m => results[m.id] || liveOf(m));

  return (
    <div>
      <div style={{ fontSize:10, color:C.dim, marginBottom:20, fontFamily:F.main, letterSpacing:1.5, textTransform:"uppercase" }}>
        Private group · {members.length} member{members.length!==1?"s":""} · {gridRows.length} of {allMatches.length} matches played
      </div>

      {/* Top row */}
      <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginBottom:22 }}>
        {/* Group identity */}
        <div style={{ flex:"1 1 300px", minWidth:280, background:C.surface, borderRadius:8, padding:"18px 20px",
                      border:`1px solid ${C.line}`, borderTop:`2px solid ${C.gold}`, boxShadow:"0 1px 2px rgba(0,0,0,0.3)" }}>
          <div style={{ fontSize:9, fontWeight:700, fontFamily:F.main, color:C.gold, letterSpacing:1.8, textTransform:"uppercase" }}>Your Group</div>
          <div style={{ fontSize:26, fontWeight:700, fontFamily:F.main, color:C.white, letterSpacing:1, textTransform:"uppercase", marginTop:6 }}>{myGroup.name}</div>
          <div style={{ fontSize:12, fontFamily:F.body, color:C.muted, marginTop:6 }}>
            {me
              ? <>You're {ord(myIdx+1)} of {rows.length}{behind > 0 ? ` · ${behind} point${behind!==1?"s":""} behind the lead` : myIdx===0 ? " · leading" : ""}</>
              : <>{rows.length} member{rows.length!==1?"s":""}</>}
          </div>
          <div style={{ height:1, background:C.lineSoft, margin:"16px 0" }} />
          <div style={{ fontSize:9, fontWeight:700, fontFamily:F.main, color:C.dim, letterSpacing:1.3, textTransform:"uppercase", marginBottom:8 }}>Invite Link</div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1, minWidth:0, background:"rgba(0,0,0,0.28)", border:`1px solid ${C.line}`, borderRadius:5,
                          padding:"8px 11px", fontSize:11.5, fontFamily:F.body, color:C.muted,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {link || "No token yet — run the invite-token migration"}
            </div>
            <button disabled={!link}
              onMouseEnter={()=>setHoverCopy(true)} onMouseLeave={()=>setHoverCopy(false)}
              onClick={()=>{ if(!link) return; navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
              style={{ flexShrink:0, padding:"8px 14px", borderRadius:5, cursor: link?"pointer":"default",
                       border:`1px solid ${C.gold}`,
                       background: hoverCopy && link ? C.gold : "rgba(200,168,106,0.14)",
                       color: hoverCopy && link ? "#151515" : C.goldLight,
                       fontFamily:F.main, fontWeight:700, fontSize:11, letterSpacing:1,
                       textTransform:"uppercase", opacity: link?1:0.4,
                       transition:"background-color 0.12s ease, color 0.12s ease" }}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Your run so far */}
        <div style={{ flex:"1 1 300px", minWidth:280, background:C.surface, borderRadius:8, padding:"18px 20px",
                      border:`1px solid ${C.line}`, boxShadow:"0 1px 2px rgba(0,0,0,0.3)" }}>
          <div style={{ fontSize:9, fontWeight:700, fontFamily:F.main, color:C.dim, letterSpacing:1.8, textTransform:"uppercase" }}>Your run so far</div>
          <div style={{ display:"flex", gap:26, marginTop:14, flexWrap:"wrap" }}>
            <StatBlock n={exact}  label="Exact · +3"  color={C.green} />
            <StatBlock n={winner} label="Winner · +1" color={C.gold} />
            <StatBlock n={missed} label="Missed · 0"  color={C.muted} />
          </div>
          <div style={{ height:1, background:C.lineSoft, margin:"16px 0" }} />
          <div style={{ fontSize:9, fontWeight:700, fontFamily:F.main, color:C.dim, letterSpacing:1.3, textTransform:"uppercase", marginBottom:8 }}>
            Hit rate · {predCount} of {allMatches.length} predicted
          </div>
          <div style={{ height:7, borderRadius:4, overflow:"hidden", display:"flex", background:"rgba(255,255,255,0.05)" }}>
            <div style={{ width:`${pct(exact)}%`,  background:C.green }} />
            <div style={{ width:`${pct(winner)}%`, background:C.gold }} />
            <div style={{ width:`${pct(missed)}%`, background:"rgba(255,255,255,0.10)" }} />
          </div>
        </div>
      </div>

      {/* Group standings */}
      <div style={{ fontSize:9, fontWeight:700, fontFamily:F.main, color:C.dim, letterSpacing:1.8, textTransform:"uppercase", marginBottom:10 }}>Group Standings</div>
      <div style={{ marginBottom:26 }}>
        <StandingsList rows={rows} authId={authId} tintMe
          predCountFor={(p)=>Object.keys(predictions[p.id]||{}).length} totalMatches={allMatches.length} />
      </div>

      {/* Per-match breakdown */}
      <div style={{ fontSize:9, fontWeight:700, fontFamily:F.main, color:C.dim, letterSpacing:1.8, textTransform:"uppercase", marginBottom:8 }}>Per-match breakdown</div>
      <div style={{ fontSize:11.5, fontFamily:F.body, color:C.dim, marginBottom:12 }}>
        <span style={{ color:C.green, fontWeight:600 }}>+3</span> exact ·{" "}
        <span style={{ color:C.gold, fontWeight:600 }}>+1</span> winner ·{" "}
        <span style={{ color:C.muted, fontWeight:600 }}>0</span> missed ·{" "}
        <span style={{ color:C.dimmer, fontWeight:600 }}>—</span> no pick
      </div>

      {gridRows.length === 0 ? (
        <div style={{ background:C.surface, border:`1px solid ${C.line}`, borderRadius:8, padding:30,
                      textAlign:"center", color:C.dim, fontFamily:F.main, fontSize:12, letterSpacing:1 }}>
          No matches played yet
        </div>
      ) : (
        <div style={{ overflowX:"auto", border:`1px solid ${C.line}`, borderRadius:8, background:C.surface }}>
          <div style={{ minWidth:660, display:"grid",
                        gridTemplateColumns:`1fr repeat(${members.length}, 74px)`, alignItems:"center" }}>
            {/* header */}
            <div style={{ background:"rgba(0,0,0,0.28)", borderBottom:`1px solid ${C.line}`, padding:"10px 14px" }}>
              <span style={{ fontSize:9.5, fontWeight:700, fontFamily:F.main, color:C.muted, letterSpacing:0.8, textTransform:"uppercase" }}>Match</span>
            </div>
            {members.map(mem => (
              <div key={mem.id} style={{ background:"rgba(0,0,0,0.28)", borderBottom:`1px solid ${C.line}`, padding:"10px 0", textAlign:"center" }}>
                <span style={{ fontSize:9.5, fontWeight:700, fontFamily:F.main, letterSpacing:0.8, textTransform:"uppercase",
                               color: mem.id===authId ? C.blue : C.muted }}>
                  {mem.id===authId ? "You" : mem.nickname}
                </span>
              </div>
            ))}

            {/* body */}
            {gridRows.map((m, ri) => {
              const rs   = results[m.id];
              const live = !rs && liveOf(m);
              const last = ri === gridRows.length-1;
              return (
                <Fragment key={m.id}>
                  <div style={{ padding:"11px 14px", minWidth:0,
                                borderBottom: last ? "none" : `1px solid ${C.lineSoft}`,
                                background: live ? "rgba(255,90,31,0.04)" : "transparent" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, fontFamily:F.main, color:C.white,
                                     whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {m.team1} <span style={{ color:C.dim }}>{rs ? `${rs.score1}–${rs.score2}` : "vs"}</span> {m.team2}
                      </span>
                      {live && (
                        <span style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0, padding:"2px 6px",
                                       borderRadius:3, background:"rgba(255,90,31,0.12)", border:`1px solid rgba(255,90,31,0.4)`,
                                       fontSize:9, fontWeight:700, fontFamily:F.main, color:C.orange, letterSpacing:0.5 }}>
                          <span style={{ width:4, height:4, borderRadius:"50%", background:C.orange,
                                         animation:"ewcPulse 1.4s ease-in-out infinite" }} />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:9, fontFamily:F.main, fontWeight:700, color:C.dim, letterSpacing:1,
                                  textTransform:"uppercase", marginTop:4 }}>
                      {m.label}{m.group?` · Group ${m.group}`:""} · {new Date(m.startTime).toLocaleDateString("en-US",{ timeZone:"Asia/Riyadh", month:"short", day:"numeric" })}
                    </div>
                  </div>
                  {members.map(mem => {
                    const pr = predictions[mem.id]?.[m.id];
                    const mine = mem.id===authId;
                    if (live) {
                      return (
                        <div key={mem.id} style={{ padding:"11px 0", textAlign:"center",
                                                   borderBottom: last ? "none" : `1px solid ${C.lineSoft}`,
                                                   background:"rgba(255,90,31,0.04)" }}>
                          <span style={{ fontSize:11, fontFamily:F.main, fontWeight:700,
                                         color: mine ? C.goldLight : C.dim }}>
                            {pr ? teamStyle(pr.winner).abbr : "—"}
                          </span>
                        </div>
                      );
                    }
                    const sc = pr && rs ? calcScore(pr, rs) : null;
                    const tint = mine ? (sc===3 ? "rgba(62,207,142,0.07)" : "rgba(91,140,255,0.05)") : "transparent";
                    return (
                      <div key={mem.id} style={{ padding:"11px 0", textAlign:"center", background:tint,
                                                 borderBottom: last ? "none" : `1px solid ${C.lineSoft}` }}>
                        {sc === null
                          ? <span style={{ fontSize:15, fontFamily:F.main, fontWeight:700, color:C.dimmer }}>—</span>
                          : <span style={{ ...NUM, fontSize:15, fontFamily:F.main, fontWeight:700,
                                           color: sc===3?C.green : sc===1?C.gold : C.muted }}>{sc===0?"0":`+${sc}`}</span>}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OTHERS' PICKS ───────────────────────────────────────────────────────────
function PlayerChip({ p, selected, points, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 15px 8px 9px", borderRadius:6,
               cursor:"pointer", transition:"background-color 0.12s ease, border-color 0.12s ease",
               border:`1px solid ${selected ? C.gold : hover ? C.lineStrong : C.line}`,
               background: selected ? "rgba(200,168,106,0.14)" : hover ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)" }}>
      <span style={{ width:24, height:24, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center",
                     background: selected ? "rgba(200,168,106,0.22)" : "rgba(255,255,255,0.06)",
                     fontFamily:F.main, fontWeight:700, fontSize:11,
                     color: selected ? C.goldLight : C.muted }}>
        {p.nickname[0].toUpperCase()}
      </span>
      <span style={{ fontFamily:F.main, fontWeight:700, fontSize:13, color: selected ? C.goldLight : C.white }}>{p.nickname}</span>
      <span style={{ ...NUM, fontFamily:F.main, fontWeight:700, fontSize:11, color: selected ? C.gold : C.dim }}>{points}</span>
    </button>
  );
}

// A locked match with someone else's pick on it.
function PickCard({ match, result, pred, now }) {
  const score = pred && result ? calcScore(pred, result) : null;
  const predLine = pred
    ? (pred.score1 != null ? `Predicted ${pred.score1}–${pred.score2}` : `Predicted ${pred.winner}`)
    : "No prediction";
  const border = score===3 ? "1px solid rgba(62,207,142,0.4)"
               : score===1 ? "1px solid rgba(200,168,106,0.4)"
               : `1px solid ${C.line}`;
  return (
    <div style={{ width:300, background:C.surface, border, borderRadius:5, overflow:"hidden",
                  boxShadow:"0 1px 2px rgba(0,0,0,0.3)" }}>
      <div style={{ padding:"6px 12px", background:"rgba(0,0,0,0.22)", borderBottom:`1px solid ${C.lineSoft}`,
                    display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, minHeight:26 }}>
        <span style={{ fontSize:9, color:C.dim, fontFamily:F.main, fontWeight:700, letterSpacing:1,
                       textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {match.group?`Group ${match.group} · `:""}{match.label} · {predLine}
        </span>
        {score !== null && <ScoreChip score={score} />}
        {score === null && !result && (
          <CountdownPill lockTime={getLockTime(match).toISOString()} now={now} startTime={match.startTime} />
        )}
      </div>
      <BracketTeamRow name={match.team1} score={result?.score1} isWinner={result?.winner===match.team1}
        isPick={pred?.winner===match.team1} hasResult={!!result} pickLabel="Their pick" />
      <BracketTeamRow name={match.team2} score={result?.score2} isWinner={result?.winner===match.team2}
        isPick={pred?.winner===match.team2} hasResult={!!result} pickLabel="Their pick" last />
    </div>
  );
}

function HiddenPickCard({ match, now }) {
  const ms = getLockTime(match).getTime() - now;
  const h = Math.floor(ms / 3600000), mi = Math.floor((ms % 3600000) / 60000);
  const left = ms <= 0 ? "locking now" : h > 0 ? `locks in ${h}h ${String(mi).padStart(2,"0")}m` : `locks in ${mi}m`;
  return (
    <div style={{ width:300, minHeight:118, background:C.bgDeep, border:`1px dashed ${C.lineSoft}`,
                  borderRadius:5, display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", gap:6, padding:"14px 16px", textAlign:"center" }}>
      <div style={{ fontSize:10, fontWeight:700, fontFamily:F.main, color:C.dim, letterSpacing:1.3, textTransform:"uppercase" }}>
        Hidden until lock
      </div>
      <div style={{ fontSize:11.5, fontFamily:F.body, color:C.dimmer }}>
        {match.group?`Group ${match.group} · `:""}{match.label} · {left}
      </div>
    </div>
  );
}

function OthersPicksPage({ players, authId, predictions, results, allMatches, now, totalFor, search, setSearch, selectedId, setSelectedId }) {
  const candidates = players.filter(p => p.id !== authId &&
    (!search || p.nickname.toLowerCase().includes(search.toLowerCase())));
  const viewing = players.find(p => p.id === selectedId);

  const predictable = allMatches.filter(m => !hasTBD(m));
  const visible = predictable.filter(m => isLocked(m, now));
  const hidden  = predictable.filter(m => !isLocked(m, now));
  const shown   = visible.filter(m => predictions[selectedId]?.[m.id]);

  return (
    <div>
      <div style={{ fontSize:10, color:C.dim, marginBottom:16, fontFamily:F.main, letterSpacing:1.5, textTransform:"uppercase" }}>
        Browse a player's predictions · <span style={{ color:C.gold }}>Locked matches only</span>
      </div>

      <input value={search} onChange={e=>{ setSearch(e.target.value); setSelectedId(null); }}
        placeholder="Search player…"
        style={{ ...inputStyle({ width:"100%", padding:"9px 14px", fontSize:13, marginBottom:14,
                                 boxSizing:"border-box", borderRadius:6, background:"rgba(255,255,255,0.03)",
                                 border:`1px solid ${C.line}` }) }} />

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:22 }}>
        {candidates.map(p => (
          <PlayerChip key={p.id} p={p} selected={selectedId===p.id} points={totalFor(p.id)}
            onClick={()=>setSelectedId(selectedId===p.id?null:p.id)} />
        ))}
        {candidates.length===0 && <div style={{ color:C.dim, fontSize:13, fontFamily:F.main }}>No other players yet</div>}
      </div>

      {viewing ? (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <span style={{ fontSize:12, fontWeight:700, fontFamily:F.main, color:C.gold, letterSpacing:1.5, textTransform:"uppercase", flexShrink:0 }}>
              {viewing.nickname} · {shown.length} pick{shown.length!==1?"s":""} visible
            </span>
            <div style={{ height:1, flex:1, background:C.lineSoft }} />
            <span style={{ fontSize:9, fontFamily:F.main, fontWeight:700, color:C.dim, letterSpacing:1.2, textTransform:"uppercase", flexShrink:0 }}>
              {hidden.length} hidden until lock
            </span>
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
            {shown.map(m => (
              <PickCard key={m.id} match={m} result={results[m.id]} pred={predictions[selectedId][m.id]} now={now} />
            ))}
            {/* Privacy shown, not just enforced — the absence is the rule made visible. */}
            {hidden.map(m => <HiddenPickCard key={m.id} match={m} now={now} />)}
          </div>

          {shown.length===0 && hidden.length===0 && (
            <div style={{ padding:30, textAlign:"center", color:C.dim, fontFamily:F.main, fontSize:12, letterSpacing:1 }}>
              Nothing to show yet
            </div>
          )}
        </>
      ) : (
        <div style={{ padding:40, textAlign:"center", color:C.dimmer, fontFamily:F.main, fontSize:12,
                      letterSpacing:1.5, textTransform:"uppercase" }}>
          Select a player above
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loading,        setLoading]        = useState(true);
  const [players,        setPlayers]        = useState([]);
  const [predictions,    setPredictions]    = useState({});
  const [results,        setResults]        = useState({});
  const [bonusPoints,    setBonusPoints]    = useState([]);
  const [groupMatches,   setGroupMatches]   = useState(DEFAULT_GROUP_MATCHES);
  const [playoffMatches, setPlayoffMatches] = useState(DEFAULT_PLAYOFF);
  const [adminHash,      setAdminHash]      = useState(ADMIN_PASSWORD_HASH);
  const [authId,         setAuthId]         = useState(()=>localStorage.getItem("rlcs_auth")||null);
  const [isAdmin,        setIsAdmin]        = useState(()=>localStorage.getItem("rlcs_admin")==="1");
  const [page,           setPage]           = useState("predict");
  const [filterGroup,    setFilterGroup]    = useState("all");
  const [viewingPlayer,  setViewingPlayer]  = useState(null);
  const [newNick,        setNewNick]        = useState("");
  const [editNick,       setEditNick]       = useState({});
  const [adminTab,       setAdminTab]       = useState("players");
  const [lbSearch,       setLbSearch]       = useState("");
  const [othersSearch,   setOthersSearch]   = useState("");
  const [adminSearch,    setAdminSearch]    = useState("");
  const [pwCurrent,      setPwCurrent]      = useState("");
  const [pwNew,          setPwNew]          = useState("");
  const [pwConfirm,      setPwConfirm]      = useState("");
  const [pwMsg,          setPwMsg]          = useState(null); // {ok, text}
  // Groups
  const [groups,           setGroups]           = useState([]);
  const [changeGroupModal, setChangeGroupModal] = useState(false);
  const [cgCode,           setCgCode]           = useState("");
  const [cgPass,           setCgPass]           = useState("");
  const [cgMsg,            setCgMsg]            = useState(null);
  const [cgLoading,        setCgLoading]        = useState(false);
  // Admin groups
  const [newGrpName,       setNewGrpName]       = useState("");
  const [newGrpCode,       setNewGrpCode]       = useState("");
  const [newGrpPass,       setNewGrpPass]       = useState("");
  const [newGrpMsg,        setNewGrpMsg]        = useState(null);
  const [expandedGrp,      setExpandedGrp]      = useState(null);
  // Toasts
  const [toasts,           setToasts]           = useState([]);
  // Admin players sub-tab
  const [playerSort,       setPlayerSort]       = useState("score");
  const [moveGrpOpen,      setMoveGrpOpen]      = useState(null);
  // Admin activity sub-tab
  const [activityFeed,     setActivityFeed]     = useState([]);
  const [recentRegs,       setRecentRegs]       = useState([]);
  // Invite-link join flow — token parsed from URL synchronously so it survives login
  const [pendingJoinToken, setPendingJoinToken] = useState(()=>{
    const m = window.location.pathname.match(INVITE_TOKEN_RE);
    if (m) { sessionStorage.setItem("rlcs_pending_join", m[1]); window.history.replaceState({}, "", "/"); return m[1]; }
    return sessionStorage.getItem("rlcs_pending_join") || null;
  });
  const [joinGroup,        setJoinGroup]        = useState(null); // group row from Supabase
  const [joinLoading,      setJoinLoading]      = useState(false);

  const myIdRef = useRef(authId);
  useEffect(()=>{ myIdRef.current=authId; },[authId]);

  // ── Shared countdown clock — ONE interval for all match cards ──
  const [now, setNow] = useState(()=>Date.now());
  useEffect(()=>{ const iv=setInterval(()=>setNow(Date.now()),1000); return()=>clearInterval(iv); },[]);

  const pillRef = useRef(null);
  const [pillOpen,      setPillOpen]      = useState(false);
  const [cgShowPass,    setCgShowPass]    = useState(false);
  const [pwShowCurrent, setPwShowCurrent] = useState(false);
  const [pwShowNew,     setPwShowNew]     = useState(false);
  const [pwShowConfirm, setPwShowConfirm] = useState(false);

  // Click-outside to close profile pill
  useEffect(()=>{
    if(!pillOpen)return;
    const h=(e)=>{ if(pillRef.current&&!pillRef.current.contains(e.target))setPillOpen(false); };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[pillOpen]);

  const toast = (msg, type="info") => { const id=Date.now(); setToasts(t=>[...t,{id,msg,type}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000); };

  // ── Activity feed (admin only) ──
  useEffect(()=>{
    if(adminTab!=="activity"||!isAdmin)return;
    const fetch=async()=>{
      const [{data:preds},{data:newPlayers}]=await Promise.all([
        supabase.from("predictions").select("*, players(nickname)").order("updated_at",{ascending:false}).limit(50),
        supabase.from("players").select("*").order("joined_at",{ascending:false}).limit(20),
      ]);
      setActivityFeed(preds||[]);
      setRecentRegs(newPlayers||[]);
    };
    fetch();
    const iv=setInterval(fetch,30000);
    return()=>clearInterval(iv);
  },[adminTab,isAdmin]);

  // ── Resolve pending invite token once auth + data are ready ──
  useEffect(()=>{
    if(!pendingJoinToken||loading||!authId)return;
    (async()=>{
      const{data:grp}=await supabase.from("groups").select("*").eq("invite_token",pendingJoinToken).single();
      if(grp){ setJoinGroup(grp); }
      else{ toast("Invite link is invalid or has been regenerated","error"); sessionStorage.removeItem("rlcs_pending_join"); setPendingJoinToken(null); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[pendingJoinToken,loading,authId]);

  // ── Load all data ──
  useEffect(()=>{
    (async()=>{
      const [{ data:pls },{ data:preds },{ data:res },{ data:bon },{ data:bracket },{ data:settings },{ data:grps }] = await Promise.all([
        supabase.from("players").select("*").order("created_at"),
        supabase.from("predictions").select("*"),
        supabase.from("results").select("*"),
        supabase.from("bonus_points").select("*").order("created_at"),
        supabase.from("results").select("*").like("match_id","bracket_%"),
        supabase.from("app_settings").select("value").eq("key","admin_password_hash").single(),
        supabase.from("groups").select("*").order("created_at"),
      ]);
      if(settings?.value)setAdminHash(settings.value);
      setGroups(grps||[]);
      setPlayers(pls||[]);
      const predMap={};
      (preds||[]).forEach(p=>{ if(!predMap[p.player_id])predMap[p.player_id]={}; predMap[p.player_id][p.match_id]={winner:p.winner,score1:p.score1,score2:p.score2}; });
      setPredictions(predMap);
      const myId=localStorage.getItem("rlcs_auth");
      if(myId){
        const{data:verifiedPlayer}=await supabase.from("players").select("id").eq("id",myId).single();
        if(!verifiedPlayer){
          localStorage.removeItem("rlcs_auth"); localStorage.removeItem("rlcs_admin");
          setAuthId(null); setIsAdmin(false);
        } else {
          await supabase.from("players").update({last_seen:new Date().toISOString()}).eq("id",myId);
          if(predMap[myId])localStorage.setItem(`rlcs_preds_${myId}`,JSON.stringify(predMap[myId]));
        }
      }
      const resMap={};
      (res||[]).forEach(r=>{ resMap[r.match_id]={winner:r.winner,score1:r.score1,score2:r.score2}; });
      setResults(resMap);
      setBonusPoints(bon||[]);
      await loadBracketTeams();
      setLoading(false);
    })();
  },[]);

  const loadBracketTeams = async () => {
    const { data } = await supabase.from("bracket_teams").select("*");
    if (data && data.length > 0) {
      const overrides = {};
      data.forEach(row => { overrides[row.match_id] = { team1: row.team1, team2: row.team2 }; });
      setPlayoffMatches(prev => prev.map(m => overrides[m.id] ? { ...m, ...overrides[m.id] } : m));
      setGroupMatches(prev => prev.map(m => overrides[m.id] ? { ...m, ...overrides[m.id] } : m));
    }
  };

  // ── Realtime ──
  useEffect(()=>{
    const ch=supabase.channel("rlcs-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"players"},({eventType:et,new:n,old:o})=>{
        setPlayers(prev=>et==="INSERT"?[...prev,n]:et==="UPDATE"?prev.map(p=>p.id===n.id?n:p):prev.filter(p=>p.id!==o.id));
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"predictions"},({eventType:et,new:p})=>{
        if((et==="INSERT"||et==="UPDATE")&&p.player_id!==myIdRef.current){
          setPredictions(prev=>({...prev,[p.player_id]:{...(prev[p.player_id]||{}),[p.match_id]:{winner:p.winner,score1:p.score1,score2:p.score2}}}));
        }
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"results"},({eventType:et,new:r,old:o})=>{
        if(et==="INSERT"||et==="UPDATE")setResults(prev=>({...prev,[r.match_id]:{winner:r.winner,score1:r.score1,score2:r.score2}}));
        else setResults(prev=>{const n={...prev};delete n[o.match_id];return n;});
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"bonus_points"},({eventType:et,new:b,old:o})=>{
        if(et==="INSERT")setBonusPoints(prev=>[...prev,b]);
        else if(et==="DELETE")setBonusPoints(prev=>prev.filter(x=>x.id!==o.id));
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"bracket_teams"},({eventType:et,new:r})=>{
        if(et==="INSERT"||et==="UPDATE"){
          setPlayoffMatches(prev=>prev.map(m=>m.id===r.match_id?{...m,team1:r.team1,team2:r.team2}:m));
          setGroupMatches(prev=>prev.map(m=>m.id===r.match_id?{...m,team1:r.team1,team2:r.team2}:m));
        }
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"groups"},({eventType:et,new:g,old:o})=>{
        setGroups(prev=>et==="INSERT"?[...prev,g]:et==="UPDATE"?prev.map(x=>x.id===g.id?g:x):prev.filter(x=>x.id!==o.id));
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"app_settings"},({new:r})=>{
        if(r.key==="admin_password_hash")setAdminHash(r.value);
      })
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  useEffect(()=>{ if(authId)localStorage.setItem("rlcs_auth",authId); else localStorage.removeItem("rlcs_auth"); },[authId]);
  useEffect(()=>{ if(isAdmin)localStorage.setItem("rlcs_admin","1"); else localStorage.removeItem("rlcs_admin"); },[isAdmin]);

  useEffect(()=>{
    if(!authId||loading)return;
    const backup=localStorage.getItem(`rlcs_preds_${authId}`);
    if(!backup)return;
    try{ const bp=JSON.parse(backup); setPredictions(prev=>({...prev,[authId]:{...bp,...(prev[authId]||{})}})); }catch{}
  },[authId,loading]);

  const logout=()=>{
    if(authId)localStorage.removeItem(`rlcs_preds_${authId}`);
    localStorage.removeItem("rlcs_auth");
    localStorage.removeItem("rlcs_admin");
    setAuthId(null); setIsAdmin(false); setPage("predict");
  };

  const handlePredict=useCallback(async(matchId,pred)=>{
    if(!authId)return;
    setPredictions(prev=>{ const u={...prev,[authId]:{...(prev[authId]||{}),[matchId]:pred}}; localStorage.setItem(`rlcs_preds_${authId}`,JSON.stringify(u[authId])); return u; });
    await supabase.from("predictions").upsert({player_id:authId,match_id:matchId,winner:pred.winner,score1:pred.score1,score2:pred.score2,updated_at:new Date().toISOString()},{onConflict:"player_id,match_id"});
  },[authId]);

  const handleSetResult=useCallback(async(matchId,result)=>{
    if(result===null){ setResults(prev=>{const n={...prev};delete n[matchId];return n;}); await supabase.from("results").delete().eq("match_id",matchId); toast("Result cleared","info"); }
    else{ const c={winner:result.winner,score1:result.score1,score2:result.score2}; setResults(prev=>({...prev,[matchId]:c})); await supabase.from("results").upsert({match_id:matchId,...c,set_at:new Date().toISOString()},{onConflict:"match_id"}); toast(`Result set: ${result.score1}–${result.score2}`,"success"); }
  },[toast]);

  const handleUpdateBracketTeams=async(matchId,team1,team2)=>{
    setPlayoffMatches(prev=>prev.map(m=>m.id===matchId?{...m,team1,team2}:m));
    setGroupMatches(prev=>prev.map(m=>m.id===matchId?{...m,team1,team2}:m));
    await supabase.from("bracket_teams").upsert({match_id:matchId,team1,team2},{onConflict:"match_id"});
  };

  const handleAddBonus=async(playerId,amount,reason)=>{ const cleanReason=sanitize(reason||"",200)||null; const{data,error}=await supabase.from("bonus_points").insert({player_id:playerId,amount,reason:cleanReason}).select().single(); if(!error&&data){setBonusPoints(prev=>[...prev,data]);toast(`Bonus ${amount>0?"+":""}${amount} pts added`,"success");}else if(error)toast("Failed to add bonus: "+error.message,"error"); };
  const handleDeleteBonus=async(id)=>{ setBonusPoints(prev=>prev.filter(b=>b.id!==id)); await supabase.from("bonus_points").delete().eq("id",id); };
  const handleAddPlayer=async()=>{ const nick=sanitize(newNick.trim(),20);if(!nick)return; const id=`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; const{error}=await supabase.from("players").insert({id,nickname:nick}); if(!error){setNewNick("");toast(`Player "${nick}" added`,"success");}else toast("Failed to add player: "+error.message,"error"); };
  const handleDeletePlayer=async(id)=>{ if(!window.confirm("Delete player?"))return; const p=players.find(x=>x.id===id); await supabase.from("players").delete().eq("id",id); toast(`Player "${p?.nickname}" deleted`,"info"); };
  const handleRename=async(id,nickname)=>{ const cleanNick=sanitize(nickname,20); setPlayers(prev=>prev.map(p=>p.id===id?{...p,nickname:cleanNick}:p)); await supabase.from("players").update({nickname:cleanNick}).eq("id",id); setEditNick(n=>{const c={...n};delete c[id];return c;}); toast(`Renamed to "${cleanNick}"`,"success"); };
  const handleMoveToGroup=async(playerId,groupId)=>{ setPlayers(prev=>prev.map(p=>p.id===playerId?{...p,group_id:groupId}:p)); await supabase.from("players").update({group_id:groupId}).eq("id",playerId); setMoveGrpOpen(null); const grpName=groupId==="public"?"Public":groups.find(g=>g.id===groupId)?.name||groupId; toast(`Moved to group: ${grpName}`,"success"); };

  const handleChangeAdminPassword=async()=>{
    setPwMsg(null);
    if(!pwNew||pwNew.length<8){setPwMsg({ok:false,text:"New password must be at least 8 characters."});return;}
    if(pwNew!==pwConfirm){setPwMsg({ok:false,text:"New passwords do not match."});return;}
    const currentHash=await hashPassword(pwCurrent);
    if(currentHash!==adminHash){setPwMsg({ok:false,text:"Current password is incorrect."});return;}
    const newHash=await hashPassword(pwNew);
    const{error}=await supabase.from("app_settings").upsert({key:"admin_password_hash",value:newHash},{onConflict:"key"});
    if(error){setPwMsg({ok:false,text:"Failed to save: "+error.message});return;}
    setAdminHash(newHash);
    setPwCurrent(""); setPwNew(""); setPwConfirm("");
    setPwMsg({ok:true,text:"Password updated successfully."});
  };

  const handleChangeGroup = async () => {
    setCgMsg(null);
    if (!cgCode.trim()) { setCgMsg({ ok:false, text:"Enter a group code." }); return; }
    setCgLoading(true);
    const { data:grp } = await supabase.from("groups").select("*").ilike("id", cgCode.trim()).single();
    if (!grp) { setCgMsg({ ok:false, text:"Group not found." }); setCgLoading(false); return; }
    const gHash = await hashPassword(cgPass);
    if (gHash !== grp.password_hash) { setCgMsg({ ok:false, text:"Wrong group password." }); setCgLoading(false); return; }
    await supabase.from("players").update({ group_id:grp.id }).eq("id", authId);
    setPlayers(prev => prev.map(p => p.id===authId ? { ...p, group_id:grp.id } : p));
    setCgLoading(false); setChangeGroupModal(false); setCgCode(""); setCgPass("");
  };

  const handleCreateGroup = async () => {
    setNewGrpMsg(null);
    const cleanName = sanitize(newGrpName.trim(), 30);
    const cleanCode = sanitize(newGrpCode.trim(), 20).toLowerCase();
    if (!cleanName) { setNewGrpMsg({ ok:false, text:"Enter a group name." }); return; }
    if (!cleanCode) { setNewGrpMsg({ ok:false, text:"Enter a group code." }); return; }
    if (newGrpPass.length < 4) { setNewGrpMsg({ ok:false, text:"Password must be at least 4 characters." }); return; }
    const hash = await hashPassword(newGrpPass);
    const { error } = await supabase.from("groups").insert({ id:cleanCode, name:cleanName, password_hash:hash, is_private:true });
    if (error) { setNewGrpMsg({ ok:false, text:error.code==="23505"?"Code already in use.":"Error: "+error.message }); return; }
    setNewGrpName(""); setNewGrpCode(""); setNewGrpPass("");
    setNewGrpMsg({ ok:true, text:"Group created!" });
    toast(`Group "${cleanName}" created`,"success");
  };

  const handleDeleteGroup = async (groupId) => {
    const grpName=groups.find(g=>g.id===groupId)?.name||groupId;
    if (!window.confirm(`Delete group "${grpName}"? All members will be moved to Public.`)) return;
    await supabase.from("players").update({ group_id:"public" }).eq("group_id", groupId);
    setPlayers(prev => prev.map(p => p.group_id===groupId ? { ...p, group_id:"public" } : p));
    await supabase.from("groups").delete().eq("id", groupId);
    toast(`Group "${grpName}" deleted`,"info");
  };

  const handleJoinByToken = async () => {
    if(!joinGroup||!authId)return;
    setJoinLoading(true);
    await supabase.from("players").update({group_id:joinGroup.id}).eq("id",authId);
    setPlayers(prev=>prev.map(p=>p.id===authId?{...p,group_id:joinGroup.id}:p));
    const name=joinGroup.name;
    setJoinGroup(null); setPendingJoinToken(null); sessionStorage.removeItem("rlcs_pending_join");
    setJoinLoading(false);
    toast(`Joined "${name}"!`,"success");
    setPage("mygroup");
  };

  const handleRegenerateInviteToken = async (groupId) => {
    const newToken = crypto.randomUUID();
    const{error}=await supabase.from("groups").update({invite_token:newToken}).eq("id",groupId);
    if(!error){ setGroups(prev=>prev.map(g=>g.id===groupId?{...g,invite_token:newToken}:g)); toast("Invite link regenerated","success"); }
  };

  const getPredScore =(pid)=>ALL_MATCHES.reduce((t,m)=>t+calcScore(predictions[pid]?.[m.id],results[m.id]),0);
  const getBonusTotal=(pid)=>bonusPoints.filter(b=>b.player_id===pid).reduce((t,b)=>t+b.amount,0);
  const getTotalScore=(pid)=>getPredScore(pid)+getBonusTotal(pid);
  const leaderboard=[...players].map(p=>({...p,score:getTotalScore(p.id),predScore:getPredScore(p.id),bonus:getBonusTotal(p.id)})).sort((a,b)=>b.score-a.score);
  const myPlayer=players.find(p=>p.id===authId);
  const myGroup=myPlayer?.group_id&&myPlayer.group_id!=="public"?groups.find(g=>g.id===myPlayer.group_id)||null:null;

  if(loading)return <LoadingScreen />;
  if(!authId&&!isAdmin)return <LoginScreen players={players} onLogin={id=>{setAuthId(id);setIsAdmin(false);}} onAdminLogin={()=>{setIsAdmin(true);setAuthId(null);}} adminHash={adminHash} />;

  const NAV=[
    {id:"predict",     label:"Group Stage"},
    {id:"playoffs",    label:"Playoffs"},
    ...(myGroup&&!isAdmin?[{id:"mygroup",label:"My Group"}]:[]),
    {id:"leaderboard", label:"Standings"},
    {id:"others",      label:"Others' Picks"},
    ...(isAdmin?[{id:"admin",label:"Admin"}]:[]),
  ];

  return (
    <div style={{ minHeight:"100vh", background:PAGE_BG, backgroundAttachment:"fixed", color:C.white, fontFamily:F.body, position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:#121214}::-webkit-scrollbar-thumb{background:#5c4d31;border-radius:4px}@keyframes ewcPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      {/* HEADER */}
      <div style={{ position:"sticky",top:0,zIndex:100,background:"rgba(18,18,20,0.94)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",borderBottom:`1px solid rgba(200,168,106,0.28)`,padding:"14px 20px" }}>
        <div style={{ maxWidth:1440,margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:10 }}>
            <div>
              <div style={{ fontSize:19,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:1.5,textTransform:"uppercase" }}>EWC 2026 <span style={{ color:C.gold }}>·</span> Rocket League</div>
              <div style={{ fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase",marginTop:3 }}>Aug 12–16 · Riyadh · $1,000,000 · 16 Teams</div>
            </div>
            {/* Profile Pill Dropdown */}
            <div ref={pillRef} style={{ position:"relative" }}>
              <div onClick={()=>setPillOpen(v=>!v)} style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:`1px solid ${isAdmin?"rgba(190,158,89,0.4)":"rgba(15,88,244,0.3)"}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",userSelect:"none" }}>
                <div style={{ width:24,height:24,borderRadius:6,background:isAdmin?`rgba(190,158,89,0.2)`:`rgba(15,88,244,0.15)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:isAdmin?C.red:C.blue,fontFamily:F.main }}>{isAdmin?"A":myPlayer?.nickname[0].toUpperCase()}</div>
                <span style={{ fontSize:12,fontFamily:F.main,fontWeight:700,color:isAdmin?C.red:C.white,letterSpacing:1 }}>{isAdmin?"ADMIN":myPlayer?.nickname}</span>
                <span style={{ fontSize:9,color:C.dim }}>{pillOpen?"▲":"▼"}</span>
              </div>
              {pillOpen&&(
                <div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,background:C.surface,border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:8,minWidth:200,boxShadow:"0 8px 30px rgba(0,0,0,0.6)",zIndex:999 }}>
                  {/* User info */}
                  <div style={{ padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:6 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ width:36,height:36,borderRadius:8,background:isAdmin?"rgba(190,158,89,0.2)":"rgba(15,88,244,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:isAdmin?C.red:C.blue,fontFamily:F.main,flexShrink:0 }}>{isAdmin?"A":myPlayer?.nickname[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:0.5 }}>{isAdmin?"ADMIN":myPlayer?.nickname}</div>
                        {isAdmin
                          ? <div style={{ fontSize:10,color:C.red,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase",marginTop:2 }}>⚙ Full Access</div>
                          : <div style={{ fontSize:10,color:myGroup?C.purple:C.dim,fontFamily:F.main,letterSpacing:0.5,marginTop:2 }}>{myGroup?`🏠 ${myGroup.name}`:"Public"}</div>
                        }
                      </div>
                      {!isAdmin&&(
                        <div style={{ marginLeft:"auto",background:"rgba(15,88,244,0.15)",border:"1px solid rgba(15,88,244,0.3)",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:F.main,color:C.blue }}>{getTotalScore(authId)} pts</div>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  {!isAdmin&&(
                    <button onClick={()=>{ setPillOpen(false); setCgCode(""); setCgPass(""); setCgShowPass(false); setCgMsg(null); setChangeGroupModal(true); }} style={{ width:"100%",textAlign:"left",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"none",border:"none",color:C.muted,fontFamily:F.main,fontWeight:600,fontSize:12,cursor:"pointer",borderRadius:7,transition:"background 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                      🏠 Change Group
                    </button>
                  )}
                  <button onClick={()=>{ setPillOpen(false); logout(); }} style={{ width:"100%",textAlign:"left",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"none",border:"none",color:C.red,fontFamily:F.main,fontWeight:600,fontSize:12,cursor:"pointer",borderRadius:7,transition:"background 0.1s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(190,158,89,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{ padding:"7px 14px",borderRadius:"5px 5px 0 0",border:"none",cursor:"pointer",background:page===n.id?"rgba(200,168,106,0.12)":"transparent",color:page===n.id?C.goldLight:C.muted,fontFamily:F.main,fontWeight:700,fontSize:11.5,letterSpacing:1.2,textTransform:"uppercase",borderBottom:page===n.id?`2px solid ${C.gold}`:"2px solid transparent",transition:"background-color 0.12s" }}>{n.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* MOMENTUM STRIP */}
      <MomentumStrip now={now} results={results} totalMatches={ALL_MATCHES.length} />

      {/* PAGE CONTENT */}
      <div style={{ position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"24px 20px 40px" }}>

        {/* GROUP STAGE */}
        {page==="predict"&&(
          <GroupStagePage groupMatches={groupMatches} predictions={predictions} results={results}
            playerId={isAdmin?null:authId} onPredict={handlePredict} now={now} isAdmin={isAdmin} />
        )}

        {/* PLAYOFFS */}
        {page==="playoffs"&&(
          <PlayoffsPage playoffMatches={playoffMatches} predictions={predictions} results={results}
            playerId={isAdmin?null:authId} onPredict={handlePredict} now={now} isAdmin={isAdmin} />
        )}

        {/* MY GROUP */}
        {page==="mygroup"&&myGroup&&(()=>{
          const grpMembers=players.filter(p=>p.group_id===myGroup.id);
          const grpLb=[...grpMembers].map(p=>({...p,score:getTotalScore(p.id),predScore:getPredScore(p.id),bonus:getBonusTotal(p.id)})).sort((a,b)=>b.score-a.score);
          return (
            <MyGroupPage myGroup={myGroup} members={grpMembers} rows={grpLb} authId={authId}
              predictions={predictions} results={results}
              allMatches={[...groupMatches,...playoffMatches]} now={now} inviteBase={INVITE_BASE} />
          );
        })()}


        {/* LEADERBOARD */}
        {page==="leaderboard"&&(
          <div>
            <div style={{ fontSize:10,color:C.dim,marginBottom:16,fontFamily:F.main,letterSpacing:1.5,textTransform:"uppercase" }}>
              Global standings · {players.length} player{players.length!==1?"s":""} · Updated live
            </div>
            <input value={lbSearch} onChange={e=>setLbSearch(e.target.value)} placeholder="Search player…"
              style={{ ...inputStyle({ width:"100%", padding:"9px 14px", fontSize:13, marginBottom:14, boxSizing:"border-box", borderRadius:6, background:"rgba(255,255,255,0.03)", border:`1px solid ${C.line}` }) }} />
            <StandingsList
              rows={leaderboard.filter(p=>!lbSearch||p.nickname.toLowerCase().includes(lbSearch.toLowerCase()))}
              authId={authId}
              groupLabelFor={(p)=>{ const g=p.group_id&&p.group_id!=="public"?groups.find(x=>x.id===p.group_id):null;
                                    return g ? (isAdmin||p.group_id===myGroup?.id ? g.name : "Private") : null; }}
              predCountFor={(p)=>Object.keys(predictions[p.id]||{}).length}
              totalMatches={ALL_MATCHES.length} />
            {isAdmin&&Object.keys(results).length>0&&(
              <div style={{ marginTop:28 }}>
                <div style={{ fontSize:10,color:C.muted,letterSpacing:2,marginBottom:10,fontFamily:F.main,textTransform:"uppercase" }}>Match Breakdown</div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:F.main }}>
                    <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                      <th style={{ textAlign:"left",padding:"5px 8px",color:C.muted,letterSpacing:1 }}>Match</th>
                      <th style={{ textAlign:"center",padding:"5px 8px",color:C.muted,letterSpacing:1 }}>Score</th>
                      {players.map(p=><th key={p.id} style={{ textAlign:"center",padding:"5px 8px",color:p.id===authId?C.blue:C.muted,letterSpacing:0.5 }}>{p.nickname}</th>)}
                    </tr></thead>
                    <tbody>
                      {ALL_MATCHES.filter(m=>results[m.id]).map(m=>(
                        <tr key={m.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding:"5px 8px",color:C.dim,whiteSpace:"nowrap" }}>{m.team1} vs {m.team2}</td>
                          <td style={{ textAlign:"center",padding:"5px 8px",color:C.muted }}>{results[m.id].score1}–{results[m.id].score2}</td>
                          {players.map(p=>{const s=calcScore(predictions[p.id]?.[m.id],results[m.id]);const has=!!predictions[p.id]?.[m.id];return<td key={p.id} style={{ textAlign:"center",padding:"5px 8px",fontWeight:700,color:!has?"rgba(255,255,255,0.1)":s===3?C.green:s===1?C.red:"rgba(255,255,255,0.25)" }}>{has?`+${s}`:"—"}</td>;})}
                        </tr>
                      ))}
                      {players.some(p=>getBonusTotal(p.id)!==0)&&(
                        <tr style={{ borderTop:`2px solid rgba(255,255,255,0.08)` }}>
                          <td colSpan={2} style={{ padding:"5px 8px",color:C.red,fontFamily:F.main,fontSize:11,letterSpacing:1 }}>⭐ Bonus</td>
                          {players.map(p=>{const b=getBonusTotal(p.id);return<td key={p.id} style={{ textAlign:"center",padding:"5px 8px",fontWeight:700,color:b>0?C.green:b<0?C.red:C.dim,fontFamily:F.main }}>{b!==0?(b>0?"+":"")+b:"—"}</td>;})}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OTHERS' PICKS */}
        {page==="others"&&(
          <OthersPicksPage players={players} authId={authId} predictions={predictions} results={results}
            allMatches={[...groupMatches,...playoffMatches]} now={now} totalFor={getTotalScore}
            search={othersSearch} setSearch={setOthersSearch}
            selectedId={viewingPlayer} setSelectedId={setViewingPlayer} />
        )}

        {/* ADMIN */}
        {page==="admin"&&isAdmin&&(
          <div>
            {/* Stats bar */}
            <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap" }}>
              {[
                {icon:"👥",label:"Total Players",  val:players.length},
                {icon:"🏠",label:"Private Groups", val:groups.filter(g=>g.id!=="public").length},
                {icon:"🎯",label:"Total Predictions",val:Object.values(predictions).reduce((t,pm)=>t+Object.keys(pm).length,0)},
                {icon:"✅",label:"Results Set",    val:Object.keys(results).length},
              ].map(({icon,label,val})=>(
                <div key={label} style={{ background:C.surface,border:"1px solid rgba(190,158,89,0.2)",borderRadius:8,padding:16,flex:1,minWidth:110 }}>
                  <div style={{ fontSize:28,fontWeight:700,fontFamily:F.main,color:C.white }}>{val}</div>
                  <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase",marginTop:4 }}>{icon} {label}</div>
                </div>
              ))}
            </div>

            {/* Sub-tabs */}
            <div style={{ display:"flex",gap:4,marginBottom:24,background:C.surface,border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:4,flexWrap:"wrap" }}>
              {[{id:"players",label:"👥 Players"},{id:"groups",label:"🏠 Groups"},{id:"bracket",label:"🏆 Bracket"},{id:"results",label:"🎯 Results"},{id:"bonus",label:"⭐ Bonus"},{id:"activity",label:"📊 Activity"}].map(t=>(
                <button key={t.id} onClick={()=>setAdminTab(t.id)} style={{ flex:1,padding:"9px 0",borderRadius:7,border:"none",cursor:"pointer",background:adminTab===t.id?"rgba(190,158,89,0.12)":"transparent",color:adminTab===t.id?C.gold:C.muted,fontFamily:F.main,fontWeight:700,fontSize:11,transition:"all 0.15s",minWidth:80,letterSpacing:0.5,textTransform:"uppercase" }}>{t.label}</button>
              ))}
            </div>

            {/* Players */}
            {adminTab==="players"&&(()=>{
              const filtered=players.filter(p=>!adminSearch||p.nickname.toLowerCase().includes(adminSearch.toLowerCase()));
              const sorted=[...filtered].sort((a,b)=>
                playerSort==="name"   ? a.nickname.localeCompare(b.nickname) :
                playerSort==="joined" ? new Date(b.joined_at||0)-new Date(a.joined_at||0) :
                playerSort==="seen"   ? new Date(b.last_seen||0)-new Date(a.last_seen||0) :
                getTotalScore(b.id)-getTotalScore(a.id)
              );
              return (
                <div>
                  <div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                    <input value={adminSearch} onChange={e=>setAdminSearch(e.target.value)} placeholder="Search player…"
                      style={{ ...inputStyle({ flex:1, padding:"9px 14px", fontSize:13, boxSizing:"border-box", minWidth:160 }) }} />
                    <select value={playerSort} onChange={e=>setPlayerSort(e.target.value)}
                      style={{ ...inputStyle({ padding:"9px 12px", fontSize:12, cursor:"pointer" }) }}>
                      <option value="score">By Score</option>
                      <option value="name">By Name</option>
                      <option value="joined">By Join Date</option>
                      <option value="seen">By Last Seen</option>
                    </select>
                  </div>
                  <div style={{ fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:1,marginBottom:8 }}>{sorted.length} player{sorted.length!==1?"s":""} total</div>
                  {sorted.map(p=>{
                    const pGrpObj=p.group_id&&p.group_id!=="public"?groups.find(g=>g.id===p.group_id):null;
                    const predCount=Object.keys(predictions[p.id]||{}).length;
                    return (
                      <div key={p.id} style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 14px",marginBottom:8 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                          <div style={{ width:32,height:32,borderRadius:8,background:"rgba(190,158,89,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:C.red,fontFamily:F.main,flexShrink:0 }}>{p.nickname[0].toUpperCase()}</div>
                          <div style={{ flex:1,minWidth:120 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                              <span style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:C.white }}>{p.nickname}</span>
                              {pGrpObj&&<span style={{ fontSize:9,color:C.purple,background:"rgba(190,158,89,0.15)",padding:"1px 7px",borderRadius:4,border:"1px solid rgba(190,158,89,0.3)",letterSpacing:1,fontFamily:F.main,fontWeight:600 }}>🏠 {pGrpObj.name}</span>}
                            </div>
                            <div style={{ fontSize:10,color:C.dim,fontFamily:F.main,marginTop:2,display:"flex",gap:10,flexWrap:"wrap",letterSpacing:0.5 }}>
                              <span style={{ color:C.muted }}>{getTotalScore(p.id)} pts</span>
                              <span>{predCount}/{ALL_MATCHES.length} preds</span>
                              {p.joined_at&&<span>Joined {timeAgo(p.joined_at)}</span>}
                              {p.last_seen&&<span>Seen {timeAgo(p.last_seen)}</span>}
                            </div>
                          </div>
                          {editNick[p.id]!==undefined?(
                            <div style={{ display:"flex",gap:6 }}>
                              <input value={editNick[p.id]} onChange={e=>setEditNick(n=>({...n,[p.id]:e.target.value}))} autoFocus onKeyDown={e=>{if(e.key==="Enter")handleRename(p.id,editNick[p.id]||p.nickname);}}
                                style={{ ...inputStyle({ padding:"5px 10px", fontSize:13, width:130 }) }} />
                              <button onClick={()=>handleRename(p.id,editNick[p.id]||p.nickname)} style={{ background:C.green,border:"none",borderRadius:6,color:"#000",fontWeight:700,padding:"5px 10px",fontFamily:F.main,cursor:"pointer",fontSize:11 }}>✓</button>
                              <button onClick={()=>setEditNick(n=>{const c={...n};delete c[p.id];return c;})} style={{ background:"rgba(255,255,255,0.06)",border:"none",borderRadius:6,color:C.muted,fontWeight:700,padding:"5px 8px",fontFamily:F.main,cursor:"pointer" }}>✕</button>
                            </div>
                          ):(
                            <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                              {moveGrpOpen===p.id?(
                                <select autoFocus onChange={e=>handleMoveToGroup(p.id,e.target.value)} onBlur={()=>setMoveGrpOpen(null)}
                                  style={{ ...inputStyle({ padding:"4px 8px", fontSize:12, cursor:"pointer" }) }} defaultValue="">
                                  <option value="" disabled>Move to…</option>
                                  <option value="public">Public</option>
                                  {groups.filter(g=>g.id!=="public").map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                              ):(
                                <button onClick={()=>setMoveGrpOpen(p.id)} style={{ background:"rgba(190,158,89,0.1)",border:"1px solid rgba(190,158,89,0.25)",borderRadius:6,color:C.purple,fontFamily:F.main,fontWeight:700,fontSize:10,padding:"4px 8px",cursor:"pointer",letterSpacing:0.5 }}>🏠 Group</button>
                              )}
                              <button onClick={()=>setEditNick(n=>({...n,[p.id]:p.nickname}))} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:C.muted,fontFamily:F.main,fontWeight:700,fontSize:10,padding:"4px 8px",cursor:"pointer" }}>Rename</button>
                              <button onClick={()=>handleDeletePlayer(p.id)} style={{ background:"rgba(244,15,48,0.1)",border:"1px solid rgba(244,15,48,0.35)",borderRadius:6,color:C.red,fontFamily:F.main,fontWeight:700,fontSize:10,padding:"4px 8px",cursor:"pointer" }}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display:"flex",gap:8,marginTop:10 }}>
                    <input value={newNick} onChange={e=>setNewNick(e.target.value)} placeholder="New player nickname…" onKeyDown={e=>{if(e.key==="Enter")handleAddPlayer();}}
                      style={{ ...inputStyle({ flex:1, border:"1px dashed rgba(255,255,255,0.15)", padding:"10px 14px", fontSize:13 }) }} />
                    <button onClick={handleAddPlayer} style={{ padding:"10px 20px",background:GOLD_GRAD,border:"none",borderRadius:10,cursor:"pointer",color:"#151515",fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:1 }}>+ ADD</button>
                  </div>
                </div>
              );
            })()}

            {/* Groups */}
            {adminTab==="groups"&&(
              <div>
                {/* Stats */}
                <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap" }}>
                  {[
                    {label:"Total Groups", val:groups.filter(g=>g.id!=="public").length},
                    {label:"Private Members", val:players.filter(p=>p.group_id&&p.group_id!=="public").length},
                  ].map(({label,val})=>(
                    <div key={label} style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 20px",flex:1,minWidth:120 }}>
                      <div style={{ fontSize:24,fontWeight:700,fontFamily:F.main,color:C.red }}>{val}</div>
                      <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase",marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Group list */}
                {groups.filter(g=>g.id!=="public").length===0&&(
                  <div style={{ textAlign:"center",color:C.dim,padding:30,fontFamily:F.main,fontSize:12,letterSpacing:1 }}>No private groups yet</div>
                )}
                {groups.filter(g=>g.id!=="public").map(g=>{
                  const members=players.filter(p=>p.group_id===g.id);
                  const isExpanded=expandedGrp===g.id;
                  return (
                    <div key={g.id} style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                        <div onClick={()=>setExpandedGrp(isExpanded?null:g.id)} style={{ flex:1,cursor:"pointer" }}>
                          <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:0.5 }}>{g.name}</div>
                          <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,marginTop:2,letterSpacing:1 }}>
                            Code: <span style={{ color:C.white }}>{g.id}</span> · {members.length} member{members.length!==1?"s":""} · {new Date(g.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button onClick={()=>{ navigator.clipboard.writeText(g.id); toast("Code copied","info"); }}
                          style={{ padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:C.muted,fontFamily:F.main,fontWeight:700,fontSize:11,cursor:"pointer",letterSpacing:0.5 }}>
                          Code
                        </button>
                        {g.invite_token&&(
                          <button onClick={()=>{ navigator.clipboard.writeText(`${INVITE_BASE}/${g.invite_token}`); toast("Invite link copied","success"); }}
                            style={{ padding:"4px 10px",borderRadius:6,border:"1px solid rgba(190,158,89,0.3)",background:"rgba(190,158,89,0.08)",color:C.purple,fontFamily:F.main,fontWeight:700,fontSize:11,cursor:"pointer",letterSpacing:0.5 }}>
                            🔗 Link
                          </button>
                        )}
                        <button onClick={()=>{ if(window.confirm(`Regenerate invite link for "${g.name}"?`))handleRegenerateInviteToken(g.id); }}
                          style={{ padding:"4px 10px",borderRadius:6,border:"1px solid rgba(190,158,89,0.2)",background:"rgba(190,158,89,0.06)",color:C.red,fontFamily:F.main,fontWeight:700,fontSize:11,cursor:"pointer",letterSpacing:0.5 }}>
                          ↻
                        </button>
                        <button onClick={()=>handleDeleteGroup(g.id)}
                          style={{ padding:"4px 10px",borderRadius:6,border:"1px solid rgba(244,15,48,0.35)",background:"rgba(244,15,48,0.1)",color:C.red,fontFamily:F.main,fontWeight:700,fontSize:11,cursor:"pointer" }}>
                          Delete
                        </button>
                        <button onClick={()=>setExpandedGrp(isExpanded?null:g.id)}
                          style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:0 }}>
                          {isExpanded?"▲":"▼"}
                        </button>
                      </div>
                      {isExpanded&&(
                        <div style={{ marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                          {members.length===0
                            ? <div style={{ color:C.dim,fontSize:12,fontFamily:F.main }}>No members</div>
                            : <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                                {members.map(m=>(
                                  <span key={m.id} style={{ padding:"3px 10px",borderRadius:6,background:"rgba(190,158,89,0.1)",border:"1px solid rgba(190,158,89,0.2)",color:C.white,fontSize:12,fontFamily:F.main }}>
                                    {m.nickname}
                                  </span>
                                ))}
                              </div>
                          }
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Create new group */}
                <div style={{ marginTop:24,paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:C.muted,letterSpacing:2,marginBottom:14,textTransform:"uppercase" }}>+ Create New Group</div>
                  <div style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px",display:"flex",flexDirection:"column",gap:12 }}>
                    <div>
                      <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Group Name</div>
                      <input value={newGrpName} onChange={e=>{ setNewGrpName(e.target.value); setNewGrpCode(e.target.value.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")); setNewGrpMsg(null); }}
                        placeholder="e.g. The Squad"
                        style={{ ...inputStyle({ width:"100%", padding:"9px 12px", fontSize:13, boxSizing:"border-box" }) }} />
                    </div>
                    <div>
                      <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Group Code (editable)</div>
                      <input value={newGrpCode} onChange={e=>{ setNewGrpCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")); setNewGrpMsg(null); }}
                        placeholder="e.g. the-squad"
                        style={{ ...inputStyle({ width:"100%", padding:"9px 12px", fontSize:13, boxSizing:"border-box" }) }} />
                    </div>
                    <div>
                      <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Group Password (min 4 chars)</div>
                      <input type="password" value={newGrpPass} onChange={e=>{ setNewGrpPass(e.target.value); setNewGrpMsg(null); }}
                        placeholder="Shared group password"
                        style={{ ...inputStyle({ width:"100%", padding:"9px 12px", fontSize:13, boxSizing:"border-box" }) }} />
                    </div>
                    {newGrpMsg&&<div style={{ fontSize:12,fontFamily:F.main,letterSpacing:0.5,color:newGrpMsg.ok?C.green:C.red }}>{newGrpMsg.ok?"✓":"⚠"} {newGrpMsg.text}</div>}
                    <button onClick={handleCreateGroup} style={{ padding:"10px 0",background:GOLD_GRAD,border:"none",borderRadius:8,cursor:"pointer",color:"#151515",fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:1,textTransform:"uppercase" }}>
                      Create Group ✓
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bracket Teams */}
            {adminTab==="bracket"&&(
              <BracketEditor matches={[...groupMatches,...playoffMatches]} onUpdateTeams={handleUpdateBracketTeams} onSaved={()=>toast("Bracket teams saved","success")} />
            )}

            {/* Results */}
            {adminTab==="results"&&(
              <div>
                <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:14 }}>Update any result even after it's set.</div>
                <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
                  {["all","A","B","Playoffs"].map(g=>(
                    <button key={g} onClick={()=>setFilterGroup(g)} style={{
                      padding:"6px 14px",borderRadius:6,border:`1px solid ${filterGroup===g?"transparent":"rgba(255,255,255,0.1)"}`,cursor:"pointer",fontFamily:F.main,fontWeight:700,fontSize:12,letterSpacing:1,textTransform:"uppercase",transition:"all 0.15s",
                      background:filterGroup===g?C.red:"rgba(255,255,255,0.04)",
                      color:filterGroup===g?C.white:"#8C8C8C",
                      boxShadow:filterGroup===g?"0 0 12px rgba(190,158,89,0.4)":"none",
                    }}>
                      {g==="all"?"All":g==="Playoffs"?"Playoffs":`Group ${g}`}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {(filterGroup==="Playoffs"?playoffMatches:groupMatches.filter(m=>filterGroup==="all"||m.group===filterGroup)).map(m=>(
                    <MatchCard key={m.id} match={m} playerId={null} predictions={predictions}
                      results={results} onPredict={()=>{}} onSetResult={handleSetResult} isAdmin={true} readOnly={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Bonus Points */}
            {adminTab==="bonus"&&(
              <BonusPointsPanel players={players} bonusPoints={bonusPoints} onAdd={handleAddBonus} onDelete={handleDeleteBonus} />
            )}

            {/* Activity */}
            {adminTab==="activity"&&(
              <div>
                <div style={{ display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start" }}>
                  {/* Recent Predictions */}
                  <div style={{ flex:1,minWidth:280 }}>
                    <div style={{ fontSize:12,fontWeight:700,fontFamily:F.main,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:10 }}>🎯 Recent Predictions</div>
                    {activityFeed.length===0&&<div style={{ color:C.dim,fontSize:12,fontFamily:F.main,padding:20,textAlign:"center" }}>No predictions yet</div>}
                    {activityFeed.map((pred,i)=>{
                      const match=ALL_MATCHES.find(m=>m.id===pred.match_id);
                      const nick=pred.players?.nickname||"Unknown";
                      return (
                        <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",marginBottom:6,borderRadius:8,background:C.surface,borderLeft:`3px solid ${C.blue}` }}>
                          <div style={{ width:28,height:28,borderRadius:6,background:"rgba(15,88,244,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:C.blue,fontFamily:F.main,flexShrink:0 }}>{nick[0].toUpperCase()}</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:12,fontWeight:700,fontFamily:F.main,color:C.white }}>{nick}</div>
                            <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginTop:1 }}>
                              predicted <span style={{ color:C.white }}>{pred.winner}</span>{match?` in ${match.label}`:""}
                            </div>
                          </div>
                          <div style={{ fontSize:10,color:C.dim,fontFamily:F.main,flexShrink:0,marginTop:2 }}>{timeAgo(pred.updated_at)}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Recent Registrations */}
                  <div style={{ flex:1,minWidth:260 }}>
                    <div style={{ fontSize:12,fontWeight:700,fontFamily:F.main,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:10 }}>✅ Recent Registrations</div>
                    {recentRegs.length===0&&<div style={{ color:C.dim,fontSize:12,fontFamily:F.main,padding:20,textAlign:"center" }}>No registrations yet</div>}
                    {recentRegs.map((p,i)=>{
                      const grpObj=p.group_id&&p.group_id!=="public"?groups.find(g=>g.id===p.group_id):null;
                      return (
                        <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",marginBottom:6,borderRadius:8,background:C.surface,borderLeft:`3px solid ${C.green}` }}>
                          <div style={{ width:28,height:28,borderRadius:6,background:"rgba(19,196,111,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:C.green,fontFamily:F.main,flexShrink:0 }}>{p.nickname[0].toUpperCase()}</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:12,fontWeight:700,fontFamily:F.main,color:C.white }}>{p.nickname}</div>
                            <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginTop:1 }}>
                              joined <span style={{ color:grpObj?C.purple:C.dim }}>{grpObj?grpObj.name:"Public"}</span>
                            </div>
                          </div>
                          <div style={{ fontSize:10,color:C.dim,fontFamily:F.main,flexShrink:0,marginTop:2 }}>{timeAgo(p.joined_at)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:1,marginTop:16,textAlign:"center" }}>Auto-refreshes every 30 seconds</div>
              </div>
            )}

            {/* Change Admin Password */}
            <div style={{ marginTop:32,paddingTop:24,borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.muted,letterSpacing:2,marginBottom:16,textTransform:"uppercase" }}>🔑 Change Admin Password</div>
              <div style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px",display:"flex",flexDirection:"column",gap:10 }}>
                {[
                  {label:"CURRENT PASSWORD",     val:pwCurrent, set:setPwCurrent, show:pwShowCurrent, setShow:setPwShowCurrent},
                  {label:"NEW PASSWORD (min 8)", val:pwNew,     set:setPwNew,     show:pwShowNew,     setShow:setPwShowNew},
                  {label:"CONFIRM NEW PASSWORD", val:pwConfirm, set:setPwConfirm, show:pwShowConfirm, setShow:setPwShowConfirm},
                ].map(({label,val,set,show,setShow})=>(
                  <div key={label}>
                    <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,marginBottom:4,letterSpacing:1 }}>{label}</div>
                    <div style={{ position:"relative" }}>
                      <input type={show?"text":"password"} value={val} onChange={e=>{set(e.target.value);setPwMsg(null);}}
                        style={{ ...inputStyle({ width:"100%", padding:"9px 40px 9px 12px", fontSize:13, boxSizing:"border-box" }) }} />
                      <PwToggle show={show} onToggle={()=>setShow(v=>!v)} />
                    </div>
                  </div>
                ))}
                {pwMsg&&<div style={{ fontSize:12,fontFamily:F.main,letterSpacing:0.5,color:pwMsg.ok?C.green:C.red }}>{pwMsg.ok?"✓":"⚠"} {pwMsg.text}</div>}
                <button onClick={handleChangeAdminPassword} style={{ padding:"10px 0",background:GOLD_GRAD,border:"none",borderRadius:8,cursor:"pointer",color:"#151515",fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:1,textTransform:"uppercase",marginTop:4 }}>
                  Update Password ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* JOIN GROUP MODAL — triggered by invite link */}
      {joinGroup&&authId&&(
        <div onClick={()=>{ if(!joinLoading){ setJoinGroup(null); setPendingJoinToken(null); sessionStorage.removeItem("rlcs_pending_join"); }}} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:210,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.surface,border:"1px solid rgba(190,158,89,0.35)",borderRadius:16,padding:32,width:"100%",maxWidth:360,boxShadow:"0 0 60px rgba(190,158,89,0.15)",textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:12 }}>🏠</div>
            <div style={{ fontSize:18,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>Join Group?</div>
            <div style={{ fontSize:15,color:C.muted,fontFamily:F.body,marginBottom:6 }}>
              You've been invited to join
            </div>
            <div style={{ fontSize:20,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:1,marginBottom:16 }}>{joinGroup.name}</div>
            {myGroup&&myGroup.id!==joinGroup.id&&(
              <div style={{ fontSize:11,color:"rgba(255,193,7,0.8)",fontFamily:F.main,letterSpacing:0.5,marginBottom:16,background:"rgba(255,193,7,0.06)",border:"1px solid rgba(255,193,7,0.15)",borderRadius:6,padding:"6px 10px" }}>
                ⚠ You'll leave "{myGroup.name}"
              </div>
            )}
            {myGroup&&myGroup.id===joinGroup.id&&(
              <div style={{ fontSize:11,color:C.green,fontFamily:F.main,letterSpacing:0.5,marginBottom:16 }}>✓ You're already in this group</div>
            )}
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>{ setJoinGroup(null); setPendingJoinToken(null); sessionStorage.removeItem("rlcs_pending_join"); }} disabled={joinLoading}
                style={{ flex:1,padding:"11px 0",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:C.muted,fontFamily:F.main,fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:1 }}>
                Cancel
              </button>
              {(!myGroup||myGroup.id!==joinGroup.id)&&(
                <button onClick={handleJoinByToken} disabled={joinLoading}
                  style={{ flex:2,padding:"11px 0",background:joinLoading?"rgba(190,158,89,0.4)":GOLD_GRAD,border:"none",borderRadius:8,color:"#151515",fontFamily:F.main,fontWeight:700,fontSize:13,cursor:joinLoading?"default":"pointer",letterSpacing:1,textTransform:"uppercase" }}>
                  {joinLoading?"Joining…":"Join Group →"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHANGE GROUP MODAL */}
      {changeGroupModal&&(
        <div onClick={()=>setChangeGroupModal(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.surface,border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:32,width:"100%",maxWidth:380,boxShadow:"0 0 60px rgba(0,0,0,0.8)" }}>
            <div style={{ fontSize:16,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>🏠 Change Group</div>
            <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:20 }}>
              {myGroup ? `Currently in: ${myGroup.name}` : "Currently in: Public"}<br/>Enter the code and password for your new group.
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ background:"rgba(255,193,7,0.06)",border:"1px solid rgba(255,193,7,0.2)",borderRadius:8,padding:"8px 12px",fontSize:11,color:"rgba(255,193,7,0.85)",fontFamily:F.main,letterSpacing:0.5 }}>
                ⚠ Legacy method — ask for an invite link for one-click joining
              </div>
              <div>
                <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Group Code</div>
                <input value={cgCode} onChange={e=>{ setCgCode(e.target.value); setCgMsg(null); }} placeholder="e.g. the-squad"
                  style={{ ...inputStyle({ width:"100%", padding:"10px 12px", fontSize:14, boxSizing:"border-box" }) }} autoFocus />
              </div>
              <div>
                <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Group Password</div>
                <div style={{ position:"relative" }}>
                  <input type={cgShowPass?"text":"password"} value={cgPass} onChange={e=>{ setCgPass(e.target.value); setCgMsg(null); }} placeholder="Group password"
                    style={{ ...inputStyle({ width:"100%", padding:"10px 40px 10px 12px", fontSize:14, boxSizing:"border-box" }) }} />
                  <PwToggle show={cgShowPass} onToggle={()=>setCgShowPass(v=>!v)} />
                </div>
              </div>
              {cgMsg&&<div style={{ fontSize:12,fontFamily:F.main,letterSpacing:0.5,color:cgMsg.ok?C.green:C.red }}>{cgMsg.ok?"✓":"⚠"} {cgMsg.text}</div>}
              <div style={{ display:"flex",gap:8,marginTop:4 }}>
                <button onClick={()=>setChangeGroupModal(false)} style={{ flex:1,padding:"10px 0",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:C.muted,fontFamily:F.main,fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:1 }}>
                  Cancel
                </button>
                <button onClick={handleChangeGroup} disabled={cgLoading} style={{ flex:2,padding:"10px 0",background:cgLoading?"rgba(190,158,89,0.4)":GOLD_GRAD,border:"none",borderRadius:8,color:"#151515",fontFamily:F.main,fontWeight:700,fontSize:13,cursor:cgLoading?"default":"pointer",letterSpacing:1,textTransform:"uppercase" }}>
                  {cgLoading?"Joining…":"Join Group →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST CONTAINER */}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ position:"fixed",bottom:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none" }}>
        {toasts.map(t=>(
          <div key={t.id} style={{ minWidth:280,maxWidth:360,background:C.surface,borderLeft:`3px solid ${t.type==="error"?C.red:t.type==="success"?C.green:C.blue}`,padding:"12px 16px",borderRadius:6,color:C.white,fontFamily:F.main,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,0.25)",animation:"toastIn 0.2s ease",letterSpacing:0.5 }}>
            {t.type==="error"?"⚠ ":t.type==="success"?"✓ ":"ℹ "}{t.msg}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ position:"relative",zIndex:1,borderTop:`1px solid rgba(190,158,89,0.2)`,padding:16,textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.15)",fontFamily:F.main,letterSpacing:2,textTransform:"uppercase" }}>
        EWC 2026 Rocket League Predictor · Live Sync by Supabase
      </div>
    </div>
  );
}
