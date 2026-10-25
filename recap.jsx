/* recap.jsx — season recap page (shared by Recap-Kvenna.html and Recap-Karla.html)
   Requires window.RECAP = { title, sub, dataFile, year, display:{team:label}, history:[{year,file}]|null,
   foreign:bool, hgWord:'uppaldar'|'uppaldir', manyWord:'Flestar'|'Flestir', otherLink:{href,label}, dashLink }                       */
const { useState, useEffect, useMemo, useRef } = React;
const R = window.RECAP;
const td = (t) => R.display[t] || t;
const BRAND = '#F97316', BLUE = '#1d4ed8', TEAL = '#0E7490', GREY = '#6B7280';
const fn1 = (v, d = 1) => v == null ? '–' : (+v).toFixed(d).replace('.', ',');
const fint = (v) => v == null ? '–' : Math.round(v).toLocaleString('is-IS');

/* ───────── aggregation ───────── */
function ageOf(pc, id, year) { const b = pc[id] && pc[id].birthYear; return b ? year - b : null; }

function analyse(data, year, foreignSet) {
  const pc = data.playerStats, M = data.matches;
  const isF = (id) => foreignSet && foreignSet.has(String(id));
  const teams = {};
  const T = (t) => teams[t] || (teams[t] = { team: t, games: 0, pts: 0, gf: 0, ga: 0, pmap: {}, mins: 0, hgMins: 0, fMins: 0, u21Mins: 0, stSum: 0, stN: 0, hgSt: 0, fSt: 0 });
  const matchRows = [];
  const players = {};
  for (const m of M) {
    for (const side of [['homeTeam', 'homeScore', 'awayScore'], ['awayTeam', 'awayScore', 'homeScore']]) {
      const t = m[side[0]], gf = m[side[1]], ga = m[side[2]]; const S = T(t);
      S.games++; S.gf += gf; S.ga += ga; S.pts += gf > ga ? 3 : gf === ga ? 1 : 0;
      const pl = m.players.filter((p) => p.team === t);
      const st = pl.filter((p) => p.isStarter && p.mins > 0);
      const stAges = st.map((p) => ageOf(pc, p.id, year)).filter((a) => a != null);
      const hgSt = st.filter((p) => pc[p.id] && pc[p.id].homegrown).length;
      const fSt = st.filter((p) => isF(p.id)).length;
      S.hgSt += hgSt; S.fSt += fSt;
      if (stAges.length) { S.stSum += stAges.reduce((a, b) => a + b, 0) / stAges.length; S.stN++; }
      const tm = pl.reduce((s, p) => s + p.mins, 0), hm = pl.filter((p) => pc[p.id] && pc[p.id].homegrown).reduce((s, p) => s + p.mins, 0);
      matchRows.push({ id: m.matchId, team: t, opp: side[0] === 'homeTeam' ? m.awayTeam : m.homeTeam, home: side[0] === 'homeTeam', gf, ga,
        xiAge: stAges.length >= 9 ? stAges.reduce((a, b) => a + b, 0) / stAges.length : null, hgSt, minPct: tm ? hm / tm * 100 : null });
      for (const p of pl) {
        const a = ageOf(pc, p.id, year);
        S.mins += p.mins;
        if (pc[p.id] && pc[p.id].homegrown) S.hgMins += p.mins;
        if (isF(p.id)) S.fMins += p.mins;
        if (a != null && a < 21) S.u21Mins += p.mins;
        const pm = S.pmap[p.id] || (S.pmap[p.id] = { id: p.id, mins: 0, apps: 0 });
        pm.mins += p.mins; if (p.mins > 0) pm.apps++;
        const P = players[p.id] || (players[p.id] = { id: p.id, name: p.name, team: t, mins: 0, apps: 0, starts: 0, goals: 0, yellow: 0, red: 0 });
        P.mins += p.mins; if (p.mins > 0) P.apps++; if (p.isStarter && p.mins > 0) P.starts++; P.team = t;
      }
    }
    for (const e of (m.events || [])) {
      const P = players[e.playerId]; if (!P) continue;
      if (e.type === 'goal' && !e.isOwnGoal) P.goals++;
      if (e.type === 'yellow_card') P.yellow++;
      if (e.type === 'red_card') P.red++;
    }
  }
  const out = [];
  for (const t of Object.values(teams)) {
    const act = Object.values(t.pmap).filter((p) => p.apps > 0);
    const wa = act.filter((p) => ageOf(pc, p.id, year) != null);
    const waMin = wa.reduce((s, p) => s + p.mins, 0);
    out.push({
      team: t.team, games: t.games, pts: t.pts, ppg: t.games ? t.pts / t.games : 0, gf: t.gf, ga: t.ga,
      players: act.length, hgPlayers: act.filter((p) => pc[p.id] && pc[p.id].homegrown).length, fPlayers: act.filter((p) => isF(p.id)).length,
      minPct: t.mins ? t.hgMins / t.mins * 100 : null,
      fMinPct: t.mins ? t.fMins / t.mins * 100 : null,
      u21Pct: t.mins ? t.u21Mins / t.mins * 100 : null,
      xiAge: t.stN ? t.stSum / t.stN : null,
      avgAge: waMin ? wa.reduce((s, p) => s + ageOf(pc, p.id, year) * p.mins, 0) / waMin : null,
      hgStPerG: t.games ? t.hgSt / t.games : 0, fStPerG: t.games ? t.fSt / t.games : 0, fMins: t.fMins,
    });
  }
  const allP = Object.values(players).map((p) => ({ ...p, age: ageOf(pc, p.id, year), hg: !!(pc[p.id] && pc[p.id].homegrown), foreign: isF(p.id) }));
  const totMins = out.reduce((s, t) => s + (teams[t.team].mins), 0);
  const league = {
    matches: M.length, goals: M.reduce((s, m) => s + m.homeScore + m.awayScore, 0),
    minPct: totMins ? Object.values(teams).reduce((s, t) => s + t.hgMins, 0) / totMins * 100 : null,
    fMinPct: totMins ? Object.values(teams).reduce((s, t) => s + t.fMins, 0) / totMins * 100 : null,
    u21Pct: totMins ? Object.values(teams).reduce((s, t) => s + t.u21Mins, 0) / totMins * 100 : null,
    xiAge: (() => { const s = Object.values(teams).reduce((a, t) => a + t.stSum, 0), n = Object.values(teams).reduce((a, t) => a + t.stN, 0); return n ? s / n : null; })(),
    playersUsed: allP.filter((p) => p.apps > 0).length,
    hgUsed: allP.filter((p) => p.apps > 0 && p.hg).length,
  };
  league.gpm = league.matches ? league.goals / league.matches : 0;
  return { teams: out, players: allP.filter((p) => p.apps > 0), matchRows, league, matches: M, pc };
}

