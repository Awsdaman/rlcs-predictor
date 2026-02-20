import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ADMIN_PASSWORD = "rlcs2026";

// ─── TEAMS ───────────────────────────────────────────────────────────────────
const TEAMS = {
  "Karmine Corp":        { abbr:"KC",   color:"#00d4ff", bg:"#001a2e", logo:"https://liquipedia.net/commons/images/thumb/e/e7/Karmine_Corp_allmode.png/120px-Karmine_Corp_allmode.png" },
  "Vitality":            { abbr:"VIT",  color:"#f5c518", bg:"#1a1500", logo:"https://liquipedia.net/commons/images/thumb/b/bc/Team_Vitality_lightmode.png/120px-Team_Vitality_lightmode.png" },
  "Gentle Mates":        { abbr:"GM",   color:"#ff6b35", bg:"#1a0a00", logo:"https://liquipedia.net/commons/images/thumb/7/72/Gentle_Mates_lightmode.png/120px-Gentle_Mates_lightmode.png" },
  "Ninjas in Pyjamas":   { abbr:"NIP",  color:"#e0e0e0", bg:"#111",    logo:"https://liquipedia.net/commons/images/thumb/4/46/Ninjas_in_Pyjamas_2022_lightmode.png/120px-Ninjas_in_Pyjamas_2022_lightmode.png" },
  "Geekay Esports":      { abbr:"GKE",  color:"#00ff88", bg:"#001a0d", logo:"https://liquipedia.net/commons/images/thumb/b/b6/Geekay_Esports_lightmode.png/120px-Geekay_Esports_lightmode.png" },
  "Twisted Minds":       { abbr:"TM",   color:"#9b59b6", bg:"#0d0015", logo:"https://liquipedia.net/commons/images/thumb/0/04/Twisted_Minds_allmode.png/120px-Twisted_Minds_allmode.png" },
  "Team Falcons":        { abbr:"FAL",  color:"#1e90ff", bg:"#00091a", logo:"https://liquipedia.net/commons/images/thumb/a/a4/Team_Falcons_allmode.png/120px-Team_Falcons_allmode.png" },
  "REDACTED":            { abbr:"RED",  color:"#ff2222", bg:"#1a0000", logo:null },
  "Shopify Rebellion":   { abbr:"SR",   color:"#96bf48", bg:"#0d1a00", logo:"https://liquipedia.net/commons/images/thumb/1/1a/Shopify_Rebellion_lightmode.png/120px-Shopify_Rebellion_lightmode.png" },
  "NRG Esports":         { abbr:"NRG",  color:"#ff6900", bg:"#1a0a00", logo:"https://liquipedia.net/commons/images/thumb/2/21/NRG_Esports_allmode.png/120px-NRG_Esports_allmode.png" },
  "PWR":                 { abbr:"PWR",  color:"#00e5ff", bg:"#001a1f", logo:"https://liquipedia.net/commons/images/thumb/1/1d/PWR_allmode.png/120px-PWR_allmode.png" },
  "Spacestation Gaming": { abbr:"SSG",  color:"#ff4500", bg:"#1a0a00", logo:"https://liquipedia.net/commons/images/thumb/3/3f/Spacestation_Gaming_allmode.png/120px-Spacestation_Gaming_allmode.png" },
  "FURIA Esports":       { abbr:"FUR",  color:"#ff0000", bg:"#1a0000", logo:"https://liquipedia.net/commons/images/thumb/f/f0/FURIA_Esports_lightmode.png/120px-FURIA_Esports_lightmode.png" },
  "MIBR":                { abbr:"MIBR", color:"#00a651", bg:"#001a0d", logo:"https://liquipedia.net/commons/images/thumb/5/5e/Made_in_Brazil.png/120px-Made_in_Brazil.png" },
  "Five Fears":          { abbr:"5F",   color:"#e74c3c", bg:"#1a0000", logo:null },
  "Project Delacrus":    { abbr:"PD",   color:"#f39c12", bg:"#1a1000", logo:null },
};

// ─── GROUP MATCHES ───────────────────────────────────────────────────────────
const GROUP_MATCHES = [
  { id:"ga1", group:"A", team1:"PWR",              team2:"NRG Esports",         startTime:"2026-02-19T21:00:00Z", phase:"Group Stage" },
  { id:"ga2", group:"A", team1:"Five Fears",        team2:"Ninjas in Pyjamas",   startTime:"2026-02-19T21:00:00Z", phase:"Group Stage" },
  { id:"gb1", group:"B", team1:"Gentle Mates",      team2:"Project Delacrus",    startTime:"2026-02-19T22:00:00Z", phase:"Group Stage" },
  { id:"gb2", group:"B", team1:"MIBR",              team2:"Shopify Rebellion",   startTime:"2026-02-19T22:00:00Z", phase:"Group Stage" },
  { id:"gc1", group:"C", team1:"Geekay Esports",    team2:"FURIA Esports",       startTime:"2026-02-19T23:00:00Z", phase:"Group Stage" },
  { id:"gc2", group:"C", team1:"Team Falcons",      team2:"REDACTED",            startTime:"2026-02-19T23:00:00Z", phase:"Group Stage" },
  { id:"gd1", group:"D", team1:"Karmine Corp",      team2:"Twisted Minds",       startTime:"2026-02-20T00:00:00Z", phase:"Group Stage" },
  { id:"gd2", group:"D", team1:"Vitality",          team2:"Spacestation Gaming", startTime:"2026-02-20T00:00:00Z", phase:"Group Stage" },
  { id:"ga3", group:"A", team1:"Five Fears",        team2:"PWR",                 startTime:"2026-02-20T01:00:00Z", phase:"Group Stage" },
  { id:"ga4", group:"A", team1:"Ninjas in Pyjamas", team2:"NRG Esports",         startTime:"2026-02-20T01:00:00Z", phase:"Group Stage" },
  { id:"gb3", group:"B", team1:"MIBR",              team2:"Project Delacrus",    startTime:"2026-02-20T02:00:00Z", phase:"Group Stage" },
  { id:"gb4", group:"B", team1:"Shopify Rebellion", team2:"Gentle Mates",        startTime:"2026-02-20T02:00:00Z", phase:"Group Stage" },
  { id:"gc3", group:"C", team1:"Team Falcons",      team2:"FURIA Esports",       startTime:"2026-02-20T21:00:00Z", phase:"Group Stage" },
  { id:"gc4", group:"C", team1:"Geekay Esports",    team2:"REDACTED",            startTime:"2026-02-20T21:00:00Z", phase:"Group Stage" },
  { id:"gd3", group:"D", team1:"Karmine Corp",      team2:"Spacestation Gaming", startTime:"2026-02-20T22:00:00Z", phase:"Group Stage" },
  { id:"gd4", group:"D", team1:"Twisted Minds",     team2:"Vitality",            startTime:"2026-02-20T22:00:00Z", phase:"Group Stage" },
  { id:"gb5", group:"B", team1:"Shopify Rebellion", team2:"Project Delacrus",    startTime:"2026-02-20T23:00:00Z", phase:"Group Stage" },
  { id:"gb6", group:"B", team1:"MIBR",              team2:"Gentle Mates",        startTime:"2026-02-20T23:00:00Z", phase:"Group Stage" },
  { id:"ga5", group:"A", team1:"Five Fears",        team2:"NRG Esports",         startTime:"2026-02-21T00:00:00Z", phase:"Group Stage" },
  { id:"ga6", group:"A", team1:"Ninjas in Pyjamas", team2:"PWR",                 startTime:"2026-02-21T00:00:00Z", phase:"Group Stage" },
  { id:"gc5", group:"C", team1:"FURIA Esports",     team2:"REDACTED",            startTime:"2026-02-21T01:00:00Z", phase:"Group Stage" },
  { id:"gc6", group:"C", team1:"Geekay Esports",    team2:"Team Falcons",        startTime:"2026-02-21T01:00:00Z", phase:"Group Stage" },
  { id:"gd5", group:"D", team1:"Karmine Corp",      team2:"Vitality",            startTime:"2026-02-21T02:00:00Z", phase:"Group Stage" },
  { id:"gd6", group:"D", team1:"Twisted Minds",     team2:"Spacestation Gaming", startTime:"2026-02-21T02:00:00Z", phase:"Group Stage" },
];

