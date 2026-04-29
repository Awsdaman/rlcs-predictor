import { useState, useEffect, useCallback, useRef } from "react";
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

// ─── BRAND COLORS ─────────────────────────────────────────────────────────────
const C = {
  red:       '#E8001D',
  blue:      '#0066FF',
  purple:    '#6B35FF',
  navy:      '#07071a',
  navyLight: '#0d0d2a',
  white:     '#FFFFFF',
  muted:     '#8899BB',
  dim:       '#334466',
  green:     '#00FF88',
};

// ─── TEAMS ───────────────────────────────────────────────────────────────────
const TEAMS = {
  "Vitality":            { abbr:"VIT",  color:"#FFD700", bg:"#1a1400", logo:"/logos/vitality.png" },
  "Karmine Corp":        { abbr:"KC",   color:"#00CFFF", bg:"#001a2e", logo:"/logos/karmine-corp.png" },
  "Wildcard":            { abbr:"WC",   color:"#FF4500", bg:"#1a0a00", logo:"/logos/wildcard.png" },
  "FUT Esports":         { abbr:"FUT",  color:"#E74C3C", bg:"#1a0000", logo:"/logos/fut.png" },
  "NRG Esports":         { abbr:"NRG",  color:"#FF6900", bg:"#1a0a00", logo:"/logos/nrg.png" },
  "Manchester City":     { abbr:"MCFC", color:"#6CABDD", bg:"#001a2e", logo:"/logos/manchester-city.png" },
  "MIBR":                { abbr:"MIBR", color:"#00A651", bg:"#001a0d", logo:"/logos/mibr.png" },
  "Five Fears":          { abbr:"5F",   color:"#E74C3C", bg:"#1a0000", logo:"/logos/five-fears.png" },
  "Twisted Minds":       { abbr:"TM",   color:"#FF3D6E", bg:"#1a0010", logo:"/logos/twisted-minds.png" },
  "Ninjas in Pyjamas":   { abbr:"NIP",  color:"#F0F0F0", bg:"#0d0d0d", logo:"/logos/nip.png" },
  "Shopify Rebellion":   { abbr:"SR",   color:"#96BF48", bg:"#0d1a00", logo:"/logos/shopify.png" },
  "TSM":                 { abbr:"TSM",  color:"#3498DB", bg:"#00091a", logo:"/logos/tsm.png" },
  "Gentle Mates":        { abbr:"GM",   color:"#FF6B35", bg:"#1a0a00", logo:"/logos/gentle-mates.png" },
  "Spacestation Gaming": { abbr:"SSG",  color:"#00CFFF", bg:"#001a20", logo:"/logos/spacestation.png" },
  "R8 Esports":          { abbr:"R8",   color:"#C0392B", bg:"#1a0000", logo:"/logos/r8.png" },
  "FURIA Esports":       { abbr:"FUR",  color:"#FF0000", bg:"#1a0000", logo:"/logos/furia.png" },
};

// ─── GROUP MATCHES ───────────────────────────────────────────────────────────
const GROUP_MATCHES = [
  // Wednesday May 20 — Slot 1 (09:00 UTC = 12:00 KSA)
  { id:"ga1", group:"A", team1:"Vitality",            team2:"Karmine Corp",        startTime:"2026-05-20T09:00:00Z", phase:"Group Stage" },
  { id:"gc1", group:"C", team1:"Twisted Minds",       team2:"Ninjas in Pyjamas",   startTime:"2026-05-20T09:00:00Z", phase:"Group Stage" },
  { id:"gd1", group:"D", team1:"Gentle Mates",        team2:"Spacestation Gaming", startTime:"2026-05-20T09:00:00Z", phase:"Group Stage" },
  { id:"gb1", group:"B", team1:"NRG Esports",         team2:"Manchester City",     startTime:"2026-05-20T09:00:00Z", phase:"Group Stage" },
  // Wednesday May 20 — Slot 2 (12:00 UTC = 15:00 KSA)
  { id:"ga2", group:"A", team1:"Vitality",            team2:"Wildcard",            startTime:"2026-05-20T12:00:00Z", phase:"Group Stage" },
  { id:"gd2", group:"D", team1:"Gentle Mates",        team2:"R8 Esports",          startTime:"2026-05-20T12:00:00Z", phase:"Group Stage" },
  { id:"gc2", group:"C", team1:"Twisted Minds",       team2:"Shopify Rebellion",   startTime:"2026-05-20T12:00:00Z", phase:"Group Stage" },
  { id:"gb2", group:"B", team1:"NRG Esports",         team2:"MIBR",                startTime:"2026-05-20T12:00:00Z", phase:"Group Stage" },
  // Wednesday May 20 — Slot 3 (15:00 UTC = 18:00 KSA)
  { id:"gd3", group:"D", team1:"Gentle Mates",        team2:"FURIA Esports",       startTime:"2026-05-20T15:00:00Z", phase:"Group Stage" },
  { id:"ga3", group:"A", team1:"Vitality",            team2:"FUT Esports",         startTime:"2026-05-20T15:00:00Z", phase:"Group Stage" },
  { id:"gc3", group:"C", team1:"Twisted Minds",       team2:"TSM",                 startTime:"2026-05-20T15:00:00Z", phase:"Group Stage" },
  { id:"gb3", group:"B", team1:"NRG Esports",         team2:"Five Fears",          startTime:"2026-05-20T15:00:00Z", phase:"Group Stage" },
  // Thursday May 21 — Slot 1 (09:00 UTC = 12:00 KSA)
  { id:"gd4", group:"D", team1:"Spacestation Gaming", team2:"R8 Esports",          startTime:"2026-05-21T09:00:00Z", phase:"Group Stage" },
  { id:"ga4", group:"A", team1:"Karmine Corp",        team2:"Wildcard",            startTime:"2026-05-21T09:00:00Z", phase:"Group Stage" },
  { id:"gb4", group:"B", team1:"Manchester City",     team2:"MIBR",                startTime:"2026-05-21T09:00:00Z", phase:"Group Stage" },
  { id:"gc4", group:"C", team1:"Ninjas in Pyjamas",   team2:"Shopify Rebellion",   startTime:"2026-05-21T09:00:00Z", phase:"Group Stage" },
  // Thursday May 21 — Slot 2 (12:00 UTC = 15:00 KSA)
  { id:"gb5", group:"B", team1:"Manchester City",     team2:"Five Fears",          startTime:"2026-05-21T12:00:00Z", phase:"Group Stage" },
  { id:"gc5", group:"C", team1:"Ninjas in Pyjamas",   team2:"TSM",                 startTime:"2026-05-21T12:00:00Z", phase:"Group Stage" },
  { id:"ga5", group:"A", team1:"Karmine Corp",        team2:"FUT Esports",         startTime:"2026-05-21T12:00:00Z", phase:"Group Stage" },
  { id:"gd5", group:"D", team1:"Spacestation Gaming", team2:"FURIA Esports",       startTime:"2026-05-21T12:00:00Z", phase:"Group Stage" },
  // Thursday May 21 — Slot 3 (15:00 UTC = 18:00 KSA)
  { id:"gc6", group:"C", team1:"Shopify Rebellion",   team2:"TSM",                 startTime:"2026-05-21T15:00:00Z", phase:"Group Stage" },
  { id:"ga6", group:"A", team1:"Wildcard",            team2:"FUT Esports",         startTime:"2026-05-21T15:00:00Z", phase:"Group Stage" },
  { id:"gd6", group:"D", team1:"R8 Esports",          team2:"FURIA Esports",       startTime:"2026-05-21T15:00:00Z", phase:"Group Stage" },
  { id:"gb6", group:"B", team1:"MIBR",                team2:"Five Fears",          startTime:"2026-05-21T15:00:00Z", phase:"Group Stage" },
];