/* ───────── small UI helpers ───────── */
function Section({ title, sub, children }) {
  return (<div className="kpi-section"><div className="kpi-title">{title}</div>{sub && <div className="kpi-sub">{sub}</div>}{children}</div>);
}
function Stat({ label, value, sub, color }) {
  return (<div className="card" style={{ padding: '14px 16px', flex: '1 1 150px', minWidth: 150 }}>
    <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || '#111827', letterSpacing: '-.02em', marginTop: 2 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: GREY, marginTop: 1 }}>{sub}</div>}
  </div>);
}
function Bar({ pct, color, w = 90 }) {
  return (<div style={{ width: w, height: 6, background: '#EEF0F3', borderRadius: 3 }}><div style={{ width: Math.max(0, Math.min(100, pct || 0)) + '%', height: 6, background: color, borderRadius: 3 }} /></div>);
}
function Th({ col, sort, setSort, children, left, sub }) {
  const on = sort.col === col;
  return (<th className={left ? '' : 'num'} style={{ cursor: 'pointer', color: on ? BRAND : undefined }}
    onClick={() => setSort({ col, dir: on ? -sort.dir : (col === 'team' ? 1 : -1) })}>
    {children}{on ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}{sub && <div style={{ fontWeight: 400, fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>{sub}</div>}
  </th>);
}
function useSort(def) { return useState({ col: def, dir: -1 }); }
function sorted(rows, sort) {
  return [...rows].sort((a, b) => {
    let x = a[sort.col], y = b[sort.col];
    if (typeof x === 'string') return sort.dir * x.localeCompare(y, 'is');
    if (x == null) x = -Infinity; if (y == null) y = -Infinity; return sort.dir * (x - y);
  });
}

/* ───────── sections ───────── */
function TeamTable({ teams, prevMap }) {
  const [sort, setSort] = useSort('minPct');
  const rows = sorted(teams.map((t) => ({ ...t, delta: prevMap && prevMap[t.team] != null && t.minPct != null ? t.minPct - prevMap[t.team] : null })), sort);
  const p = { sort, setSort };
  return (<div className="card" style={{ padding: 16, overflowX: 'auto' }}>
    <table className="data-table">
      <thead><tr>
        <th>#</th><Th col="team" {...p} left>Lið</Th>
        <Th col="minPct" {...p} sub={'% mínútna ' + R.hgWord}>{R.hgWord[0].toUpperCase() + R.hgWord.slice(1)} mín.</Th>
        {prevMap && <Th col="delta" {...p} sub={'vs ' + (R.year - 1)}>Breyting</Th>}
        <Th col="xiAge" {...p} sub="byrjunarlið">Meðalaldur</Th>
        <Th col="u21Pct" {...p} sub="% mínútna">U21</Th>
        <Th col="hgStPerG" {...p} sub={'í byrjunarliði/leik'}>{R.hgWord[0].toUpperCase() + R.hgWord.slice(1)}</Th>
        <Th col="players" {...p} sub="notaðir">Leikmenn</Th>
        <Th col="ppg" {...p} sub="stig/leik">Árangur</Th>
      </tr></thead>
      <tbody>{rows.map((t, i) => (
        <tr key={t.team}>
          <td style={{ color: GREY }}>{i + 1}</td>
          <td style={{ fontWeight: 600 }}>{td(t.team)}</td>
          <td className="num"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <b style={{ minWidth: 34 }}>{fn1(t.minPct, 0)}%</b><Bar pct={t.minPct} color={BRAND} /></span></td>
          {prevMap && <td className="num" style={{ color: t.delta == null ? '#D1D5DB' : t.delta > 0 ? '#16A34A' : t.delta < 0 ? '#DC2626' : GREY }}>
            {t.delta == null ? '–' : (t.delta > 0 ? '+' : '') + fn1(t.delta, 0) + ' pp'}</td>}
          <td className="num">{fn1(t.xiAge)}</td>
          <td className="num">{fn1(t.u21Pct, 0)}%</td>
          <td className="num">{fn1(t.hgStPerG)}</td>
          <td className="num" style={{ color: GREY }}>{t.players}</td>
          <td className="num" style={{ color: GREY }}>{fn1(t.ppg, 2)}</td>
        </tr>))}</tbody>
    </table></div>);
}

function ChartBox({ build, deps, height = 300 }) {
  const ref = useRef(null), ch = useRef(null);
  useEffect(() => { if (!ref.current) return; if (ch.current) ch.current.destroy(); ch.current = new Chart(ref.current, build()); return () => ch.current && ch.current.destroy(); }, deps);
  return <div style={{ height, position: 'relative' }}><canvas ref={ref} /></div>;
}

function History({ hist }) {
  // hist: [{year, league}]
  const labels = hist.map((h) => h.year);
  const mk = (key, color, label, fmt) => ({ label, data: hist.map((h) => h.league[key]), borderColor: color, backgroundColor: color, tension: .2, pointRadius: 5, borderWidth: 2.5 });
  const opts = (suffix) => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { ticks: { callback: (v) => v + suffix }, grid: { color: '#EEF0F3' } } } });
  return (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 }}>
    {[['minPct', BRAND, 'Hlutfall mínútna — ' + R.hgWord, '%'], ['xiAge', BLUE, 'Meðalaldur byrjunarliða', ''], ['u21Pct', '#16A34A', 'Hlutfall mínútna U21', '%']].map(([k, c, l, s]) => (
      <div className="card" key={k} style={{ padding: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{l} — deildin í heild</div>
        <ChartBox height={220} deps={[JSON.stringify(hist.map((h) => h.league[k]))]} build={() => ({ type: 'line', data: { labels, datasets: [mk(k, c, l)] }, options: opts(s) })} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: GREY, marginTop: 6 }}>
          {hist.map((h) => <span key={h.year}><b style={{ color: '#111827' }}>{h.year}</b> {fn1(h.league[k], k === 'xiAge' ? 1 : 0)}{s}</span>)}</div>
      </div>))}
  </div>);
}

