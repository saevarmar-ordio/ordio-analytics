/* views-news.jsx — news feed on the homepage */
const { useState: useStateN, useEffect: useEffectN } = React;

/* type → label + colors */
const NEWS_TYPES = {
  recap:      { label: 'Samantekt',   fg: '#C2410C', bg: '#FFF3EA' },
  feature:    { label: 'Nýjung',      fg: '#1d4ed8', bg: '#dbeafe' },
  update:     { label: 'Uppfærsla',   fg: '#059669', bg: '#dcfce7' },
  correction: { label: 'Leiðrétting', fg: '#b45309', bg: '#fef3c7' },
};

/* league key → short badge */
const LEAGUE_BADGE = {
  kvenna: { label: '♀ Konur', show: true },
  karla:  { label: '♂ Karlar',  show: true },
  both:   { label: 'Báðar deildir', show: true },
  all:    { label: null, show: false }, // site-wide — no league badge
};

const IS_MON=['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember'];
function fmtNewsDate(iso) {
  try {
    const d = new Date(iso);
    const datePart = d.getDate()+'. '+IS_MON[d.getMonth()]+' '+d.getFullYear();
    if (/\d{2}:\d{2}/.test(iso)) {
      const t = d.toLocaleTimeString('is-IS', { hour:'2-digit', minute:'2-digit', hour12:false });
      return `${datePart} · ${t}`;
    }
    return datePart;
  } catch { return iso; }
}

/* normalise body into an array of paragraphs */
function bodyParas(item) {
  if (Array.isArray(item.paragraphs)) return item.paragraphs;
  if (Array.isArray(item.body)) return item.body;
  if (typeof item.body === 'string' && item.body.trim()) {
    return item.body.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function NewsItem({ item }) {
  const t  = NEWS_TYPES[item.type] || NEWS_TYPES.update;
  const lb = LEAGUE_BADGE[item.league] || {};
  const paras = bodyParas(item);
  const isRecap = item.type === 'recap';
  const collapsible = isRecap && paras.length > 2;
  const [open, setOpen] = useStateN(false);

  const shown = collapsible && !open ? paras.slice(0, 1) : paras;

  return (
    <div style={{ padding:'16px 0', borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
        {/* Type badge */}
        <span style={{ fontFamily:MONO, fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:t.fg, background:t.bg, padding:'3px 8px', borderRadius:3 }}>
          {t.label}
        </span>
        {/* Round badge (recaps) */}
        {item.round && (
          <span style={{ fontFamily:MONO, fontSize:9, fontWeight:600, color:C.text, background:C.surfaceAlt, padding:'3px 8px', borderRadius:3 }}>
            {item.round}
          </span>
        )}
        {/* League badge */}
        {lb.show && lb.label && (
          <span style={{ fontFamily:MONO, fontSize:9, fontWeight:500, color:C.muted, border:`1px solid ${C.border}`, padding:'3px 8px', borderRadius:3 }}>
            {lb.label}
          </span>
        )}
        {/* Date */}
        <span style={{ fontFamily:MONO, fontSize:10, color:C.muted, marginLeft:'auto' }}>
          {fmtNewsDate(item.date)}
        </span>
      </div>

      <div style={{
        fontFamily:DISPLAY,
        fontSize: isRecap ? 17 : 14,
        fontWeight: isRecap ? 700 : 600,
        letterSpacing: isRecap ? '-.01em' : 0,
        color:C.text, marginBottom: paras.length ? 6 : 0, lineHeight:1.25,
      }}>
        {item.title}
      </div>

      {shown.map((p, i) => (
        <p key={i} style={{
          fontSize:13, color:C.muted, lineHeight:1.6,
          margin:'0 0 8px 0',
          // lead paragraph of a recap gets a touch more presence
          ...(isRecap && i === 0 ? { color:C.text, fontWeight:500 } : {}),
        }}>{p}</p>
      ))}

      {collapsible && (
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            appearance:'none', border:'none', background:'none', cursor:'pointer',
            fontFamily:MONO, fontSize:11, fontWeight:600, color:t.fg,
            padding:'2px 0', marginTop:2, display:'inline-flex', alignItems:'center', gap:5,
          }}>
          {open ? 'Loka' : `Lesa meira (${paras.length - 1})`}
          <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform .15s', fontSize:9 }}>▾</span>
        </button>
      )}
    </div>
  );
}

function NewsFeed() {
  const [items, setItems] = useStateN(null);
  const leagueKey = window.LEAGUE_KEY || 'kvenna';

  useEffectN(() => {
    fetch('news.json')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  if (!items) return null;

  // Show items relevant to THIS league: own league + both + site-wide(all)
  const relevant = items.filter(it =>
    it.league === leagueKey || it.league === 'both' || it.league === 'all'
  );

  if (!relevant.length) return null;

  return (
    <div className="card" style={{ padding:'20px 24px', marginBottom:16, display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ fontFamily:MONO, fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.muted }}>
          Fréttir
        </div>
        <span style={{ width:7, height:7, borderRadius:'50%', background:C.orange }} title="Nýjustu fréttir"/>
      </div>
      <div style={{ overflowY:'auto', flex:1, marginTop:4 }}>
        {relevant.map((it, i) => <NewsItem key={i} item={it}/>)}
      </div>
    </div>
  );
}

Object.assign(window, { NewsFeed });