// ─── PLAYOFF MATCHES — teams set from bracket state in Supabase ──────────────
// Default teams from the bracket image. Admin can override TBD slots.
const DEFAULT_PLAYOFF = [
  { id:"p_ubm1", label:"UPPER BRACKET M1",  round:"UB",  col:0, row:0, startTime:"2026-02-21T21:00:00Z", team1:"NRG Esports",      team2:"Gentle Mates",      bo:7 },
  { id:"p_ubm2", label:"UPPER BRACKET M2",  round:"UB",  col:0, row:1, startTime:"2026-02-21T22:30:00Z", team1:"Team Falcons",      team2:"Vitality",          bo:7 },
  { id:"p_lbm1", label:"LOWER BRACKET M1",  round:"LB",  col:0, row:2, startTime:"2026-02-22T00:00:00Z", team1:"Karmine Corp",      team2:"Geekay Esports",    bo:7 },
  { id:"p_lbm2", label:"LOWER BRACKET M2",  round:"LB",  col:0, row:3, startTime:"2026-02-22T01:30:00Z", team1:"Shopify Rebellion", team2:"Ninjas in Pyjamas", bo:7 },
  { id:"p_qf1",  label:"QUARTER FINAL 1",   round:"QF",  col:1, row:0, startTime:"2026-02-22T21:00:00Z", team1:"TBD",               team2:"TBD",               bo:7 },
  { id:"p_qf2",  label:"QUARTER FINAL 2",   round:"QF",  col:1, row:1, startTime:"2026-02-22T22:30:00Z", team1:"TBD",               team2:"TBD",               bo:7 },
  { id:"p_sf1",  label:"SEMI FINAL 1",      round:"SF",  col:2, row:0, startTime:"2026-02-23T00:00:00Z", team1:"TBD",               team2:"TBD",               bo:7 },
  { id:"p_sf2",  label:"SEMI FINAL 2",      round:"SF",  col:2, row:1, startTime:"2026-02-23T01:30:00Z", team1:"TBD",               team2:"TBD",               bo:7 },
  { id:"p_gf",   label:"GRAND FINAL",       round:"GF",  col:3, row:0, startTime:"2026-02-23T21:00:00Z", team1:"TBD",               team2:"TBD",               bo:7 },
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
const fmtTime   = (iso) => new Date(iso).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
const teamStyle = (n)   => TEAMS[n] || { abbr:(n||"?").slice(0,3).toUpperCase(), color:"#888", bg:"#111", logo:null };
const isTBDTeam = (n)   => !n || n === "TBD";
const F = { main:"'Barlow Condensed', sans-serif", body:"'Barlow', sans-serif" };

// ─── TEAM BADGE ──────────────────────────────────────────────────────────────
function TeamBadge({ name, size="sm" }) {
  const t = teamStyle(name);
  const isTBD = isTBDTeam(name);
  const sz = size === "lg" ? 44 : 28;
  const [err, setErr] = useState(false);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:sz, height:sz, borderRadius:6, background:isTBD?"#1a1a1a":t.bg, border:`2px solid ${isTBD?"#2a2a2a":t.color}25`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
        {t.logo && !isTBD && !err
          ? <img src={t.logo} alt={name} style={{ width:"88%", height:"88%", objectFit:"contain" }} onError={()=>setErr(true)} />
          : <span style={{ fontSize:sz*0.3, fontWeight:900, color:isTBD?"#444":t.color, fontFamily:F.main }}>{isTBD?"?":t.abbr}</span>
        }
      </div>
      <span style={{ fontSize:size==="lg"?14:11, fontWeight:800, color:isTBD?"#444":"#ddd", fontFamily:F.main, letterSpacing:0.5, textTransform:"uppercase" }}>{name||"TBD"}</span>
    </div>
  );
}

