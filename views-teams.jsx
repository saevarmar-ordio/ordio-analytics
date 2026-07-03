/* views-teams.jsx — TeamsView + TeamDetailView */
const { useState: useStateT, useMemo: useMemoT } = React;

/* ── AGE DIST CHART — scatter plot ──────────────────────── */
function AgeDistChart({ playerList, pc }) {
  const [hover, setHover] = React.useState(null);

  const players = React.useMemo(() =>
    playerList.map(p => ({
      ...p,
      age: pc[p.id]?.birthYear ? 2026 - pc[p.id].birthYear : null,
      hg:  pc[p.id]?.homegrown || false,
    })).filter(p => p.age !== null),
  [playerList, pc]);

  if (!players.length) return null;

  const ages    = players.map(p => p.age);
  const minAge  = Math.min(...ages) - 1;
  const maxAge  = Math.max(...ages) + 1;
  const maxMins = Math.max(...players.map(p => p.mins), 1);
  const yMax    = Math.ceil(maxMins / 90) * 90;

  const W=560, H=190, PL=46, PR=20, PT=16, PB=32;
  const IW=W-PL-PR, IH=H-PT-PB;
  const px = a => PL + ((a - minAge) / (maxAge - minAge)) * IW;
  const py = m => PT + IH - (m / yMax) * IH;

  const yTicks = [0, Math.round(yMax/2/90)*90, yMax];
  const xTicks = [];
  const range = maxAge - minAge;
  for (let a = Math.ceil(minAge); a <= maxAge; a++) {
    if (range <= 8 || a % 2 === 0) xTicks.push(a);
  }

  return (
    <div>
      <SecHdr>Aldursdreifing — hvert punkt er einn leikmaður</SecHdr>
      <div style={{ position:'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', overflow:'visible' }}>
          {/* Y gridlines */}
          {yTicks.map(m => (
            <g key={m}>
              <line x1={PL} x2={PL+IW} y1={py(m)} y2={py(m)} stroke={C.border} strokeWidth="1"/>
              <text x={PL-6} y={py(m)+4} textAnchor="end" fontSize="9" fill={C.muted} fontFamily="monospace">{m}m</text>
            </g>
          ))}
          {/* X gridlines */}
          {xTicks.map(a => (
            <g key={a}>
              <line x1={px(a)} x2={px(a)} y1={PT} y2={PT+IH} stroke={C.border} strokeWidth="0.5" strokeDasharray="3,3"/>
              <text x={px(a)} y={PT+IH+14} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="monospace">{a}</text>
            </g>
          ))}
          {/* Axes */}
          <line x1={PL} x2={PL+IW} y1={PT+IH} y2={PT+IH} stroke={C.border} strokeWidth="1"/>
          <line x1={PL} x2={PL} y1={PT} y2={PT+IH} stroke={C.border} strokeWidth="1"/>
          {/* Axis labels */}
          <text x={PL+IW/2} y={H-1} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="monospace">Aldur (ár)</text>
          <text x={10} y={PT+IH/2} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="monospace"
            transform={`rotate(-90,10,${PT+IH/2})`}>Mínútur</text>

          {/* Dots — non-hovered first (z-order) */}
          {players.filter(p => hover?.id !== p.id).map(p => (
            <circle key={p.id}
              cx={px(p.age)} cy={py(p.mins)} r={4}
              fill={p.hg ? C.orange : C.muted}
              opacity={hover ? 0.2 : 0.8}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor:'pointer' }}
            />
          ))}
          {/* Hovered dot on top */}
          {hover && (
            <g onMouseLeave={() => setHover(null)}>
              <circle cx={px(hover.age)} cy={py(hover.mins)} r={6}
                fill={hover.hg ? C.orange : C.muted}
                stroke={C.surface} strokeWidth="2"
              />
              {/* Name label */}
              <text
                x={px(hover.age)}
                y={py(hover.mins) - 12}
                textAnchor="middle" fontSize="11" fontWeight="600"
                fill={C.text} fontFamily="sans-serif"
                style={{ pointerEvents:'none' }}
              >{hover.name}</text>
            </g>
          )}
        </svg>

        {/* Hover info card */}
        {hover && (
          <div style={{
            position:'absolute', top:8, right:8,
            background:C.surface, border:`1px solid ${C.border}`,
            padding:'10px 14px', pointerEvents:'none',
            boxShadow:'0 2px 10px rgba(0,0,0,.1)', minWidth:170,
          }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:3 }}>{hover.name}</div>
            <div style={{ fontFamily:MONO, fontSize:11, color:C.muted }}>
              {hover.age} ára · {hover.mins} mínútur
            </div>
            {hover.hg && (
              <div style={{ fontFamily:MONO, fontSize:10, color:C.orange, marginTop:5, display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:C.orange }}/>
                {HGSING}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginTop:10, alignItems:'center' }}>
        {[{c:C.orange,l:HGSING},{c:C.muted,l:'Ekki '+HGSING.toLowerCase()}].map(({c,l})=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.muted }}>
            <div style={{ width:10,height:10,borderRadius:'50%',background:c,opacity:.8 }}/>
            {l}
          </div>
        ))}
        <div style={{ fontFamily:MONO, fontSize:10, color:C.muted, marginLeft:'auto' }}>
          Farðu yfir punkt til að sjá nafn
        </div>
      </div>
    </div>
  );
}

