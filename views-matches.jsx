/* views-matches.jsx — redesigned with face-off cards */
const { useState: useStateM, useMemo: useMemoM } = React;

/* ── ROUND TREND — league-wide line chart (constant width) ─ */
function RoundSummary({ matches, pc, metric }) {
  const [hover, setHover] = useStateM(null);

  const stats = useMemoM(() => ROUNDS.map(r => {
    const ms = matches.filter(m => r.ids.includes(m.matchId));
    let tot=0, hgM=0;
    const played = ms.flatMap(m => m.players.filter(p => p.mins > 0));
    for (const p of played) {
      tot += p.mins;
      if (pc[p.id]?.homegrown) hgM += p.mins;
    }
    const wa = played.filter(p => pc[p.id]?.birthYear);
    const avgAge = wa.length ? wa.reduce((s,p) => s+(2026-pc[p.id].birthYear), 0) / wa.length : null;
    const hgCount = played.filter(p => pc[p.id]?.homegrown).length;
    return {
      n: r.n, label: r.label, played: played.length,
      minPct: tot ? Math.round(hgM/tot*100) : 0,
      hgPct:  played.length ? Math.round(hgCount/played.length*100) : 0,
      avgAge,
    };
  }).filter(s => s.played > 0).sort((a,b) => a.n - b.n), [matches, pc]);

  const getPct    = s => metric==='minPct' ? s.minPct : s.hgPct;
  const pctLabel  = metric==='minPct' ? `Hlutfall mínútna — ${HGADJ_LC}` : `Hlutfall leikmanna — ${HGADJ_LC}`;

  if (!stats.length) return null;

  const pcts = stats.map(getPct);
  const avgSeason = Math.round(pcts.reduce((a,b)=>a+b,0) / pcts.length);

  // Fallback for the very start of a season (single round) — no line to draw
  if (stats.length < 2) {
    const s = stats[0];
    return (
      <div className="card" style={{ padding:'16px 22px', marginBottom:28, display:'flex', alignItems:'baseline', gap:10 }}>
        <span style={{ fontFamily:MONO, fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.muted }}>{s.label}</span>
        <span style={{ fontFamily:MONO, fontSize:24, fontWeight:600, color:quartColorFor(getPct(s), metric) }}>{getPct(s)}%</span>
        <span style={{ fontFamily:MONO, fontSize:11, color:C.muted }}>{pctLabel}</span>
      </div>
    );
  }

  const ages = stats.map(s=>s.avgAge).filter(v=>v!=null);
  let pMin = Math.max(0,   Math.floor((Math.min(...pcts)-6)/5)*5);
  let pMax = Math.min(100, Math.ceil ((Math.max(...pcts)+6)/5)*5);
  if (pMax - pMin < 20) pMax = Math.min(100, pMin + 20);
  const aMin = Math.floor(Math.min(...ages) - 1);
  const aMax = Math.ceil (Math.max(...ages) + 1);

  const W=680, H=200, PL=40, PR=44, PT=18, PB=30;
  const IW=W-PL-PR, IH=H-PT-PB, n=stats.length;
  const xAt  = i => PL + (n===1 ? IW/2 : (i/(n-1))*IW);
  const pyAt = v => PT + IH - ((v-pMin)/(pMax-pMin))*IH;
  const ayAt = v => PT + IH - ((v-aMin)/(aMax-aMin))*IH;

  const pctPts  = stats.map((s,i)=>`${xAt(i)},${pyAt(getPct(s))}`).join(' ');
  const areaPts = `${xAt(0)},${PT+IH} ${pctPts} ${xAt(n-1)},${PT+IH}`;
  const ageLine = stats.map((s,i)=>s.avgAge!=null?`${xAt(i)},${ayAt(s.avgAge)}`:null).filter(Boolean).join(' ');

  const pStep = Math.max(5, Math.ceil((pMax-pMin)/4/5)*5);
  const pTicks=[]; for(let v=pMin; v<=pMax; v+=pStep) pTicks.push(v);
  const everyN = n>14 ? 2 : 1;

  return (
    <div className="card" style={{ padding:'18px 22px 14px', marginBottom:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
        <div style={{ fontFamily:MONO, fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.muted, display:'flex', alignItems:'center' }}>
          {pctLabel} eftir umferðum <InfoTip text={metric==='minPct'?TIPS.hgMin:TIPS.hgPct}/>
        </div>
        <div style={{ fontFamily:MONO, fontSize:11, color:C.muted }}>
          Meðaltal <span style={{ color:C.orange, fontWeight:700 }}>{avgSeason}%</span>
        </div>
      </div>
      <div style={{ position:'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', overflow:'visible' }}>
          {/* % grid + left axis */}
          {pTicks.map(v=>(
            <g key={'p'+v}>
              <line x1={PL} x2={PL+IW} y1={pyAt(v)} y2={pyAt(v)} stroke={C.border} strokeWidth="0.5"/>
              <text x={PL-6} y={pyAt(v)+3} textAnchor="end" fontSize="9" fill={C.orange} fontFamily="monospace">{v}%</text>
            </g>
          ))}
          {/* age right axis */}
          {[aMin, Math.round((aMin+aMax)/2), aMax].map(a=>(
            <text key={'a'+a} x={PL+IW+6} y={ayAt(a)+3} textAnchor="start" fontSize="9" fill={C.blue} fontFamily="monospace">{a}</text>
          ))}
          {/* season-average reference */}
          <line x1={PL} x2={PL+IW} y1={pyAt(avgSeason)} y2={pyAt(avgSeason)} stroke={C.orange} strokeWidth="1" strokeDasharray="3,3" opacity="0.35"/>
          {/* lines */}
          <polyline points={ageLine} fill="none" stroke={C.blue} strokeWidth="2" opacity="0.85"/>
          <polyline points={pctPts}  fill="none" stroke={C.orange} strokeWidth="2.5"/>
          {/* x labels */}
          {stats.map((s,i)=> (i%everyN===0 || i===n-1) ? (
            <text key={'x'+i} x={xAt(i)} y={PT+IH+14} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="monospace">{s.n}</text>
          ) : null)}
          <text x={PL+IW/2} y={H} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="monospace">Umferð</text>
          {/* points + hover zones */}
          {stats.map((s,i)=>(
            <g key={'pt'+i} onMouseEnter={()=>setHover({ ...s, x:xAt(i) })} onMouseLeave={()=>setHover(null)}>
              <rect x={xAt(i)-(IW/n)/2} y={PT} width={Math.max(IW/n,10)} height={IH} fill="transparent" style={{ cursor:'pointer' }}/>
              {s.avgAge!=null && <circle cx={xAt(i)} cy={ayAt(s.avgAge)} r={hover?.n===s.n?3.5:2.5} fill={C.blue} opacity="0.85"/>}
              <circle cx={xAt(i)} cy={pyAt(getPct(s))} r={hover?.n===s.n?4.5:3} fill={C.orange}/>
            </g>
          ))}
          {hover && <line x1={hover.x} x2={hover.x} y1={PT} y2={PT+IH} stroke={C.border} strokeWidth="1" strokeDasharray="3,3"/>}
        </svg>
        {hover && (
          <div style={{ position:'absolute', top:4, right:8, background:C.surface,
            border:`1px solid ${C.border}`, padding:'8px 12px', pointerEvents:'none',
            boxShadow:'0 2px 10px rgba(0,0,0,.1)', minWidth:120 }}>
            <div style={{ fontWeight:600, fontSize:12, marginBottom:4 }}>{hover.label}</div>
            <div style={{ fontFamily:MONO, fontSize:11, color:C.orange }}>{getPct(hover)}% {HGADJ_LC}</div>
            {hover.avgAge!=null && <div style={{ fontFamily:MONO, fontSize:11, color:C.blue }}>{fn(hover.avgAge)} ára meðalaldur</div>}
          </div>
        )}
      </div>
      {/* legend */}
      <div style={{ display:'flex', gap:16, marginTop:8, alignItems:'center', flexWrap:'wrap' }}>
        {[{c:C.orange,l:pctLabel},{c:C.blue,l:'Meðalaldur'}].map(({c,l})=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.muted }}>
            <div style={{ width:16, height:2, background:c }}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FACE-OFF MATCH CARD ────────────────────────────────── */
function MatchCard({ match, pc, metric, onClick }) {
  const [h, setH] = useStateM(false);
  const hs = matchTeamStats(match, match.homeTeam, pc);
  const as = matchTeamStats(match, match.awayTeam, pc);
  const hPct = metric==='minPct' ? hs.minPct : hs.hgPct;
  const aPct = metric==='minPct' ? as.minPct : as.hgPct;
  const hCol = quartColorFor(hPct, metric);
  const aCol = quartColorFor(aPct, metric);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: C.surface,
        border: `1px solid ${h ? C.orange : C.border}`,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color .12s, box-shadow .12s',
        boxShadow: h ? '0 4px 16px rgba(0,0,0,.09)' : '0 1px 2px rgba(0,0,0,.04)',
      }}
    >
      {/* Team names row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600, fontSize:14, color:C.text, lineHeight:1.2 }}>{td(match.homeTeam)}</div>
          <div style={{ fontFamily:MONO, fontSize:10, color:C.muted, marginTop:3 }}>
            {fn(hs.avgAge)} ára · {hs.hgCount} upp.
          </div>
        </div>
        <div style={{ flexShrink:0, margin:'0 10px', textAlign:'center' }}>
          {match.homeScore!=null && match.awayScore!=null ? (
            <div style={{ fontFamily:MONO, fontSize:18, fontWeight:700, color:C.text, lineHeight:1, whiteSpace:'nowrap' }}>
              {match.homeScore}<span style={{ color:C.muted, margin:'0 3px' }}>–</span>{match.awayScore}
            </div>
          ) : (
            <div style={{ fontFamily:MONO, fontSize:9, color:C.muted, padding:'3px 8px', background:C.surfaceAlt, borderRadius:3 }}>vs</div>
          )}
        </div>
        <div style={{ flex:1, textAlign:'right' }}>
          <div style={{ fontWeight:600, fontSize:14, color:C.text, lineHeight:1.2 }}>{td(match.awayTeam)}</div>
          <div style={{ fontFamily:MONO, fontSize:10, color:C.muted, marginTop:3 }}>
            {fn(as.avgAge)} ára · {as.hgCount} upp.
          </div>
        </div>
      </div>

      {/* Face-off bar: home from left, away from right, center split */}
      <div style={{ height:10, background:C.surfaceAlt, borderRadius:5, overflow:'hidden', position:'relative', margin:'4px 0 8px' }}>
        {/* Home fills from left — max 50% of bar */}
        <div style={{
          position:'absolute', left:0, top:0, bottom:0,
          width:`${hPct/2}%`,
          background:hCol,
          borderRadius:'5px 0 0 5px',
        }}/>
        {/* Away fills from right — max 50% of bar */}
        <div style={{
          position:'absolute', right:0, top:0, bottom:0,
          width:`${aPct/2}%`,
          background:aCol,
          opacity:.85,
          borderRadius:'0 5px 5px 0',
        }}/>
        {/* Center divider */}
        <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'rgba(0,0,0,.12)' }}/>
      </div>

      {/* Percentages + label */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:MONO, fontSize:13, fontWeight:600, color:hCol }}>{hPct}%</span>
        <span style={{ fontFamily:MONO, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>
          {metric==='minPct' ? 'mín ↑' : 'leikm ↑'}
        </span>
        <span style={{ fontFamily:MONO, fontSize:13, fontWeight:600, color:aCol }}>{aPct}%</span>
      </div>
    </div>
  );
}

