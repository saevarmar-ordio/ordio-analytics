/* components.jsx — shared UI, v2 */
const { useState } = React;

/* ── MOBILE HOOK ────────────────────────────────────────── */
function useIsMobile() {
  const [m, setM] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}
window.useIsMobile = useIsMobile;

/* ── DESIGN TOKENS ──────────────────────────────────────── */
const C = {
  bg:          '#F4F5F7',
  surface:     '#ffffff',
  surfaceAlt:  '#F9FAFB',
  border:      '#E7E9EE',
  text:        '#111827',
  muted:       '#6B7280',
  // sidebar
  sidebar:     '#111827',
  sidebarHov:  'rgba(255,255,255,.06)',
  sidebarBrd:  'rgba(255,255,255,.08)',
  // brand accent (chrome / interactive)
  orange:      '#F97316',
  orangeFaint: '#FFF3EA',
  // data-tier accents
  green:       '#16A34A',
  greenFaint:  '#DCFCE7',
  amber:       '#D97706',
  amberFaint:  '#FEF3C7',
  blue:        '#2563EB',
  blueFaint:   '#DBEAFE',
  red:         '#E05A5A',
};
window.C = C;

const DISPLAY = "'Inter',sans-serif";
const MONO    = "'Inter',sans-serif";
const SANS    = "'Inter',sans-serif";
window.DISPLAY = DISPLAY; window.MONO = MONO; window.SANS = SANS;

/* ── GENDER-AWARE "HOMEGROWN" WORDING ───────── */
/* karla → uppaldir (masc.) · kvenna → uppaldar (fem.) */
const IS_KARLA = (window.LEAGUE_KEY === 'karla');
const HGADJ    = IS_KARLA ? 'Uppaldir' : 'Uppaldar';   // plural, capitalised
const HGADJ_LC = IS_KARLA ? 'uppaldir' : 'uppaldar';   // plural, lowercase
const HGSING   = IS_KARLA ? 'Uppalinn' : 'Uppalin';    // singular, capitalised
window.HGADJ = HGADJ; window.HGADJ_LC = HGADJ_LC; window.HGSING = HGSING;

/* ── QUARTILE COLOUR SCALE ──────────────────────────────── */
/* 4 clearly-separated steps: neðsti → efsti fjórðungur */
const QUART_COLORS = ['#B42318', '#F97316', '#CA8A04', '#15803D'];
window.QUART_COLORS = QUART_COLORS;
/* Colour a value by where it sits in the league-wide distribution for
   the given metric. Thresholds live on window.__quart (set by <App/>).
   Falls back to fixed bands before they are computed. */
window.quartColorFor = function (v, metricKey = 'minPct') {
  const t = window.__quart && window.__quart[metricKey];
  if (!t) return v >= 50 ? QUART_COLORS[3] : v >= 33 ? QUART_COLORS[2] : v >= 20 ? QUART_COLORS[1] : QUART_COLORS[0];
  return v >= t.q75 ? QUART_COLORS[3] : v >= t.q50 ? QUART_COLORS[2] : v >= t.q25 ? QUART_COLORS[1] : QUART_COLORS[0];
};

/* ── PAGE TITLE ─────────────────────────────────────────── */
function PageTitle({ children, sub, mb = 24 }) {
  return (
    <div style={{ marginBottom: sub ? 4 : mb }}>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', color: C.text, lineHeight: 1.1 }}>
        {children}
      </h1>
      {sub && <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 6, letterSpacing: '.03em' }}>{sub}</div>}
    </div>
  );
}

/* ── STAT CARD ──────────────────────────────────────────── */
function StatCard({ label, value, color, sub }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600, color: color || C.text, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: C.muted, marginTop: 6 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ── KPI GRID ───────────────────────────────────────────── */
function KpiGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 1, background: C.border, border: `1px solid ${C.border}`, marginBottom: 24, boxShadow: '0 1px 3px rgba(15,23,42,.06)' }}>
      {items.map(({ label, value, color, tip }) => (
        <div key={label} style={{ background: C.surface, padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: color || C.text }}>{value}</div>
          <div style={{ fontFamily: MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: C.muted, marginTop: 4, display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
            {label}{tip && <InfoTip text={tip}/>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── HG BAR ─────────────────────────────────────────────── */
function HgBar({ pct, barW = 80, height = 4, showLabel = true }) {
  const col = quartColorFor(pct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {showLabel && (
        <span style={{ fontFamily: MONO, fontSize: 12, color: col, fontWeight: 600, minWidth: 34, textAlign: 'right' }}>
          {pct}%
        </span>
      )}
      <div style={{ width: barW, height, background: C.surfaceAlt, borderRadius: 2, flexShrink: 0, overflow: 'hidden' }}>
        <div style={{ height, width: `${Math.min(pct,100)}%`, background: col, borderRadius: 2 }} />
      </div>
    </div>
  );
}

/* ── HG DOT ─────────────────────────────────────────────── */
function HgDot({ homegrown }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
      background: homegrown ? C.orange : C.border,
      border: homegrown ? 'none' : `1px solid ${C.border}`,
    }} title={homegrown ? HGSING : ''} />
  );
}

/* ── TEAM NAME ──────────────────────────────────────────── */
function TeamName({ name, bold = true, size = 13 }) {
  return <span style={{ color: C.text, fontWeight: bold ? 600 : 400, fontSize: size }}>{td(name)}</span>;
}

/* ── SORTABLE TH ────────────────────────────────────────── */
function SortTh({ col, sortCol, sortDir, onSort, right = false, sub, children, style = {} }) {
  const active = col === sortCol;
  return (
    <th onClick={() => onSort(col)}
      className={active ? (sortDir > 0 ? 'sorted-asc' : 'sorted-desc') : ''}
      style={{ textAlign: right ? 'right' : 'left', color: active ? C.orange : C.muted, ...style }}>
      <div>{children}</div>
      {sub && <div style={{ fontSize: 9, fontWeight: 400, opacity: .7, marginTop: 1, letterSpacing: '.04em' }}>{sub}</div>}
    </th>
  );
}

/* ── BACK BTN ───────────────────────────────────────────── */
function BackBtn({ onClick, to = 'Til baka' }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 11, color: h ? C.orange : C.muted, cursor: 'pointer', border: 'none', background: 'none', padding: 0, marginBottom: 20, transition: 'color .15s', letterSpacing: '.04em' }}>
      ← {to}
    </button>
  );
}

