import { useState, useEffect, useCallback } from "react";
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

// ─── MATCHES ─────────────────────────────────────────────────────────────────
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
const PLAYOFF_MATCHES = [
  { id:"p1", group:null, team1:"TBD", team2:"TBD", startTime:"2026-02-21T21:00:00Z", phase:"Playoffs – UB/LB R1" },
  { id:"p2", group:null, team1:"TBD", team2:"TBD", startTime:"2026-02-21T22:30:00Z", phase:"Playoffs – UB/LB R1" },
  { id:"p3", group:null, team1:"TBD", team2:"TBD", startTime:"2026-02-22T00:00:00Z", phase:"Playoffs – UB/LB R1" },
  { id:"p4", group:null, team1:"TBD", team2:"TBD", startTime:"2026-02-22T01:30:00Z", phase:"Playoffs – UB/LB R1" },
  { id:"p5", group:null, team1:"TBD", team2:"TBD", startTime:"2026-02-22T21:00:00Z", phase:"Playoffs – Semifinals" },
  { id:"p6", group:null, team1:"TBD", team2:"TBD", startTime:"2026-02-22T22:30:00Z", phase:"Playoffs – Semifinals" },
  { id:"p7", group:null, team1:"TBD", team2:"TBD", startTime:"2026-02-23T00:00:00Z", phase:"Playoffs – Grand Final" },
];
const ALL_MATCHES = [...GROUP_MATCHES, ...PLAYOFF_MATCHES];

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
const F = { main:"'Barlow Condensed', sans-serif", body:"'Barlow', sans-serif" };

// ─── TEAM BADGE ──────────────────────────────────────────────────────────────
function TeamBadge({ name, size="sm" }) {
  const t = teamStyle(name);
  const isTBD = !name || name === "TBD";
  const sz = size === "lg" ? 44 : 30;
  const [err, setErr] = useState(false);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:sz, height:sz, borderRadius:7, background:isTBD?"#1a1a1a":t.bg, border:`2px solid ${isTBD?"#2a2a2a":t.color}25`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
        {t.logo && !isTBD && !err
          ? <img src={t.logo} alt={name} style={{ width:"88%", height:"88%", objectFit:"contain" }} onError={() => setErr(true)} />
          : <span style={{ fontSize:sz*0.28, fontWeight:900, color:isTBD?"#444":t.color, fontFamily:F.main }}>{isTBD?"?":t.abbr}</span>
        }
      </div>
      <span style={{ fontSize:size==="lg"?14:11, fontWeight:800, color:isTBD?"#444":"#ddd", fontFamily:F.main, letterSpacing:0.5, textTransform:"uppercase" }}>{name}</span>
    </div>
  );
}