function TopList({ title, rows, render, note }) {
  return (<div className="card" style={{ padding: 16 }}>
    <div className="eyebrow" style={{ marginBottom: 8 }}>{title}</div>
    <table className="data-table"><tbody>{rows.map((r, i) => (
      <tr key={r.key || r.id + i}><td style={{ color: GREY, width: 22 }}>{i + 1}</td>{render(r)}</tr>))}</tbody></table>
    {note && <div style={{ fontSize: 10, color: GREY, marginTop: 6 }}>{note}</div>}
  </div>);
}
const Name = ({ p }) => (<td style={{ fontWeight: 600 }}>{p.name}<span style={{ color: GREY, fontWeight: 400 }}> · {td(p.team)}</span>{p.age != null && <span style={{ color: GREY, fontWeight: 400 }}> · {p.age} ára</span>}</td>);

function PlayerLists({ A }) {
  const P = A.players;
  const top = (arr, f, n = 10) => [...arr].sort((a, b) => f(b) - f(a) || b.mins - a.mins).slice(0, n);
  const L = [
    ['Markahæstu leikmenn', top(P, (p) => p.goals).filter((p) => p.goals > 0), (p) => [<Name key="n" p={p} />, <td key="v" className="num"><b>{p.goals}</b> mörk</td>]],
    [R.hgWord[0].toUpperCase() + R.hgWord.slice(1) + ' með flestar mínútur', top(P.filter((p) => p.hg), (p) => p.mins), (p) => [<Name key="n" p={p} />, <td key="v" className="num"><b>{fint(p.mins)}</b> mín</td>]],
    ['Flestar mínútur — U21', top(P.filter((p) => p.age != null && p.age < 21), (p) => p.mins), (p) => [<Name key="n" p={p} />, <td key="v" className="num"><b>{fint(p.mins)}</b> mín</td>]],
    ['Yngstu leikmenn sem spiluðu', [...P].filter((p) => p.age != null).sort((a, b) => a.age - b.age || b.mins - a.mins).slice(0, 10), (p) => [<Name key="n" p={p} />, <td key="v" className="num">{fint(p.mins)} mín</td>]],
    ['Elstu leikmenn með 900+ mínútur', [...P].filter((p) => p.age != null && p.mins >= 900).sort((a, b) => b.age - a.age || b.mins - a.mins).slice(0, 10), (p) => [<Name key="n" p={p} />, <td key="v" className="num">{fint(p.mins)} mín</td>]],
    ['Flest gul spjöld', top(P, (p) => p.yellow).filter((p) => p.yellow > 0), (p) => [<Name key="n" p={p} />, <td key="v" className="num"><b>{p.yellow}</b>{p.red ? <span style={{ color: '#DC2626' }}> +{p.red} rautt</span> : null}</td>]],
  ];
  return (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 12 }}>
    {L.map(([t, rows, render]) => <TopList key={t} title={t} rows={rows.map((r) => ({ ...r, key: r.id }))} render={render} />)}</div>);
}

