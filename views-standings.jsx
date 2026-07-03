/* views-standings.jsx — league table computed from results */
const { useMemo: useMemoS } = React;

function StandingsView({ matches, onTeam, highlight }) {
  const rows = useMemoS(() => computeStandings(matches), [matches]);
  const maxPts = Math.max(...rows.map(r => r.Pts), 1);
  const leagueKey = window.LEAGUE_KEY || 'kvenna';
  const SPLIT = 6; // top 6 go up in both leagues
  const upperLabel = 'Efri hluti — úrslitakeppni';
  const lowerLabel = 'Neðri hluti';
  const colSpan = 10;

  return (
    <div className="fade-in">
      <PageTitle sub="Reiknuð sjálfkrafa úr leikúrslitum">Stöðutafla</PageTitle>

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table className="data-table" style={{ minWidth:560 }}>
            <thead>
              <tr>
                <th style={{ width:34, textAlign:'right' }}>#</th>
                <th>Lið</th>
                <th className="num" style={{ width:38 }} title="Leikir">L</th>
                <th className="num" style={{ width:38 }} title="Sigrar">S</th>
                <th className="num" style={{ width:38 }} title="Jafntefli">J</th>
                <th className="num" style={{ width:38 }} title="Töp">T</th>
                <th className="num" style={{ width:42 }} title="Mörk skoruð">MF</th>
                <th className="num" style={{ width:42 }} title="Mörk á móti">MM</th>
                <th className="num" style={{ width:48 }} title="Markamunur">+/−</th>
                <th className="num" style={{ width:48 }} title="Stig">Stig</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isHi = r.team === highlight;
                const inUpper = i < SPLIT;
                const isReleg = i >= rows.length - 2;
                const accent = inUpper ? C.green : isReleg ? C.red : C.amber;
                const splitRow = i === SPLIT ? (
                  <tr key="split" aria-hidden="true">
                    <td colSpan={colSpan} style={{ padding:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px',
                        background:C.surfaceAlt, borderTop:`2px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
                        <span style={{ fontFamily:MONO, fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:C.muted }}>{lowerLabel}</span>
                        <span style={{ flex:1, height:1, background:C.border }}/>
                      </div>
                    </td>
                  </tr>
                ) : null;
                const groupHeader = i === 0 ? (
                  <tr key="uphdr" aria-hidden="true">
                    <td colSpan={colSpan} style={{ padding:'7px 12px', background:C.greenFaint, borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ fontFamily:MONO, fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:C.green }}>{upperLabel}</span>
                    </td>
                  </tr>
                ) : null;
                return (
                  <React.Fragment key={r.team}>
                  {groupHeader}
                  {splitRow}
                  <tr onClick={() => onTeam(r.team)}
                    style={{ background: isHi ? C.greenFaint : undefined }}>
                    <td className="num" style={{ color:C.muted, fontSize:12 }}>{i+1}</td>
                    <td style={{ fontWeight:600 }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:3, height:16, borderRadius:2, background:accent, display:'inline-block' }}/>
                        <TeamName name={r.team}/>
                      </span>
                    </td>
                    <td className="num" style={{ color:C.muted }}>{r.P}</td>
                    <td className="num">{r.W}</td>
                    <td className="num">{r.D}</td>
                    <td className="num">{r.L}</td>
                    <td className="num" style={{ color:C.muted }}>{r.GF}</td>
                    <td className="num" style={{ color:C.muted }}>{r.GA}</td>
                    <td className="num" style={{ color: r.GD>0?C.green:r.GD<0?C.red:C.muted, fontWeight:500 }}>
                      {r.GD>0?'+':''}{r.GD}
                    </td>
                    <td className="num">
                      <span style={{ fontFamily:MONO, fontSize:14, fontWeight:700, color:C.text }}>{r.Pts}</span>
                    </td>
                  </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop:12, fontFamily:MONO, fontSize:10, color:C.muted, lineHeight:1.7 }}>
        L=leikir · S=sigrar · J=jafntefli · T=töp · MF=mörk skoruð · MM=mörk á móti · +/−=markamunur
        <br/>
        <span style={{ color:C.green }}>grænt</span> = efstu 6 (efri hluti) &nbsp;·&nbsp;
        <span style={{ color:C.amber }}>gult</span> = neðri hluti &nbsp;·&nbsp;
        <span style={{ color:C.red }}>rautt</span> = neðstu 2 falla
      </div>
    </div>
  );
}

Object.assign(window, { StandingsView });