/* ── SECTION HEADER ─────────────────────────────────────── */
function SecHdr({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: `1px solid ${C.border}`, marginBottom: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: C.muted }}>{children}</div>
      {action}
    </div>
  );
}

/* ── AGE BADGE ──────────────────────────────────────────── */
function AgeBadge({ age }) {
  if (!age) return <span style={{ color: C.muted, fontFamily: MONO, fontSize: 12 }}>–</span>;
  const color = age < 21 ? '#e05a5a' : age <= 25 ? '#1d4ed8' : C.muted;
  return <span style={{ fontFamily: MONO, fontSize: 12, color }}>{age}</span>;
}

/* ── ROUND LABEL ────────────────────────────────────────── */
function RoundLabel({ matchId }) {
  const r = getRound(matchId);
  return <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted }}>{r ? r.label : matchId}</span>;
}

/* ── INFO TOOLTIP ───────────────────────────────────────── */
function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  const [pos,  setPos]  = useState({ top:0, left:0 });
  const ref = React.useRef(null);

  function handleEnter() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left + r.width/2 });
    }
    setShow(true);
  }

  return (
    <>
      <span ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:14, height:14, borderRadius:'50%',
          background: show ? C.orange : C.surfaceAlt,
          border: `1px solid ${show ? C.orange : C.border}`,
          cursor:'help', flexShrink:0,
          marginLeft:4, verticalAlign:'middle',
          transition:'background .12s, border-color .12s',
          userSelect:'none',
        }}
      >
        <svg width="7" height="9" viewBox="0 0 7 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="3.5" cy="1.2" r="1" fill={show ? '#fff' : C.muted}/>
          <rect x="2.5" y="3.2" width="2" height="5" rx="1" fill={show ? '#fff' : C.muted}/>
        </svg>
      </span>

      {show && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div style={{
          position:'fixed',
          top: pos.top,
          left: pos.left,
          transform:'translateX(-50%)',
          background:'#111827',
          color:'#f8fafc',
          fontSize:12,
          fontFamily:SANS,
          lineHeight:1.55,
          padding:'10px 14px',
          borderRadius:4,
          maxWidth:260,
          zIndex:9999,
          boxShadow:'0 4px 20px rgba(0,0,0,.25)',
          pointerEvents:'none',
        }}>
          {text}
          {/* Arrow */}
          <div style={{
            position:'absolute', top:-5, left:'50%', transform:'translateX(-50%)',
            width:0, height:0,
            borderLeft:'5px solid transparent',
            borderRight:'5px solid transparent',
            borderBottom:'5px solid #111827',
          }}/>
        </div>,
        document.body
      )}
    </>
  );
}

window.InfoTip = InfoTip;

/* ── TIPS DICTIONARY ────────────────────────────────────── */
window.TIPS = {
  hgMin:    'Hlutfall heildarleiktíma sem uppaldir leikmenn spiluðu. Aðalmælikvarðinn á vefnum.',
  hgPct:    'Hlutfall leikmanna (einstaklinga) sem eru uppaldir af öllum sem fengu leiktíma.',
  uppalin:  'Leikmaður með ≥1 leik í 3.–5. flokki hjá sama félagi (skilgreining KSÍ).',
  avgAge:   'Meðalaldur leikmanna sem fengu leiktíma, veginn eftir leiktíma — endurspeglar aldur þeirra sem raunverulega spila (leikmaður með fáar mínútur vegur minna).',
  avgAgeXI: 'Meðalaldur byrjunarliðs, veginn eftir leiktíma sem byrjunarliðsmenn.',
  coreAge:  'Meðalaldur 11 leikmanna með flestar mínútur — nær betur til raunverulegs kjarna liðsins.',
  u21:      'U21 virkar = undir 21 árs með yfir 90 mínútur. Alls = allir U21 á leikskrá.',
  kjarni:   'Leikmenn sem spiluðu yfir 50% af mögulegum mínútum liðsins.',
  quartile: 'Liturinn sýnir í hvaða fjórðungi deildarinnar liðið er eftir hlutfalli uppaldra. Mörkin eru reiknuð úr dreifingu ALLRA liða (25/50/75 hlutfallsmörk) og uppfærast eftir umferðum — svo lið færast milli lita þegar staðan breytist, í stað fastra marka. Grænt = efsti fjórðungur, rautt = neðsti.',
};

Object.assign(window, { C, DISPLAY, MONO, SANS, PageTitle, StatCard, KpiGrid, HgBar, HgDot, TeamName, SortTh, BackBtn, SecHdr, AgeBadge, RoundLabel, InfoTip });