/* ── MATCHES VIEW ───────────────────────────────────────── */
function MatchesView({ matches, pc, metric, onMatch }) {
  return (
    <div className="fade-in">
      <PageTitle sub={`${matches.length} leikir · ${ROUNDS.filter(r=>r.n<=13).length} umferðir`}>Leikjayfirlit</PageTitle>

      {/* Per-round stat strip */}
      <RoundSummary matches={matches} pc={pc} metric={metric}/>

      {/* Rounds */}
      {ROUNDS.map(r => (
        <div key={r.label} style={{ marginBottom:28 }}>
          <div style={{ fontFamily:MONO, fontSize:10, color:C.muted, letterSpacing:'.1em', textTransform:'uppercase', paddingBottom:8, borderBottom:`1px solid ${C.border}`, marginBottom:12 }}>
            {r.label}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
            {r.ids.map(id => {
              const m = matches.find(x => x.matchId===id);
              if (!m) return null;
              return <MatchCard key={id} match={m} pc={pc} metric={metric} onClick={() => onMatch(id)}/>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── EVENT BADGES (goals + cards for one player in a match) ── */
function Card({ color }) {
  return <span style={{ display:'inline-block', width:7, height:10, borderRadius:1.5, background:color, verticalAlign:'middle' }}/>;
}
function Ball({ own }) {
  return (
    <span style={{ display:'inline-flex', width:11, height:11, borderRadius:'50%', background: own?C.red:C.green, alignItems:'center', justifyContent:'center', verticalAlign:'middle' }}>
      <span style={{ width:4, height:4, borderRadius:'50%', background:'#fff' }}/>
    </span>
  );
}
function EventBadges({ ev }) {
  if (!ev) return null;
  const items = [];
  // Regular goals
  if (ev.goals > 0) {
    items.push(
      <span key="g" style={{ display:'inline-flex', alignItems:'center', gap:3 }} title={`${ev.goals} mörk${ev.penalties?` (${ev.penalties} víti)`:''}`}>
        <Ball/>
        {ev.goals > 1 && <span style={{ fontFamily:MONO, fontSize:10, color:C.text, fontWeight:600 }}>×{ev.goals}</span>}
        {ev.penalties > 0 && <span style={{ fontFamily:MONO, fontSize:9, color:C.muted }}>({ev.penalties}v)</span>}
      </span>
    );
  }
  // Own goals
  if (ev.ownGoals > 0) {
    items.push(
      <span key="og" style={{ display:'inline-flex', alignItems:'center', gap:3 }} title="Sjálfsmark">
        <Ball own/>
        <span style={{ fontFamily:MONO, fontSize:9, color:C.red }}>sj{ev.ownGoals>1?`×${ev.ownGoals}`:''}</span>
      </span>
    );
  }
  if (ev.yellow > 0) items.push(<Card key="y" color="#f5c518"/>);
  if (ev.red > 0)    items.push(<Card key="r" color={C.red}/>);
  if (!items.length) return null;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:6, marginLeft:8 }}>{items}</span>;
}

/* ── PLAYER ROW (match detail) ──────────────────────────── */
function PlayerRow({ p, pc, ev }) {
  const s = pc[p.id] || {};
  const age = s.birthYear ? 2026 - s.birthYear : null;
  return (
    <tr>
      <td className="num" style={{ width:32, color:C.muted, fontSize:11 }}>{p.number}</td>
      <td style={{ fontWeight: p.mins > 0 ? 500 : 400, color: p.mins > 0 ? C.text : C.muted }}>
        <span style={{ display:'inline-flex', alignItems:'center', flexWrap:'wrap' }}>
          {p.name}
          <EventBadges ev={ev}/>
        </span>
      </td>
      <td className="num" style={{ width:52, color:C.muted, fontSize:12 }}>{p.mins > 0 ? `${p.mins}m` : '—'}</td>
      <td className="num" style={{ width:52 }}><AgeBadge age={age}/></td>
      <td style={{ width:32, textAlign:'center' }}>
        {p.mins > 0 && <HgDot homegrown={s.homegrown}/>}
      </td>
    </tr>
  );
}

/* ── TEAM BLOCK (match detail) ──────────────────────────── */
function TeamBlock({ match, team, pc, onTeam, metric }) {
  const s = matchTeamStats(match, team, pc);
  const pct = metric==='minPct' ? s.minPct : s.hgPct;
  const starters = match.players.filter(p => p.team===team && p.isStarter);
  const bench    = match.players.filter(p => p.team===team && !p.isStarter);

  // Per-player events for THIS match
  const evMap = {};
  for (const e of (match.events||[])) {
    if (!e.playerId) continue;
    if (!evMap[e.playerId]) evMap[e.playerId] = { goals:0, penalties:0, ownGoals:0, yellow:0, red:0 };
    const r = evMap[e.playerId];
    if (e.type==='goal') { if (e.isOwnGoal) r.ownGoals++; else { r.goals++; if (e.isPenalty) r.penalties++; } }
    else if (e.type==='yellow_card' && !e.isSecondYellow) r.yellow++;
    else if (e.type==='red_card') r.red++;
  }

  // Average ages
  const avgAgeOf = list => {
    const ages = list.map(p => pc[p.id]?.birthYear ? 2026 - pc[p.id].birthYear : null).filter(a => a!=null);
    return ages.length ? (ages.reduce((s,a)=>s+a,0)/ages.length) : null;
  };
  const benchPlayed = bench.filter(p => p.mins > 0);
  const stAge = avgAgeOf(starters);
  const bnAge = avgAgeOf(benchPlayed);
  const allAge = avgAgeOf([...starters, ...benchPlayed]);

  return (
    <div className="card" style={{ overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:C.surfaceAlt }}>
        <button onClick={() => onTeam(team)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:SANS, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:DISPLAY, fontSize:16, fontWeight:700, color:C.text }}>{td(team)}</span>
          <span style={{ fontFamily:MONO, fontSize:11, color:C.muted }}>↗</span>
        </button>
        <div style={{ display:'flex', gap:16 }}>
          {[
            { v: fn(allAge)+' ára', l: 'Meðalaldur' },
            { v: pct+'%', l: metric==='minPct'?'Mín ↑':HGADJ, c: quartColorFor(pct, metric) },
          ].map(({ v, l, c }) => (
            <div key={l} style={{ textAlign:'right' }}>
              <div style={{ fontFamily:MONO, fontSize:13, fontWeight:600, color:c||C.text }}>{v}</div>
              <div style={{ fontFamily:MONO, fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'.05em', marginTop:1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Starters */}
      <div style={{ padding:'4px 16px', background:C.bg, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:MONO, fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em' }}>
        <span>Byrjunarlið · {starters.length}</span>
        {stAge!=null && <span style={{ textTransform:'none', letterSpacing:0 }}>⌀ {fn(stAge)} ára</span>}
      </div>
      <table className="data-table"><tbody>{starters.map(p => <PlayerRow key={p.id} p={p} pc={pc} ev={evMap[p.id]}/>)}</tbody></table>

      {/* Bench */}
      <div style={{ padding:'4px 16px', background:C.bg, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:MONO, fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em' }}>
        <span>Bekkur{benchPlayed.length ? ` · ${benchPlayed.length} inn á` : ''}</span>
        {bnAge!=null && <span style={{ textTransform:'none', letterSpacing:0 }}>⌀ {fn(bnAge)} ára</span>}
      </div>
      <table className="data-table"><tbody>{bench.map(p => <PlayerRow key={p.id} p={p} pc={pc} ev={evMap[p.id]}/>)}</tbody></table>
    </div>
  );
}

/* ── MATCH DETAIL VIEW ──────────────────────────────────── */
function MatchDetailView({ matchId, matches, pc, onBack, onTeam, metric }) {
  const m = matches.find(x => x.matchId===matchId);
  if (!m) return null;
  const r = getRound(matchId);

  return (
    <div className="fade-in">
      <BackBtn onClick={onBack} to="Leikir"/>

      {r && (
        <div style={{ fontFamily:MONO, fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.orange, marginBottom:8 }}>
          {r.label}
        </div>
      )}
      <h1 style={{ fontFamily:DISPLAY, fontSize:30, fontWeight:700, letterSpacing:'-.02em', lineHeight:1.1, marginBottom:6 }}>
        {td(m.homeTeam)}
        {m.homeScore!=null && m.awayScore!=null ? (
          <span style={{ fontFamily:MONO, fontWeight:700, margin:'0 16px', color:C.orange }}>{m.homeScore}–{m.awayScore}</span>
        ) : (
          <span style={{ color:C.muted, fontWeight:300, margin:'0 14px', fontFamily:SANS, fontSize:24 }}>vs</span>
        )}
        {td(m.awayTeam)}
      </h1>
      <div style={{ fontFamily:MONO, fontSize:11, color:C.muted, marginBottom:24 }}>
        Leikskýrsla #{m.matchId}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: useIsMobile()?'1fr':'1fr 1fr', gap:16 }}>
        <TeamBlock match={m} team={m.homeTeam} pc={pc} onTeam={onTeam} metric={metric}/>
        <TeamBlock match={m} team={m.awayTeam} pc={pc} onTeam={onTeam} metric={metric}/>
      </div>

      <div style={{ marginTop:16, fontFamily:MONO, fontSize:10, color:C.muted, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:C.orange }}/>
          {HGSING}
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
          <span style={{ display:'inline-flex', width:11, height:11, borderRadius:'50%', background:C.green, alignItems:'center', justifyContent:'center' }}>
            <span style={{ width:4, height:4, borderRadius:'50%', background:'#fff' }}/>
          </span>
          Mark (v = víti · sj = sjálfsmark)
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
          <span style={{ display:'inline-block', width:7, height:10, borderRadius:1.5, background:'#f5c518' }}/>
          Gult
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
          <span style={{ display:'inline-block', width:7, height:10, borderRadius:1.5, background:C.red }}/>
          Rautt
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { MatchesView, MatchDetailView });