/* ── PLAYER LIST (team detail) ──────────────────────────── */
function TeamPlayerList({ playerList, pc, avgAge, avgAgeSt }) {
  const maxM = Math.max(...playerList.map(p=>p.mins), 1);
  const played = playerList.filter(p=>p.apps>0);
  const benchOnly = playerList.filter(p=>p.apps===0);
  return (
    <div>
      <SecHdr>Leikmannahópur — allir í leikmannaskýrslu</SecHdr>
      <div style={{ display:'flex', gap:18, marginBottom:12, fontFamily:MONO, fontSize:11, alignItems:'baseline', flexWrap:'wrap' }}>
        <span style={{ color:C.muted }}>Meðalaldur XI <span style={{ color:'#1d4ed8', fontWeight:600, fontSize:13 }}>{fn(avgAgeSt)}</span></span>
        <span style={{ color:C.muted }}>Heild <span style={{ color:C.amber, fontWeight:600, fontSize:13 }}>{fn(avgAge)}</span></span>
        <span style={{ color:C.muted, fontSize:10, opacity:.8 }}>· vegið eftir leiktíma</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width:28 }}>#</th>
            <th>Nafn</th>
            <th className="num" style={{ width:100 }}>Mínútur</th>
            <th className="num" style={{ width:72 }}>Sk / Lei</th>
            <th className="num" style={{ width:60 }}>Aldur</th>
            <th style={{ width:28, textAlign:'center' }}>↑</th>
          </tr>
        </thead>
        <tbody>
          {played.map(p=>{
            const s=pc[p.id]||{};
            const age=s.birthYear?2026-s.birthYear:null;
            const pct=Math.round(p.mins/maxM*100);
            return (
              <tr key={p.id}>
                <td className="num" style={{ color:C.muted }}>{p.number}</td>
                <td style={{ fontWeight:500 }}>{p.name}</td>
                <td className="num">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8 }}>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, minWidth:38, textAlign:'right' }}>{p.mins}</span>
                    <div style={{ width:64, height:3, background:C.surfaceAlt, borderRadius:2 }}>
                      <div style={{ height:3, width:`${pct}%`, background:C.amber, borderRadius:2 }}/>
                    </div>
                  </div>
                </td>
                <td className="num" style={{ color:C.muted }}>{p.starts}/{p.apps}</td>
                <td className="num"><AgeBadge age={age}/></td>
                <td style={{ textAlign:'center' }}><HgDot homegrown={s.homegrown}/></td>
              </tr>
            );
          })}
          {benchOnly.length>0 && (
            <tr>
              <td colSpan={6} style={{ background:C.bg, fontFamily:MONO, fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em', padding:'5px 12px' }}>
                Aðeins á bekk — engar mínútur ({benchOnly.length})
              </td>
            </tr>
          )}
          {benchOnly.map(p=>{
            const s=pc[p.id]||{};
            const age=s.birthYear?2026-s.birthYear:null;
            return (
              <tr key={p.id} style={{ opacity:.72 }}>
                <td className="num" style={{ color:C.muted }}>{p.number}</td>
                <td style={{ fontWeight:400, color:C.muted }}>{p.name}</td>
                <td className="num">
                  <span style={{ fontFamily:MONO, fontSize:11, color:C.muted }}>á bekk ×{p.squad}</span>
                </td>
                <td className="num" style={{ color:C.muted }}>0/0</td>
                <td className="num"><AgeBadge age={age}/></td>
                <td style={{ textAlign:'center' }}><HgDot homegrown={s.homegrown}/></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop:10, fontFamily:"'Inter',sans-serif", fontSize:10, color:C.muted }}>
        ↑ = {HGSING.toLowerCase()} í félagi &nbsp;·&nbsp; Sk/Lei = skipan / leikir &nbsp;·&nbsp; „á bekk ×N“ = í hóp N leiki án mínútna
      </div>
    </div>
  );
}

/* ── MATCH LIST (team detail) ───────────────────────────── */
function TeamMatchList({ teamMatches, team, pc, metric, onMatch }) {
  return (
    <div>
      <SecHdr>Leikir ({teamMatches.length})</SecHdr>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {teamMatches.map(m=>{
          const opp=m.homeTeam===team?m.awayTeam:m.homeTeam;
          const s=matchTeamStats(m,team,pc);
          const pct=metric==='minPct'?s.minPct:s.hgPct;
          const r=getRound(m.matchId);
          return (
            <div key={m.matchId} onClick={()=>onMatch(m.matchId)}
              style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'10px 14px', cursor:'pointer', transition:'border-color .15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.orange}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:C.muted, marginBottom:2 }}>
                    {r?r.label:m.matchId}
                  </div>
                  <div style={{ fontWeight:600, fontSize:13 }}>
                    vs <TeamName name={opp}/>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:quartColorFor(pct, metric) }}>{pct}%</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:C.muted, display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <span><span style={{ color:'#1d4ed8' }}>XI</span> {fn(s.avgAgeSt)}</span>
                    <span><span style={{ color:C.amber }}>Heild</span> {fn(s.avgAge)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── ROUND-BY-ROUND TREND — dual-axis line chart ────────── */
function RoundTrendChart({ teamMatches, team, pc }) {
  const [hover, setHover] = React.useState(null);

  const data = React.useMemo(() => {
    return teamMatches.map(m => {
      const r = getRound(m.matchId);
      const s = matchTeamStats(m, team, pc);
      return { n: r ? r.n : null, label: r ? r.label : m.matchId,
               avgAge: s.avgAge, avgAgeSt: s.avgAgeSt, hg: s.hgCount };
    }).filter(d => d.avgAge != null && d.n != null).sort((a,b) => a.n - b.n);
  }, [teamMatches, team, pc]);

  if (data.length < 2) return null;

  const ages  = data.flatMap(d => [d.avgAge, d.avgAgeSt].filter(v => v != null));
  const aMin  = Math.floor(Math.min(...ages) - 1);
  const aMax  = Math.ceil(Math.max(...ages) + 1);
  const hgs   = data.map(d => d.hg);
  const hTop  = Math.max(Math.max(...hgs) + 1, 4);

  const W=600, H=200, PL=40, PR=40, PT=20, PB=32;
  const IW=W-PL-PR, IH=H-PT-PB;
  const n = data.length;
  const xAt  = i => PL + (n===1 ? IW/2 : (i/(n-1))*IW);
  const ayAt = a => PT + IH - ((a - aMin)/(aMax - aMin))*IH;
  const hyAt = h => PT + IH - (h / hTop)*IH;

  const aStep = Math.max(1, Math.ceil((aMax - aMin)/4));
  const aTicks = []; for (let a=aMin; a<=aMax; a+=aStep) aTicks.push(a);
  const hStep = Math.max(1, Math.ceil(hTop/4));
  const hTicks = []; for (let h=0; h<=hTop; h+=hStep) hTicks.push(h);

  const ageLine = data.map((d,i) => `${xAt(i)},${ayAt(d.avgAge)}`).join(' ');
  const stLine  = data.filter(d=>d.avgAgeSt!=null).map((d,i,arr) => `${xAt(data.indexOf(d))},${ayAt(d.avgAgeSt)}`).join(' ');
  const hgLine  = data.map((d,i) => `${xAt(i)},${hyAt(d.hg)}`).join(' ');

  return (
    <div>
      <SecHdr>Þróun milli umferða — meðalaldur &amp; {HGADJ_LC}</SecHdr>
      <div style={{ position:'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', overflow:'visible' }}>
          {/* Left axis ticks (age) */}
          {aTicks.map(a => (
            <g key={'a'+a}>
              <line x1={PL} x2={PL+IW} y1={ayAt(a)} y2={ayAt(a)} stroke={C.border} strokeWidth="0.5"/>
              <text x={PL-6} y={ayAt(a)+3} textAnchor="end" fontSize="9" fill={C.amber} fontFamily="monospace">{a}</text>
            </g>
          ))}
          {/* Right axis ticks (homegrown count) */}
          {hTicks.map(h => (
            <text key={'h'+h} x={PL+IW+6} y={hyAt(h)+3} textAnchor="start" fontSize="9" fill={C.orange} fontFamily="monospace">{h}</text>
          ))}
          {/* X labels */}
          {data.map((d,i) => (
            <text key={'x'+i} x={xAt(i)} y={PT+IH+14} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="monospace">{d.n}</text>
          ))}
          <text x={PL+IW/2} y={H-1} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="monospace">Umferð</text>

          {/* Lines */}
          <polyline points={hgLine}  fill="none" stroke={C.orange} strokeWidth="2" opacity="0.5" strokeDasharray="4,3"/>
          <polyline points={ageLine} fill="none" stroke={C.amber} strokeWidth="2"/>
          <polyline points={stLine}  fill="none" stroke="#1d4ed8" strokeWidth="2"/>

          {/* Points */}
          {data.map((d,i) => (
            <g key={'p'+i}
              onMouseEnter={() => setHover({ ...d, x:xAt(i) })}
              onMouseLeave={() => setHover(null)}>
              <rect x={xAt(i)-(IW/n)/2} y={PT} width={Math.max(IW/n,12)} height={IH} fill="transparent" style={{ cursor:'pointer' }}/>
              <circle cx={xAt(i)} cy={hyAt(d.hg)}      r={hover?.n===d.n?4:3} fill={C.orange} opacity="0.6"/>
              <circle cx={xAt(i)} cy={ayAt(d.avgAge)}  r={hover?.n===d.n?4:3} fill={C.amber}/>
              {d.avgAgeSt!=null && <circle cx={xAt(i)} cy={ayAt(d.avgAgeSt)} r={hover?.n===d.n?4:3} fill="#1d4ed8"/>}
            </g>
          ))}
          {hover && (
            <line x1={hover.x} x2={hover.x} y1={PT} y2={PT+IH} stroke={C.border} strokeWidth="1" strokeDasharray="3,3"/>
          )}
        </svg>

        {hover && (
          <div style={{ position:'absolute', top:8, right:8, background:C.surface,
            border:`1px solid ${C.border}`, padding:'8px 12px', pointerEvents:'none',
            boxShadow:'0 2px 10px rgba(0,0,0,.1)', minWidth:130 }}>
            <div style={{ fontWeight:600, fontSize:12, marginBottom:4 }}>{hover.label}</div>
            <div style={{ fontFamily:MONO, fontSize:11, color:'#1d4ed8' }}>{fn(hover.avgAgeSt)} ára byrjunarlið</div>
            <div style={{ fontFamily:MONO, fontSize:11, color:C.amber }}>{fn(hover.avgAge)} ára heild</div>
            <div style={{ fontFamily:MONO, fontSize:11, color:C.orange }}>{hover.hg} {HGADJ_LC}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:14, marginTop:10, alignItems:'center', flexWrap:'wrap' }}>
        {[{c:'#1d4ed8',l:'Meðalaldur XI'},{c:C.amber,l:'Meðalaldur heild'},{c:C.orange,l:HGADJ}].map(({c,l})=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.muted }}>
            <div style={{ width:16, height:2, background:c }}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── TEAM DETAIL VIEW ───────────────────────────────────── */
function TeamDetailView({ team, matches, pc, metric, onBack, onMatch }) {
  const agg = useMemoT(()=>teamAgg(matches,pc,team),[matches,pc,team]);
  const res = useMemoT(()=>teamResults(matches,team),[matches,team]);

  return (
    <div className="fade-in">
      <BackBtn onClick={onBack} to="Lið"/>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:MONO, fontSize:11, textTransform:'uppercase', letterSpacing:'.1em', color:C.orange, marginBottom:6 }}>Liðayfirlit</div>
        <h1 style={{ fontFamily:DISPLAY, fontSize:32, fontWeight:700, letterSpacing:'-.025em', lineHeight:1.1, marginBottom:6 }}>
          <TeamName name={team} size={32}/>
        </h1>
        <div style={{ fontFamily:MONO, fontSize:11, color:C.muted }}>
          {agg.teamMatches.length} leikir · {res.w}S {res.d}J {res.l}T · {res.pts} stig
        </div>
      </div>

      {/* Results KPIs */}
      <SecHdr>Úrslit & árangur</SecHdr>
      <KpiGrid items={[
        {label:'Stig',        value:res.pts,                              color:C.text},
        {label:'Mörk skoruð', value:res.gf},
        {label:'Mörk á sig',  value:res.ga},
        {label:'Markamunur',  value:(res.gd>0?'+':'')+res.gd,             color:res.gd>0?C.green:res.gd<0?C.red:C.muted},
        {label:'Gul spjöld',  value:res.yc,                               color:res.yc?C.amber:C.muted},
        {label:'Rauð spjöld', value:res.rc,                               color:res.rc?C.red:C.muted},
      ]}/>

      {/* Squad KPIs */}
      <SecHdr>Leikmannahópur</SecHdr>
      <KpiGrid items={[
        {label:'Leikmenn',                   value:agg.players},
        {label:'Meðalaldur',                 value:fn(agg.avgAge),    tip:TIPS.avgAge},
        {label:'Kjarnaaldur',                 value:fn(agg.coreAge),   tip:TIPS.coreAge},
        {label:HGADJ,                   value:agg.hgCount,       tip:TIPS.uppalin},
        {label:metric==='minPct'?`${HGADJ} mín%`:'Uppal%', value:agg[metric]+'%', color:quartColorFor(agg[metric], metric), tip:metric==='minPct'?TIPS.hgMin:TIPS.hgPct},
      ]}/>

      {/* Skýringar — always visible, not just hover */}
      <div style={{ background:C.bg, border:`1px solid ${C.border}`, padding:'12px 16px', marginBottom:16 }}>
        <div style={{ fontFamily:MONO, fontSize:10, textTransform:'uppercase', letterSpacing:'.08em', color:C.muted, marginBottom:9 }}>Hvað þýða tölurnar?</div>
        <div style={{ display:'grid', gridTemplateColumns: useIsMobile()?'1fr':'1fr 1fr', gap:'7px 28px' }}>
          {[
            ['Meðalaldur', TIPS.avgAge],
            ['Meðalaldur XI', TIPS.avgAgeXI],
            ['Kjarnaaldur', TIPS.coreAge],
            [HGADJ, TIPS.uppalin],
            [`${HGADJ} mín%`, TIPS.hgMin],
            ['U21 virkar', TIPS.u21],
          ].map(([t,desc])=>(
            <div key={t} style={{ fontSize:11.5, lineHeight:1.5 }}>
              <span style={{ fontWeight:600, color:C.text }}>{t}</span>
              <span style={{ color:C.muted }}> — {desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Age distribution + round-by-round trend, side by side */}
      <div style={{ display:'grid', gridTemplateColumns: useIsMobile()?'1fr':'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'16px 18px' }}>
          <AgeDistChart playerList={agg.playerList} pc={pc}/>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'16px 18px' }}>
          <RoundTrendChart teamMatches={agg.teamMatches} team={team} pc={pc}/>
        </div>
      </div>

      {/* Players + Matches */}
      <div style={{ display:'grid', gridTemplateColumns: useIsMobile()?'1fr':'2fr 1fr', gap:20 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'16px 18px' }}>
          <TeamPlayerList playerList={agg.rosterList} pc={pc} avgAge={agg.avgAge} avgAgeSt={agg.avgAgeSt}/>
        </div>
        <div>
          <TeamMatchList teamMatches={agg.teamMatches} team={team} pc={pc} metric={metric} onMatch={onMatch}/>
        </div>
      </div>
    </div>
  );
}

/* ── TEAMS VIEW ─────────────────────────────────────────── */
function TeamsView({ matches, pc, metric, onTeam }) {
  const [sortCol, setSortCol] = useStateT('minPct');
  const [sortDir, setSortDir] = useStateT(-1);

  const data = useMemoT(()=>TEAMS.map(t=>teamAgg(matches,pc,t)),[matches,pc]);

  function handleSort(col) {
    if (sortCol===col) setSortDir(d=>d*-1);
    else { setSortCol(col); setSortDir(col==='team'?1:-1); }
  }

  const sorted = useMemoT(()=>[...data].sort((a,b)=>{
    let av=a[sortCol], bv=b[sortCol];
    if (typeof av==='string') return sortDir*av.localeCompare(bv,'is');
    if (av===null||av===undefined) av=sortDir>0?Infinity:-Infinity;
    if (bv===null||bv===undefined) bv=sortDir>0?Infinity:-Infinity;
    return sortDir*(av-bv);
  }), [data,sortCol,sortDir]);

  const thP={sortCol,sortDir,onSort:handleSort,right:true};

  return (
    <div className="fade-in">
      <PageTitle sub="10 lið — smelltu á lið til að sjá nánar">Liðayfirlit</PageTitle>
      <div className="card" style={{ overflowX:'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <SortTh col="team" {...thP} right={false}>Lið</SortTh>
              <SortTh col="players" {...thP}>Leikmenn</SortTh>
              <SortTh col="avgAgeSt" {...thP} sub="Byrjunarlið">Meðalaldur<InfoTip text={TIPS.avgAgeXI}/></SortTh>
              <SortTh col="avgAge"   {...thP} sub="Samtals">Meðalaldur<InfoTip text={TIPS.avgAge}/></SortTh>
              <SortTh col="coreAge"  {...thP} sub="Top 11 mín">Kjarnaaldur<InfoTip text={TIPS.coreAge}/></SortTh>
              <SortTh col="hgCount"  {...thP} sub="Leikmenn">{HGADJ}<InfoTip text={TIPS.uppalin}/></SortTh>
              <SortTh col="hgPct"    {...thP} sub="% leikmenn">Uppal%<InfoTip text={TIPS.hgPct}/></SortTh>
              <SortTh col="minPct"   {...thP} sub="% mínútur" style={{ minWidth:160 }}>{HGADJ} mín<InfoTip text={TIPS.hgMin}/></SortTh>
              <SortTh col="u21active"  {...thP} sub="Virkar/alls">U21<InfoTip text={TIPS.u21}/></SortTh>
              <SortTh col="corePlayers" {...thP} sub=">50% mín">Kjarni<InfoTip text={TIPS.kjarni}/></SortTh>
            </tr>
          </thead>
          <tbody>
            {sorted.map(d=>{
              const isKey = sortCol==='minPct'||sortCol==='hgPct';
              return (
                <tr key={d.team} onClick={()=>onTeam(d.team)}>
                  <td style={{ fontWeight:600 }}>
                    <TeamName name={d.team}/>
                    <span style={{ fontFamily:MONO, fontSize:10, color:C.muted, fontWeight:400, marginLeft:5 }}>({d.teamMatches.length})</span>
                  </td>
                  <td className="num" style={{ color:C.muted }}>{d.players}</td>
                  <td className="num">{fn(d.avgAgeSt)}</td>
                  <td className="num" style={{ fontWeight:600 }}>{fn(d.avgAge)}</td>
                  <td className="num">{fn(d.coreAge)}</td>
                  <td className="num">{d.hgCount}</td>
                  <td className="num" style={{ color:quartColorFor(d.hgPct, 'hgPct'), fontWeight:d.hgPct>=50?600:400 }}>{d.hgPct}%</td>
                  <td className="num">
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8 }}>
                      <span style={{ color:quartColorFor(d.minPct, 'minPct'), fontWeight:600, fontFamily:"'Inter',sans-serif", fontSize:12, minWidth:32 }}>{d.minPct}%</span>
                      <div style={{ width:80, height:5, background:C.surfaceAlt, borderRadius:2 }}>
                        <div style={{ height:5, width:`${d.minPct}%`, background:quartColorFor(d.minPct, 'minPct'), borderRadius:2 }}/>
                      </div>
                    </div>
                  </td>
                  <td className="num" style={{ color:C.muted }}>{d.u21active}/{d.u21}</td>
                  <td className="num" style={{ color:C.muted }}>{d.corePlayers}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:12, fontFamily:MONO, fontSize:10, color:C.muted, lineHeight:1.7 }}>
        Kjarnaaldur = meðalaldur 11 leikmanna með flestar mínútur &nbsp;·&nbsp;
        U21 virkar = undir 21 árs með yfir 90 mín &nbsp;·&nbsp;
        Kjarni = leikmenn með yfir 50% af mögulegum mínútum
      </div>
    </div>
  );
}

Object.assign(window, { TeamsView, TeamDetailView });
