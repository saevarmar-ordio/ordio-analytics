/* views-players.jsx — PlayersView */
const { useState: useStateP, useMemo: useMemoP } = React;

function PlayersView({ matches, pc }) {
  const [search, setSearch] = useStateP('');
  const [teamF, setTeamF] = useStateP('');
  const [hgF, setHgF] = useStateP('all'); // all | yes | no
  const [sortCol, setSortCol] = useStateP('totalMins');
  const [sortDir, setSortDir] = useStateP(-1);

  /* Build master player list */
  const all = useMemoP(() => {
    const ev = playerEvents(matches);
    const pmap = {};
    for (const m of matches) {
      for (const p of m.players) {
        if (!pmap[p.id]) pmap[p.id] = { id: p.id, name: p.name, team: p.team, totalMins: 0 };
        pmap[p.id].totalMins += p.mins;
      }
    }
    return Object.values(pmap).
    filter((p) => p.totalMins > 0).
    map((p) => ({
      ...p,
      age: pc[p.id]?.birthYear ? 2026 - pc[p.id].birthYear : null,
      homegrown: pc[p.id]?.homegrown || false,
      goals: ev[p.id]?.goals || 0,
      penalties: ev[p.id]?.penalties || 0,
      ownGoals: ev[p.id]?.ownGoals || 0,
      yellow: ev[p.id]?.yellow || 0,
      red: ev[p.id]?.red || 0
    }));
  }, [matches, pc]);

  function handleSort(col) {
    if (sortCol === col) setSortDir((d) => d * -1);else
    {setSortCol(col);setSortDir(col === 'name' || col === 'team' ? 1 : -1);}
  }

  const visible = useMemoP(() => {
    let rows = [...all];
    if (search) rows = rows.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (teamF) rows = rows.filter((p) => p.team === teamF);
    if (hgF === 'yes') rows = rows.filter((p) => p.homegrown);
    if (hgF === 'no') rows = rows.filter((p) => !p.homegrown);
    rows.sort((a, b) => {
      let av = a[sortCol],bv = b[sortCol];
      if (av === null || av === undefined) av = sortDir > 0 ? Infinity : -Infinity;
      if (bv === null || bv === undefined) bv = sortDir > 0 ? Infinity : -Infinity;
      if (typeof av === 'string') return sortDir * av.localeCompare(bv, 'is');
      return sortDir * (av - bv);
    });
    return rows;
  }, [all, search, teamF, hgF, sortCol, sortDir]);

  const maxMins = useMemoP(() => Math.max(...all.map((p) => p.totalMins), 1), [all]);

  const inputStyle = {
    padding: '7px 11px',
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontFamily: "'Inter',sans-serif",
    fontSize: 13,
    outline: 'none',
    transition: 'border-color .15s'
  };

  const thP = { sortCol, sortDir, onSort: handleSort };

  const hgCountAll = all.filter((p) => p.homegrown).length;
  const hgCountShown = visible.filter((p) => p.homegrown).length;

  return (
    <div className="fade-in">
      <PageTitle sub={`${all.length} leikmenn — leit, röðun og síun`}>Leikmannayfirlit</PageTitle>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Leita að leikmanni"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 220 }}
          onFocus={(e) => e.target.style.borderColor = C.orange}
          onBlur={(e) => e.target.style.borderColor = C.border} />
        
        <select value={teamF} onChange={(e) => setTeamF(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Öll lið</option>
          {TEAMS.map((t) => <option key={t} value={t}>{td(t)}</option>)}
        </select>
        {/* Homegrown filter buttons */}
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${C.border}` }}>
          {[['all', 'Allir'], ['yes', HGADJ], ['no', 'Aðrir']].map(([v, l]) =>
          <button key={v} onClick={() => setHgF(v)}
          style={{
            padding: '7px 12px', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter',sans-serif", fontSize: 11,
            background: hgF === v ? C.orange : C.surface,
            color: hgF === v ? '#fff' : C.muted,
            borderRight: v !== 'no' ? `1px solid ${C.border}` : 'none',
            transition: 'background .15s, color .15s'
          }}>
            {l}</button>
          )}
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: "'Inter',sans-serif", fontSize: 11, color: C.muted }}>
          {visible.length} leikmenn &nbsp;·&nbsp;
          <span style={{ color: C.orange }}>{hgCountShown} {HGADJ_LC}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="data-table" style={{ minWidth: 620 }}>
          <thead>
            <tr>
              <SortTh col="name" {...thP}>Leikmaður</SortTh>
              <SortTh col="team" {...thP}>Lið</SortTh>
              <SortTh col="age" {...thP} right>Aldur</SortTh>
              <SortTh col="totalMins" {...thP} right style={{ minWidth: 120 }}>Mínútur</SortTh>
              <SortTh col="goals" {...thP} right sub="víti / sj.m.">Mörk</SortTh>
              <SortTh col="yellow" {...thP} right>Gul</SortTh>
              <SortTh col="red" {...thP} right>Rauð</SortTh>
              <SortTh col="homegrown" {...thP} style={{ textAlign: 'center' }}>{HGSING}</SortTh>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
                const pct = Math.round(p.totalMins / maxMins * 100);
                return (
                  <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td><TeamName name={p.team} bold={false} /></td>
                  <td className="num"><AgeBadge age={p.age} /></td>
                  <td className="num">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, minWidth: 38, textAlign: 'right' }}>{p.totalMins}</span>
                      <div style={{ width: 60, height: 3, background: C.surfaceAlt, borderRadius: 2 }}>
                        <div style={{ height: 3, width: `${pct}%`, background: C.amber, borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>
                  {/* Goals */}
                  <td className="num">
                    {p.goals > 0 || p.ownGoals > 0 ?
                      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, justifyContent: 'flex-end' }}>
                        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: p.goals > 0 ? C.text : C.muted }}>{p.goals}</span>
                        {(p.penalties > 0 || p.ownGoals > 0) &&
                        <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted }}>
                            {p.penalties > 0 && <span title="Vítaspyrnur">{p.penalties}v</span>}
                            {p.penalties > 0 && p.ownGoals > 0 && ' '}
                            {p.ownGoals > 0 && <span style={{ color: C.red }} title="Sjálfsmörk">{p.ownGoals}sj</span>}
                          </span>
                        }
                      </span> :
                      <span style={{ color: C.border }}>–</span>}
                  </td>
                  {/* Yellow */}
                  <td className="num">
                    {p.yellow > 0 ?
                      <span style={{ fontFamily: MONO, fontSize: 12, color: C.amber, fontWeight: 600 }}>{p.yellow}</span> :
                      <span style={{ color: C.border }}>–</span>}
                  </td>
                  {/* Red */}
                  <td className="num">
                    {p.red > 0 ?
                      <span style={{ fontFamily: MONO, fontSize: 12, color: C.red, fontWeight: 600 }}>{p.red}</span> :
                      <span style={{ color: C.border }}>–</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}><HgDot homegrown={p.homegrown} /></span>
                  </td>
                </tr>);

              })}
          </tbody>
        </table>
        </div>
      </div>

      {visible.length === 0 &&
      <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.muted }}>
          Enginn leikmaður passar við leitarskilyrðin
        </div>
      }

      <div style={{ marginTop: 10, fontFamily: "'Inter',sans-serif", fontSize: 10, color: C.muted, lineHeight: 1.7 }}>
        Aldurslitir: <span style={{ color: '#e05a5a' }}>rauður</span> = undir 21 &nbsp;
        <span style={{ color: '#1d4ed8' }}>blár</span> = 21–25 &nbsp;
        <span style={{ color: C.muted }}>grár</span> = 26+
        &nbsp;·&nbsp; Mörk: <span style={{ color: C.muted }}>Nv</span> = vítaspyrnur, <span style={{ color: C.red }}>Nsj</span> = sjálfsmörk
      </div>
    </div>);

}

Object.assign(window, { PlayersView });