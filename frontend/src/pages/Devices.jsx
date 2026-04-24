import { useState } from 'react'
import { addWatchPath, delWatchPath } from '../api'

export default function Devices({ devices, watchPaths, setWatchPaths, alerts, showToast }) {
  const [wpInput, setWpInput] = useState('')
  const usbEvents = alerts
    .filter(a => (a.threat_type||'').toLowerCase().includes('usb'))
    .slice(0, 8)

  const blocked = devices.filter(d => d.status === 'blocked').length

  const handleAddPath = async () => {
    if (!wpInput.trim()) return
    try {
      const res = await addWatchPath(wpInput.trim())
      setWatchPaths(res.paths)
      setWpInput('')
      showToast('cyan', `Watch path added: ${wpInput.trim()}`)
    } catch { showToast('red', 'Failed to add path') }
  }

  const handleDelPath = async (path) => {
    try {
      const res = await delWatchPath(path)
      setWatchPaths(res.paths)
      showToast('gray', 'Watch path removed.')
    } catch { showToast('red', 'Failed to remove path') }
  }

  return (
    <div className="page active" id="page-devices">
      <div className="content">
        <div className="g3">
          <div className="kpi c-green"><div className="kpi-lbl">Online</div><div className="kpi-val">{devices.filter(d=>d.status==='online').length}</div><div className="kpi-sub">Actively monitored</div></div>
          <div className="kpi c-amber"><div className="kpi-lbl">Offline</div><div className="kpi-val">{devices.filter(d=>d.status==='offline').length}</div><div className="kpi-sub">Not reporting</div></div>
          <div className="kpi c-red"><div className="kpi-lbl">Blocked</div><div className="kpi-val">{blocked}</div><div className="kpi-sub">Access revoked</div></div>
        </div>

        <div className="panel">
          <div className="ph"><span className="ph-title">Connected Endpoints</span><span className="badge b-live">● Polling</span></div>
          <div className="pb">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
              {devices.map(d => {
                const statusColor = d.status === 'online' ? 'var(--green)' : d.status === 'blocked' ? 'var(--red)' : 'var(--t2)'
                return (
                  <div key={d.id} className={`dev-card ${d.blocked ? 'blocked-dev' : ''}`}>
                    <div className="dev-hd">
                      <div>
                        <div className="dev-name">{d.id} {d.blocked && <span style={{ color:'var(--red)', fontSize:9 }}>● BLOCKED</span>}</div>
                        <div className="dev-os">{d.os}</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:statusColor }} />
                          <span style={{ fontFamily:'var(--fm)', fontSize:8, color:statusColor }}>{d.status.toUpperCase()}</span>
                        </div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:8, color:'var(--t2)' }}>{d.lastSeen}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:8, color:'var(--t2)', marginBottom:8 }}>
                      User: <span style={{ color:'var(--cyan)' }}>{d.user}</span>
                    </div>
                    <div className="dev-stat">
                      <div className="ds"><div className="ds-v">{(d.events||0).toLocaleString()}</div><div className="ds-k">events</div></div>
                      <div className="ds"><div className="ds-v" style={{ color:'var(--cyan)' }}>{d.watchers}</div><div className="ds-k">watchers</div></div>
                      <div className="ds"><div className="ds-v" style={{ color: d.blocked?'var(--red)':'var(--green)' }}>●</div><div className="ds-k">{d.blocked?'blocked':'active'}</div></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="g2">
          <div className="panel">
            <div className="ph"><span className="ph-title">Watch Paths</span><span className="badge b-cyan">config</span></div>
            <div className="pb">
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                {watchPaths.map(p => (
                  <span key={p} className="wl-tag">{p}<button className="wl-rm" onClick={() => handleDelPath(p)}>×</button></span>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input className="wl-input" placeholder="Add path e.g. C:\Users\Downloads" value={wpInput} onChange={e => setWpInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAddPath()} />
                <button className="btn-add" onClick={handleAddPath}>ADD</button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph"><span className="ph-title">USB Event Log</span><span className="badge b-amber">Today</span></div>
            <div className="pb" style={{ paddingTop:6 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto' }}>
                {usbEvents.length === 0
                  ? <div className="no-data" style={{ padding:16 }}>No USB events<small>No removable media detected</small></div>
                  : usbEvents.map(e => (
                    <div key={e._id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--b1)' }}>
                      <div>
                        <span style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--cyan)' }}>{e.user}</span>{' '}
                        <span style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t2)' }}>{e.threat_type}</span>
                      </div>
                      <span style={{ fontFamily:'var(--fm)', fontSize:8, color:'var(--t3)' }}>{e.timestamp?.slice(11,19)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