function Records({ A }) {
  const MR = A.matchRows;
  const lineup = (arr, f, n = 5) => [...arr].sort(f).slice(0, n);
  const mname = (r) => `${td(r.team)} ${r.gf}–${r.ga} ${td(r.opp)}`;
  const byId = {}; A.matches.forEach((m) => byId[m.matchId] = m);
  const gameRows = (() => { const seen = new Set(), out = []; for (const m of A.matches) out.push({ key: m.matchId, m, goals: m.homeScore + m.awayScore, margin: Math.abs(m.homeScore - m.awayScore) }); return out; })();
  const gtxt = (m) => `${td(m.homeTeam)} ${m.homeScore}–${m.awayScore} ${td(m.awayTeam)}`;
  const lists = [
    ['Yngsta byrjunarlið (meðalaldur)', lineup(MR.filter((r) => r.xiAge != null), (a, b) => a.xiAge - b.xiAge), (r) => [<td key="a" style={{ fontWeight: 600 }}>{td(r.team)}</td>, <td key="b" style={{ color: GREY }}>gegn {td(r.opp)} ({r.gf}–{r.ga})</td>, <td key="c" className="num"><b>{fn1(r.xiAge, 1)}</b> ár</td>]],
    ['Elsta byrjunarlið (meðalaldur)', lineup(MR.filter((r) => r.xiAge != null), (a, b) => b.xiAge - a.xiAge), (r) => [<td key="a" style={{ fontWeight: 600 }}>{td(r.team)}</td>, <td key="b" style={{ color: GREY }}>gegn {td(r.opp)} ({r.gf}–{r.ga})</td>, <td key="c" className="num"><b>{fn1(r.xiAge, 1)}</b> ár</td>]],
    [R.manyWord + ' ' + R.hgWord + ' í byrjunarliði', lineup(MR, (a, b) => b.hgSt - a.hgSt || b.minPct - a.minPct), (r) => [<td key="a" style={{ fontWeight: 600 }}>{td(r.team)}</td>, <td key="b" style={{ color: GREY }}>gegn {td(r.opp)} ({r.gf}–{r.ga})</td>, <td key="c" className="num"><b>{r.hgSt}</b> af 11</td>]],
    ['Hæst hlutfall mínútna — ' + R.hgWord + ' (einn leikur)', lineup(MR.filter((r) => r.minPct != null), (a, b) => b.minPct - a.minPct), (r) => [<td key="a" style={{ fontWeight: 600 }}>{td(r.team)}</td>, <td key="b" style={{ color: GREY }}>gegn {td(r.opp)} ({r.gf}–{r.ga})</td>, <td key="c" className="num"><b>{fn1(r.minPct, 0)}%</b></td>]],
    ['Flest mörk í leik', lineup(gameRows, (a, b) => b.goals - a.goals), (r) => [<td key="a" style={{ fontWeight: 600 }}>{gtxt(r.m)}</td>, <td key="c" className="num"><b>{r.goals}</b> mörk</td>]],
    ['Stærstu sigrar', lineup(gameRows, (a, b) => b.margin - a.margin || b.goals - a.goals), (r) => [<td key="a" style={{ fontWeight: 600 }}>{gtxt(r.m)}</td>, <td key="c" className="num"><b>+{r.margin}</b></td>]],
  ];
  return (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 12 }}>
    {lists.map(([t, rows, render]) => <TopList key={t} title={t} rows={rows.map((r, i) => ({ ...r, key: (r.id || r.key || '') + t + i }))} render={render} />)}</div>);
}

