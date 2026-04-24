export function Gauge({ score = 0 }) {
  const circ = 428
  const offset = circ * (1 - score / 100)
  const grad = score <= 30 ? 'url(#grad-safe)' : score <= 70 ? 'url(#grad-mid)' : 'url(#grad-crit)'
  const color = score <= 30 ? 'var(--green)' : score <= 70 ? 'var(--amber)' : 'var(--red)'
  const label = score <= 30 ? 'SAFE' : score <= 70 ? 'ELEVATED' : 'CRITICAL'
  const status = score <= 30 ? '✓ All systems nominal' : score <= 70 ? '⚠ Elevated risk detected' : '● CRITICAL THREAT ACTIVE'
  const badgeBg = score <= 30 ? 'rgba(0,230,118,.1)' : score <= 70 ? 'rgba(255,176,32,.1)' : 'rgba(255,41,82,.1)'
  const badgeBd = score <= 30 ? 'rgba(0,230,118,.2)' : score <= 70 ? 'rgba(255,176,32,.2)' : 'rgba(255,41,82,.2)'

  return (
    <div className="panel" style={{ animationDelay: '.25s' }}>
      <div className="ph">
        <span className="ph-title">System Threat Level</span>
        <span className="badge" style={{ background: badgeBg, color, border: `1px solid ${badgeBd}` }}>{label}</span>
      </div>
      <div className="gauge-area">
        <svg className="g-svg" viewBox="0 0 170 170">
          <defs>
            <linearGradient id="grad-safe" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00E676"/><stop offset="100%" stopColor="#00CFFF"/></linearGradient>
            <linearGradient id="grad-mid"  x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FFB020"/><stop offset="100%" stopColor="#FF6020"/></linearGradient>
            <linearGradient id="grad-crit" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FF2952"/><stop offset="100%" stopColor="#FF0080"/></linearGradient>
          </defs>
          <circle className="g-track" cx="85" cy="85" r="68"/>
          <circle className="g-fill" cx="85" cy="85" r="68" stroke={grad} style={{ strokeDashoffset: offset }}/>
          <text x="85" y="80" textAnchor="middle" className="g-num">{score}</text>
          <text x="85" y="100" textAnchor="middle" className="g-sub" fill={color}>{label}</text>
        </svg>
        <div className="g-status" style={{ color }}>{status}</div>
        <div className="g-scale">
          <div className="gs"><div className="gs-v" style={{ color: 'var(--green)' }}>0–30</div><div className="gs-k">Safe</div></div>
          <div className="gs"><div className="gs-v" style={{ color: 'var(--amber)' }}>31–70</div><div className="gs-k">Elevated</div></div>
          <div className="gs"><div className="gs-v" style={{ color: 'var(--red)' }}>71–100</div><div className="gs-k">Critical</div></div>
        </div>
      </div>
    </div>
  )
}