// ─── MATCH CARD ──────────────────────────────────────────────────────────────
function MatchCard({ match, playerId, predictions, results, onPredict, onSetResult, isAdmin, readOnly }) {
  const pred   = predictions[playerId]?.[match.id];
  const result = results[match.id];
  const locked = isLocked(match);
  const isTBD  = match.team1 === "TBD";
  const score  = (pred && result) ? calcScore(pred, result) : null;
  const maxScore = match.phase === "Group Stage" ? 3 : 4;
  const t1 = teamStyle(match.team1), t2 = teamStyle(match.team2);

  const [s1,  setS1]  = useState(pred?.score1 ?? "");
  const [s2,  setS2]  = useState(pred?.score2 ?? "");
  const [as1, setAs1] = useState(result?.score1 ?? "");
  const [as2, setAs2] = useState(result?.score2 ?? "");

  useEffect(() => { setS1(pred?.score1 ?? ""); setS2(pred?.score2 ?? ""); }, [pred?.score1, pred?.score2]);
  useEffect(() => { setAs1(result?.score1 ?? ""); setAs2(result?.score2 ?? ""); }, [result?.score1, result?.score2]);

  const submitPred = (winner) => {
    const n1 = parseInt(s1), n2 = parseInt(s2);
    onPredict(match.id, { winner, score1:isNaN(n1)?null:n1, score2:isNaN(n2)?null:n2 });
  };
  const submitResult = () => {
    const n1 = parseInt(as1), n2 = parseInt(as2);
    if (isNaN(n1)||isNaN(n2)) return;
    onSetResult(match.id, { winner:n1>n2?match.team1:match.team2, score1:n1, score2:n2 });
  };

  return (
    <div style={{ background:"linear-gradient(135deg,#0d0d0d,#111)", border:`1px solid ${score===3?"#00c77a30":score===1?"#f5c51830":score===0&&result?"#e74c3c20":"#1e1e1e"}`, borderRadius:12, padding:"14px 16px", position:"relative" }}>
      {score !== null && (
        <div style={{ position:"absolute", top:10, right:10, borderRadius:6, padding:"2px 9px", background:score===3?"#00c77a":score===1?"#f5c518":"#e74c3c", color:"#000", fontWeight:900, fontSize:12, fontFamily:F.main }}>
          +{score} pts
        </div>
      )}
      {locked && !result && score===null && (
        <div style={{ position:"absolute", top:10, right:10, background:"#1a1a1a", color:"#444", fontSize:10, borderRadius:6, padding:"2px 9px", fontFamily:F.main }}>🔒 LOCKED</div>
      )}

      <div style={{ fontSize:10, color:"#333", marginBottom:10, fontFamily:F.main, letterSpacing:1, textTransform:"uppercase" }}>
        {match.group?`Group ${match.group} · `:""}{match.phase} · Bo{match.phase==="Group Stage"?5:7} · {fmtTime(match.startTime)}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1 }}><TeamBadge name={match.team1} /></div>
        {result ? (
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"#0a0a0a", borderRadius:8, padding:"4px 14px", flexShrink:0 }}>
            <span style={{ fontSize:22, fontWeight:900, fontFamily:F.main, color:result.winner===match.team1?"#00c77a":"#444" }}>{result.score1}</span>
            <span style={{ color:"#2a2a2a" }}>:</span>
            <span style={{ fontSize:22, fontWeight:900, fontFamily:F.main, color:result.winner===match.team2?"#00c77a":"#444" }}>{result.score2}</span>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
            {!isTBD && !locked && playerId && !readOnly ? (
              <>
                <input type="number" min={0} max={maxScore} value={s1} onChange={e=>setS1(e.target.value)} placeholder="–"
                  style={{ width:34, textAlign:"center", background:"#1a1a1a", border:"1px solid #252525", borderRadius:6, color:"#ddd", fontSize:16, fontWeight:800, fontFamily:F.main, padding:"4px 0" }} />
                <span style={{ color:"#2a2a2a" }}>:</span>
                <input type="number" min={0} max={maxScore} value={s2} onChange={e=>setS2(e.target.value)} placeholder="–"
                  style={{ width:34, textAlign:"center", background:"#1a1a1a", border:"1px solid #252525", borderRadius:6, color:"#ddd", fontSize:16, fontWeight:800, fontFamily:F.main, padding:"4px 0" }} />
              </>
            ) : (
              <span style={{ color:"#2a2a2a", fontFamily:F.main, fontSize:13, padding:"0 8px" }}>vs</span>
            )}
          </div>
        )}
        <div style={{ flex:1, display:"flex", justifyContent:"flex-end" }}><TeamBadge name={match.team2} /></div>
      </div>

      {/* Win buttons */}
      {!locked && !result && playerId && !isTBD && !readOnly && (
        <div style={{ display:"flex", gap:6, marginTop:10 }}>
          {[{team:match.team1,t:t1},{team:match.team2,t:t2}].map(({team,t}) => (
            <button key={team} onClick={()=>submitPred(team)} style={{
              flex:1, padding:"7px 0", borderRadius:7, border:"none", cursor:"pointer",
              background:pred?.winner===team?t.color:"#181818", color:pred?.winner===team?"#000":"#555",
              fontFamily:F.main, fontWeight:800, fontSize:11, letterSpacing:0.5, textTransform:"uppercase", transition:"all 0.15s",
            }}>{team.split(" ").slice(-1)[0]} wins</button>
          ))}
        </div>
      )}

      {/* Read-only prediction display (for "Others" page) */}
      {readOnly && pred && (
        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:11, color:"#444", fontFamily:F.main }}>PREDICTION:</div>
          <div style={{ background:"#181818", borderRadius:6, padding:"3px 10px", fontSize:12, fontFamily:F.main, fontWeight:800,
            color: result ? (calcScore(pred,result)===3?"#00c77a":calcScore(pred,result)===1?"#f5c518":"#e74c3c") : "#888" }}>
            {pred.winner?.split(" ").slice(-1)[0]}
            {pred.score1!=null ? ` · ${pred.score1}–${pred.score2}` : ""}
          </div>
          {result && <div style={{ fontSize:10, fontFamily:F.main, color:"#444" }}>→ {calcScore(pred,result)===3?"✓ EXACT":calcScore(pred,result)===1?"✓ WINNER":"✗ WRONG"}</div>}
        </div>
      )}

      {/* My prediction hint */}
      {pred && !result && !readOnly && (
        <div style={{ marginTop:8, fontSize:10, color:"#333", fontFamily:F.main }}>
          YOUR PICK: <span style={{ color:"#555" }}>{pred.winner?.split(" ").slice(-1)[0]}{pred.score1!=null?` (${pred.score1}–${pred.score2})`:""}</span>
        </div>
      )}

      {/* Admin result setter */}
      {isAdmin && !isTBD && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, flexWrap:"wrap" }}>
          {result ? (
            <>
              <span style={{ fontSize:10, color:"#00c77a", fontFamily:F.main }}>✓ {result.score1}–{result.score2}</span>
              <button onClick={()=>onSetResult(match.id,null)} style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:5, border:"none", cursor:"pointer", background:"#1a0000", color:"#e74c3c", fontFamily:F.main, fontWeight:800, fontSize:10 }}>CLEAR</button>
            </>
          ) : (
            <>
              <span style={{ fontSize:10, color:"#444", fontFamily:F.main }}>RESULT:</span>
              <input type="number" min={0} max={maxScore} value={as1} onChange={e=>setAs1(e.target.value)} placeholder="T1"
                style={{ width:38, background:"#1a1a1a", border:"1px solid #252525", borderRadius:5, color:"#ddd", fontSize:13, fontFamily:F.main, padding:"3px 6px" }} />
              <span style={{ color:"#333" }}>–</span>
              <input type="number" min={0} max={maxScore} value={as2} onChange={e=>setAs2(e.target.value)} placeholder="T2"
                style={{ width:38, background:"#1a1a1a", border:"1px solid #252525", borderRadius:5, color:"#ddd", fontSize:13, fontFamily:F.main, padding:"3px 6px" }} />
              <button onClick={submitResult} style={{ padding:"4px 12px", borderRadius:5, border:"none", cursor:"pointer", background:"#f5c518", color:"#000", fontFamily:F.main, fontWeight:900, fontSize:11 }}>SET ✓</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ players, onLogin, onAdminLogin }) {
  const [name,    setName]    = useState("");
  const [pass,    setPass]    = useState("");
  const [tab,     setTab]     = useState("player"); // "player" | "admin"
  const [error,   setError]   = useState("");

  const handlePlayerLogin = () => {
    const match = players.find(p => p.nickname.toLowerCase() === name.trim().toLowerCase());
    if (!match) {
      setError("Name not found. Ask the admin to add you first.");
      return;
    }
    onLogin(match.id);
  };

  const handleAdminLogin = () => {
    if (pass === ADMIN_PASSWORD) {
      onAdminLogin();
    } else {
      setError("Wrong password.");
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap" rel="stylesheet" />

      {/* Logo / Title */}
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:32, fontWeight:900, fontFamily:F.main, background:"linear-gradient(90deg,#00d4ff,#f5c518)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:-0.5 }}>
          RLCS 2026
        </div>
        <div style={{ fontSize:18, fontWeight:800, fontFamily:F.main, color:"#333", letterSpacing:3, textTransform:"uppercase", marginTop:2 }}>
          Boston Major Predictor
        </div>
        <div style={{ fontSize:11, color:"#2a2a2a", fontFamily:F.main, letterSpacing:1, marginTop:6 }}>
          FEB 19–22 · AGGANIS ARENA · $354,000
        </div>
      </div>

      {/* Card */}
      <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:16, padding:32, width:"100%", maxWidth:380 }}>

        {/* Tabs */}
        <div style={{ display:"flex", marginBottom:24, background:"#111", borderRadius:10, padding:4 }}>
          {[{id:"player",label:"🎮 Player"},{id:"admin",label:"⚙️ Admin"}].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError(""); }} style={{
              flex:1, padding:"8px 0", borderRadius:7, border:"none", cursor:"pointer",
              background:tab===t.id?"#1e1e1e":"transparent",
              color:tab===t.id?"#ddd":"#444",
              fontFamily:F.main, fontWeight:800, fontSize:13, transition:"all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "player" ? (
          <>
            <div style={{ fontSize:12, color:"#444", fontFamily:F.main, letterSpacing:0.5, marginBottom:10 }}>
              ENTER YOUR NAME (must be added by admin first)
            </div>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key==="Enter" && handlePlayerLogin()}
              placeholder="Your nickname…"
              style={{ width:"100%", background:"#111", border:"1px solid #222", borderRadius:8, color:"#ddd", padding:"12px 14px", fontSize:15, fontFamily:F.body, marginBottom:12, boxSizing:"border-box" }}
              autoFocus
            />
            {/* Player list hint */}
            {players.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:"#333", fontFamily:F.main, letterSpacing:0.5, marginBottom:6 }}>REGISTERED PLAYERS:</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {players.map(p => (
                    <button key={p.id} onClick={() => { setName(p.nickname); setError(""); }} style={{
                      padding:"4px 10px", borderRadius:6, border:"1px solid #222", background:"#111",
                      color:"#666", fontFamily:F.main, fontWeight:700, fontSize:11, cursor:"pointer",
                    }}>{p.nickname}</button>
                  ))}
                </div>
              </div>
            )}
            {error && <div style={{ color:"#e74c3c", fontSize:12, fontFamily:F.main, marginBottom:10 }}>⚠ {error}</div>}
            <button onClick={handlePlayerLogin} style={{ width:"100%", padding:12, background:"linear-gradient(90deg,#00d4ff,#0099bb)", border:"none", borderRadius:8, color:"#000", fontWeight:900, fontFamily:F.main, fontSize:15, cursor:"pointer", letterSpacing:0.5 }}>
              LET'S PREDICT →
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize:12, color:"#444", fontFamily:F.main, letterSpacing:0.5, marginBottom:10 }}>ADMIN PASSWORD</div>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(""); }}
              onKeyDown={e => e.key==="Enter" && handleAdminLogin()}
              placeholder="Password…"
              style={{ width:"100%", background:"#111", border:"1px solid #222", borderRadius:8, color:"#ddd", padding:"12px 14px", fontSize:15, fontFamily:F.body, marginBottom:12, boxSizing:"border-box" }}
              autoFocus
            />
            {error && <div style={{ color:"#e74c3c", fontSize:12, fontFamily:F.main, marginBottom:10 }}>⚠ {error}</div>}
            <button onClick={handleAdminLogin} style={{ width:"100%", padding:12, background:"linear-gradient(90deg,#f5c518,#cc9900)", border:"none", borderRadius:8, color:"#000", fontWeight:900, fontFamily:F.main, fontSize:15, cursor:"pointer", letterSpacing:0.5 }}>
              LOGIN AS ADMIN →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800;900&display=swap" rel="stylesheet" />
      <div style={{ fontSize:22, fontWeight:900, fontFamily:F.main, background:"linear-gradient(90deg,#00d4ff,#f5c518)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>RLCS 2026 · BOSTON MAJOR</div>
      <div style={{ width:36, height:36, border:"3px solid #1a1a1a", borderTop:"3px solid #f5c518", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:"#333", fontSize:11, fontFamily:F.main, letterSpacing:2 }}>LOADING…</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loading,     setLoading]     = useState(true);
  const [players,     setPlayers]     = useState([]);
  const [predictions, setPredictions] = useState({});
  const [results,     setResults]     = useState({});

  // Auth state: null = not logged in, string = player id, "admin" = admin
  const [authId,      setAuthId]      = useState(() => localStorage.getItem("rlcs_auth") || null);
  const [isAdmin,     setIsAdmin]     = useState(() => localStorage.getItem("rlcs_admin") === "1");

  const [page,        setPage]        = useState("predict");
  const [filterPhase, setFilterPhase] = useState("Group Stage");
  const [filterGroup, setFilterGroup] = useState("all");
  const [viewingPlayer, setViewingPlayer] = useState(null); // for "others" page

  // Admin player management
  const [newNick,     setNewNick]     = useState("");
  const [editNick,    setEditNick]    = useState({});

  // ── Load data ──
  useEffect(() => {
    (async () => {
      const [{ data:pls }, { data:preds }, { data:res }] = await Promise.all([
        supabase.from("players").select("*").order("created_at"),
        supabase.from("predictions").select("*"),
        supabase.from("results").select("*"),
      ]);
      setPlayers(pls || []);
      const predMap = {};
      (preds||[]).forEach(p => { if (!predMap[p.player_id]) predMap[p.player_id]={}; predMap[p.player_id][p.match_id]={winner:p.winner,score1:p.score1,score2:p.score2}; });
      setPredictions(predMap);
      const resMap = {};
      (res||[]).forEach(r => { resMap[r.match_id]={winner:r.winner,score1:r.score1,score2:r.score2}; });
      setResults(resMap);
      setLoading(false);
    })();
  }, []);

  // ── Realtime ──
  useEffect(() => {
    const ch = supabase.channel("rlcs-live")
      .on("postgres_changes", { event:"*", schema:"public", table:"players" }, ({ eventType:et, new:n, old:o }) => {
        setPlayers(prev => et==="INSERT"?[...prev,n]:et==="UPDATE"?prev.map(p=>p.id===n.id?n:p):prev.filter(p=>p.id!==o.id));
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"predictions" }, ({ eventType:et, new:p }) => {
        if (et==="INSERT"||et==="UPDATE") setPredictions(prev => ({ ...prev, [p.player_id]:{ ...(prev[p.player_id]||{}), [p.match_id]:{winner:p.winner,score1:p.score1,score2:p.score2} } }));
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"results" }, ({ eventType:et, new:r, old:o }) => {
        if (et==="INSERT"||et==="UPDATE") setResults(prev=>({...prev,[r.match_id]:{winner:r.winner,score1:r.score1,score2:r.score2}}));
        else setResults(prev=>{ const n={...prev}; delete n[o.match_id]; return n; });
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  // ── Persist auth ──
  useEffect(() => {
    if (authId) localStorage.setItem("rlcs_auth", authId);
    else localStorage.removeItem("rlcs_auth");
  }, [authId]);
  useEffect(() => {
    if (isAdmin) localStorage.setItem("rlcs_admin", "1");
    else localStorage.removeItem("rlcs_admin");
  }, [isAdmin]);

  const logout = () => { setAuthId(null); setIsAdmin(false); setPage("predict"); };

  // ── Handlers ──
  const handlePredict = useCallback(async (matchId, pred) => {
    if (!authId || authId === "admin") return;
    setPredictions(prev => ({ ...prev, [authId]:{ ...(prev[authId]||{}), [matchId]:pred } }));
    await supabase.from("predictions").upsert({ player_id:authId, match_id:matchId, winner:pred.winner, score1:pred.score1, score2:pred.score2, updated_at:new Date().toISOString() }, { onConflict:"player_id,match_id" });
  }, [authId]);

  const handleSetResult = useCallback(async (matchId, result) => {
    if (result === null) {
      setResults(prev => { const n={...prev}; delete n[matchId]; return n; });
      await supabase.from("results").delete().eq("match_id", matchId);
    } else {
      setResults(prev => ({ ...prev, [matchId]:result }));
      await supabase.from("results").upsert({ match_id:matchId, ...result, set_at:new Date().toISOString() }, { onConflict:"match_id" });
    }
  }, []);

  const handleAddPlayer = async () => {
    const nick = newNick.trim();
    if (!nick) return;
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    await supabase.from("players").insert({ id, nickname:nick });
    setNewNick("");
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm("Delete this player and all their predictions?")) return;
    await supabase.from("players").delete().eq("id", id);
  };

  const handleRename = async (id, nickname) => {
    setPlayers(prev => prev.map(p => p.id===id?{...p,nickname}:p));
    await supabase.from("players").update({ nickname }).eq("id", id);
    setEditNick(n => { const c={...n}; delete c[id]; return c; });
  };

  const getScore = (pid) => ALL_MATCHES.reduce((t,m) => t + calcScore(predictions[pid]?.[m.id], results[m.id]), 0);
  const leaderboard = [...players].map(p => ({ ...p, score:getScore(p.id) })).sort((a,b) => b.score-a.score);
  const myPlayer = players.find(p => p.id === authId);

  const filteredMatches = ALL_MATCHES.filter(m => {
    if (filterPhase==="Group Stage" && m.phase!=="Group Stage") return false;
    if (filterPhase==="Playoffs"    && m.phase==="Group Stage") return false;
    if (filterPhase==="Group Stage" && filterGroup!=="all" && m.group!==filterGroup) return false;
    return true;
  });

  if (loading) return <LoadingScreen />;
  if (!authId && !isAdmin) return <LoginScreen players={players} onLogin={id => { setAuthId(id); setIsAdmin(false); }} onAdminLogin={() => { setIsAdmin(true); setAuthId(null); }} />;

  // Nav tabs — admin sees extra "Manage Players" tab
  const NAV = [
    { id:"predict",     icon:"🎯", label:"Predictions" },
    { id:"leaderboard", icon:"🏆", label:"Leaderboard" },
    { id:"others",      icon:"👁",  label:"Others' Picks" },
    ...(isAdmin ? [{ id:"admin", icon:"⚙️", label:"Admin" }] : []),
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"#e0e0e0", fontFamily:F.body }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap" rel="stylesheet" />

      {/* ══ HEADER ══ */}
      <div style={{ background:"#0a0a0a", borderBottom:"1px solid #161616", padding:"14px 20px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:20, fontWeight:900, fontFamily:F.main, background:"linear-gradient(90deg,#00d4ff,#f5c518)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                RLCS 2026 · BOSTON MAJOR
              </div>
              <div style={{ fontSize:10, color:"#333", fontFamily:F.main, letterSpacing:1 }}>FEB 19–22 · AGGANIS ARENA · $354,000</div>
            </div>

            {/* Identity pill */}
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#111", border:`1px solid ${isAdmin?"#f5c51830":"#1e1e1e"}`, borderRadius:8, padding:"6px 12px" }}>
              <div style={{ width:24, height:24, borderRadius:6, background:isAdmin?"#f5c518":"#00d4ff20", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12, color:isAdmin?"#000":"#00d4ff", fontFamily:F.main }}>
                {isAdmin ? "A" : myPlayer?.nickname[0].toUpperCase()}
              </div>
              <span style={{ fontSize:12, fontFamily:F.main, fontWeight:800, color:isAdmin?"#f5c518":"#ddd" }}>
                {isAdmin ? "ADMIN" : myPlayer?.nickname}
              </span>
              <button onClick={logout} title="Logout" style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>✕</button>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                padding:"7px 14px", borderRadius:6, border:"none", cursor:"pointer",
                background:page===n.id?"#161616":"transparent",
                color:page===n.id?"#ddd":"#444",
                fontFamily:F.main, fontWeight:800, fontSize:12, letterSpacing:0.5, textTransform:"uppercase",
                borderBottom:page===n.id?"2px solid #f5c518":"2px solid transparent", transition:"color 0.15s",
              }}>{n.icon} {n.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"20px 16px" }}>

        {/* ══ PREDICTIONS ══ */}
        {page === "predict" && (
          <div>
            {/* Phase / Group filters */}
            <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
              {["Group Stage","Playoffs"].map(ph => (
                <button key={ph} onClick={() => { setFilterPhase(ph); setFilterGroup("all"); }} style={{ padding:"6px 14px", borderRadius:7, border:"none", cursor:"pointer", background:filterPhase===ph?"#f5c518":"#111", color:filterPhase===ph?"#000":"#555", fontFamily:F.main, fontWeight:800, fontSize:12 }}>{ph}</button>
              ))}
              {filterPhase==="Group Stage" && ["all","A","B","C","D"].map(g => (
                <button key={g} onClick={() => setFilterGroup(g)} style={{ padding:"6px 14px", borderRadius:7, border:"none", cursor:"pointer", background:filterGroup===g?"#00d4ff":"#111", color:filterGroup===g?"#000":"#555", fontFamily:F.main, fontWeight:800, fontSize:12 }}>
                  {g==="all"?"All Groups":`Group ${g}`}
                </button>
              ))}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filteredMatches.map(m => (
                <MatchCard key={m.id} match={m} playerId={isAdmin?null:authId} predictions={predictions}
                  results={results} onPredict={handlePredict} onSetResult={handleSetResult} isAdmin={false} readOnly={isAdmin} />
              ))}
            </div>
          </div>
        )}

        {/* ══ LEADERBOARD ══ */}
        {page === "leaderboard" && (
          <div>
            <div style={{ fontSize:11, color:"#333", marginBottom:16, fontFamily:F.main, letterSpacing:1, textTransform:"uppercase" }}>
              🟢 3 pts = exact score · 🟡 1 pt = correct winner · 🔴 0 pts = wrong
            </div>
            {leaderboard.length===0 && <div style={{ textAlign:"center", color:"#333", padding:40 }}>No players yet</div>}
            {leaderboard.map((p,i) => (
              <div key={p.id} style={{ background:i===0?"linear-gradient(135deg,#1a1400,#0e0e0e)":"#0d0d0d", border:`1px solid ${p.id===authId?"#00d4ff25":i===0?"#f5c51820":"#181818"}`, borderRadius:12, padding:"14px 18px", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <span style={{ fontSize:22, width:30, textAlign:"center" }}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":<span style={{ fontSize:14, color:"#333", fontFamily:F.main }}>{`#${i+1}`}</span>}
                  </span>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, fontFamily:F.main, display:"flex", alignItems:"center", gap:6 }}>
                      {p.nickname}
                      {p.id===authId && <span style={{ fontSize:9, color:"#00d4ff", background:"#00d4ff15", padding:"1px 7px", borderRadius:4 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize:10, color:"#333", fontFamily:F.main, marginTop:2 }}>
                      {Object.keys(predictions[p.id]||{}).length} / {GROUP_MATCHES.length} predicted
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:30, fontWeight:900, fontFamily:F.main, color:i===0?"#f5c518":"#ddd" }}>
                  {p.score}<span style={{ fontSize:12, color:"#444", marginLeft:4 }}>pts</span>
                </div>
              </div>
            ))}

            {/* Breakdown table */}
            {Object.keys(results).length > 0 && (
              <div style={{ marginTop:28 }}>
                <div style={{ fontSize:11, color:"#333", letterSpacing:1, marginBottom:10, fontFamily:F.main, textTransform:"uppercase" }}>Match Breakdown</div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, fontFamily:F.main }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #181818" }}>
                        <th style={{ textAlign:"left", padding:"5px 8px", color:"#333", fontWeight:700 }}>Match</th>
                        <th style={{ textAlign:"center", padding:"5px 8px", color:"#333" }}>Score</th>
                        {players.map(p => <th key={p.id} style={{ textAlign:"center", padding:"5px 8px", color:p.id===authId?"#00d4ff":"#333" }}>{p.nickname}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_MATCHES.filter(m=>results[m.id]).map(m => (
                        <tr key={m.id} style={{ borderBottom:"1px solid #0f0f0f" }}>
                          <td style={{ padding:"5px 8px", color:"#555", maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.team1.split(" ").pop()} vs {m.team2.split(" ").pop()}</td>
                          <td style={{ textAlign:"center", padding:"5px 8px", color:"#444" }}>{results[m.id].score1}–{results[m.id].score2}</td>
                          {players.map(p => {
                            const s = calcScore(predictions[p.id]?.[m.id], results[m.id]);
                            const has = !!predictions[p.id]?.[m.id];
                            return <td key={p.id} style={{ textAlign:"center", padding:"5px 8px", fontWeight:900, color:!has?"#222":s===3?"#00c77a":s===1?"#f5c518":"#e74c3c" }}>{has?`+${s}`:"—"}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ OTHERS' PICKS ══ */}
        {page === "others" && (
          <div>
            <div style={{ fontSize:11, color:"#333", marginBottom:16, fontFamily:F.main, letterSpacing:1, textTransform:"uppercase" }}>
              👁 Predictions are only visible for matches that have already started (locked)
            </div>

            {/* Player selector */}
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              {players.filter(p => p.id !== authId).map(p => (
                <button key={p.id} onClick={() => setViewingPlayer(viewingPlayer===p.id?null:p.id)} style={{
                  padding:"8px 16px", borderRadius:8, border:`1px solid ${viewingPlayer===p.id?"#00d4ff40":"#1e1e1e"}`,
                  background:viewingPlayer===p.id?"#00d4ff15":"#0d0d0d",
                  color:viewingPlayer===p.id?"#00d4ff":"#555",
                  fontFamily:F.main, fontWeight:800, fontSize:13, cursor:"pointer", transition:"all 0.15s",
                }}>
                  {p.nickname}
                  <span style={{ marginLeft:6, fontSize:10, color:viewingPlayer===p.id?"#00d4ff":"#333" }}>
                    {getScore(p.id)} pts
                  </span>
                </button>
              ))}
              {players.filter(p=>p.id!==authId).length===0 && (
                <div style={{ color:"#333", fontSize:13, fontFamily:F.main }}>No other players yet</div>
              )}
            </div>

            {viewingPlayer && (() => {
              const vp = players.find(p=>p.id===viewingPlayer);
              const lockedMatches = ALL_MATCHES.filter(m => isLocked(m) && m.team1!=="TBD");
              const hasPreds = lockedMatches.filter(m => predictions[viewingPlayer]?.[m.id]);
              return (
                <div>
                  <div style={{ fontSize:14, fontWeight:800, fontFamily:F.main, color:"#ddd", marginBottom:4 }}>
                    {vp?.nickname}'s predictions
                  </div>
                  <div style={{ fontSize:11, color:"#333", fontFamily:F.main, marginBottom:14 }}>
                    {hasPreds.length} predictions made on locked matches · {getScore(viewingPlayer)} pts total
                  </div>
                  {lockedMatches.length === 0 && (
                    <div style={{ textAlign:"center", color:"#333", padding:40, fontFamily:F.main }}>
                      No matches have started yet — check back after Feb 19!
                    </div>
                  )}
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {lockedMatches.map(m => (
                      <MatchCard key={m.id} match={m} playerId={viewingPlayer} predictions={predictions}
                        results={results} onPredict={()=>{}} onSetResult={()=>{}} isAdmin={false} readOnly={true} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {!viewingPlayer && players.filter(p=>p.id!==authId).length > 0 && (
              <div style={{ textAlign:"center", color:"#2a2a2a", padding:40, fontFamily:F.main, fontSize:13 }}>
                ↑ Select a player above to see their picks
              </div>
            )}
          </div>
        )}

        {/* ══ ADMIN ══ */}
        {page === "admin" && isAdmin && (
          <div>
            {/* ── Manage Players ── */}
            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:13, fontWeight:800, fontFamily:F.main, color:"#f5c518", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>
                👥 Manage Players
              </div>

              {players.map(p => (
                <div key={p.id} style={{ background:"#0d0d0d", border:"1px solid #181818", borderRadius:10, padding:"10px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:30, height:30, borderRadius:7, background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#f5c518", fontFamily:F.main, flexShrink:0 }}>
                    {p.nickname[0].toUpperCase()}
                  </div>
                  {editNick[p.id] !== undefined ? (
                    <div style={{ flex:1, display:"flex", gap:6 }}>
                      <input value={editNick[p.id]} onChange={e=>setEditNick(n=>({...n,[p.id]:e.target.value}))} autoFocus
                        onKeyDown={e=>{ if(e.key==="Enter") handleRename(p.id, editNick[p.id]||p.nickname); }}
                        style={{ flex:1, background:"#111", border:"1px solid #2a2a2a", borderRadius:6, color:"#ddd", padding:"5px 10px", fontSize:13, fontFamily:F.body }} />
                      <button onClick={()=>handleRename(p.id, editNick[p.id]||p.nickname)} style={{ background:"#00c77a", border:"none", borderRadius:6, color:"#000", fontWeight:900, padding:"5px 12px", fontFamily:F.main, cursor:"pointer", fontSize:11 }}>SAVE</button>
                      <button onClick={()=>setEditNick(n=>{const c={...n};delete c[p.id];return c;})} style={{ background:"#181818", border:"none", borderRadius:6, color:"#555", fontWeight:800, padding:"5px 10px", fontFamily:F.main, cursor:"pointer" }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex:1, fontSize:13, fontWeight:800, fontFamily:F.main }}>
                        {p.nickname}
                        <span style={{ color:"#333", fontWeight:400, fontSize:11, marginLeft:8 }}>{getScore(p.id)} pts</span>
                      </div>
                      <button onClick={()=>setEditNick(n=>({...n,[p.id]:p.nickname}))} style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:6, color:"#555", fontFamily:F.main, fontWeight:800, fontSize:11, padding:"4px 10px", cursor:"pointer" }}>RENAME</button>
                      <button onClick={()=>handleDeletePlayer(p.id)} style={{ background:"#1a0000", border:"1px solid #e74c3c20", borderRadius:6, color:"#e74c3c", fontFamily:F.main, fontWeight:800, fontSize:11, padding:"4px 10px", cursor:"pointer" }}>DELETE</button>
                    </>
                  )}
                </div>
              ))}

              {/* Add player */}
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <input value={newNick} onChange={e=>setNewNick(e.target.value)} placeholder="New player nickname…"
                  onKeyDown={e=>{ if(e.key==="Enter") handleAddPlayer(); }}
                  style={{ flex:1, background:"#0d0d0d", border:"1px dashed #222", borderRadius:10, color:"#ddd", padding:"10px 14px", fontSize:13, fontFamily:F.body }} />
                <button onClick={handleAddPlayer} style={{ padding:"10px 20px", background:"#f5c518", border:"none", borderRadius:10, cursor:"pointer", color:"#000", fontFamily:F.main, fontWeight:900, fontSize:13 }}>+ ADD</button>
              </div>
            </div>

            {/* ── Set Match Results ── */}
            <div>
              <div style={{ fontSize:13, fontWeight:800, fontFamily:F.main, color:"#f5c518", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>
                🎯 Set Match Results
              </div>

              {/* Phase filter for admin */}
              <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
                {["Group Stage","Playoffs"].map(ph => (
                  <button key={ph} onClick={() => { setFilterPhase(ph); setFilterGroup("all"); }} style={{ padding:"6px 14px", borderRadius:7, border:"none", cursor:"pointer", background:filterPhase===ph?"#f5c518":"#111", color:filterPhase===ph?"#000":"#555", fontFamily:F.main, fontWeight:800, fontSize:12 }}>{ph}</button>
                ))}
                {filterPhase==="Group Stage" && ["all","A","B","C","D"].map(g => (
                  <button key={g} onClick={() => setFilterGroup(g)} style={{ padding:"6px 14px", borderRadius:7, border:"none", cursor:"pointer", background:filterGroup===g?"#00d4ff":"#111", color:filterGroup===g?"#000":"#555", fontFamily:F.main, fontWeight:800, fontSize:12 }}>
                    {g==="all"?"All Groups":`Group ${g}`}
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {filteredMatches.filter(m=>m.team1!=="TBD").map(m => (
                  <MatchCard key={m.id} match={m} playerId={null} predictions={predictions}
                    results={results} onPredict={()=>{}} onSetResult={handleSetResult} isAdmin={true} readOnly={false} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop:"1px solid #0f0f0f", padding:16, textAlign:"center", fontSize:10, color:"#1e1e1e", fontFamily:F.main, letterSpacing:1 }}>
        RLCS 2026 BOSTON MAJOR PREDICTOR · LIVE SYNC BY SUPABASE
      </div>
    </div>
  );
}