function ForeignSection({ A }) {
  const [sort, setSort] = useSort('fMinPct');
  const rows = sorted(A.teams, sort); const p = { sort, setSort };
  const maxF = Math.max(...A.teams.map((t) => t.fMinPct || 0), 1);
  // pearson r between foreign minute share and points/game
  const xs = A.teams.map((t) => t.fMinPct), ys = A.teams.map((t) => t.ppg), n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const r = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  const topF = [...A.players.filter((p) => p.foreign)].sort((a, b) => b.mins - a.mins).slice(0, 10);
  return (<div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 12, marginBottom: 12 }}>
      <div className="card" style={{ padding: 16, overflowX: 'auto' }}>
        <table className="data-table"><thead><tr><th>#</th><Th col="team" {...p} left>Lið</Th>
          <Th col="fPlayers" {...p} sub="leikmenn">Erlendar</Th><Th col="fMinPct" {...p} sub="% mínútna">Mínútur</Th>
          <Th col="fStPerG" {...p} sub="byrjunarlið/leik">Í byrjunarliði</Th><Th col="ppg" {...p} sub="stig/leik">Árangur</Th></tr></thead>
          <tbody>{rows.map((t, i) => (<tr key={t.team}><td style={{ color: GREY }}>{i + 1}</td><td style={{ fontWeight: 600 }}>{td(t.team)}</td>
            <td className="num">{t.fPlayers}</td>
            <td className="num"><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}><b style={{ minWidth: 34 }}>{fn1(t.fMinPct, 0)}%</b><Bar pct={t.fMinPct / maxF * 100} color={TEAL} w={70} /></span></td>
            <td className="num">{fn1(t.fStPerG)}</td><td className="num" style={{ color: GREY }}>{fn1(t.ppg, 2)}</td></tr>))}</tbody></table>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Erlendar mínútur vs stig á leik</div>
        <ChartBox height={260} deps={[A.teams.length]} build={() => ({
          type: 'scatter',
          data: { datasets: [{ data: A.teams.map((t) => ({ x: t.fMinPct, y: t.ppg, label: td(t.team) })), backgroundColor: TEAL, pointRadius: 6 }] },
          options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.raw.label}: ${fn1(c.raw.x, 0)}% mín., ${fn1(c.raw.y, 2)} stig/leik` } } },
            scales: { x: { title: { display: true, text: '% mínútna erlendra leikmanna' }, grid: { color: '#EEF0F3' } }, y: { title: { display: true, text: 'stig á leik' }, grid: { color: '#EEF0F3' } } } },
          plugins: [{ id: 'lbl', afterDatasetsDraw(c) { const x = c.ctx; x.save(); x.font = '10px Inter'; x.fillStyle = '#374151'; c.getDatasetMeta(0).data.forEach((pt, i) => x.fillText(c.data.datasets[0].data[i].label, pt.x + 8, pt.y + 3)); x.restore(); } }] })} />
        <div style={{ fontSize: 11, color: GREY, marginTop: 6 }}>Fylgni (r) milli hlutfalls erlendra mínútna og stiga á leik: <b style={{ color: '#111827' }}>{fn1(r, 2)}</b> (10 lið — lítið úrtak, ekki orsakasamband).</div>
      </div>
    </div>
    <TopList title="Erlendar leikmenn með flestar mínútur" rows={topF.map((p) => ({ ...p, key: p.id }))}
      render={(p) => [<td key="n" style={{ fontWeight: 600 }}>{p.name}<span style={{ color: GREY, fontWeight: 400 }}> · {td(p.team)}</span></td>, <td key="v" className="num"><b>{fint(p.mins)}</b> mín</td>, <td key="g" className="num" style={{ color: GREY }}>{p.goals} mörk</td>]} />
  </div>);
}

/* ───────── app ───────── */
function App() {
  const [state, setState] = useState(null);
  useEffect(() => {
    const get = (f) => fetch(f).then((r) => r.ok ? r.json() : null).catch(() => null);
    Promise.all([get(R.dataFile), R.foreign ? get('players_meta.json') : Promise.resolve(null), ...(R.history || []).map((h) => get(h.file))]).then(setState);
  }, []);
  const res = useMemo(() => {
    if (!state || !state[0]) return null;
    const meta = state[1];
    const fset = meta ? new Set(Object.entries(meta.players || {}).filter(([, v]) => v.foreign).map(([k]) => String(k))) : null;
    const A = analyse(state[0], R.year, fset);
    let hist = null, prevMap = null;
    if (R.history) {
      hist = R.history.map((h, i) => ({ year: h.year, a: state[2 + i] ? analyse(state[2 + i], h.year, null) : null })).filter((h) => h.a);
      hist.push({ year: R.year, a: A });
      hist = hist.map((h) => ({ year: h.year, league: h.a.league }));
      const prev = state[2 + R.history.length - 1];
      if (prev) { const PA = analyse(prev, R.history[R.history.length - 1].year, null); prevMap = {}; PA.teams.forEach((t) => prevMap[t.team] = t.minPct); }
    }
    return { A, hist, prevMap };
  }, [state]);
  if (!state) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8', fontSize: 13 }}>Hleður gögn…</div>;
  if (!res) return <div style={{ padding: 40 }}>Gat ekki hlaðið gögnum.</div>;
  const { A, hist, prevMap } = res, L = A.league;
  const best = [...A.teams].sort((a, b) => b.minPct - a.minPct)[0], worst = [...A.teams].sort((a, b) => a.minPct - b.minPct)[0];
  const youngest = [...A.teams].sort((a, b) => a.xiAge - b.xiAge)[0], oldest = [...A.teams].sort((a, b) => b.xiAge - a.xiAge)[0];
  return (<div style={{ width: '100%' }}>
    <div className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="index.html">← Ordio</a><span style={{ color: '#E7E9EE' }}>|</span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{R.title}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href={R.otherLink.href}>{R.otherLink.label}</a>
        <a href={R.dashLink}>Mælaborð →</a></div>
    </div>
    <div style={{ maxWidth: 1220, margin: '0 auto', padding: '28px 24px 60px' }}>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>{R.sub}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
        <Stat label={'Mínútur — ' + R.hgWord} value={fn1(L.minPct, 0) + '%'} sub={`${L.hgUsed} af ${L.playersUsed} leikmönnum`} color={BRAND} />
        <Stat label="Meðalaldur byrjunarliða" value={fn1(L.xiAge)} sub="ár, allir leikir" color={BLUE} />
        <Stat label="Mínútur U21" value={fn1(L.u21Pct, 0) + '%'} sub="af öllum mínútum" />
        <Stat label="Leikir / mörk" value={`${L.matches} / ${L.goals}`} sub={fn1(L.gpm, 2) + ' mörk í leik'} />
        {R.foreign && <Stat label="Mínútur erlendra" value={fn1(L.fMinPct, 0) + '%'} sub="af öllum mínútum" color={TEAL} />}
      </div>

      <Section title={'Uppeldi: liðin í röð'} sub={`Röðuð eftir hlutfalli mínútna uppaldra leikmanna. Hæst: ${td(best.team)} (${fn1(best.minPct, 0)}%), lægst: ${td(worst.team)} (${fn1(worst.minPct, 0)}%). Yngsta byrjunarliðið: ${td(youngest.team)} (${fn1(youngest.xiAge)} ár), elsta: ${td(oldest.team)} (${fn1(oldest.xiAge)} ár). Árangur = stig á leik í öllum leikjum tímabilsins. Smelltu á dálkahaus til að raða.`}>
        <TeamTable teams={A.teams} prevMap={prevMap} />
      </Section>

      {hist && <Section title="Deildin í heild: þróun milli ára" sub={'Allir leikir hvers tímabils, allar mínútur leikmanna í deildinni. ' + R.year + ' er heilt tímabil.'}>
        <History hist={hist} /></Section>}

      <Section title="Leikmenn: topplistar" sub="Öll mót tímabilsins (grunnhluti og úrslitakeppni). U21 = 20 ára og yngri á tímabilinu (aldur = tímabil − fæðingarár)."><PlayerLists A={A} /></Section>

      <Section title="Met og áhugaverðir leikir" sub="Byrjunarliðsaldur er reiknaður yfir leikmenn með aldur skráðan (lágmark 9 af 11)."><Records A={A} /></Section>

      {R.foreign && <Section title="Erlendar leikmenn" sub="Erlendir leikmenn samkvæmt lista frá Ordio (players_meta.json)."><ForeignSection A={A} /></Section>}
    </div>
  </div>);
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