// ─── PLAYOFF MATCHES — teams set from bracket state in Supabase ──────────────
const DEFAULT_PLAYOFF = [
  { id:"p_lb1",   label:"LB ROUND 1 M1",      round:"LBR1", startTime:"2026-05-22T09:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_lb2",   label:"LB ROUND 1 M2",      round:"LBR1", startTime:"2026-05-22T09:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_lb3",   label:"LB ROUND 1 M3",      round:"LBR1", startTime:"2026-05-22T09:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_lb4",   label:"LB ROUND 1 M4",      round:"LBR1", startTime:"2026-05-22T09:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_lb5",   label:"LB ROUND 2 M1",      round:"LBR2", startTime:"2026-05-22T13:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_lb6",   label:"LB ROUND 2 M2",      round:"LBR2", startTime:"2026-05-22T13:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_ubqf1", label:"UB QUARTER FINAL 1",  round:"UBQF", startTime:"2026-05-22T13:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_ubqf2", label:"UB QUARTER FINAL 2",  round:"UBQF", startTime:"2026-05-22T13:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_lbqf1", label:"LB QUARTER FINAL 1",  round:"LBQF", startTime:"2026-05-23T09:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_lbqf2", label:"LB QUARTER FINAL 2",  round:"LBQF", startTime:"2026-05-23T09:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_sf1",   label:"SEMI FINAL 1",         round:"SF",   startTime:"2026-05-24T09:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_sf2",   label:"SEMI FINAL 2",         round:"SF",   startTime:"2026-05-24T11:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
  { id:"p_gf",    label:"GRAND FINAL",           round:"GF",   startTime:"2026-05-24T14:00:00Z", team1:"TBD", team2:"TBD", bo:7 },
];

const ALL_MATCHES = [...GROUP_MATCHES, ...DEFAULT_PLAYOFF];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const calcScore = (pred, result) => {
  if (!pred || !result) return 0;
  if (pred.score1 === result.score1 && pred.score2 === result.score2) return 3;
  if (pred.winner === result.winner) return 1;
  return 0;
};
const isLocked  = (m)   => new Date() >= new Date(m.startTime);
const fmtTime   = (iso) => new Date(iso).toLocaleString("en-US", { timeZone:"Asia/Riyadh", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
const timeAgo   = (iso) => { if(!iso)return"–"; const s=Math.floor((Date.now()-new Date(iso))/1000); if(s<60)return`${s}s ago`; const m=Math.floor(s/60); if(m<60)return`${m} min ago`; const h=Math.floor(m/60); if(h<24)return`${h} hr ago`; return`${Math.floor(h/24)}d ago`; };
const teamStyle = (n)   => TEAMS[n] || { abbr:(n||"?").slice(0,3).toUpperCase(), color:"#888", bg:"#111", logo:null };
const isTBDTeam = (n)   => !n || n === "TBD";
const F = { main:"'Rajdhani', sans-serif", body:"'Inter', sans-serif" };

// ─── SHARED INPUT STYLE ───────────────────────────────────────────────────────
const inputStyle = (extra={}) => ({
  background:"rgba(255,255,255,0.05)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:7,
  color:C.white,
  fontFamily:F.body,
  ...extra,
});

// ─── TEAM BADGE ──────────────────────────────────────────────────────────────
function TeamBadge({ name, size="sm" }) {
  const t = teamStyle(name);
  const isTBD = isTBDTeam(name);
  const sz = size === "lg" ? 52 : 36;
  if (name === "Twisted Minds" || name === "Vitality") console.log(`[TeamBadge] ${name} logo path:`, t.logo);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{
        width: sz,
        height: sz,
        borderRadius: 7,
        background: isTBD ? "#1a1a2e" : t.bg,
        border: `2px solid ${isTBD ? "#333355" : t.color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: isTBD ? "none" : `0 0 10px ${t.color}60, inset 0 0 6px ${t.color}20`,
      }}>
        {t.logo && !isTBD
          ? <>
              <img src={t.logo} alt={name} style={{ width:"95%", height:"95%", objectFit:"contain" }}
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
function BracketCard({ match, result, pred, onClick, isSelected }) {
  const t1 = match.team1, t2 = match.team2;
  const res = result;
  const score = pred && res ? calcScore(pred, res) : null;
  const locked = isLocked(match);
  const t1TBD = isTBDTeam(t1), t2TBD = isTBDTeam(t2);

  const borderColor = score===3 ? "rgba(0,255,136,0.4)" : score===1 ? "rgba(232,0,29,0.4)" : isSelected ? "rgba(0,102,255,0.6)" : "rgba(255,255,255,0.08)";
  const glowShadow  = score===3 ? "0 0 15px rgba(0,255,136,0.2)" : score===1 ? "0 0 15px rgba(232,0,29,0.15)" : isSelected ? "0 0 20px rgba(0,102,255,0.2)" : "none";

  return (
    <div onClick={onClick} style={{
      background:"rgba(8,8,28,0.9)",
      border:`1px solid ${borderColor}`,
      borderRadius:8, overflow:"hidden", cursor:"pointer", transition:"all 0.15s", minWidth:180,
      boxShadow: glowShadow,
    }}>
      {/* Label bar */}
      <div style={{ padding:"3px 10px", background:"rgba(4,4,20,0.9)", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:9, color:C.muted, fontFamily:F.main, letterSpacing:2, textTransform:"uppercase" }}>{match.label}</span>
        {score !== null && <span style={{ fontSize:9, fontWeight:700, fontFamily:F.main, color:score===3?C.green:score===1?C.red:"rgba(255,255,255,0.3)" }}>+{score}pts</span>}
        {locked && !res && score===null && <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:F.main }}>🔒</span>}
      </div>
      {/* Team 1 */}
      <div style={{ padding:"6px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.04)", background:res?.winner===t1?"rgba(0,255,136,0.06)":"transparent", borderLeft:res?.winner===t1?`2px solid ${C.green}`:"2px solid transparent" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {!t1TBD && (() => { const t=teamStyle(t1); const [e,setE]=useState(false); return (
            <div style={{ width:18, height:18, borderRadius:4, background:t.bg, border:`1px solid ${t.color}40`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
              {t.logo&&!e?<img src={t.logo} style={{ width:"90%", height:"90%", objectFit:"contain" }} onError={()=>setE(true)} alt="" />:<span style={{ fontSize:7, fontWeight:700, color:t.color, fontFamily:F.main }}>{t.abbr}</span>}
            </div>
          )})()}
          <span style={{ fontSize:11, fontWeight:700, fontFamily:F.main, color:t1TBD?"rgba(255,255,255,0.2)":res?.winner===t1?C.green:C.white, textTransform:"uppercase", letterSpacing:0.5 }}>{t1TBD?"TBD":t1}</span>
        </div>
        {res && <span style={{ fontSize:13, fontWeight:700, fontFamily:F.main, color:res.winner===t1?C.green:C.dim }}>{res.score1}</span>}
        {!res && pred?.winner===t1 && <span style={{ fontSize:9, color:C.red, fontFamily:F.main }}>★</span>}
      </div>
      {/* Team 2 */}
      <div style={{ padding:"6px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", background:res?.winner===t2?"rgba(0,255,136,0.06)":"transparent", borderLeft:res?.winner===t2?`2px solid ${C.green}`:"2px solid transparent" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {!t2TBD && (() => { const t=teamStyle(t2); const [e,setE]=useState(false); return (
            <div style={{ width:18, height:18, borderRadius:4, background:t.bg, border:`1px solid ${t.color}40`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
              {t.logo&&!e?<img src={t.logo} style={{ width:"90%", height:"90%", objectFit:"contain" }} onError={()=>setE(true)} alt="" />:<span style={{ fontSize:7, fontWeight:700, color:t.color, fontFamily:F.main }}>{t.abbr}</span>}
            </div>
          )})()}
          <span style={{ fontSize:11, fontWeight:700, fontFamily:F.main, color:t2TBD?"rgba(255,255,255,0.2)":res?.winner===t2?C.green:C.white, textTransform:"uppercase", letterSpacing:0.5 }}>{t2TBD?"TBD":t2}</span>
        </div>
        {res && <span style={{ fontSize:13, fontWeight:700, fontFamily:F.main, color:res.winner===t2?C.green:C.dim }}>{res.score2}</span>}
        {!res && pred?.winner===t2 && <span style={{ fontSize:9, color:C.red, fontFamily:F.main }}>★</span>}
      </div>
    </div>
  );
}

// ─── PREDICT PANEL ────────────────────────────────────────────────────────────
function PredictPanel({ match, result, pred, onPredict, onClose }) {
  const locked = isLocked(match);
  const t1TBD = isTBDTeam(match.team1), t2TBD = isTBDTeam(match.team2);
  const [s1, setS1] = useState(pred?.score1 ?? "");
  const [s2, setS2] = useState(pred?.score2 ?? "");
  const t1 = teamStyle(match.team1), t2 = teamStyle(match.team2);

  useEffect(() => { setS1(pred?.score1??""); setS2(pred?.score2??""); }, [pred?.score1, pred?.score2]);

  const submit = (winner) => {
    const n1=parseInt(s1), n2=parseInt(s2);
    onPredict(match.id, { winner, score1:isNaN(n1)?null:n1, score2:isNaN(n2)?null:n2 });
    onClose();
  };

  return (
    <div style={{ background:"rgba(8,8,28,0.97)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"16px 18px", marginTop:12, boxShadow:"0 0 30px rgba(0,0,0,0.5)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, fontFamily:F.main, color:C.red, letterSpacing:2, textTransform:"uppercase" }}>{match.label} — Bo{match.bo}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16 }}>✕</button>
      </div>
      <div style={{ fontSize:10, color:C.dim, fontFamily:F.main, letterSpacing:1, marginBottom:12 }}>{fmtTime(match.startTime)} · KSA</div>

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
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, justifyContent:"center" }}>
            <input type="number" min={0} max={4} value={s1} onChange={e=>setS1(e.target.value)} placeholder="–"
              style={{ ...inputStyle({ width:48, textAlign:"center", fontSize:20, fontWeight:700, padding:"6px 0" }) }} />
            <span style={{ color:"rgba(255,255,255,0.15)", fontSize:18 }}>:</span>
            <input type="number" min={0} max={4} value={s2} onChange={e=>setS2(e.target.value)} placeholder="–"
              style={{ ...inputStyle({ width:48, textAlign:"center", fontSize:20, fontWeight:700, padding:"6px 0" }) }} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {[{team:match.team1,t:t1},{team:match.team2,t:t2}].map(({team,t})=>(
              <button key={team} onClick={()=>submit(team)} style={{
                flex:1, padding:"9px 0", borderRadius:7, border:`1px solid ${pred?.winner===team?t.color:"rgba(255,255,255,0.1)"}`,
                cursor:"pointer", fontFamily:F.main, fontWeight:700, fontSize:12, textTransform:"uppercase", letterSpacing:1,
                background:pred?.winner===team?t.color:"rgba(255,255,255,0.04)",
                color:pred?.winner===team?"#000":C.muted,
                boxShadow:pred?.winner===team?`0 0 12px ${t.color}60`:"none",
                transition:"all 0.15s",
              }}>
                {team.split(" ").slice(-1)[0]} wins
              </button>
            ))}
          </div>
          {pred && <div style={{ marginTop:8, fontSize:10, color:C.dim, fontFamily:F.main, textAlign:"center", letterSpacing:1 }}>CURRENT: {pred.winner} {pred.score1!=null?`(${pred.score1}–${pred.score2})`:""}</div>}
        </div>
      )}
    </div>
  );
}

// ─── PLAYOFFS BRACKET PAGE ────────────────────────────────────────────────────
function PlayoffsPage({ playoffMatches, predictions, results, playerId, onPredict }) {
  const [selected, setSelected] = useState(null);

  const byRound = (r) => playoffMatches.filter(m => m.round === r);
  const selectedMatch = playoffMatches.find(m => m.id === selected);

  const renderSection = (label, matches) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:9, color:C.muted, fontFamily:F.main, letterSpacing:2, textTransform:"uppercase", marginBottom:6, paddingLeft:2 }}>{label}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {matches.map(m => (
          <BracketCard key={m.id} match={m} result={results[m.id]} pred={predictions[playerId]?.[m.id]}
            onClick={() => setSelected(selected === m.id ? null : m.id)} isSelected={selected === m.id} />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:10, color:C.muted, marginBottom:16, fontFamily:F.main, letterSpacing:2, textTransform:"uppercase" }}>
        Playoffs · May 22–24 · All Bo7 · Click any match to predict
      </div>

      <div style={{ overflowX:"auto", paddingBottom:8 }}>
        <div style={{ display:"flex", gap:0, minWidth:900, alignItems:"flex-start" }}>

          <div style={{ flex:1 }}>
            {renderSection("LB Round 1", byRound("LBR1"))}
            {renderSection("UB Quarter Finals", byRound("UBQF"))}
          </div>

          <div style={{ width:24, display:"flex", alignItems:"center", justifyContent:"center", paddingTop:80 }}>
            <div style={{ width:24, height:1, background:"rgba(255,255,255,0.1)" }} />
          </div>

          <div style={{ flex:1 }}>
            {renderSection("LB Round 2", byRound("LBR2"))}
            {renderSection("LB Quarter Finals", byRound("LBQF"))}
          </div>

          <div style={{ width:24, display:"flex", alignItems:"center", justifyContent:"center", paddingTop:60 }}>
            <div style={{ width:24, height:1, background:"rgba(255,255,255,0.1)" }} />
          </div>

          <div style={{ flex:1 }}>
            {renderSection("Semi Finals", byRound("SF"))}
          </div>

          <div style={{ width:24, display:"flex", alignItems:"center", justifyContent:"center", paddingTop:40 }}>
            <div style={{ width:24, height:1, background:"rgba(255,255,255,0.1)" }} />
          </div>

          <div style={{ flex:1 }}>
            {renderSection("Grand Final 🏆", byRound("GF"))}
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
function MatchCard({ match, playerId, predictions, results, onPredict, onSetResult, isAdmin, readOnly }) {
  const pred   = predictions[playerId]?.[match.id];
  const result = results[match.id];
  const locked = isLocked(match);
  const score  = (pred && result) ? calcScore(pred, result) : null;
  const t1 = teamStyle(match.team1), t2 = teamStyle(match.team2);
  const [s1,  setS1]  = useState(pred?.score1??"");
  const [s2,  setS2]  = useState(pred?.score2??"");
  const [as1, setAs1] = useState(result?.score1??"");
  const [as2, setAs2] = useState(result?.score2??"");
  const [hovered, setHovered] = useState(false);

  useEffect(()=>{ setS1(pred?.score1??""); setS2(pred?.score2??""); },[pred?.score1,pred?.score2]);
  useEffect(()=>{ setAs1(result?.score1??""); setAs2(result?.score2??""); },[result?.score1,result?.score2]);

  const submitPred=(winner)=>{ const n1=parseInt(s1),n2=parseInt(s2); onPredict(match.id,{winner,score1:isNaN(n1)?null:n1,score2:isNaN(n2)?null:n2}); };
  const submitResult=()=>{ const n1=parseInt(as1),n2=parseInt(as2); if(isNaN(n1)||isNaN(n2))return; onSetResult(match.id,{winner:n1>n2?match.team1:match.team2,score1:n1,score2:n2}); };

  const borderColor = score===3 ? "rgba(0,255,136,0.4)" : score===1 ? "rgba(232,0,29,0.4)" : score===0&&result ? "rgba(100,100,150,0.3)" : hovered ? "rgba(0,102,255,0.4)" : "rgba(255,255,255,0.08)";
  const glowShadow  = score===3 ? "0 0 15px rgba(0,255,136,0.2)" : score===1 ? "0 0 15px rgba(232,0,29,0.15)" : hovered && !result ? "0 0 20px rgba(0,102,255,0.15)" : "none";

  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{ background:"linear-gradient(135deg, rgba(10,10,35,0.9), rgba(15,15,45,0.9))", border:`1px solid ${borderColor}`, borderRadius:8, padding:"14px 16px", position:"relative", transition:"all 0.2s", boxShadow:glowShadow }}
    >
      {/* Score badge */}
      {score!==null&&<div style={{ position:"absolute",top:10,right:10,borderRadius:5,padding:"2px 9px",background:score===3?C.green:score===1?C.red:"rgba(100,100,150,0.4)",color:score===1?C.white:"#000",fontWeight:700,fontSize:11,fontFamily:F.main,letterSpacing:1 }}>+{score} PTS</div>}
      {locked&&!result&&score===null&&!isAdmin&&<div style={{ position:"absolute",top:10,right:10,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.25)",fontSize:10,borderRadius:5,padding:"2px 9px",fontFamily:F.main,letterSpacing:1 }}>🔒 LOCKED</div>}

      {/* Match info */}
      <div style={{ fontSize:10,color:C.muted,marginBottom:10,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase" }}>
        Group {match.group} · Bo5 · {fmtTime(match.startTime)} KSA
      </div>

      {/* Teams row */}
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <div style={{ flex:1 }}><TeamBadge name={match.team1} /></div>
        {result?(
          <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(4,4,20,0.8)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"4px 14px",flexShrink:0 }}>
            <span style={{ fontSize:22,fontWeight:700,fontFamily:F.main,color:result.winner===match.team1?C.green:C.dim }}>{result.score1}</span>
            <span style={{ color:"rgba(255,255,255,0.08)" }}>:</span>
            <span style={{ fontSize:22,fontWeight:700,fontFamily:F.main,color:result.winner===match.team2?C.green:C.dim }}>{result.score2}</span>
          </div>
        ):(
          <div style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0 }}>
            {!locked&&playerId&&!readOnly?(
              <>
                <input type="number" min={0} max={3} value={s1} onChange={e=>setS1(e.target.value)} placeholder="–"
                  style={{ ...inputStyle({ width:36, textAlign:"center", fontSize:16, fontWeight:700, padding:"4px 0" }) }} />
                <span style={{ color:"rgba(255,255,255,0.08)" }}>:</span>
                <input type="number" min={0} max={3} value={s2} onChange={e=>setS2(e.target.value)} placeholder="–"
                  style={{ ...inputStyle({ width:36, textAlign:"center", fontSize:16, fontWeight:700, padding:"4px 0" }) }} />
              </>
            ):(
              <span style={{ color:"rgba(255,255,255,0.08)",fontFamily:F.main,fontSize:14,padding:"0 8px" }}>vs</span>
            )}
          </div>
        )}
        <div style={{ flex:1,display:"flex",justifyContent:"flex-end" }}><TeamBadge name={match.team2} /></div>
      </div>

      {/* Win buttons */}
      {!locked&&!result&&playerId&&!readOnly&&(
        <div style={{ display:"flex",gap:6,marginTop:10 }}>
          {[{team:match.team1,t:t1},{team:match.team2,t:t2}].map(({team,t})=>(
            <button key={team} onClick={()=>submitPred(team)} style={{
              flex:1, padding:"7px 0", borderRadius:7, cursor:"pointer", fontFamily:F.main, fontWeight:700, fontSize:11, letterSpacing:1, textTransform:"uppercase", transition:"all 0.15s",
              background:pred?.winner===team?t.color:"rgba(255,255,255,0.04)",
              border:`1px solid ${pred?.winner===team?t.color:"rgba(255,255,255,0.1)"}`,
              color:pred?.winner===team?"#000":C.muted,
              boxShadow:pred?.winner===team?`0 0 12px ${t.color}60`:"none",
            }}>{team.split(" ").slice(-1)[0]} wins</button>
          ))}
        </div>
      )}

      {pred&&!result&&!readOnly&&(
        <div style={{ marginTop:8,fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:1 }}>
          YOUR PICK: <span style={{ color:C.muted }}>{pred.winner?.split(" ").slice(-1)[0]}{pred.score1!=null?` (${pred.score1}–${pred.score2})`:""}</span>
        </div>
      )}

      {readOnly&&pred&&(
        <div style={{ marginTop:10,display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1 }}>PREDICTION:</div>
          <div style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"3px 10px",fontSize:12,fontFamily:F.main,fontWeight:700,
            color:result?(calcScore(pred,result)===3?C.green:calcScore(pred,result)===1?C.red:"rgba(255,255,255,0.3)"):C.muted }}>
            {pred.winner?.split(" ").slice(-1)[0]}{pred.score1!=null?` · ${pred.score1}–${pred.score2}`:""}
          </div>
          {result&&<div style={{ fontSize:10,fontFamily:F.main,color:C.dim,letterSpacing:1 }}>{calcScore(pred,result)===3?"✓ EXACT":calcScore(pred,result)===1?"✓ WINNER":"✗ WRONG"}</div>}
        </div>
      )}

      {/* Admin result setter */}
      {isAdmin&&(
        <div style={{ marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
          <span style={{ fontSize:10,color:result?C.red:C.muted,fontFamily:F.main,letterSpacing:1 }}>{result?"✎ EDIT:":"SET:"}</span>
          <input type="number" min={0} max={3} value={as1} onChange={e=>setAs1(e.target.value)} placeholder="T1"
            style={{ ...inputStyle({ width:42, fontSize:13, padding:"4px 6px", border:`1px solid ${result?"rgba(232,0,29,0.4)":"rgba(255,255,255,0.1)"}` }) }} />
          <span style={{ color:"rgba(255,255,255,0.1)" }}>–</span>
          <input type="number" min={0} max={3} value={as2} onChange={e=>setAs2(e.target.value)} placeholder="T2"
            style={{ ...inputStyle({ width:42, fontSize:13, padding:"4px 6px", border:`1px solid ${result?"rgba(232,0,29,0.4)":"rgba(255,255,255,0.1)"}` }) }} />
          <button onClick={submitResult} style={{ padding:"5px 12px",borderRadius:5,border:"none",cursor:"pointer",background:C.red,color:C.white,fontFamily:F.main,fontWeight:700,fontSize:11,letterSpacing:1 }}>{result?"UPDATE ✓":"SET ✓"}</button>
          {result&&<button onClick={()=>onSetResult(match.id,null)} style={{ padding:"5px 10px",borderRadius:5,border:`1px solid rgba(232,0,29,0.3)`,cursor:"pointer",background:"rgba(232,0,29,0.1)",color:C.red,fontFamily:F.main,fontWeight:700,fontSize:11 }}>CLEAR ✕</button>}
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
      <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.red,letterSpacing:2,marginBottom:6,textTransform:"uppercase" }}>⭐ Bonus / Penalty Points</div>
      <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:16 }}>Use negative numbers to deduct points (e.g. -5).</div>
      <div style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px",marginBottom:20 }}>
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
          <button onClick={handleAdd} style={{ padding:"9px 18px",background:C.red,border:"none",borderRadius:7,cursor:"pointer",color:C.white,fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:1 }}>ADD ✓</button>
        </div>
        {error&&<div style={{ color:C.red,fontSize:11,fontFamily:F.main,marginTop:8,letterSpacing:1 }}>⚠ {error}</div>}
      </div>
      {players.map(p=>{
        const myBonus=bonusPoints.filter(b=>b.player_id===p.id); const total=getBonusTotal(p.id);
        if(myBonus.length===0)return null;
        return (
          <div key={p.id} style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
              <div style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:C.white }}>{p.nickname}</div>
              <div style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:total>0?C.green:total<0?C.red:C.muted }}>{total>0?"+":""}{total} bonus pts</div>
            </div>
            {myBonus.map(b=>(
              <div key={b.id} style={{ display:"flex",alignItems:"center",gap:10,paddingTop:6,borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,width:42,textAlign:"center",color:b.amount>0?C.green:C.red }}>{b.amount>0?"+":""}{b.amount}</div>
                <div style={{ flex:1,fontSize:12,color:C.muted,fontFamily:F.body }}>{b.reason||<span style={{ color:C.dim,fontStyle:"italic" }}>No reason</span>}</div>
                <button onClick={()=>onDelete(b.id)} style={{ background:"rgba(232,0,29,0.1)",border:"1px solid rgba(232,0,29,0.3)",borderRadius:5,color:C.red,fontFamily:F.main,fontWeight:700,fontSize:10,padding:"3px 8px",cursor:"pointer" }}>✕</button>
              </div>
            ))}
          </div>
        );
      })}
      {bonusPoints.length===0&&<div style={{ textAlign:"center",color:C.dim,padding:30,fontFamily:F.main,fontSize:12,letterSpacing:1 }}>No adjustments yet</div>}
    </div>
  );
}

// ─── BRACKET TEAM EDITOR (Admin) ──────────────────────────────────────────────
function BracketEditor({ playoffMatches, onUpdateTeams, onSaved }) {
  const [teams, setTeams] = useState(() => {
    const map = {};
    playoffMatches.forEach(m => { map[m.id] = { team1: m.team1, team2: m.team2 }; });
    return map;
  });
  useEffect(() => {
    const map = {};
    playoffMatches.forEach(m => { map[m.id] = { team1: m.team1, team2: m.team2 }; });
    setTeams(map);
  }, [playoffMatches.map(m=>m.team1+m.team2).join()]);

  const save = async () => {
    for (const m of playoffMatches) {
      const t = teams[m.id];
      if (t.team1 !== m.team1 || t.team2 !== m.team2) {
        await onUpdateTeams(m.id, t.team1||"TBD", t.team2||"TBD");
      }
    }
    onSaved?.();
  };

  return (
    <div>
      <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.red,letterSpacing:2,marginBottom:6,textTransform:"uppercase" }}>🏆 Set Playoff Team Names</div>
      <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:16 }}>
        Fill in team names as they qualify. Leave as TBD if not yet decided. Hit SAVE ALL when done.
      </div>
      {playoffMatches.map(m=>(
        <div key={m.id} style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 16px",marginBottom:10 }}>
          <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{m.label}</div>
          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
            <input value={teams[m.id]?.team1||""} onChange={e=>setTeams(t=>({...t,[m.id]:{...t[m.id],team1:e.target.value}}))}
              placeholder="Team 1 (or TBD)"
              style={{ ...inputStyle({ flex:1, minWidth:140, padding:"8px 12px", fontSize:13 }) }} />
            <span style={{ color:C.dim,fontFamily:F.main,fontWeight:700 }}>vs</span>
            <input value={teams[m.id]?.team2||""} onChange={e=>setTeams(t=>({...t,[m.id]:{...t[m.id],team2:e.target.value}}))}
              placeholder="Team 2 (or TBD)"
              style={{ ...inputStyle({ flex:1, minWidth:140, padding:"8px 12px", fontSize:13 }) }} />
          </div>
        </div>
      ))}
      <button onClick={save} style={{ width:"100%",padding:12,background:C.red,border:"none",borderRadius:10,cursor:"pointer",color:C.white,fontFamily:F.main,fontWeight:700,fontSize:14,marginTop:8,letterSpacing:2,textTransform:"uppercase" }}>
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
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, rgba(232,0,29,0.06) 0%, transparent 40%), linear-gradient(225deg, rgba(0,102,255,0.08) 0%, transparent 40%), linear-gradient(180deg, ${C.navy} 0%, #0a0820 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:${C.navy}}::-webkit-scrollbar-thumb{background:${C.red};border-radius:3px}`}</style>
      {/* Streaks */}
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"15%",left:"-10%",width:600,height:3,background:"linear-gradient(90deg,transparent,rgba(232,0,29,0.6),transparent)",transform:"rotate(-35deg)",filter:"blur(8px)" }} />
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"10%",right:"-5%",width:500,height:2,background:"linear-gradient(90deg,transparent,rgba(0,102,255,0.8),transparent)",transform:"rotate(35deg)",filter:"blur(6px)" }} />
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"55%",left:"5%",width:400,height:2,background:"linear-gradient(90deg,transparent,rgba(107,53,255,0.6),transparent)",transform:"rotate(-20deg)",filter:"blur(6px)" }} />

      <div style={{ position:"relative",zIndex:1,textAlign:"center",marginBottom:32 }}>
        <div style={{ fontSize:36,fontWeight:700,fontFamily:F.main,background:`linear-gradient(90deg, ${C.white}, ${C.red})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:4,textTransform:"uppercase" }}>RLCS 2026</div>
        <div style={{ fontSize:16,fontWeight:700,fontFamily:F.main,color:"rgba(255,255,255,0.4)",letterSpacing:4,marginTop:4,textTransform:"uppercase" }}>Paris Major Predictor</div>
        <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:3,marginTop:8,textTransform:"uppercase" }}>May 20–24 · Paris La Défense Arena · $354,000</div>
      </div>

      <div style={{ position:"relative",zIndex:1,background:"rgba(8,8,28,0.95)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:32,width:"100%",maxWidth:400,boxShadow:"0 0 60px rgba(0,0,0,0.5)" }}>
        {/* Tabs */}
        <div style={{ display:"flex",marginBottom:24,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:4 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{ setTab(t.id); setRegErrs({}); setRegMsg(null); setLoginErr(""); setAdminErr(""); }}
              style={{ flex:1,padding:"8px 0",borderRadius:7,border:"none",cursor:"pointer",background:tab===t.id?"rgba(232,0,29,0.15)":"transparent",color:tab===t.id?C.red:C.muted,fontFamily:F.main,fontWeight:700,fontSize:12,letterSpacing:0.5,transition:"all 0.15s" }}>
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
                  style={{ ...inputStyle({ width:"100%", padding:"11px 100px 11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.user?"rgba(232,0,29,0.5)":"rgba(255,255,255,0.1)"}` }) }} autoFocus />
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
                  style={{ ...inputStyle({ width:"100%", padding:"11px 40px 11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.pass?"rgba(232,0,29,0.5)":"rgba(255,255,255,0.1)"}` }) }} />
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
                  style={{ ...inputStyle({ width:"100%", padding:"11px 40px 11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.confirm?"rgba(232,0,29,0.5)":"rgba(255,255,255,0.1)"}` }) }} />
                <PwToggle show={regShowC} onToggle={()=>setRegShowC(v=>!v)} />
              </div>
              <FieldErr msg={regErrs.confirm} />
            </div>

            {/* Private group toggle */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <span style={{ fontSize:12,color:C.muted,fontFamily:F.main,letterSpacing:0.5 }}>Join a private group?</span>
              <div onClick={()=>setRegGroup(v=>!v)}
                style={{ width:40,height:22,borderRadius:11,background:regGroup?"rgba(232,0,29,0.3)":"rgba(255,255,255,0.08)",border:`1px solid ${regGroup?"rgba(232,0,29,0.5)":"rgba(255,255,255,0.12)"}`,cursor:"pointer",position:"relative",transition:"all 0.2s",flexShrink:0 }}>
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
                    style={{ ...inputStyle({ width:"100%", padding:"11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.gcode?"rgba(232,0,29,0.5)":"rgba(255,255,255,0.1)"}` }) }} />
                  <FieldErr msg={regErrs.gcode} />
                </div>
                <div>
                  <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,marginBottom:4,textTransform:"uppercase" }}>Group Password</div>
                  <input type="password" value={regGPass} onChange={e=>{ setRegGPass(e.target.value); setRegErrs(v=>({...v,gpass:null})); }}
                    placeholder="Group password"
                    style={{ ...inputStyle({ width:"100%", padding:"11px 14px", fontSize:14, boxSizing:"border-box", border:`1px solid ${regErrs.gpass?"rgba(232,0,29,0.5)":"rgba(255,255,255,0.1)"}` }) }} />
                  <FieldErr msg={regErrs.gpass} />
                </div>
              </>
            )}

            {regMsg&&<div style={{ fontSize:12,fontFamily:F.main,letterSpacing:0.5,color:regMsg.ok?C.green:C.red }}>{regMsg.ok?"✓":"⚠"} {regMsg.text}</div>}

            <button onClick={handleRegister} disabled={regLoading||rlCountdown>0}
              style={{ padding:"13px 0",background:(regLoading||rlCountdown>0)?"rgba(232,0,29,0.4)":`linear-gradient(90deg, ${C.red}, #AA0015)`,border:"none",borderRadius:8,color:C.white,fontWeight:700,fontFamily:F.main,fontSize:14,cursor:(regLoading||rlCountdown>0)?"default":"pointer",letterSpacing:2,textTransform:"uppercase",marginTop:2 }}>
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
              style={{ padding:"13px 0",background:loginLoading?"rgba(0,102,255,0.4)":`linear-gradient(90deg, ${C.blue}, #0044CC)`,border:"none",borderRadius:8,color:C.white,fontWeight:700,fontFamily:F.main,fontSize:14,cursor:loginLoading?"default":"pointer",letterSpacing:2,textTransform:"uppercase" }}>
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
              style={{ padding:"13px 0",background:`linear-gradient(90deg, ${C.red}, #AA0015)`,border:"none",borderRadius:8,color:C.white,fontWeight:700,fontFamily:F.main,fontSize:14,cursor:"pointer",letterSpacing:2,textTransform:"uppercase" }}>
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
    <div style={{ minHeight:"100vh", background:`linear-gradient(180deg, ${C.navy} 0%, #0a0820 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
      <div style={{ fontSize:22,fontWeight:700,fontFamily:F.main,background:`linear-gradient(90deg, ${C.white}, ${C.red})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:4,textTransform:"uppercase" }}>RLCS 2026 · Paris Major</div>
      <div style={{ width:36,height:36,border:`3px solid rgba(255,255,255,0.08)`,borderTop:`3px solid ${C.red}`,borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:C.muted,fontSize:11,fontFamily:F.main,letterSpacing:3,textTransform:"uppercase" }}>Loading…</div>
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
  const [grpCopied,        setGrpCopied]        = useState(false);
  // Admin groups
  const [newGrpName,       setNewGrpName]       = useState("");
  const [newGrpCode,       setNewGrpCode]       = useState("");
  const [newGrpPass,       setNewGrpPass]       = useState("");
  const [newGrpMsg,        setNewGrpMsg]        = useState(null);
  const [expandedGrp,      setExpandedGrp]      = useState(null);
  const [grpViewingPlayer, setGrpViewingPlayer] = useState(null);
  const [grpOthersSearch,  setGrpOthersSearch]  = useState("");
  // Toasts
  const [toasts,           setToasts]           = useState([]);
  // Admin players sub-tab
  const [playerSort,       setPlayerSort]       = useState("score");
  const [moveGrpOpen,      setMoveGrpOpen]      = useState(null);
  // Admin activity sub-tab
  const [activityFeed,     setActivityFeed]     = useState([]);
  const [recentRegs,       setRecentRegs]       = useState([]);

  const myIdRef = useRef(authId);
  useEffect(()=>{ myIdRef.current=authId; },[authId]);

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

  const getPredScore =(pid)=>ALL_MATCHES.reduce((t,m)=>t+calcScore(predictions[pid]?.[m.id],results[m.id]),0);
  const getBonusTotal=(pid)=>bonusPoints.filter(b=>b.player_id===pid).reduce((t,b)=>t+b.amount,0);
  const getTotalScore=(pid)=>getPredScore(pid)+getBonusTotal(pid);
  const leaderboard=[...players].map(p=>({...p,score:getTotalScore(p.id),predScore:getPredScore(p.id),bonus:getBonusTotal(p.id)})).sort((a,b)=>b.score-a.score);
  const myPlayer=players.find(p=>p.id===authId);
  const myGroup=myPlayer?.group_id&&myPlayer.group_id!=="public"?groups.find(g=>g.id===myPlayer.group_id)||null:null;
  const filteredGroupMatches=GROUP_MATCHES.filter(m=>filterGroup==="all"||m.group===filterGroup);

  if(loading)return <LoadingScreen />;
  if(!authId&&!isAdmin)return <LoginScreen players={players} onLogin={id=>{setAuthId(id);setIsAdmin(false);}} onAdminLogin={()=>{setIsAdmin(true);setAuthId(null);}} adminHash={adminHash} />;

  const NAV=[
    {id:"predict",     icon:"🎯",label:"Group Stage"},
    {id:"playoffs",    icon:"🏆",label:"Playoffs"},
    ...(myGroup&&!isAdmin?[{id:"mygroup",icon:"🏠",label:"My Group"}]:[]),
    {id:"leaderboard", icon:"📊",label:"Standings"},
    {id:"others",      icon:"👁", label:"Others' Picks"},
    ...(isAdmin?[{id:"admin",icon:"⚙️",label:"Admin"}]:[]),
  ];

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, rgba(232,0,29,0.06) 0%, transparent 40%), linear-gradient(225deg, rgba(0,102,255,0.08) 0%, transparent 40%), linear-gradient(180deg, ${C.navy} 0%, #0a0820 100%)`, color:C.white, fontFamily:F.body, position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:${C.navy}}::-webkit-scrollbar-thumb{background:${C.red};border-radius:3px}`}</style>

      {/* Background streaks */}
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"15%",left:"-10%",width:600,height:3,background:"linear-gradient(90deg,transparent,rgba(232,0,29,0.6),transparent)",transform:"rotate(-35deg)",filter:"blur(8px)" }} />
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"10%",right:"-5%",width:500,height:2,background:"linear-gradient(90deg,transparent,rgba(0,102,255,0.8),transparent)",transform:"rotate(35deg)",filter:"blur(6px)" }} />
      <div style={{ position:"fixed",pointerEvents:"none",zIndex:0,top:"55%",left:"5%",width:400,height:2,background:"linear-gradient(90deg,transparent,rgba(107,53,255,0.6),transparent)",transform:"rotate(-20deg)",filter:"blur(6px)" }} />

      {/* HEADER */}
      <div style={{ position:"sticky",top:0,zIndex:100,background:"rgba(4,4,20,0.95)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid rgba(232,0,29,0.3)`,padding:"14px 20px" }}>
        <div style={{ maxWidth:900,margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:10 }}>
            <div>
              <div style={{ fontSize:20,fontWeight:700,fontFamily:F.main,background:`linear-gradient(90deg, ${C.white}, ${C.red})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:3,textTransform:"uppercase" }}>RLCS 2026 · Paris Major</div>
              <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:3,textTransform:"uppercase",marginTop:2 }}>May 20–24 · Paris La Défense Arena · $354,000</div>
            </div>
            {/* Profile Pill Dropdown */}
            <div ref={pillRef} style={{ position:"relative" }}>
              <div onClick={()=>setPillOpen(v=>!v)} style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:`1px solid ${isAdmin?"rgba(232,0,29,0.4)":"rgba(0,102,255,0.3)"}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",userSelect:"none" }}>
                <div style={{ width:24,height:24,borderRadius:6,background:isAdmin?`rgba(232,0,29,0.2)`:`rgba(0,102,255,0.15)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:isAdmin?C.red:C.blue,fontFamily:F.main }}>{isAdmin?"A":myPlayer?.nickname[0].toUpperCase()}</div>
                <span style={{ fontSize:12,fontFamily:F.main,fontWeight:700,color:isAdmin?C.red:C.white,letterSpacing:1 }}>{isAdmin?"ADMIN":myPlayer?.nickname}</span>
                <span style={{ fontSize:9,color:C.dim }}>{pillOpen?"▲":"▼"}</span>
              </div>
              {pillOpen&&(
                <div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,background:"rgba(8,8,28,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:8,minWidth:200,boxShadow:"0 8px 30px rgba(0,0,0,0.6)",zIndex:999 }}>
                  {/* User info */}
                  <div style={{ padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:6 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ width:36,height:36,borderRadius:8,background:isAdmin?"rgba(232,0,29,0.2)":"rgba(0,102,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:isAdmin?C.red:C.blue,fontFamily:F.main,flexShrink:0 }}>{isAdmin?"A":myPlayer?.nickname[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:0.5 }}>{isAdmin?"ADMIN":myPlayer?.nickname}</div>
                        {isAdmin
                          ? <div style={{ fontSize:10,color:C.red,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase",marginTop:2 }}>⚙ Full Access</div>
                          : <div style={{ fontSize:10,color:myGroup?C.purple:C.dim,fontFamily:F.main,letterSpacing:0.5,marginTop:2 }}>{myGroup?`🏠 ${myGroup.name}`:"Public"}</div>
                        }
                      </div>
                      {!isAdmin&&(
                        <div style={{ marginLeft:"auto",background:"rgba(0,102,255,0.15)",border:"1px solid rgba(0,102,255,0.3)",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:F.main,color:C.blue }}>{getTotalScore(authId)} pts</div>
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
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(232,0,29,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex",gap:2,flexWrap:"wrap" }}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{ padding:"7px 14px",borderRadius:6,border:"none",cursor:"pointer",background:page===n.id?"rgba(232,0,29,0.1)":"transparent",color:page===n.id?C.white:C.muted,fontFamily:F.main,fontWeight:700,fontSize:12,letterSpacing:1,textTransform:"uppercase",borderBottom:page===n.id?`2px solid ${C.red}`:"2px solid transparent",transition:"all 0.15s" }}>{n.icon} {n.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div style={{ position:"relative",zIndex:1,maxWidth:900,margin:"0 auto",padding:"20px 16px" }}>

        {/* GROUP STAGE */}
        {page==="predict"&&(
          <div>
            <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
              {["all","A","B","C","D"].map(g=>(
                <button key={g} onClick={()=>setFilterGroup(g)} style={{
                  padding:"6px 14px",borderRadius:6,border:`1px solid ${filterGroup===g?"transparent":"rgba(255,255,255,0.1)"}`,cursor:"pointer",fontFamily:F.main,fontWeight:700,fontSize:12,letterSpacing:1,textTransform:"uppercase",transition:"all 0.15s",
                  background:filterGroup===g?(g==="all"?C.blue:C.red):"rgba(255,255,255,0.04)",
                  color:filterGroup===g?C.white:"#667799",
                  boxShadow:filterGroup===g?(g==="all"?"0 0 15px rgba(0,102,255,0.5)":"0 0 15px rgba(232,0,29,0.5)"):"none",
                }}>{g==="all"?"All Groups":`Group ${g}`}</button>
              ))}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {filteredGroupMatches.map(m=>(
                <MatchCard key={m.id} match={m} playerId={isAdmin?null:authId} predictions={predictions}
                  results={results} onPredict={handlePredict} onSetResult={handleSetResult} isAdmin={false} readOnly={isAdmin} />
              ))}
            </div>
          </div>
        )}

        {/* PLAYOFFS */}
        {page==="playoffs"&&(
          <PlayoffsPage playoffMatches={playoffMatches} predictions={predictions} results={results}
            playerId={isAdmin?null:authId} onPredict={handlePredict} />
        )}

        {/* MY GROUP */}
        {page==="mygroup"&&myGroup&&(()=>{
          const grpMembers=players.filter(p=>p.group_id===myGroup.id);
          const grpLb=[...grpMembers].map(p=>({...p,score:getTotalScore(p.id),predScore:getPredScore(p.id),bonus:getBonusTotal(p.id)})).sort((a,b)=>b.score-a.score);
          return (
            <div>
              {/* Header */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:24,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:2,textTransform:"uppercase" }}>🏠 {myGroup.name}</div>
                <div style={{ fontSize:12,color:C.muted,fontFamily:F.main,marginTop:4,letterSpacing:1 }}>Members: {grpMembers.length}</div>
              </div>

              {/* Share box */}
              <div style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase",marginBottom:4 }}>Share this group</div>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"4px 14px",fontSize:13,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:1 }}>{myGroup.id}</div>
                    <button onClick={()=>{ navigator.clipboard.writeText(`Join my RLCS 2026 Paris Major prediction group! Code: ${myGroup.id}`); setGrpCopied(true); setTimeout(()=>setGrpCopied(false),2000); }}
                      style={{ padding:"5px 14px",borderRadius:6,border:`1px solid ${grpCopied?"rgba(0,255,136,0.4)":"rgba(255,255,255,0.1)"}`,background:grpCopied?"rgba(0,255,136,0.1)":"rgba(255,255,255,0.04)",color:grpCopied?C.green:C.muted,fontFamily:F.main,fontWeight:700,fontSize:11,cursor:"pointer",letterSpacing:1,transition:"all 0.2s" }}>
                      {grpCopied?"✓ Copied!":"Copy Invite"}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:1 }}>Share the code + your group password with friends</div>
              </div>

              {/* Group leaderboard */}
              <div style={{ fontSize:10,color:C.muted,marginBottom:10,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase" }}>🏆 Group Standings</div>
              {grpLb.map((p,i)=>{
                const bg=i===0?"linear-gradient(135deg, rgba(232,0,29,0.15), rgba(10,10,35,0.95))":i===1?"linear-gradient(135deg, rgba(0,102,255,0.1), rgba(10,10,35,0.95))":i===2?"linear-gradient(135deg, rgba(107,53,255,0.1), rgba(10,10,35,0.95))":"rgba(8,8,28,0.9)";
                const borderCol=p.id===authId?"rgba(0,102,255,0.3)":i===0?"rgba(232,0,29,0.3)":i===1?"rgba(0,102,255,0.2)":i===2?"rgba(107,53,255,0.2)":"rgba(255,255,255,0.06)";
                return (
                  <div key={p.id} style={{ background:bg,border:`1px solid ${borderCol}`,borderRadius:12,padding:"14px 18px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                      <span style={{ fontSize:22,width:30,textAlign:"center" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":<span style={{ fontSize:13,color:C.dim,fontFamily:F.main,fontWeight:700 }}>{`#${i+1}`}</span>}</span>
                      <div>
                        <div style={{ fontSize:15,fontWeight:700,fontFamily:F.main,display:"flex",alignItems:"center",gap:6,textTransform:"uppercase",letterSpacing:1 }}>
                          {p.nickname}{p.id===authId&&<span style={{ fontSize:9,color:C.blue,background:"rgba(0,102,255,0.2)",padding:"1px 7px",borderRadius:4,border:"1px solid rgba(0,102,255,0.4)",letterSpacing:1 }}>YOU</span>}
                        </div>
                        <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,marginTop:2,display:"flex",gap:8,letterSpacing:1 }}>
                          <span>{Object.keys(predictions[p.id]||{}).length}/{ALL_MATCHES.length} predicted</span>
                          {p.bonus!==0&&<span style={{ color:p.bonus>0?C.green:C.red }}>{p.bonus>0?"+":""}{p.bonus} bonus</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:30,fontWeight:700,fontFamily:F.main,color:i===0?C.red:C.white }}>{p.score}<span style={{ fontSize:12,color:C.muted,marginLeft:4,letterSpacing:1 }}>pts</span></div>
                      {p.bonus!==0&&<div style={{ fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:0.5 }}>{p.predScore} pred {p.bonus>0?"+":""}{p.bonus} bonus</div>}
                    </div>
                  </div>
                );
              })}

              {/* Group breakdown table */}
              {Object.keys(results).length>0&&(
                <div style={{ marginTop:24,marginBottom:24 }}>
                  <div style={{ fontSize:10,color:C.muted,letterSpacing:2,marginBottom:10,fontFamily:F.main,textTransform:"uppercase" }}>Match Breakdown</div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:F.main }}>
                      <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                        <th style={{ textAlign:"left",padding:"5px 8px",color:C.muted,letterSpacing:1 }}>Match</th>
                        <th style={{ textAlign:"center",padding:"5px 8px",color:C.muted,letterSpacing:1 }}>Score</th>
                        {grpMembers.map(p=><th key={p.id} style={{ textAlign:"center",padding:"5px 8px",color:p.id===authId?C.blue:C.muted,letterSpacing:0.5 }}>{p.nickname}</th>)}
                      </tr></thead>
                      <tbody>
                        {ALL_MATCHES.filter(m=>results[m.id]).map(m=>(
                          <tr key={m.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding:"5px 8px",color:C.dim,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.team1?.split(" ").pop()} vs {m.team2?.split(" ").pop()}</td>
                            <td style={{ textAlign:"center",padding:"5px 8px",color:C.muted }}>{results[m.id].score1}–{results[m.id].score2}</td>
                            {grpMembers.map(p=>{const s=calcScore(predictions[p.id]?.[m.id],results[m.id]);const has=!!predictions[p.id]?.[m.id];return<td key={p.id} style={{ textAlign:"center",padding:"5px 8px",fontWeight:700,color:!has?"rgba(255,255,255,0.1)":s===3?C.green:s===1?C.red:"rgba(255,255,255,0.25)" }}>{has?`+${s}`:"—"}</td>;})}
                          </tr>
                        ))}
                        {grpMembers.some(p=>getBonusTotal(p.id)!==0)&&(
                          <tr style={{ borderTop:"2px solid rgba(255,255,255,0.08)" }}>
                            <td colSpan={2} style={{ padding:"5px 8px",color:C.red,fontFamily:F.main,fontSize:11,letterSpacing:1 }}>⭐ Bonus</td>
                            {grpMembers.map(p=>{const b=getBonusTotal(p.id);return<td key={p.id} style={{ textAlign:"center",padding:"5px 8px",fontWeight:700,color:b>0?C.green:b<0?C.red:C.dim,fontFamily:F.main }}>{b!==0?(b>0?"+":"")+b:"—"}</td>;})}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Group others' picks */}
              <div style={{ fontSize:10,color:C.muted,marginBottom:10,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase" }}>👁 Group Members' Picks</div>
              <input value={grpOthersSearch} onChange={e=>{ setGrpOthersSearch(e.target.value); setGrpViewingPlayer(null); }} placeholder="Search member…"
                style={{ ...inputStyle({ width:"100%", padding:"9px 14px", fontSize:13, marginBottom:10, boxSizing:"border-box" }) }} />
              <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
                {grpMembers.filter(p=>p.id!==authId&&(!grpOthersSearch||p.nickname.toLowerCase().includes(grpOthersSearch.toLowerCase()))).map(p=>(
                  <button key={p.id} onClick={()=>setGrpViewingPlayer(grpViewingPlayer===p.id?null:p.id)} style={{
                    padding:"8px 16px",borderRadius:8,cursor:"pointer",fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:0.5,transition:"all 0.15s",
                    border:`1px solid ${grpViewingPlayer===p.id?"rgba(0,102,255,0.5)":"rgba(255,255,255,0.1)"}`,
                    background:grpViewingPlayer===p.id?"rgba(0,102,255,0.15)":"rgba(255,255,255,0.04)",
                    color:grpViewingPlayer===p.id?"#4488FF":C.muted,
                  }}>{p.nickname}</button>
                ))}
              </div>
              {grpViewingPlayer&&(()=>{
                const vp=players.find(p=>p.id===grpViewingPlayer);
                const lockedMatches=[...GROUP_MATCHES,...playoffMatches].filter(m=>isLocked(m)&&!isTBDTeam(m.team1));
                return (
                  <div>
                    <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.white,marginBottom:4,letterSpacing:1,textTransform:"uppercase" }}>{vp?.nickname}'s predictions</div>
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {lockedMatches.map(m=>(
                        <MatchCard key={m.id} match={m} playerId={grpViewingPlayer} predictions={predictions}
                          results={results} onPredict={()=>{}} onSetResult={()=>{}} isAdmin={false} readOnly={true} />
                      ))}
                    </div>
                  </div>
                );
              })()}
              {!grpViewingPlayer&&grpMembers.filter(p=>p.id!==authId).length>0&&<div style={{ textAlign:"center",color:"rgba(255,255,255,0.1)",padding:30,fontFamily:F.main,fontSize:13,letterSpacing:2,textTransform:"uppercase" }}>↑ Select a member above</div>}
              {grpMembers.filter(p=>p.id!==authId).length===0&&<div style={{ textAlign:"center",color:C.dim,padding:30,fontFamily:F.main,fontSize:12 }}>You're the only member so far. Share the group code to invite friends!</div>}
            </div>
          );
        })()}

        {/* LEADERBOARD */}
        {page==="leaderboard"&&(
          <div>
            <div style={{ fontSize:10,color:C.muted,marginBottom:12,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase" }}>🟢 3 pts = exact score · 🔴 1 pt = correct winner · ⭐ bonus points</div>
            <input value={lbSearch} onChange={e=>setLbSearch(e.target.value)} placeholder="Search player…"
              style={{ ...inputStyle({ width:"100%", padding:"9px 14px", fontSize:13, marginBottom:12, boxSizing:"border-box" }) }} />
            {leaderboard.map((p,i)=>{
              if(lbSearch&&!p.nickname.toLowerCase().includes(lbSearch.toLowerCase()))return null;
              const bg = i===0 ? "linear-gradient(135deg, rgba(232,0,29,0.15), rgba(10,10,35,0.95))"
                       : i===1 ? "linear-gradient(135deg, rgba(0,102,255,0.1), rgba(10,10,35,0.95))"
                       : i===2 ? "linear-gradient(135deg, rgba(107,53,255,0.1), rgba(10,10,35,0.95))"
                       : "rgba(8,8,28,0.9)";
              const borderCol = p.id===authId ? "rgba(0,102,255,0.3)" : i===0 ? "rgba(232,0,29,0.3)" : i===1 ? "rgba(0,102,255,0.2)" : i===2 ? "rgba(107,53,255,0.2)" : "rgba(255,255,255,0.06)";
              const pGrp = p.group_id&&p.group_id!=="public" ? groups.find(g=>g.id===p.group_id) : null;
              const grpLabel = pGrp ? (isAdmin||p.group_id===myGroup?.id ? pGrp.name : "Private") : null;
              return (
              <div key={p.id} style={{ background:bg, border:`1px solid ${borderCol}`, borderRadius:12, padding:"14px 18px", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                  <span style={{ fontSize:22,width:30,textAlign:"center" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":<span style={{ fontSize:13,color:C.dim,fontFamily:F.main,fontWeight:700 }}>{`#${i+1}`}</span>}</span>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700,fontFamily:F.main,display:"flex",alignItems:"center",gap:6,textTransform:"uppercase",letterSpacing:1,flexWrap:"wrap" }}>
                      {p.nickname}
                      {p.id===authId&&<span style={{ fontSize:9,color:C.blue,background:"rgba(0,102,255,0.2)",padding:"1px 7px",borderRadius:4,border:"1px solid rgba(0,102,255,0.4)",letterSpacing:1 }}>YOU</span>}
                      {grpLabel&&<span style={{ fontSize:9,color:C.purple,background:"rgba(107,53,255,0.15)",padding:"1px 7px",borderRadius:4,border:"1px solid rgba(107,53,255,0.3)",letterSpacing:1,fontWeight:600 }}>🏠 {grpLabel}</span>}
                    </div>
                    <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,marginTop:2,display:"flex",gap:8,letterSpacing:1 }}>
                      <span>{Object.keys(predictions[p.id]||{}).length}/{ALL_MATCHES.length} predicted</span>
                      {p.bonus!==0&&<span style={{ color:p.bonus>0?C.green:C.red }}>{p.bonus>0?"+":""}{p.bonus} bonus</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:30,fontWeight:700,fontFamily:F.main,color:i===0?C.red:C.white }}>{p.score}<span style={{ fontSize:12,color:C.muted,marginLeft:4,letterSpacing:1 }}>pts</span></div>
                  {p.bonus!==0&&<div style={{ fontSize:10,color:C.dim,fontFamily:F.main,letterSpacing:0.5 }}>{p.predScore} pred {p.bonus>0?"+":""}{p.bonus} bonus</div>}
                </div>
              </div>
              );
            })}
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
                          <td style={{ padding:"5px 8px",color:C.dim,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.team1?.split(" ").pop()} vs {m.team2?.split(" ").pop()}</td>
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
          <div>
            <div style={{ fontSize:10,color:C.muted,marginBottom:12,fontFamily:F.main,letterSpacing:2,textTransform:"uppercase" }}>👁 Only visible for matches that have already started</div>
            <input value={othersSearch} onChange={e=>{ setOthersSearch(e.target.value); setViewingPlayer(null); }}
              placeholder="Search player name…"
              style={{ ...inputStyle({ width:"100%", padding:"9px 14px", fontSize:13, marginBottom:12, boxSizing:"border-box" }) }} />
            <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
              {players.filter(p=>p.id!==authId&&(!othersSearch||p.nickname.toLowerCase().includes(othersSearch.toLowerCase()))).map(p=>(
                <button key={p.id} onClick={()=>setViewingPlayer(viewingPlayer===p.id?null:p.id)} style={{
                  padding:"8px 16px",borderRadius:8,cursor:"pointer",fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:0.5,transition:"all 0.15s",
                  border:`1px solid ${viewingPlayer===p.id?"rgba(0,102,255,0.5)":"rgba(255,255,255,0.1)"}`,
                  background:viewingPlayer===p.id?"rgba(0,102,255,0.15)":"rgba(255,255,255,0.04)",
                  color:viewingPlayer===p.id?"#4488FF":C.muted,
                }}>
                  {p.nickname}<span style={{ fontSize:10,color:viewingPlayer===p.id?C.blue:C.dim,marginLeft:6 }}>{getTotalScore(p.id)} pts</span>
                </button>
              ))}
              {players.filter(p=>p.id!==authId).length===0&&<div style={{ color:C.dim,fontSize:13,fontFamily:F.main }}>No other players yet</div>}
            </div>
            {viewingPlayer&&(()=>{
              const vp=players.find(p=>p.id===viewingPlayer);
              const lockedMatches=[...GROUP_MATCHES,...playoffMatches].filter(m=>isLocked(m)&&!isTBDTeam(m.team1));
              return (
                <div>
                  <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.white,marginBottom:4,letterSpacing:1,textTransform:"uppercase" }}>{vp?.nickname}'s predictions</div>
                  <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:14 }}>
                    {lockedMatches.filter(m=>predictions[viewingPlayer]?.[m.id]).length} predictions · {getTotalScore(viewingPlayer)} pts
                    {getBonusTotal(viewingPlayer)!==0&&<span style={{ color:getBonusTotal(viewingPlayer)>0?C.green:C.red }}> (incl. {getBonusTotal(viewingPlayer)>0?"+":""}{getBonusTotal(viewingPlayer)} bonus)</span>}
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {lockedMatches.map(m=>(
                      <MatchCard key={m.id} match={m} playerId={viewingPlayer} predictions={predictions}
                        results={results} onPredict={()=>{}} onSetResult={()=>{}} isAdmin={false} readOnly={true} />
                    ))}
                  </div>
                </div>
              );
            })()}
            {!viewingPlayer&&<div style={{ textAlign:"center",color:"rgba(255,255,255,0.1)",padding:40,fontFamily:F.main,fontSize:13,letterSpacing:2,textTransform:"uppercase" }}>↑ Select a player above</div>}
          </div>
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
                <div key={label} style={{ background:"rgba(10,10,35,0.9)",border:"1px solid rgba(232,0,29,0.2)",borderRadius:8,padding:16,flex:1,minWidth:110 }}>
                  <div style={{ fontSize:28,fontWeight:700,fontFamily:F.main,color:C.white }}>{val}</div>
                  <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase",marginTop:4 }}>{icon} {label}</div>
                </div>
              ))}
            </div>

            {/* Sub-tabs */}
            <div style={{ display:"flex",gap:4,marginBottom:24,background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:4,flexWrap:"wrap" }}>
              {[{id:"players",label:"👥 Players"},{id:"groups",label:"🏠 Groups"},{id:"bracket",label:"🏆 Bracket"},{id:"results",label:"🎯 Results"},{id:"bonus",label:"⭐ Bonus"},{id:"activity",label:"📊 Activity"}].map(t=>(
                <button key={t.id} onClick={()=>setAdminTab(t.id)} style={{ flex:1,padding:"9px 0",borderRadius:7,border:"none",cursor:"pointer",background:adminTab===t.id?"rgba(232,0,29,0.1)":"transparent",color:adminTab===t.id?C.red:C.muted,fontFamily:F.main,fontWeight:700,fontSize:11,transition:"all 0.15s",minWidth:80,letterSpacing:0.5,textTransform:"uppercase" }}>{t.label}</button>
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
                      <div key={p.id} style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 14px",marginBottom:8 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                          <div style={{ width:32,height:32,borderRadius:8,background:"rgba(232,0,29,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:C.red,fontFamily:F.main,flexShrink:0 }}>{p.nickname[0].toUpperCase()}</div>
                          <div style={{ flex:1,minWidth:120 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                              <span style={{ fontSize:13,fontWeight:700,fontFamily:F.main,color:C.white }}>{p.nickname}</span>
                              {pGrpObj&&<span style={{ fontSize:9,color:C.purple,background:"rgba(107,53,255,0.15)",padding:"1px 7px",borderRadius:4,border:"1px solid rgba(107,53,255,0.3)",letterSpacing:1,fontFamily:F.main,fontWeight:600 }}>🏠 {pGrpObj.name}</span>}
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
                                <button onClick={()=>setMoveGrpOpen(p.id)} style={{ background:"rgba(107,53,255,0.1)",border:"1px solid rgba(107,53,255,0.25)",borderRadius:6,color:C.purple,fontFamily:F.main,fontWeight:700,fontSize:10,padding:"4px 8px",cursor:"pointer",letterSpacing:0.5 }}>🏠 Group</button>
                              )}
                              <button onClick={()=>setEditNick(n=>({...n,[p.id]:p.nickname}))} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:C.muted,fontFamily:F.main,fontWeight:700,fontSize:10,padding:"4px 8px",cursor:"pointer" }}>Rename</button>
                              <button onClick={()=>handleDeletePlayer(p.id)} style={{ background:"rgba(232,0,29,0.1)",border:"1px solid rgba(232,0,29,0.3)",borderRadius:6,color:C.red,fontFamily:F.main,fontWeight:700,fontSize:10,padding:"4px 8px",cursor:"pointer" }}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display:"flex",gap:8,marginTop:10 }}>
                    <input value={newNick} onChange={e=>setNewNick(e.target.value)} placeholder="New player nickname…" onKeyDown={e=>{if(e.key==="Enter")handleAddPlayer();}}
                      style={{ ...inputStyle({ flex:1, border:"1px dashed rgba(255,255,255,0.15)", padding:"10px 14px", fontSize:13 }) }} />
                    <button onClick={handleAddPlayer} style={{ padding:"10px 20px",background:C.red,border:"none",borderRadius:10,cursor:"pointer",color:C.white,fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:1 }}>+ ADD</button>
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
                    <div key={label} style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 20px",flex:1,minWidth:120 }}>
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
                    <div key={g.id} style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                        <div onClick={()=>setExpandedGrp(isExpanded?null:g.id)} style={{ flex:1,cursor:"pointer" }}>
                          <div style={{ fontSize:14,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:0.5 }}>{g.name}</div>
                          <div style={{ fontSize:10,color:C.muted,fontFamily:F.main,marginTop:2,letterSpacing:1 }}>
                            Code: <span style={{ color:C.white }}>{g.id}</span> · {members.length} member{members.length!==1?"s":""} · {new Date(g.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button onClick={()=>{ navigator.clipboard.writeText(g.id); }}
                          style={{ padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:C.muted,fontFamily:F.main,fontWeight:700,fontSize:11,cursor:"pointer",letterSpacing:0.5 }}>
                          Copy Code
                        </button>
                        <button onClick={()=>handleDeleteGroup(g.id)}
                          style={{ padding:"4px 10px",borderRadius:6,border:"1px solid rgba(232,0,29,0.3)",background:"rgba(232,0,29,0.1)",color:C.red,fontFamily:F.main,fontWeight:700,fontSize:11,cursor:"pointer" }}>
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
                                  <span key={m.id} style={{ padding:"3px 10px",borderRadius:6,background:"rgba(107,53,255,0.1)",border:"1px solid rgba(107,53,255,0.2)",color:C.white,fontSize:12,fontFamily:F.main }}>
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
                  <div style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px",display:"flex",flexDirection:"column",gap:12 }}>
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
                    <button onClick={handleCreateGroup} style={{ padding:"10px 0",background:C.red,border:"none",borderRadius:8,cursor:"pointer",color:C.white,fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:1,textTransform:"uppercase" }}>
                      Create Group ✓
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bracket Teams */}
            {adminTab==="bracket"&&(
              <BracketEditor playoffMatches={playoffMatches} onUpdateTeams={handleUpdateBracketTeams} onSaved={()=>toast("Bracket teams saved","success")} />
            )}

            {/* Results */}
            {adminTab==="results"&&(
              <div>
                <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:14 }}>Update any result even after it's set.</div>
                <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
                  {["all","A","B","C","D","Playoffs"].map(g=>(
                    <button key={g} onClick={()=>setFilterGroup(g)} style={{
                      padding:"6px 14px",borderRadius:6,border:`1px solid ${filterGroup===g?"transparent":"rgba(255,255,255,0.1)"}`,cursor:"pointer",fontFamily:F.main,fontWeight:700,fontSize:12,letterSpacing:1,textTransform:"uppercase",transition:"all 0.15s",
                      background:filterGroup===g?C.red:"rgba(255,255,255,0.04)",
                      color:filterGroup===g?C.white:"#667799",
                      boxShadow:filterGroup===g?"0 0 12px rgba(232,0,29,0.4)":"none",
                    }}>
                      {g==="all"?"All":g==="Playoffs"?"Playoffs":`Group ${g}`}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {(filterGroup==="Playoffs"?playoffMatches.filter(m=>!isTBDTeam(m.team1)):GROUP_MATCHES.filter(m=>filterGroup==="all"||m.group===filterGroup)).map(m=>(
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
                        <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",marginBottom:6,borderRadius:8,background:"rgba(8,8,28,0.8)",borderLeft:`3px solid ${C.blue}` }}>
                          <div style={{ width:28,height:28,borderRadius:6,background:"rgba(0,102,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:C.blue,fontFamily:F.main,flexShrink:0 }}>{nick[0].toUpperCase()}</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:12,fontWeight:700,fontFamily:F.main,color:C.white }}>{nick}</div>
                            <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginTop:1 }}>
                              predicted <span style={{ color:C.white }}>{pred.winner?.split(" ").slice(-1)[0]}</span>{match?` in ${match.label}`:""}
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
                        <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",marginBottom:6,borderRadius:8,background:"rgba(8,8,28,0.8)",borderLeft:`3px solid ${C.green}` }}>
                          <div style={{ width:28,height:28,borderRadius:6,background:"rgba(0,255,136,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:C.green,fontFamily:F.main,flexShrink:0 }}>{p.nickname[0].toUpperCase()}</div>
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
              <div style={{ background:"rgba(8,8,28,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px",display:"flex",flexDirection:"column",gap:10 }}>
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
                <button onClick={handleChangeAdminPassword} style={{ padding:"10px 0",background:C.red,border:"none",borderRadius:8,cursor:"pointer",color:C.white,fontFamily:F.main,fontWeight:700,fontSize:13,letterSpacing:1,textTransform:"uppercase",marginTop:4 }}>
                  Update Password ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHANGE GROUP MODAL */}
      {changeGroupModal&&(
        <div onClick={()=>setChangeGroupModal(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"rgba(8,8,28,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:32,width:"100%",maxWidth:380,boxShadow:"0 0 60px rgba(0,0,0,0.8)" }}>
            <div style={{ fontSize:16,fontWeight:700,fontFamily:F.main,color:C.white,letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>🏠 Change Group</div>
            <div style={{ fontSize:11,color:C.muted,fontFamily:F.body,marginBottom:20 }}>
              {myGroup ? `Currently in: ${myGroup.name}` : "Currently in: Public"}<br/>Enter the code and password for your new group.
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
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
                <button onClick={handleChangeGroup} disabled={cgLoading} style={{ flex:2,padding:"10px 0",background:cgLoading?"rgba(232,0,29,0.4)":`linear-gradient(90deg, ${C.red}, #AA0015)`,border:"none",borderRadius:8,color:C.white,fontFamily:F.main,fontWeight:700,fontSize:13,cursor:cgLoading?"default":"pointer",letterSpacing:1,textTransform:"uppercase" }}>
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
          <div key={t.id} style={{ minWidth:280,maxWidth:360,background:"rgba(8,8,28,0.97)",borderLeft:`3px solid ${t.type==="error"?C.red:t.type==="success"?C.green:C.blue}`,padding:"12px 16px",borderRadius:6,color:C.white,fontFamily:F.main,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,0.5)",animation:"toastIn 0.2s ease",letterSpacing:0.5 }}>
            {t.type==="error"?"⚠ ":t.type==="success"?"✓ ":"ℹ "}{t.msg}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ position:"relative",zIndex:1,borderTop:`1px solid rgba(232,0,29,0.15)`,padding:16,textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.15)",fontFamily:F.main,letterSpacing:2,textTransform:"uppercase" }}>
        RLCS 2026 Paris Major Predictor · Live Sync by Supabase
      </div>
    </div>
  );
}