// ─── BRACKET MATCH CARD ───────────────────────────────────────────────────────
// Compact card used inside the bracket grid
function BracketCard({ match, result, pred, onClick, isSelected }) {
  const t1 = match.team1, t2 = match.team2;
  const res = result;
  const score = pred && res ? calcScore(pred, res) : null;
  const locked = isLocked(match);
  const t1TBD = isTBDTeam(t1), t2TBD = isTBDTeam(t2);

  return (
    <div onClick={onClick} style={{
      background: isSelected ? "#181818" : "#111",
      border: `1px solid ${score===3?"#00c77a50":score===1?"#f5c51850":isSelected?"#f5c518":"#222"}`,
      borderRadius:8, overflow:"hidden", cursor:"pointer", transition:"all 0.15s", minWidth:180,
    }}>
      {/* Label */}
      <div style={{ padding:"3px 10px", background:"#0a0a0a", borderBottom:"1px solid #1a1a1a" }}>
        <span style={{ fontSize:9, color:"#444", fontFamily:F.main, letterSpacing:1, textTransform:"uppercase" }}>{match.label}</span>
        {score !== null && <span style={{ float:"right", fontSize:9, fontWeight:900, fontFamily:F.main, color:score===3?"#00c77a":score===1?"#f5c518":"#e74c3c" }}>+{score}pts</span>}
        {locked && !res && score===null && <span style={{ float:"right", fontSize:9, color:"#333", fontFamily:F.main }}>🔒</span>}
      </div>
      {/* Team 1 */}
      <div style={{ padding:"6px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #161616", background: res?.winner===t1?"#001a0d":"transparent" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {!t1TBD && (() => { const t=teamStyle(t1); const [e,setE]=useState(false); return (
            <div style={{ width:18, height:18, borderRadius:4, background:t.bg, border:`1px solid ${t.color}30`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
              {t.logo&&!e?<img src={t.logo} style={{ width:"90%", height:"90%", objectFit:"contain" }} onError={()=>setE(true)} alt="" />:<span style={{ fontSize:7, fontWeight:900, color:t.color, fontFamily:F.main }}>{t.abbr}</span>}
            </div>
          )})()}
          <span style={{ fontSize:11, fontWeight:800, fontFamily:F.main, color:t1TBD?"#333":res?.winner===t1?"#00c77a":"#bbb", textTransform:"uppercase" }}>{t1TBD?"TBD":t1}</span>
        </div>
        {res && <span style={{ fontSize:13, fontWeight:900, fontFamily:F.main, color:res.winner===t1?"#00c77a":"#555" }}>{res.score1}</span>}
        {!res && pred?.winner===t1 && <span style={{ fontSize:9, color:"#f5c518", fontFamily:F.main }}>★</span>}
      </div>
      {/* Team 2 */}
      <div style={{ padding:"6px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", background: res?.winner===t2?"#001a0d":"transparent" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {!t2TBD && (() => { const t=teamStyle(t2); const [e,setE]=useState(false); return (
            <div style={{ width:18, height:18, borderRadius:4, background:t.bg, border:`1px solid ${t.color}30`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
              {t.logo&&!e?<img src={t.logo} style={{ width:"90%", height:"90%", objectFit:"contain" }} onError={()=>setE(true)} alt="" />:<span style={{ fontSize:7, fontWeight:900, color:t.color, fontFamily:F.main }}>{t.abbr}</span>}
            </div>
          )})()}
          <span style={{ fontSize:11, fontWeight:800, fontFamily:F.main, color:t2TBD?"#333":res?.winner===t2?"#00c77a":"#bbb", textTransform:"uppercase" }}>{t2TBD?"TBD":t2}</span>
        </div>
        {res && <span style={{ fontSize:13, fontWeight:900, fontFamily:F.main, color:res.winner===t2?"#00c77a":"#555" }}>{res.score2}</span>}
        {!res && pred?.winner===t2 && <span style={{ fontSize:9, color:"#f5c518", fontFamily:F.main }}>★</span>}
      </div>
    </div>
  );
}

// ─── PREDICT PANEL (shown below bracket when card clicked) ───────────────────
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
    <div style={{ background:"#0d0d0d", border:"1px solid #252525", borderRadius:10, padding:"16px 18px", marginTop:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:12, fontWeight:800, fontFamily:F.main, color:"#f5c518", letterSpacing:1 }}>{match.label} — Bo{match.bo}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:16 }}>✕</button>
      </div>
      <div style={{ fontSize:10, color:"#444", fontFamily:F.main, marginBottom:12 }}>{fmtTime(match.startTime)}</div>

      {result ? (
        <div style={{ textAlign:"center", padding:"10px 0" }}>
          <div style={{ fontSize:11, color:"#555", fontFamily:F.main, marginBottom:6 }}>FINAL RESULT</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
            <span style={{ fontSize:13, fontWeight:800, fontFamily:F.main, color:result.winner===match.team1?"#00c77a":"#555" }}>{match.team1}</span>
            <span style={{ fontSize:28, fontWeight:900, fontFamily:F.main, color:"#ddd" }}>{result.score1}–{result.score2}</span>
            <span style={{ fontSize:13, fontWeight:800, fontFamily:F.main, color:result.winner===match.team2?"#00c77a":"#555" }}>{match.team2}</span>
          </div>
          {pred && <div style={{ marginTop:8, fontSize:11, fontFamily:F.main, color:"#555" }}>Your pick: {pred.winner} {pred.score1!=null?`(${pred.score1}–${pred.score2})`:""}</div>}
        </div>
      ) : locked ? (
        <div style={{ textAlign:"center", color:"#444", fontFamily:F.main, fontSize:12, padding:"10px 0" }}>🔒 Predictions locked</div>
      ) : t1TBD || t2TBD ? (
        <div style={{ textAlign:"center", color:"#444", fontFamily:F.main, fontSize:12, padding:"10px 0" }}>Teams TBD — predictions open once teams are set</div>
      ) : (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, justifyContent:"center" }}>
            <input type="number" min={0} max={4} value={s1} onChange={e=>setS1(e.target.value)} placeholder="–"
              style={{ width:44, textAlign:"center", background:"#111", border:"1px solid #252525", borderRadius:6, color:"#ddd", fontSize:18, fontWeight:800, fontFamily:F.main, padding:"6px 0" }} />
            <span style={{ color:"#333", fontSize:16 }}>:</span>
            <input type="number" min={0} max={4} value={s2} onChange={e=>setS2(e.target.value)} placeholder="–"
              style={{ width:44, textAlign:"center", background:"#111", border:"1px solid #252525", borderRadius:6, color:"#ddd", fontSize:18, fontWeight:800, fontFamily:F.main, padding:"6px 0" }} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {[{team:match.team1,t:t1},{team:match.team2,t:t2}].map(({team,t})=>(
              <button key={team} onClick={()=>submit(team)} style={{ flex:1, padding:"9px 0", borderRadius:7, border:"none", cursor:"pointer", background:pred?.winner===team?t.color:"#1a1a1a", color:pred?.winner===team?"#000":"#666", fontFamily:F.main, fontWeight:800, fontSize:12, textTransform:"uppercase", transition:"all 0.15s" }}>
                {team.split(" ").slice(-1)[0]} wins
              </button>
            ))}
          </div>
          {pred && <div style={{ marginTop:8, fontSize:10, color:"#444", fontFamily:F.main, textAlign:"center" }}>Current: {pred.winner} {pred.score1!=null?`(${pred.score1}–${pred.score2})`:""}</div>}
        </div>
      )}
    </div>
  );
}

// ─── PLAYOFFS BRACKET PAGE ────────────────────────────────────────────────────
function PlayoffsPage({ playoffMatches, predictions, results, playerId, onPredict }) {
  const [selected, setSelected] = useState(null);

  const cols = [
    { id:"UB", label:"UPPER BRACKET", matches: playoffMatches.filter(m=>m.round==="UB") },
    { id:"LB", label:"LOWER BRACKET", matches: playoffMatches.filter(m=>m.round==="LB") },
    { id:"QF", label:"QUARTER FINALS", matches: playoffMatches.filter(m=>m.round==="QF") },
    { id:"SF", label:"SEMI FINALS",   matches: playoffMatches.filter(m=>m.round==="SF") },
    { id:"GF", label:"GRAND FINAL 🏆",matches: playoffMatches.filter(m=>m.round==="GF") },
  ];

  const selectedMatch = playoffMatches.find(m=>m.id===selected);

  return (
    <div>
      <div style={{ fontSize:11, color:"#333", marginBottom:16, fontFamily:F.main, letterSpacing:1, textTransform:"uppercase" }}>
        Playoffs · Feb 21–22 · All Bo7 · Click any match to predict
      </div>

      {/* Bracket grid — scrollable horizontally on mobile */}
      <div style={{ overflowX:"auto", paddingBottom:8 }}>
        <div style={{ display:"flex", gap:0, minWidth:820, alignItems:"flex-start" }}>

          {/* Col 0: UB + LB side by side */}
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginRight:0, flex:1 }}>
            {/* Upper Bracket */}
            <div>
              <div style={{ fontSize:9, color:"#555", fontFamily:F.main, letterSpacing:1, textTransform:"uppercase", marginBottom:6, paddingLeft:2 }}>Upper Bracket</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {cols[0].matches.map(m=>(
                  <BracketCard key={m.id} match={m} result={results[m.id]} pred={predictions[playerId]?.[m.id]}
                    onClick={()=>setSelected(selected===m.id?null:m.id)} isSelected={selected===m.id} />
                ))}
              </div>
            </div>
            {/* Lower Bracket */}
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:9, color:"#555", fontFamily:F.main, letterSpacing:1, textTransform:"uppercase", marginBottom:6, paddingLeft:2 }}>Lower Bracket</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {cols[1].matches.map(m=>(
                  <BracketCard key={m.id} match={m} result={results[m.id]} pred={predictions[playerId]?.[m.id]}
                    onClick={()=>setSelected(selected===m.id?null:m.id)} isSelected={selected===m.id} />
                ))}
              </div>
            </div>
          </div>

          {/* Connector */}
          <div style={{ width:24, display:"flex", alignItems:"center", justifyContent:"center", paddingTop:60 }}>
            <div style={{ width:24, height:2, background:"#222" }} />
          </div>

          {/* Col 1: Quarter Finals */}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:"#555", fontFamily:F.main, letterSpacing:1, textTransform:"uppercase", marginBottom:6, paddingLeft:2 }}>Quarter Finals</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {cols[2].matches.map(m=>(
                <BracketCard key={m.id} match={m} result={results[m.id]} pred={predictions[playerId]?.[m.id]}
                  onClick={()=>setSelected(selected===m.id?null:m.id)} isSelected={selected===m.id} />
              ))}
            </div>
          </div>

          {/* Connector */}
          <div style={{ width:24, display:"flex", alignItems:"center", justifyContent:"center", paddingTop:40 }}>
            <div style={{ width:24, height:2, background:"#222" }} />
          </div>

          {/* Col 2: Semi Finals */}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:"#555", fontFamily:F.main, letterSpacing:1, textTransform:"uppercase", marginBottom:6, paddingLeft:2 }}>Semi Finals</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {cols[3].matches.map(m=>(
                <BracketCard key={m.id} match={m} result={results[m.id]} pred={predictions[playerId]?.[m.id]}
                  onClick={()=>setSelected(selected===m.id?null:m.id)} isSelected={selected===m.id} />
              ))}
            </div>
          </div>

          {/* Connector */}
          <div style={{ width:24, display:"flex", alignItems:"center", justifyContent:"center", paddingTop:20 }}>
            <div style={{ width:24, height:2, background:"#222" }} />
          </div>

          {/* Col 3: Grand Final */}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:"#f5c51880", fontFamily:F.main, letterSpacing:1, textTransform:"uppercase", marginBottom:6, paddingLeft:2 }}>Grand Final</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {cols[4].matches.map(m=>(
                <BracketCard key={m.id} match={m} result={results[m.id]} pred={predictions[playerId]?.[m.id]}
                  onClick={()=>setSelected(selected===m.id?null:m.id)} isSelected={selected===m.id} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Predict panel — shown below bracket when a match is selected */}
      {selected && selectedMatch && playerId && (
        <PredictPanel match={selectedMatch} result={results[selected]} pred={predictions[playerId]?.[selected]}
          onPredict={onPredict} onClose={()=>setSelected(null)} />
      )}
      {selected && !playerId && (
        <div style={{ textAlign:"center", color:"#444", fontFamily:F.main, fontSize:12, marginTop:12 }}>Log in as a player to predict</div>
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
  useEffect(()=>{ setS1(pred?.score1??""); setS2(pred?.score2??""); },[pred?.score1,pred?.score2]);
  useEffect(()=>{ setAs1(result?.score1??""); setAs2(result?.score2??""); },[result?.score1,result?.score2]);
  const submitPred=(winner)=>{ const n1=parseInt(s1),n2=parseInt(s2); onPredict(match.id,{winner,score1:isNaN(n1)?null:n1,score2:isNaN(n2)?null:n2}); };
  const submitResult=()=>{ const n1=parseInt(as1),n2=parseInt(as2); if(isNaN(n1)||isNaN(n2))return; onSetResult(match.id,{winner:n1>n2?match.team1:match.team2,score1:n1,score2:n2}); };
  return (
    <div style={{ background:"linear-gradient(135deg,#0d0d0d,#111)", border:`1px solid ${score===3?"#00c77a30":score===1?"#f5c51830":score===0&&result?"#e74c3c20":"#1e1e1e"}`, borderRadius:12, padding:"14px 16px", position:"relative" }}>
      {score!==null&&<div style={{ position:"absolute",top:10,right:10,borderRadius:6,padding:"2px 9px",background:score===3?"#00c77a":score===1?"#f5c518":"#e74c3c",color:"#000",fontWeight:900,fontSize:12,fontFamily:F.main }}>+{score} pts</div>}
      {locked&&!result&&score===null&&!isAdmin&&<div style={{ position:"absolute",top:10,right:10,background:"#1a1a1a",color:"#444",fontSize:10,borderRadius:6,padding:"2px 9px",fontFamily:F.main }}>🔒 LOCKED</div>}
      <div style={{ fontSize:10,color:"#333",marginBottom:10,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase" }}>
        Group {match.group} · Bo5 · {fmtTime(match.startTime)}
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <div style={{ flex:1 }}><TeamBadge name={match.team1} /></div>
        {result?(
          <div style={{ display:"flex",alignItems:"center",gap:6,background:"#0a0a0a",borderRadius:8,padding:"4px 14px",flexShrink:0 }}>
            <span style={{ fontSize:22,fontWeight:900,fontFamily:F.main,color:result.winner===match.team1?"#00c77a":"#444" }}>{result.score1}</span>
            <span style={{ color:"#2a2a2a" }}>:</span>
            <span style={{ fontSize:22,fontWeight:900,fontFamily:F.main,color:result.winner===match.team2?"#00c77a":"#444" }}>{result.score2}</span>
          </div>
        ):(
          <div style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0 }}>
            {!locked&&playerId&&!readOnly?(
              <>
                <input type="number" min={0} max={3} value={s1} onChange={e=>setS1(e.target.value)} placeholder="–" style={{ width:34,textAlign:"center",background:"#1a1a1a",border:"1px solid #252525",borderRadius:6,color:"#ddd",fontSize:16,fontWeight:800,fontFamily:F.main,padding:"4px 0" }} />
                <span style={{ color:"#2a2a2a" }}>:</span>
                <input type="number" min={0} max={3} value={s2} onChange={e=>setS2(e.target.value)} placeholder="–" style={{ width:34,textAlign:"center",background:"#1a1a1a",border:"1px solid #252525",borderRadius:6,color:"#ddd",fontSize:16,fontWeight:800,fontFamily:F.main,padding:"4px 0" }} />
              </>
            ):(
              <span style={{ color:"#2a2a2a",fontFamily:F.main,fontSize:13,padding:"0 8px" }}>vs</span>
            )}
          </div>
        )}
        <div style={{ flex:1,display:"flex",justifyContent:"flex-end" }}><TeamBadge name={match.team2} /></div>
      </div>
      {!locked&&!result&&playerId&&!readOnly&&(
        <div style={{ display:"flex",gap:6,marginTop:10 }}>
          {[{team:match.team1,t:t1},{team:match.team2,t:t2}].map(({team,t})=>(
            <button key={team} onClick={()=>submitPred(team)} style={{ flex:1,padding:"7px 0",borderRadius:7,border:"none",cursor:"pointer",background:pred?.winner===team?t.color:"#181818",color:pred?.winner===team?"#000":"#555",fontFamily:F.main,fontWeight:800,fontSize:11,letterSpacing:0.5,textTransform:"uppercase",transition:"all 0.15s" }}>{team.split(" ").slice(-1)[0]} wins</button>
          ))}
        </div>
      )}
      {pred&&!result&&!readOnly&&<div style={{ marginTop:8,fontSize:10,color:"#333",fontFamily:F.main }}>YOUR PICK: <span style={{ color:"#555" }}>{pred.winner?.split(" ").slice(-1)[0]}{pred.score1!=null?` (${pred.score1}–${pred.score2})`:""}</span></div>}
      {readOnly&&pred&&(
        <div style={{ marginTop:10,display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ fontSize:11,color:"#444",fontFamily:F.main }}>PREDICTION:</div>
          <div style={{ background:"#181818",borderRadius:6,padding:"3px 10px",fontSize:12,fontFamily:F.main,fontWeight:800,color:result?(calcScore(pred,result)===3?"#00c77a":calcScore(pred,result)===1?"#f5c518":"#e74c3c"):"#888" }}>
            {pred.winner?.split(" ").slice(-1)[0]}{pred.score1!=null?` · ${pred.score1}–${pred.score2}`:""}
          </div>
          {result&&<div style={{ fontSize:10,fontFamily:F.main,color:"#444" }}>{calcScore(pred,result)===3?"✓ EXACT":calcScore(pred,result)===1?"✓ WINNER":"✗ WRONG"}</div>}
        </div>
      )}
      {isAdmin&&(
        <div style={{ marginTop:10,paddingTop:10,borderTop:"1px solid #1a1a1a",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
          <span style={{ fontSize:10,color:result?"#f5c518":"#555",fontFamily:F.main }}>{result?"✎ EDIT:":"SET:"}</span>
          <input type="number" min={0} max={3} value={as1} onChange={e=>setAs1(e.target.value)} placeholder="T1" style={{ width:40,background:"#1a1a1a",border:`1px solid ${result?"#f5c51840":"#252525"}`,borderRadius:5,color:"#ddd",fontSize:13,fontFamily:F.main,padding:"4px 6px" }} />
          <span style={{ color:"#333" }}>–</span>
          <input type="number" min={0} max={3} value={as2} onChange={e=>setAs2(e.target.value)} placeholder="T2" style={{ width:40,background:"#1a1a1a",border:`1px solid ${result?"#f5c51840":"#252525"}`,borderRadius:5,color:"#ddd",fontSize:13,fontFamily:F.main,padding:"4px 6px" }} />
          <button onClick={submitResult} style={{ padding:"5px 12px",borderRadius:5,border:"none",cursor:"pointer",background:"#f5c518",color:"#000",fontFamily:F.main,fontWeight:900,fontSize:11 }}>{result?"UPDATE ✓":"SET ✓"}</button>
          {result&&<button onClick={()=>onSetResult(match.id,null)} style={{ padding:"5px 10px",borderRadius:5,border:"none",cursor:"pointer",background:"#1a0000",color:"#e74c3c",fontFamily:F.main,fontWeight:800,fontSize:11 }}>CLEAR ✕</button>}
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
      <div style={{ fontSize:13,fontWeight:800,fontFamily:F.main,color:"#f5c518",letterSpacing:1,marginBottom:6 }}>⭐ BONUS / PENALTY POINTS</div>
      <div style={{ fontSize:11,color:"#555",fontFamily:F.main,marginBottom:16 }}>Use negative numbers to deduct points (e.g. -5).</div>
      <div style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:12,padding:"16px 18px",marginBottom:20 }}>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end" }}>
          <div style={{ flex:1,minWidth:130 }}>
            <div style={{ fontSize:10,color:"#444",fontFamily:F.main,marginBottom:4 }}>PLAYER</div>
            <select value={sel} onChange={e=>setSel(e.target.value)} style={{ width:"100%",background:"#111",border:"1px solid #252525",borderRadius:7,color:"#ddd",padding:"9px 10px",fontSize:13,fontFamily:F.main,cursor:"pointer" }}>
              <option value="">— Select —</option>
              {players.map(p=><option key={p.id} value={p.id}>{p.nickname}</option>)}
            </select>
          </div>
          <div style={{ width:90 }}>
            <div style={{ fontSize:10,color:"#444",fontFamily:F.main,marginBottom:4 }}>POINTS</div>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="+5 or -3"
              style={{ width:"100%",background:"#111",border:"1px solid #252525",borderRadius:7,color:parseInt(amount)<0?"#e74c3c":parseInt(amount)>0?"#00c77a":"#ddd",padding:"9px 10px",fontSize:14,fontFamily:F.main,fontWeight:800,boxSizing:"border-box" }} />
          </div>
          <div style={{ flex:2,minWidth:150 }}>
            <div style={{ fontSize:10,color:"#444",fontFamily:F.main,marginBottom:4 }}>REASON (optional)</div>
            <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Tiebreaker bonus" onKeyDown={e=>e.key==="Enter"&&handleAdd()}
              style={{ width:"100%",background:"#111",border:"1px solid #252525",borderRadius:7,color:"#ddd",padding:"9px 10px",fontSize:13,fontFamily:F.body,boxSizing:"border-box" }} />
          </div>
          <button onClick={handleAdd} style={{ padding:"9px 18px",background:"#f5c518",border:"none",borderRadius:7,cursor:"pointer",color:"#000",fontFamily:F.main,fontWeight:900,fontSize:13 }}>ADD ✓</button>
        </div>
        {error&&<div style={{ color:"#e74c3c",fontSize:11,fontFamily:F.main,marginTop:8 }}>⚠ {error}</div>}
      </div>
      {players.map(p=>{
        const myBonus=bonusPoints.filter(b=>b.player_id===p.id); const total=getBonusTotal(p.id);
        if(myBonus.length===0)return null;
        return (
          <div key={p.id} style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
              <div style={{ fontSize:13,fontWeight:800,fontFamily:F.main }}>{p.nickname}</div>
              <div style={{ fontSize:13,fontWeight:900,fontFamily:F.main,color:total>0?"#00c77a":total<0?"#e74c3c":"#555" }}>{total>0?"+":""}{total} bonus pts</div>
            </div>
            {myBonus.map(b=>(
              <div key={b.id} style={{ display:"flex",alignItems:"center",gap:10,paddingTop:6,borderTop:"1px solid #141414" }}>
                <div style={{ fontSize:14,fontWeight:900,fontFamily:F.main,width:42,textAlign:"center",color:b.amount>0?"#00c77a":"#e74c3c" }}>{b.amount>0?"+":""}{b.amount}</div>
                <div style={{ flex:1,fontSize:12,color:"#555",fontFamily:F.body }}>{b.reason||<span style={{ color:"#333",fontStyle:"italic" }}>No reason</span>}</div>
                <button onClick={()=>onDelete(b.id)} style={{ background:"#1a0000",border:"1px solid #e74c3c20",borderRadius:5,color:"#e74c3c",fontFamily:F.main,fontWeight:800,fontSize:10,padding:"3px 8px",cursor:"pointer" }}>✕</button>
              </div>
            ))}
          </div>
        );
      })}
      {bonusPoints.length===0&&<div style={{ textAlign:"center",color:"#2a2a2a",padding:30,fontFamily:F.main,fontSize:12 }}>No adjustments yet</div>}
    </div>
  );
}

// ─── BRACKET TEAM EDITOR (Admin) ──────────────────────────────────────────────
function BracketEditor({ playoffMatches, onUpdateTeams }) {
  // Local state mirrors playoff match team names
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
    alert("Bracket teams saved!");
  };

  return (
    <div>
      <div style={{ fontSize:13,fontWeight:800,fontFamily:F.main,color:"#f5c518",letterSpacing:1,marginBottom:6 }}>🏆 SET PLAYOFF TEAM NAMES</div>
      <div style={{ fontSize:11,color:"#555",fontFamily:F.main,marginBottom:16 }}>
        Fill in team names as they qualify. Leave as TBD if not yet decided. Hit SAVE ALL when done.
      </div>

      {playoffMatches.map(m=>(
        <div key={m.id} style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:"12px 16px",marginBottom:10 }}>
          <div style={{ fontSize:10,color:"#555",fontFamily:F.main,letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>{m.label}</div>
          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
            <input value={teams[m.id]?.team1||""} onChange={e=>setTeams(t=>({...t,[m.id]:{...t[m.id],team1:e.target.value}}))}
              placeholder="Team 1 (or TBD)"
              style={{ flex:1,minWidth:140,background:"#111",border:"1px solid #252525",borderRadius:7,color:"#ddd",padding:"8px 12px",fontSize:13,fontFamily:F.body }} />
            <span style={{ color:"#333",fontFamily:F.main,fontWeight:800 }}>vs</span>
            <input value={teams[m.id]?.team2||""} onChange={e=>setTeams(t=>({...t,[m.id]:{...t[m.id],team2:e.target.value}}))}
              placeholder="Team 2 (or TBD)"
              style={{ flex:1,minWidth:140,background:"#111",border:"1px solid #252525",borderRadius:7,color:"#ddd",padding:"8px 12px",fontSize:13,fontFamily:F.body }} />
          </div>
        </div>
      ))}

      <button onClick={save} style={{ width:"100%",padding:12,background:"#f5c518",border:"none",borderRadius:10,cursor:"pointer",color:"#000",fontFamily:F.main,fontWeight:900,fontSize:14,marginTop:8 }}>
        SAVE ALL TEAM NAMES ✓
      </button>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ players, onLogin, onAdminLogin }) {
  const [name,setName]=useState(""); const [pass,setPass]=useState(""); const [tab,setTab]=useState("player"); const [error,setError]=useState("");
  const handlePlayerLogin=()=>{ const m=players.find(p=>p.nickname.toLowerCase()===name.trim().toLowerCase()); if(!m){setError("Name not found. Ask the admin to add you.");return;} onLogin(m.id); };
  const handleAdminLogin=()=>{ if(pass===ADMIN_PASSWORD)onAdminLogin(); else setError("Wrong password."); };
  return (
    <div style={{ minHeight:"100vh",background:"#080808",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ textAlign:"center",marginBottom:40 }}>
        <div style={{ fontSize:32,fontWeight:900,fontFamily:F.main,background:"linear-gradient(90deg,#00d4ff,#f5c518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>RLCS 2026</div>
        <div style={{ fontSize:18,fontWeight:800,fontFamily:F.main,color:"#333",letterSpacing:3,marginTop:2 }}>BOSTON MAJOR PREDICTOR</div>
        <div style={{ fontSize:11,color:"#2a2a2a",fontFamily:F.main,letterSpacing:1,marginTop:6 }}>FEB 19–22 · AGGANIS ARENA · $354,000</div>
      </div>
      <div style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:16,padding:32,width:"100%",maxWidth:380 }}>
        <div style={{ display:"flex",marginBottom:24,background:"#111",borderRadius:10,padding:4 }}>
          {[{id:"player",label:"🎮 Player"},{id:"admin",label:"⚙️ Admin"}].map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setError("");}} style={{ flex:1,padding:"8px 0",borderRadius:7,border:"none",cursor:"pointer",background:tab===t.id?"#1e1e1e":"transparent",color:tab===t.id?"#ddd":"#444",fontFamily:F.main,fontWeight:800,fontSize:13 }}>{t.label}</button>
          ))}
        </div>
        {tab==="player"?(
          <>
            <div style={{ fontSize:12,color:"#444",fontFamily:F.main,letterSpacing:0.5,marginBottom:10 }}>ENTER YOUR NAME</div>
            <input value={name} onChange={e=>{setName(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handlePlayerLogin()} placeholder="Your nickname…" style={{ width:"100%",background:"#111",border:"1px solid #222",borderRadius:8,color:"#ddd",padding:"12px 14px",fontSize:15,fontFamily:F.body,marginBottom:12,boxSizing:"border-box" }} autoFocus />
            {players.length>0&&<div style={{ marginBottom:12 }}><div style={{ fontSize:10,color:"#333",fontFamily:F.main,marginBottom:6 }}>REGISTERED:</div><div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{players.map(p=><button key={p.id} onClick={()=>{setName(p.nickname);setError("");}} style={{ padding:"4px 10px",borderRadius:6,border:"1px solid #222",background:"#111",color:"#666",fontFamily:F.main,fontWeight:700,fontSize:11,cursor:"pointer" }}>{p.nickname}</button>)}</div></div>}
            {error&&<div style={{ color:"#e74c3c",fontSize:12,fontFamily:F.main,marginBottom:10 }}>⚠ {error}</div>}
            <button onClick={handlePlayerLogin} style={{ width:"100%",padding:12,background:"linear-gradient(90deg,#00d4ff,#0099bb)",border:"none",borderRadius:8,color:"#000",fontWeight:900,fontFamily:F.main,fontSize:15,cursor:"pointer" }}>LET'S PREDICT →</button>
          </>
        ):(
          <>
            <div style={{ fontSize:12,color:"#444",fontFamily:F.main,letterSpacing:0.5,marginBottom:10 }}>ADMIN PASSWORD</div>
            <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()} placeholder="Password…" style={{ width:"100%",background:"#111",border:"1px solid #222",borderRadius:8,color:"#ddd",padding:"12px 14px",fontSize:15,fontFamily:F.body,marginBottom:12,boxSizing:"border-box" }} autoFocus />
            {error&&<div style={{ color:"#e74c3c",fontSize:12,fontFamily:F.main,marginBottom:10 }}>⚠ {error}</div>}
            <button onClick={handleAdminLogin} style={{ width:"100%",padding:12,background:"linear-gradient(90deg,#f5c518,#cc9900)",border:"none",borderRadius:8,color:"#000",fontWeight:900,fontFamily:F.main,fontSize:15,cursor:"pointer" }}>LOGIN AS ADMIN →</button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh",background:"#080808",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800;900&display=swap" rel="stylesheet" />
      <div style={{ fontSize:22,fontWeight:900,fontFamily:F.main,background:"linear-gradient(90deg,#00d4ff,#f5c518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>RLCS 2026 · BOSTON MAJOR</div>
      <div style={{ width:36,height:36,border:"3px solid #1a1a1a",borderTop:"3px solid #f5c518",borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:"#333",fontSize:11,fontFamily:F.main,letterSpacing:2 }}>LOADING…</div>
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
  // playoffTeams stored in Supabase as a single JSON row keyed "playoff_teams"
  const [playoffMatches, setPlayoffMatches] = useState(DEFAULT_PLAYOFF);
  const [authId,         setAuthId]         = useState(()=>localStorage.getItem("rlcs_auth")||null);
  const [isAdmin,        setIsAdmin]        = useState(()=>localStorage.getItem("rlcs_admin")==="1");
  const [page,           setPage]           = useState("predict");
  const [filterGroup,    setFilterGroup]    = useState("all");
  const [viewingPlayer,  setViewingPlayer]  = useState(null);
  const [newNick,        setNewNick]        = useState("");
  const [editNick,       setEditNick]       = useState({});
  const [adminTab,       setAdminTab]       = useState("players");

  const myIdRef = useRef(authId);
  useEffect(()=>{ myIdRef.current=authId; },[authId]);

  // ── Load all data ──
  useEffect(()=>{
    (async()=>{
      const [{ data:pls },{ data:preds },{ data:res },{ data:bon },{ data:bracket }] = await Promise.all([
        supabase.from("players").select("*").order("created_at"),
        supabase.from("predictions").select("*"),
        supabase.from("results").select("*"),
        supabase.from("bonus_points").select("*").order("created_at"),
        supabase.from("results").select("*").like("match_id","bracket_%"),
      ]);
      setPlayers(pls||[]);
      const predMap={};
      (preds||[]).forEach(p=>{ if(!predMap[p.player_id])predMap[p.player_id]={}; predMap[p.player_id][p.match_id]={winner:p.winner,score1:p.score1,score2:p.score2}; });
      setPredictions(predMap);
      const myId=localStorage.getItem("rlcs_auth");
      if(myId&&predMap[myId])localStorage.setItem(`rlcs_preds_${myId}`,JSON.stringify(predMap[myId]));
      const resMap={};
      (res||[]).forEach(r=>{ resMap[r.match_id]={winner:r.winner,score1:r.score1,score2:r.score2}; });
      setResults(resMap);
      setBonusPoints(bon||[]);

      // Load playoff team overrides from a special "bracket_teams" results row
      // We store team overrides as JSON in a dedicated table row
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

  const logout=()=>{ setAuthId(null); setIsAdmin(false); setPage("predict"); };

  const handlePredict=useCallback(async(matchId,pred)=>{
    if(!authId)return;
    setPredictions(prev=>{ const u={...prev,[authId]:{...(prev[authId]||{}),[matchId]:pred}}; localStorage.setItem(`rlcs_preds_${authId}`,JSON.stringify(u[authId])); return u; });
    await supabase.from("predictions").upsert({player_id:authId,match_id:matchId,winner:pred.winner,score1:pred.score1,score2:pred.score2,updated_at:new Date().toISOString()},{onConflict:"player_id,match_id"});
  },[authId]);

  const handleSetResult=useCallback(async(matchId,result)=>{
    if(result===null){ setResults(prev=>{const n={...prev};delete n[matchId];return n;}); await supabase.from("results").delete().eq("match_id",matchId); }
    else{ const c={winner:result.winner,score1:result.score1,score2:result.score2}; setResults(prev=>({...prev,[matchId]:c})); await supabase.from("results").upsert({match_id:matchId,...c,set_at:new Date().toISOString()},{onConflict:"match_id"}); }
  },[]);

  const handleUpdateBracketTeams=async(matchId,team1,team2)=>{
    setPlayoffMatches(prev=>prev.map(m=>m.id===matchId?{...m,team1,team2}:m));
    await supabase.from("bracket_teams").upsert({match_id:matchId,team1,team2},{onConflict:"match_id"});
  };

  const handleAddBonus=async(playerId,amount,reason)=>{ const{data,error}=await supabase.from("bonus_points").insert({player_id:playerId,amount,reason:reason||null}).select().single(); if(!error&&data)setBonusPoints(prev=>[...prev,data]); };
  const handleDeleteBonus=async(id)=>{ setBonusPoints(prev=>prev.filter(b=>b.id!==id)); await supabase.from("bonus_points").delete().eq("id",id); };
  const handleAddPlayer=async()=>{ const nick=newNick.trim();if(!nick)return; const id=`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; await supabase.from("players").insert({id,nickname:nick}); setNewNick(""); };
  const handleDeletePlayer=async(id)=>{ if(!window.confirm("Delete player?"))return; await supabase.from("players").delete().eq("id",id); };
  const handleRename=async(id,nickname)=>{ setPlayers(prev=>prev.map(p=>p.id===id?{...p,nickname}:p)); await supabase.from("players").update({nickname}).eq("id",id); setEditNick(n=>{const c={...n};delete c[id];return c;}); };

  const getPredScore =(pid)=>ALL_MATCHES.reduce((t,m)=>t+calcScore(predictions[pid]?.[m.id],results[m.id]),0);
  const getBonusTotal=(pid)=>bonusPoints.filter(b=>b.player_id===pid).reduce((t,b)=>t+b.amount,0);
  const getTotalScore=(pid)=>getPredScore(pid)+getBonusTotal(pid);
  const leaderboard=[...players].map(p=>({...p,score:getTotalScore(p.id),predScore:getPredScore(p.id),bonus:getBonusTotal(p.id)})).sort((a,b)=>b.score-a.score);
  const myPlayer=players.find(p=>p.id===authId);
  const filteredGroupMatches=GROUP_MATCHES.filter(m=>filterGroup==="all"||m.group===filterGroup);

  if(loading)return <LoadingScreen />;
  if(!authId&&!isAdmin)return <LoginScreen players={players} onLogin={id=>{setAuthId(id);setIsAdmin(false);}} onAdminLogin={()=>{setIsAdmin(true);setAuthId(null);}} />;

  const NAV=[
    {id:"predict",     icon:"🎯",label:"Group Stage"},
    {id:"playoffs",    icon:"🏆",label:"Playoffs"},
    {id:"leaderboard", icon:"📊",label:"Standings"},
    {id:"others",      icon:"👁", label:"Others' Picks"},
    ...(isAdmin?[{id:"admin",icon:"⚙️",label:"Admin"}]:[]),
  ];

  return (
    <div style={{ minHeight:"100vh",background:"#080808",color:"#e0e0e0",fontFamily:F.body }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background:"#0a0a0a",borderBottom:"1px solid #161616",padding:"14px 20px",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ maxWidth:900,margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:10 }}>
            <div>
              <div style={{ fontSize:20,fontWeight:900,fontFamily:F.main,background:"linear-gradient(90deg,#00d4ff,#f5c518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>RLCS 2026 · BOSTON MAJOR</div>
              <div style={{ fontSize:10,color:"#333",fontFamily:F.main,letterSpacing:1 }}>FEB 19–22 · AGGANIS ARENA · $354,000</div>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"#111",border:`1px solid ${isAdmin?"#f5c51830":"#1e1e1e"}`,borderRadius:8,padding:"6px 12px" }}>
              <div style={{ width:24,height:24,borderRadius:6,background:isAdmin?"#f5c518":"#00d4ff20",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,color:isAdmin?"#000":"#00d4ff",fontFamily:F.main }}>{isAdmin?"A":myPlayer?.nickname[0].toUpperCase()}</div>
              <span style={{ fontSize:12,fontFamily:F.main,fontWeight:800,color:isAdmin?"#f5c518":"#ddd" }}>{isAdmin?"ADMIN":myPlayer?.nickname}</span>
              <button onClick={logout} style={{ background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:14,padding:0,lineHeight:1 }}>✕</button>
            </div>
          </div>
          <div style={{ display:"flex",gap:2,flexWrap:"wrap" }}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{ padding:"7px 14px",borderRadius:6,border:"none",cursor:"pointer",background:page===n.id?"#161616":"transparent",color:page===n.id?"#ddd":"#444",fontFamily:F.main,fontWeight:800,fontSize:12,letterSpacing:0.5,textTransform:"uppercase",borderBottom:page===n.id?"2px solid #f5c518":"2px solid transparent",transition:"color 0.15s" }}>{n.icon} {n.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900,margin:"0 auto",padding:"20px 16px" }}>

        {/* GROUP STAGE */}
        {page==="predict"&&(
          <div>
            <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
              {["all","A","B","C","D"].map(g=>(
                <button key={g} onClick={()=>setFilterGroup(g)} style={{ padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",background:filterGroup===g?"#00d4ff":"#111",color:filterGroup===g?"#000":"#555",fontFamily:F.main,fontWeight:800,fontSize:12 }}>{g==="all"?"All Groups":`Group ${g}`}</button>
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

        {/* LEADERBOARD */}
        {page==="leaderboard"&&(
          <div>
            <div style={{ fontSize:11,color:"#333",marginBottom:16,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase" }}>🟢 3 pts = exact score · 🟡 1 pt = correct winner · ⭐ bonus points</div>
            {leaderboard.map((p,i)=>(
              <div key={p.id} style={{ background:i===0?"linear-gradient(135deg,#1a1400,#0e0e0e)":"#0d0d0d",border:`1px solid ${p.id===authId?"#00d4ff25":i===0?"#f5c51820":"#181818"}`,borderRadius:12,padding:"14px 18px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                  <span style={{ fontSize:22,width:30,textAlign:"center" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":<span style={{ fontSize:14,color:"#333",fontFamily:F.main }}>{`#${i+1}`}</span>}</span>
                  <div>
                    <div style={{ fontSize:15,fontWeight:800,fontFamily:F.main,display:"flex",alignItems:"center",gap:6 }}>
                      {p.nickname}{p.id===authId&&<span style={{ fontSize:9,color:"#00d4ff",background:"#00d4ff15",padding:"1px 7px",borderRadius:4 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize:10,color:"#333",fontFamily:F.main,marginTop:2,display:"flex",gap:8 }}>
                      <span>{Object.keys(predictions[p.id]||{}).length}/{ALL_MATCHES.length} predicted</span>
                      {p.bonus!==0&&<span style={{ color:p.bonus>0?"#00c77a":"#e74c3c" }}>{p.bonus>0?"+":""}{p.bonus} bonus</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:30,fontWeight:900,fontFamily:F.main,color:i===0?"#f5c518":"#ddd" }}>{p.score}<span style={{ fontSize:12,color:"#444",marginLeft:4 }}>pts</span></div>
                  {p.bonus!==0&&<div style={{ fontSize:10,color:"#444",fontFamily:F.main }}>{p.predScore} pred {p.bonus>0?"+":""}{p.bonus} bonus</div>}
                </div>
              </div>
            ))}
            {Object.keys(results).length>0&&(
              <div style={{ marginTop:28 }}>
                <div style={{ fontSize:11,color:"#333",letterSpacing:1,marginBottom:10,fontFamily:F.main,textTransform:"uppercase" }}>Match Breakdown</div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:F.main }}>
                    <thead><tr style={{ borderBottom:"1px solid #181818" }}>
                      <th style={{ textAlign:"left",padding:"5px 8px",color:"#333" }}>Match</th>
                      <th style={{ textAlign:"center",padding:"5px 8px",color:"#333" }}>Score</th>
                      {players.map(p=><th key={p.id} style={{ textAlign:"center",padding:"5px 8px",color:p.id===authId?"#00d4ff":"#333" }}>{p.nickname}</th>)}
                    </tr></thead>
                    <tbody>
                      {ALL_MATCHES.filter(m=>results[m.id]).map(m=>(
                        <tr key={m.id} style={{ borderBottom:"1px solid #0f0f0f" }}>
                          <td style={{ padding:"5px 8px",color:"#555",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.team1?.split(" ").pop()} vs {m.team2?.split(" ").pop()}</td>
                          <td style={{ textAlign:"center",padding:"5px 8px",color:"#444" }}>{results[m.id].score1}–{results[m.id].score2}</td>
                          {players.map(p=>{const s=calcScore(predictions[p.id]?.[m.id],results[m.id]);const has=!!predictions[p.id]?.[m.id];return<td key={p.id} style={{ textAlign:"center",padding:"5px 8px",fontWeight:900,color:!has?"#222":s===3?"#00c77a":s===1?"#f5c518":"#e74c3c" }}>{has?`+${s}`:"—"}</td>;})}
                        </tr>
                      ))}
                      {players.some(p=>getBonusTotal(p.id)!==0)&&(
                        <tr style={{ borderTop:"2px solid #1a1a1a" }}>
                          <td colSpan={2} style={{ padding:"5px 8px",color:"#f5c518",fontFamily:F.main,fontSize:11 }}>⭐ Bonus</td>
                          {players.map(p=>{const b=getBonusTotal(p.id);return<td key={p.id} style={{ textAlign:"center",padding:"5px 8px",fontWeight:900,color:b>0?"#00c77a":b<0?"#e74c3c":"#333",fontFamily:F.main }}>{b!==0?(b>0?"+":"")+b:"—"}</td>;})}
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
            <div style={{ fontSize:11,color:"#333",marginBottom:16,fontFamily:F.main,letterSpacing:1,textTransform:"uppercase" }}>👁 Only visible for matches that have already started</div>
            <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
              {players.filter(p=>p.id!==authId).map(p=>(
                <button key={p.id} onClick={()=>setViewingPlayer(viewingPlayer===p.id?null:p.id)} style={{ padding:"8px 16px",borderRadius:8,border:`1px solid ${viewingPlayer===p.id?"#00d4ff40":"#1e1e1e"}`,background:viewingPlayer===p.id?"#00d4ff15":"#0d0d0d",color:viewingPlayer===p.id?"#00d4ff":"#555",fontFamily:F.main,fontWeight:800,fontSize:13,cursor:"pointer" }}>
                  {p.nickname}<span style={{ fontSize:10,color:viewingPlayer===p.id?"#00d4ff":"#333",marginLeft:6 }}>{getTotalScore(p.id)} pts</span>
                </button>
              ))}
              {players.filter(p=>p.id!==authId).length===0&&<div style={{ color:"#333",fontSize:13,fontFamily:F.main }}>No other players yet</div>}
            </div>
            {viewingPlayer&&(()=>{
              const vp=players.find(p=>p.id===viewingPlayer);
              const lockedMatches=[...GROUP_MATCHES,...playoffMatches].filter(m=>isLocked(m)&&!isTBDTeam(m.team1));
              return (
                <div>
                  <div style={{ fontSize:14,fontWeight:800,fontFamily:F.main,color:"#ddd",marginBottom:4 }}>{vp?.nickname}'s predictions</div>
                  <div style={{ fontSize:11,color:"#333",fontFamily:F.main,marginBottom:14 }}>
                    {lockedMatches.filter(m=>predictions[viewingPlayer]?.[m.id]).length} predictions · {getTotalScore(viewingPlayer)} pts
                    {getBonusTotal(viewingPlayer)!==0&&<span style={{ color:getBonusTotal(viewingPlayer)>0?"#00c77a":"#e74c3c" }}> (incl. {getBonusTotal(viewingPlayer)>0?"+":""}{getBonusTotal(viewingPlayer)} bonus)</span>}
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
            {!viewingPlayer&&<div style={{ textAlign:"center",color:"#2a2a2a",padding:40,fontFamily:F.main,fontSize:13 }}>↑ Select a player above</div>}
          </div>
        )}

        {/* ADMIN */}
        {page==="admin"&&isAdmin&&(
          <div>
            <div style={{ display:"flex",gap:4,marginBottom:24,background:"#0d0d0d",borderRadius:10,padding:4,flexWrap:"wrap" }}>
              {[{id:"players",label:"👥 Players"},{id:"bracket",label:"🏆 Bracket Teams"},{id:"results",label:"🎯 Results"},{id:"bonus",label:"⭐ Bonus Points"}].map(t=>(
                <button key={t.id} onClick={()=>setAdminTab(t.id)} style={{ flex:1,padding:"9px 0",borderRadius:7,border:"none",cursor:"pointer",background:adminTab===t.id?"#1a1a1a":"transparent",color:adminTab===t.id?"#f5c518":"#444",fontFamily:F.main,fontWeight:800,fontSize:12,transition:"all 0.15s",minWidth:100 }}>{t.label}</button>
              ))}
            </div>

            {/* Players */}
            {adminTab==="players"&&(
              <div>
                {players.map(p=>(
                  <div key={p.id} style={{ background:"#0d0d0d",border:"1px solid #181818",borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:30,height:30,borderRadius:7,background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#f5c518",fontFamily:F.main,flexShrink:0 }}>{p.nickname[0].toUpperCase()}</div>
                    {editNick[p.id]!==undefined?(
                      <div style={{ flex:1,display:"flex",gap:6 }}>
                        <input value={editNick[p.id]} onChange={e=>setEditNick(n=>({...n,[p.id]:e.target.value}))} autoFocus onKeyDown={e=>{if(e.key==="Enter")handleRename(p.id,editNick[p.id]||p.nickname);}}
                          style={{ flex:1,background:"#111",border:"1px solid #2a2a2a",borderRadius:6,color:"#ddd",padding:"5px 10px",fontSize:13,fontFamily:F.body }} />
                        <button onClick={()=>handleRename(p.id,editNick[p.id]||p.nickname)} style={{ background:"#00c77a",border:"none",borderRadius:6,color:"#000",fontWeight:900,padding:"5px 12px",fontFamily:F.main,cursor:"pointer",fontSize:11 }}>SAVE</button>
                        <button onClick={()=>setEditNick(n=>{const c={...n};delete c[p.id];return c;})} style={{ background:"#181818",border:"none",borderRadius:6,color:"#555",fontWeight:800,padding:"5px 10px",fontFamily:F.main,cursor:"pointer" }}>✕</button>
                      </div>
                    ):(
                      <>
                        <div style={{ flex:1,fontSize:13,fontWeight:800,fontFamily:F.main }}>{p.nickname}<span style={{ color:"#333",fontWeight:400,fontSize:11,marginLeft:8 }}>{getTotalScore(p.id)} pts</span></div>
                        <button onClick={()=>setEditNick(n=>({...n,[p.id]:p.nickname}))} style={{ background:"#111",border:"1px solid #1e1e1e",borderRadius:6,color:"#555",fontFamily:F.main,fontWeight:800,fontSize:11,padding:"4px 10px",cursor:"pointer" }}>RENAME</button>
                        <button onClick={()=>handleDeletePlayer(p.id)} style={{ background:"#1a0000",border:"1px solid #e74c3c20",borderRadius:6,color:"#e74c3c",fontFamily:F.main,fontWeight:800,fontSize:11,padding:"4px 10px",cursor:"pointer" }}>DELETE</button>
                      </>
                    )}
                  </div>
                ))}
                <div style={{ display:"flex",gap:8,marginTop:10 }}>
                  <input value={newNick} onChange={e=>setNewNick(e.target.value)} placeholder="New player nickname…" onKeyDown={e=>{if(e.key==="Enter")handleAddPlayer();}}
                    style={{ flex:1,background:"#0d0d0d",border:"1px dashed #222",borderRadius:10,color:"#ddd",padding:"10px 14px",fontSize:13,fontFamily:F.body }} />
                  <button onClick={handleAddPlayer} style={{ padding:"10px 20px",background:"#f5c518",border:"none",borderRadius:10,cursor:"pointer",color:"#000",fontFamily:F.main,fontWeight:900,fontSize:13 }}>+ ADD</button>
                </div>
              </div>
            )}

            {/* Bracket Teams */}
            {adminTab==="bracket"&&(
              <BracketEditor playoffMatches={playoffMatches} onUpdateTeams={handleUpdateBracketTeams} />
            )}

            {/* Results */}
            {adminTab==="results"&&(
              <div>
                <div style={{ fontSize:11,color:"#555",fontFamily:F.main,marginBottom:14 }}>Update any result even after it's set.</div>
                <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
                  {["all","A","B","C","D","Playoffs"].map(g=>(
                    <button key={g} onClick={()=>setFilterGroup(g)} style={{ padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",background:filterGroup===g?"#f5c518":"#111",color:filterGroup===g?"#000":"#555",fontFamily:F.main,fontWeight:800,fontSize:12 }}>
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
          </div>
        )}
      </div>

      <div style={{ borderTop:"1px solid #0f0f0f",padding:16,textAlign:"center",fontSize:10,color:"#1e1e1e",fontFamily:F.main,letterSpacing:1 }}>
        RLCS 2026 BOSTON MAJOR PREDICTOR · LIVE SYNC BY SUPABASE
      </div>
    </div>
  );
}