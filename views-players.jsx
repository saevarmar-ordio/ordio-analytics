/* views-players.jsx — PlayersView */
const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;

/* normalise a name/club for contract lookup */
function normContractKey(s) {
  return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

/* look up a player's contract record: name+club match first, then name-only fallback */
function resolveContract(contracts, name, team) {
  if (!contracts) return null;
  const key = normContractKey(name) + '|||' + normContractKey(team);
  if (contracts.byNameClub[key]) return contracts.byNameClub[key];
  const nameOnly = contracts.byName[normContractKey(name)];
  return nameOnly || null;
}

/* ── CONTRACT BADGE (end date + days remaining) ─────────── */
function ContractCell({ rec }) {
  if (!rec) return <span style={{ color: C.border, fontFamily: MONO, fontSize: 12 }}>–</span>;
  const d = new Date(rec.til + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return (
    <span style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>
      {dd}.{mm}.{d.getFullYear()}
      {rec.loan && <span style={{ marginLeft: 5, fontSize: 9, color: C.orange, fontWeight: 600 }} title="Lánssamningur">L</span>}
    </span>
  );
}

function DaysLeftCell({ rec }) {
  if (!rec) return <span style={{ color: C.border, fontFamily: MONO, fontSize: 12 }}>–</span>;
  const d = new Date(rec.til + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((d - today) / 86400000);
  if (days < 0) return <span style={{ fontFamily: MONO, fontSize: 12, color: C.red, fontWeight: 600 }}>Útrunnið</span>;
  const color = days <= 90 ? C.red : days <= 180 ? C.amber : C.muted;
  return <span style={{ fontFamily: MONO, fontSize: 12, color, fontWeight: days <= 90 ? 600 : 400 }}>{days}</span>;
}

/* ── header-filter bucket helpers ───────────────────────── */
function ageBucket(age) {
  if (age == null) return 'unknown';
  if (age < 21) return 'u21';
  if (age <= 25) return '21-25';
  return '26+';
}
function contractBucket(days) {
  if (days == null) return 'none';
  if (days < 0) return 'expired';
  if (days <= 90) return 'lte90';
  if (days <= 180) return 'lte180';
  return 'gt180';
}
const AGE_OPTIONS = [
  { value: 'u21', label: 'Undir 21', color: '#e05a5a' },
  { value: '21-25', label: '21–25', color: '#1d4ed8' },
  { value: '26+', label: '26+', color: '#6B7280' },
  { value: 'unknown', label: 'Óþekkt' },
];
const CONTRACT_OPTIONS = [
  { value: 'expired', label: 'Útrunnið', color: '#E05A5A' },
  { value: 'lte90', label: '≤ 90 daga', color: '#E05A5A' },
  { value: 'lte180', label: '91–180 daga', color: '#D97706' },
  { value: 'gt180', label: '> 180 daga', color: '#6B7280' },
  { value: 'none', label: 'Engin skrá' },
];

function PlayersView({ matches, pc }) {
  const [search, setSearch] = useStateP('');
  const teamOptions = useMemoP(() => TEAMS.map((t) => ({ value: t, label: td(t) })), []);
  const hgOptions = useMemoP(() => [{ value: 'yes', label: HGADJ, color: C.orange }, { value: 'no', label: 'Ekki ' + HGADJ_LC }], []);
  const [teamSel, setTeamSel] = useStateP(() => new Set(TEAMS));
  const [ageSel, setAgeSel] = useStateP(() => new Set(AGE_OPTIONS.map((o) => o.value)));
  const [contractSel, setContractSel] = useStateP(() => new Set(CONTRACT_OPTIONS.map((o) => o.value)));
  const [hgSel, setHgSel] = useStateP(() => new Set(['yes', 'no']));
  const [sortCol, setSortCol] = useStateP('totalMins');
  const [sortDir, setSortDir] = useStateP(-1);
  const [contracts, setContracts] = useStateP(null);

  useEffectP(() => {
    if (!window.HAS_CONTRACTS) return;
    fetch('contracts_kvenna.json').
    then((r) => r.ok ? r.json() : null).
    then(setContracts).
    catch(() => setContracts(null));
  }, []);

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
    map((p) => {
      const rec = resolveContract(contracts, p.name, p.team);
      return {
        ...p,
        age: pc[p.id]?.birthYear ? (window.SEASON_YEAR||2026) - pc[p.id].birthYear : null,
        homegrown: pc[p.id]?.homegrown || false,
        goals: ev[p.id]?.goals || 0,
        penalties: ev[p.id]?.penalties || 0,
        ownGoals: ev[p.id]?.ownGoals || 0,
        yellow: ev[p.id]?.yellow || 0,
        red: ev[p.id]?.red || 0,
        contractTil: rec ? rec.til : null,
        contractDaysLeft: rec ? Math.round((new Date(rec.til + 'T00:00:00') - new Date(new Date().setHours(0,0,0,0))) / 86400000) : null,
        contractRec: rec,
      };
    });
  }, [matches, pc, contracts]);

  function handleSort(col) {
    if (sortCol === col) setSortDir((d) => d * -1);else
    {setSortCol(col);setSortDir(col === 'name' || col === 'team' ? 1 : -1);}
  }

  const visible = useMemoP(() => {
    let rows = [...all];
    if (search) rows = rows.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (teamSel.size < TEAMS.length) rows = rows.filter((p) => teamSel.has(p.team));
    if (ageSel.size < AGE_OPTIONS.length) rows = rows.filter((p) => ageSel.has(ageBucket(p.age)));
    if (window.HAS_CONTRACTS && contractSel.size < CONTRACT_OPTIONS.length) rows = rows.filter((p) => contractSel.has(contractBucket(p.contractDaysLeft)));
    if (hgSel.size < 2) rows = rows.filter((p) => hgSel.has(p.homegrown ? 'yes' : 'no'));
    rows.sort((a, b) => {
      let av = a[sortCol],bv = b[sortCol];
      if (av === null || av === undefined) av = sortDir > 0 ? Infinity : -Infinity;
      if (bv === null || bv === undefined) bv = sortDir > 0 ? Infinity : -Infinity;
      if (typeof av === 'string') return sortDir * av.localeCompare(bv, 'is');
      return sortDir * (av - bv);
    });
    return rows;
  }, [all, search, teamSel, ageSel, contractSel, hgSel, sortCol, sortDir]);

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

  const anyFilterActive = teamSel.size < TEAMS.length || ageSel.size < AGE_OPTIONS.length ||
  (window.HAS_CONTRACTS && contractSel.size < CONTRACT_OPTIONS.length) || hgSel.size < 2;

  function resetFilters() {
    setTeamSel(new Set(TEAMS));
    setAgeSel(new Set(AGE_OPTIONS.map((o) => o.value)));
    setContractSel(new Set(CONTRACT_OPTIONS.map((o) => o.value)));
    setHgSel(new Set(['yes', 'no']));
  }

  return (
    <div className="fade-in">
      <PageTitle sub={`${all.length} leikmenn — leit, röðun og síun (síur í dálkahausum)`}>Leikmannayfirlit</PageTitle>
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

        {anyFilterActive &&
        <button onClick={resetFilters}
          style={{
            padding: '7px 12px', border: `1px solid ${C.border}`, cursor: 'pointer',
            fontFamily: "'Inter',sans-serif", fontSize: 11, background: C.surface, color: C.orange
          }}>
            Hreinsa síur
          </button>
        }

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
              <SortFilterTh col="team" {...thP}
                filter={<HeaderFilter options={teamOptions} selected={teamSel} onChange={setTeamSel} />}>
                Lið
              </SortFilterTh>
              <SortFilterTh col="age" {...thP} right
                filter={<HeaderFilter options={AGE_OPTIONS} selected={ageSel} onChange={setAgeSel} align="right" />}>
                Aldur
              </SortFilterTh>
              {window.HAS_CONTRACTS && <SortTh col="contractTil" {...thP} right>Samningur til</SortTh>}
              {window.HAS_CONTRACTS &&
              <SortFilterTh col="contractDaysLeft" {...thP} right sub="dagar"
                filter={<HeaderFilter options={CONTRACT_OPTIONS} selected={contractSel} onChange={setContractSel} align="right" />}>
                  Rennur út
                </SortFilterTh>
              }
              <SortTh col="totalMins" {...thP} right style={{ minWidth: 120 }}>Mínútur</SortTh>
              <SortTh col="goals" {...thP} right sub="víti / sj.m.">Mörk</SortTh>
              <SortTh col="yellow" {...thP} right>Gul</SortTh>
              <SortTh col="red" {...thP} right>Rauð</SortTh>
              <SortFilterTh col="homegrown" {...thP} style={{ textAlign: 'center' }}
                filter={<HeaderFilter options={hgOptions} selected={hgSel} onChange={setHgSel} align="right" />}>
                {HGSING}
              </SortFilterTh>
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
                  {window.HAS_CONTRACTS && <td className="num"><ContractCell rec={p.contractRec} /></td>}
                  {window.HAS_CONTRACTS && <td className="num"><DaysLeftCell rec={p.contractRec} /></td>}
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
        {window.HAS_CONTRACTS && <><br/>Samningsupplýsingar: KSÍ samningaskrá, uppfært 14.9.2026. <span style={{ color: C.orange }}>L</span> = lánssamningur. „–" = samningur fannst ekki í skránni (t.d. vegna nafnamunar).</>}
      </div>
    </div>);

}

Object.assign(window, { PlayersView });