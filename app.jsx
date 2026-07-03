/* app.jsx — Sidebar + App router + HomePage v2 */
const { useState: useA, useEffect: useEA, useMemo: useMA } = React;

/* ── TWEAK DEFAULTS ─────────────────────────────────────── */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "metric": "minPct",
  "density": "normal"
} /*EDITMODE-END*/;

/* ── MOBILE HEADER ──────────────────────────────────────── */
function MobileHeader() {
  return (
    <div className="mobile-header" style={{
      display: 'none', background: C.sidebar, padding: '8px 16px',
      alignItems: 'center', justifyContent: 'flex-start',
      flexShrink: 0, borderBottom: `1px solid rgba(255,255,255,.08)`
    }}>
      <a href="index.html" style={{ display: 'inline-flex', textDecoration: 'none' }}>
        <img src="assets/ordio-logo-dark.png" alt="Ordio" style={{ height: 26, display: 'block' }} />
      </a>
    </div>);

}

/* ── MOBILE NAV ─────────────────────────────────────────── */
function MobileNav({ view, setView }) {
  const items = [
  { id: 'home', label: 'Yfirlit' },
  { id: 'matches', label: 'Leikir' },
  { id: 'teams', label: 'Lið' },
  { id: 'players', label: 'Leikmenn' },
  { id: 'standings', label: 'Staða' }];

  const active = view === 'match-detail' ? 'matches' : view === 'team-detail' ? 'teams' : view;
  return (
    <nav className="mobile-nav" style={{ background: C.sidebar, borderTop: `1px solid rgba(255,255,255,.1)`, flexShrink: 0 }}>
      {items.map((item) =>
      <button key={item.id} onClick={() => setView(item.id)}
      style={{
        flex: 1, padding: '10px 4px 14px',
        background: 'none', border: 'none', cursor: 'pointer',
        borderTop: active === item.id ? '2px solid #F97316' : '2px solid transparent',
        color: active === item.id ? '#fff' : 'rgba(255,255,255,.5)',
        fontFamily: MONO, fontSize: 10, letterSpacing: '.05em',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
          {item.label}
        </button>
      )}
      <a href="um-vefinn.html"
      style={{
        flex: 1, padding: '10px 4px 14px',
        borderTop: '2px solid transparent',
        color: 'rgba(255,255,255,.5)',
        fontFamily: MONO, fontSize: 10, letterSpacing: '.05em',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textDecoration: 'none'
      }}>
        Um
      </a>
    </nav>);

}

/* ── SIDEBAR ────────────────────────────────────────────── */
function Sidebar({ view, setView, counts }) {
  const navItems = [
  { id: 'home', label: 'Yfirlit', badge: null },
  { id: 'matches', label: 'Leikir', badge: counts?.matches || null },
  { id: 'teams', label: 'Lið', badge: counts?.teams || null },
  { id: 'players', label: 'Leikmenn', badge: null },
  { id: 'standings', label: 'Staða', badge: null }];

  const active = view === 'match-detail' ? 'matches' : view === 'team-detail' ? 'teams' : view;

  return (
    <aside style={{ width: 210, minWidth: 210, background: C.sidebar, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Brand — links back to landing page */}
      <a href="index.html" style={{ padding: '22px 20px', borderBottom: `1px solid ${C.sidebarBrd}`, textDecoration: 'none', display: 'block' }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '.8'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
        <img src="assets/ordio-logo-dark.png" alt="Ordio" style={{ height: 44, display: 'block' }} />
      </a>

      {/* Nav */}
      <nav style={{ padding: '10px 8px', flex: 1 }}>
        {navItems.map((item) =>
        <button key={item.id} onClick={() => setView(item.id)}
        className={`nav-item${active === item.id ? ' active' : ''}`}>
          
            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: active === item.id ? 600 : 400, color: active === item.id ? '#fff' : 'rgba(255,255,255,.52)', transition: 'color .15s' }}>
              {item.label}
            </span>
            {item.badge &&
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.08)', padding: '2px 6px', borderRadius: 3 }}>
                {item.badge}
              </span>
          }
          </button>
        )}
        <a href="um-vefinn.html"
        style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '9px 12px', fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,.52)', textDecoration: 'none', borderLeft: '2px solid transparent', borderRadius: '0 6px 6px 0', marginBottom: 2, marginTop: 4, transition: 'background .15s, color .15s' }}
        onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,.06)';e.currentTarget.style.color = 'rgba(255,255,255,.8)';}}
        onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';e.currentTarget.style.color = 'rgba(255,255,255,.52)';}}>
          
          Um vefinn
        </a>
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.sidebarBrd}` }}>
        <a href="index.html" style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,.35)', letterSpacing: '.06em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, transition: 'color .15s', marginBottom: 6 }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,.7)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,.35)'}>
          ← Forsíða
        </a>
        {window.__dataLastUpdated &&
        <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,.22)', letterSpacing: '.04em' }}>
            Uppfært: {(() => {const M = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des'];const d = new Date(window.__dataLastUpdated);return d.getDate() + '. ' + M[d.getMonth()] + ' ' + d.getFullYear();})()}
          </div>
        }
      </div>
    </aside>);

}

/* ── HOME — AGE RANKING CHART ───────────────────────────── */
function AgeRankingChart({ data, onTeam }) {
  const sorted = [...data].filter((d) => d.avgAgeSt).sort((a, b) => a.avgAgeSt - b.avgAgeSt);
  const ages = sorted.flatMap((d) => [d.avgAgeSt, d.coreAge].filter(Boolean));
  const minA = Math.floor(Math.min(...ages)) - 1;
  const maxA = Math.ceil(Math.max(...ages)) + 1;
  const scl = (v) => v ? `${(v - minA) / (maxA - minA) * 100}%` : '0%';
  const sclHg = (v) => `${v / 11 * 100}%`; // out of 11 starters

  return (
    <div className="card" style={{ padding: '22px 26px' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: C.muted, marginBottom: 20 }}>
        Aldur eftir liðum — yngst til elst
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {sorted.map((d, i) =>
        <div key={d.team} onClick={() => onTeam(d.team)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '2px 0' }}
        onMouseEnter={(e) => e.currentTarget.querySelector('.rna').style.color = C.orange}
        onMouseLeave={(e) => e.currentTarget.querySelector('.rna').style.color = C.text}>
          
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, width: 18, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
            <div className="rna" style={{ fontWeight: 600, fontSize: 13, width: 108, flexShrink: 0, transition: 'color .12s', color: C.text }}>{td(d.team)}</div>

            {/* Dual bar — age only */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ position: 'relative', height: 5 }}>
                <div style={{ position: 'absolute', inset: 0, background: C.surfaceAlt, borderRadius: 3 }} />
                {d.avgAgeSt && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: scl(d.avgAgeSt), background: '#1d4ed8', borderRadius: 3, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />}
              </div>
              <div style={{ position: 'relative', height: 5 }}>
                <div style={{ position: 'absolute', inset: 0, background: C.surfaceAlt, borderRadius: 3 }} />
                {d.coreAge && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: scl(d.coreAge), background: '#60a5fa', borderRadius: 3, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />}
              </div>
            </div>

            {/* Values: ages + homegrown starters — compact inline */}
            <div style={{ flexShrink: 0, minWidth: 110, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'baseline' }}>
                <span style={{ fontFamily: MONO, fontSize: 8, color: C.muted }}>XI</span>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: '#1d4ed8' }}>{fn(d.avgAgeSt)}</span>
                <span style={{ fontFamily: MONO, fontSize: 8, color: C.muted }}>Kj</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#60a5fa' }}>{fn(d.coreAge)}</span>
                <span style={{ fontFamily: MONO, fontSize: 8, color: C.muted }}>↑</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.orange, fontWeight: 600 }}>{fn(d.hgStPerMatch)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {[
        { c: '#1d4ed8', l: 'XI — Meðalaldur byrjunarliðs', tip: TIPS.avgAgeXI },
        { c: '#60a5fa', l: 'Kj — Kjarnaaldur', tip: TIPS.coreAge },
        { c: C.orange, l: `↑XI — ${HGADJ} í byrjunarliði`, tip: 'Meðalfjöldi uppaldra leikmanna í byrjunarlið á leik.' }].
        map(({ c, l, tip }) =>
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
            <div style={{ width: 12, height: 4, borderRadius: 2, background: c }} />
            {l}<InfoTip text={tip} />
          </div>
        )}
      </div>
    </div>);

}

/* ── HOME — RANKING CHART ───────────────────────────────── */
function RankingChart({ data, metric, onTeam }) {
  const sorted = [...data].sort((a, b) => b[metric] - a[metric]);
  const lbl = metric === 'minPct' ? `Hlutfall mínútna — ${HGADJ_LC}` : `Hlutfall leikmanna — ${HGADJ_LC}`;


  return (
    <div className="card" style={{ padding: '22px 26px' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: C.muted, marginBottom: 20, display: 'flex', alignItems: 'center' }}>
        {lbl}<InfoTip text={metric === 'minPct' ? TIPS.hgMin : TIPS.hgPct} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {sorted.map((d, i) => {
          const pct = d[metric];
          const col = quartColorFor(pct, metric);
          return (
            <div key={d.team} onClick={() => onTeam(d.team)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '2px 0' }}
            onMouseEnter={(e) => e.currentTarget.querySelector('.rn').style.color = C.orange}
            onMouseLeave={(e) => e.currentTarget.querySelector('.rn').style.color = C.text}>
              
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, width: 18, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
              <div className="rn" style={{ fontWeight: 600, fontSize: 13, width: 108, flexShrink: 0, transition: 'color .12s', color: C.text }}>
                {td(d.team)}
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, fontWeight: 400, marginLeft: 4 }}>({d.teamMatches.length})</span>
              </div>
              <div style={{ flex: 1, height: 10, background: C.surfaceAlt, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 5, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: col, minWidth: 38, textAlign: 'right', flexShrink: 0 }}>
                {pct}%
              </div>
            </div>);

        })}
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ c: QUART_COLORS[3], l: 'Efsti fjórðungur' }, { c: QUART_COLORS[2], l: '2. fjórðungur' }, { c: QUART_COLORS[1], l: '3. fjórðungur' }, { c: QUART_COLORS[0], l: 'Neðsti fjórðungur' }].map(({ c, l }) =>
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
            <div style={{ width: 12, height: 4, borderRadius: 2, background: c }} />
            {l}
          </div>
        )}
        <InfoTip text={TIPS.quartile} />
      </div>
    </div>);

}

/* ── HOMEPAGE ───────────────────────────────────────────── */
function HomePage({ matches, pc, teamData, metric, onTeam }) {
  const allIds = useMA(() => {
    const s = new Set(matches.flatMap((m) => m.players.filter((p) => p.mins > 0).map((p) => p.id)));
    return [...s];
  }, [matches]);

  const hgIds = allIds.filter((id) => pc[id]?.homegrown);
  const allMins = matches.flatMap((m) => m.players).reduce((s, p) => s + p.mins, 0);
  const hgMins = matches.flatMap((m) => m.players).filter((p) => pc[p.id]?.homegrown).reduce((s, p) => s + p.mins, 0);
  const waAll = allIds.filter((id) => pc[id]?.birthYear);
  const avgAge = waAll.length ? (waAll.reduce((s, id) => s + (2026 - pc[id].birthYear), 0) / waAll.length).toFixed(1).replace('.', ',') : '–';
  const globalMinPct = allMins ? Math.round(hgMins / allMins * 100) : 0;
  const globalAvgHgSt = teamData.length ? (teamData.reduce((s, t) => s + t.hgStPerMatch, 0) / teamData.length).toFixed(1).replace('.', ',') : '–';

  return (
    <div className="fade-in">
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 38, fontWeight: 700, letterSpacing: '-.025em', color: C.text, lineHeight: 1.1, marginBottom: 10 }}>
          {(window.LEAGUE_TITLE || ['Besta deild', 'kvenna 2026']).join(' ')}
        </h1>
        <p style={{ fontSize: 15, color: C.muted, maxWidth: 480, lineHeight: 1.6 }}>
          Hlutfall uppaldra leikmanna yfir {ROUNDS.length} umferðir. Hér eru {matches.length} leikir og {allIds.length} leikmenn greindir.
        </p>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, background: C.border, border: `1px solid ${C.border}`, marginBottom: 28, boxShadow: '0 1px 3px rgba(15,23,42,.06)' }}>
        {[
        { l: 'Leikir', v: matches.length, c: null, tip: null },
        { l: 'Lið', v: TEAMS.length, c: null, tip: null },
        { l: 'Leikmenn', v: allIds.length, c: null, tip: null },
        { l: 'Meðalaldur', v: avgAge, c: null, tip: TIPS.avgAge },
        { l: HGADJ, v: hgIds.length, c: C.orange, tip: TIPS.uppalin },
        { l: `${HGADJ} mín`, v: globalMinPct + '%', c: quartColorFor(globalMinPct, 'minPct'), tip: TIPS.hgMin },
        { l: `${HGADJ} í XI`, v: globalAvgHgSt, c: C.orange, tip: 'Meðalfjöldi uppaldra leikmanna í byrjunarlið á leik, meðaltal yfir öll lið.' }].
        map(({ l, v, c, tip }) =>
        <div key={l} style={{ background: C.surface, padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, color: c || C.text, lineHeight: 1 }}>{v}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', color: C.muted, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              {l}{tip && <InfoTip text={tip} />}
            </div>
          </div>
        )}
      </div>

      {/* Charts — 2 col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <RankingChart data={teamData} metric={metric} onTeam={onTeam} />
        <AgeRankingChart data={teamData} onTeam={onTeam} />
      </div>

      {/* News feed */}
      <NewsFeed />
    </div>);

}

/* ── APP ────────────────────────────────────────────────── */
function App() {
  const [data, setData] = useA(null);
  const [error, setError] = useA(null);
  const [view, setViewRaw] = useA('home');
  const [matchId, setMatchId] = useA(null);
  const [team, setTeam] = useA(null);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEA(() => {
    fetch(window.DATA_FILE || 'ksi_data.json').
    then((r) => {if (!r.ok) throw new Error('HTTP ' + r.status);return r.json();}).
    then((d) => {
      window.__dataLastUpdated = d.lastUpdated || null;
      if (Array.isArray(d.rounds) && d.rounds.length) {
        window.ROUNDS = d.rounds.map((r, i) => ({ ...r, n: parseInt(r.label, 10) || i + 1 }));
      }
      setData(d);
    }).
    catch((e) => setError(e.message));
  }, []);

  function setView(v, id) {
    window.scrollTo && document.querySelector('main')?.scrollTo(0, 0);
    if (v === 'match-detail') {setMatchId(id);setViewRaw('match-detail');} else
    if (v === 'team-detail') {setTeam(id);setViewRaw('team-detail');} else
    setViewRaw(v);
  }

  const teamData = useMA(() => {
    if (!data) return [];
    return TEAMS.map((t) => teamAgg(data.matches, data.playerStats, t));
  }, [data]);

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 13, color: '#e05a5a' }}>Villa við að hlaða gögnum</div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{error}</div>
    </div>);


  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <div style={{ fontFamily: MONO, fontSize: 13, color: '#94a3b8', letterSpacing: '.05em' }}>Hleður gögn…</div>
    </div>);


  const { matches, playerStats: pc } = data;
  const pad = tweaks.density === 'compact' ? '20px 24px' : '28px 32px';
  const counts = { matches: matches.length, teams: TEAMS.length };

  /* League-wide quartile thresholds — shared colour scale across every view.
     Recomputed from the live team distribution, so bands shift over the season. */
  const quartThresh = (key) => {
    const vals = teamData.map((t) => t[key]).filter((v) => v != null).slice().sort((a, b) => a - b);
    const q = (p) => {
      if (!vals.length) return 0;
      const idx = (vals.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
      return vals[lo] + (vals[hi] - vals[lo]) * (idx - lo);
    };
    return { q25: q(0.25), q50: q(0.5), q75: q(0.75) };
  };
  window.__quart = { minPct: quartThresh('minPct'), hgPct: quartThresh('hgPct') };

  return (
    <>
      <Sidebar view={view} setView={setView} counts={counts} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <MobileHeader />
        <main style={{ flex: 1, overflowY: 'auto', background: C.bg }} id="main-scroll">
          <div className={`main-content${tweaks.density === 'compact' ? ' main-content--compact' : ''}`}>
          {view === 'home' &&
            <HomePage matches={matches} pc={pc} teamData={teamData} metric={tweaks.metric}
            onTeam={(t) => setView('team-detail', t)} />
            }
          {view === 'matches' &&
            <MatchesView matches={matches} pc={pc} metric={tweaks.metric}
            onMatch={(id) => setView('match-detail', id)} />
            }
          {view === 'match-detail' && matchId &&
            <MatchDetailView matchId={matchId} matches={matches} pc={pc} metric={tweaks.metric}
            onBack={() => setView('matches')} onTeam={(t) => setView('team-detail', t)} />
            }
          {view === 'teams' &&
            <TeamsView matches={matches} pc={pc} metric={tweaks.metric}
            onTeam={(t) => setView('team-detail', t)} />
            }
          {view === 'team-detail' && team &&
            <TeamDetailView team={team} matches={matches} pc={pc} metric={tweaks.metric}
            onBack={() => setView('teams')} onMatch={(id) => setView('match-detail', id)} />
            }
          {view === 'players' &&
            <PlayersView matches={matches} pc={pc} />
            }
          {view === 'standings' &&
            <StandingsView matches={matches} highlight={team}
            onTeam={(t) => setView('team-detail', t)} />
            }
        </div>
        </main>
        <MobileNav view={view} setView={setView} />
      </div>

      <TweaksPanel>
        <TweakSection title="Lykilmælikvarði">
          <TweakRadio id="metric" options={['minPct', 'hgPct']} labels={['% mínútna', '% leikmanna']} />
        </TweakSection>
        <TweakSection title="Þéttleiki">
          <TweakRadio id="density" options={['normal', 'compact']} labels={['Venjulegt', 'Þjappað']} />
        </TweakSection>
      </TweaksPanel>
    </>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);