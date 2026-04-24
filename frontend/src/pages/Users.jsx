import { useState } from 'react'

function buildHeatmapData() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  return days.map(d => ({
    day: d,
    hours: Array.from({ length: 24 }, (_, h) => {
      const isOff = h < 6 || h > 21
      const v = isOff ? (Math.random() > .7 ? Math.floor(Math.random()*6)+4 : Math.floor(Math.random()*2)) : Math.floor(Math.random()*9)+2
      return { h, v, anomaly: isOff && v > 3 }
    })
  }))
}

const HEATMAP_DATA = buildHeatmapData()

export default function Users({ userRisk, showToast }) {
  const [search, setSearch] = useState('')

  const filtered = userRisk.filter(u => u.user.includes(search.toLowerCase()))
  const highRisk = userRisk.filter(u => u.score > 70)

  const rc = s => s > 70 ? 'rf-red' : s > 40 ? 'rf-amber' : 'rf-green'
  const sc = s => s > 70 ? 'var(--red)' : s > 40 ? 'var(--amber)' : 'var(--green)'
  const statBadge = s => s === 'blocked' ? 'b-red' : s === 'watchlist' ? 'b-amber' : 'b-live'

  return (
    <div className="page active" id="page-users">
      <div className="content">
        <div className="g3">
          <div className="kpi c-cyan"><div className="kpi-lbl">Total Users</div><div className="kpi-val">{userRisk.length}</div><div className="kpi-sub">Monitored</div></div>
          <div className="kpi c-red"><div className="kpi-lbl">High Risk</div><div className="kpi-val">{highRisk.length}</div><div className="kpi-sub">Score &gt; 70</div></div>
          <div className="kpi c-amber"><div className="kpi-lbl">On Watchlist</div><div className="kpi-val">{userRisk.filter(u => u.status === 'watchlist').length}</div><div className="kpi-sub">Manual flags</div></div>
        </div>

        <div className="panel">
          <div className="ph">
            <span className="ph-title">User Risk Scores</span>
            <div className="ph-right">
              <input className="filt-input" placeholder="Search user..." style={{ minWidth: 140 }} value={search} onChange={e => setSearch(e.target.value)} />
              <span className="badge b-live">Live scoring</span>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>User</th><th>Risk Score</th><th>Events Today</th><th>Alerts</th><th>Last Active</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan="7" style={{ textAlign:'center', color:'var(--t2)', padding:24, fontFamily:'var(--fm)', fontSize:10 }}>No users found</td></tr>
                  : filtered.map(u => (
                    <tr key={u.user}>
                      <td style={{ color:'var(--cyan)' }} className="mono">{u.user}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div className="risk-bar" style={{ width:80 }}><div className={`risk-fill ${rc(u.score)}`} style={{ width:`${u.score}%` }}/></div>
                          <span style={{ color:sc(u.score), fontFamily:'var(--fm)', fontSize:10 }}>{u.score}</span>
                        </div>
                      </td>
                      <td className="mono">{u.events}</td>
                      <td style={{ color: u.alerts > 0 ? 'var(--red)' : 'var(--t2)' }} className="mono">{u.alerts}</td>
                      <td className="mono" style={{ color:'var(--t2)' }}>{u.last_active || '—'}</td>
                      <td><span className={`badge ${statBadge(u.status)}`}>{u.status.toUpperCase()}</span></td>
                      <td><button className="btn-sm btn-report" style={{ padding:'3px 8px', fontSize:7 }} onClick={() => showToast('cyan', `Watching ${u.user}`)}>WATCH</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <span className="ph-title">Activity Heatmap — Hour × Day</span>
            <div className="ph-right">
              <span style={{ fontFamily:'var(--fm)', fontSize:8, color:'var(--t2)' }}>Dark = low · </span>
              <span style={{ fontFamily:'var(--fm)', fontSize:8, color:'var(--red)' }}>Red = anomalous</span>
            </div>
          </div>
          <div style={{ padding:'12px 14px' }}>
            <div className="heatmap">
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="hm-col-hdr">{h % 6 === 0 ? String(h).padStart(2,'0') : ''}</div>
              ))}
              {HEATMAP_DATA.map(({ day, hours }) => (
                <span key={day} style={{ display:'contents' }}>
                  <div className="hm-lbl">{day}</div>
                  {hours.map(({ h, v, anomaly }) => {
                    const bg = anomaly ? `rgba(255,41,82,${(v/10).toFixed(2)})` : `rgba(0,207,255,${(v/16).toFixed(2)})`
                    return <div key={h} className="hm-cell" style={{ background: bg }} title={`${day} ${String(h).padStart(2,'0')}:00 — ${v} events${anomaly?' ⚠ ANOMALY':''}`} />
                  })}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
