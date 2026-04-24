import { useState, useEffect } from 'react'
import { Doughnut, Line } from 'react-chartjs-2'
import { Chart, ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend } from 'chart.js'
import { alertAction } from '../api'

Chart.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend)

const THREATS = ['Mass exfiltration','USB exfiltration','Credential stuffing','After-hours access','Privilege abuse']

function exportCSV(list) {
  const rows = [['ID','Time','User','File','Size','Type','Severity','Status'], ...list.map(a => [a._id, a.timestamp?.slice(11,19), a.user, a.file_name, a.file_size || '—', a.threat_type, a.severity || '—', a.status])]
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sentinel_alerts.csv'; link.click()
}

export default function Threats({ alerts, stats, showToast }) {
  const [list, setList] = useState(alerts)
  const [search, setSearch] = useState('')
  const [sev, setSev] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [lineData, setLineData] = useState(new Array(20).fill(0))

  useEffect(() => { setList(alerts) }, [alerts])
  useEffect(() => {
    setLineData(prev => { const n = [...prev]; n.shift(); n.push(alerts.filter(a => a.status === 'open').length); return n })
  }, [alerts.length])

  const filtered = list.filter(a => {
    const q = search.toLowerCase()
    return (!q || (a.user||'').includes(q) || (a.file_name||'').toLowerCase().includes(q))
      && (!sev || a.severity === sev)
      && (!type || a.threat_type === type)
      && (!status || a.status === status)
  })

  const doAction = async (id, action) => {
    try {
      await alertAction(id, action)
      setList(prev => prev.map(a => a._id === id ? { ...a, status: action === 'block' ? 'blocked' : 'dismissed' } : a))
      showToast(action === 'block' ? 'amber' : 'gray', action === 'block' ? 'User blocked.' : 'Alert dismissed.')
    } catch { showToast('red', 'Action failed') }
  }

  const bulkDismiss = async () => {
    const open = filtered.filter(a => a.status === 'open')
    await Promise.allSettled(open.map(a => alertAction(a._id, 'dismiss')))
    setList(prev => prev.map(a => a.status === 'open' ? { ...a, status: 'dismissed' } : a))
    showToast('gray', `${open.length} alerts dismissed.`)
  }

  const bd = stats?.threat_breakdown || {}
  const pieData = {
    labels: THREATS,
    datasets: [{ data: THREATS.map(t => bd[t] || 1), backgroundColor: ['rgba(255,41,82,.7)','rgba(255,176,32,.7)','rgba(255,176,32,.4)','rgba(167,139,250,.7)','rgba(0,207,255,.6)'], borderColor: 'transparent', hoverOffset: 8 }]
  }
  const lineChartData = {
    labels: lineData.map((_, i) => i),
    datasets: [{ label: 'Anomalies', data: lineData, borderColor: 'rgba(255,41,82,.8)', backgroundColor: 'rgba(255,41,82,.06)', borderWidth: 1.5, pointRadius: 0, tension: .4, fill: true }]
  }
  const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0C1220', borderColor: 'rgba(255,255,255,.08)', borderWidth: 1 } } }

  const sevClass = s => s === 'CRITICAL' ? 'sev-crit' : s === 'HIGH' ? 'sev-high' : 'sev-med'

  return (
    <div className="page active" id="page-threats">
      <div className="content">
        <div className="g4">
          {[
            { lbl: 'Total Alerts', val: list.length, c: 'c-red' },
            { lbl: 'Blocked', val: list.filter(a => a.status === 'blocked').length, c: 'c-amber' },
            { lbl: 'Dismissed', val: list.filter(a => a.status === 'dismissed').length, c: 'c-green' },
            { lbl: 'Open', val: list.filter(a => a.status === 'open').length, c: 'c-purple' },
          ].map(({ lbl, val, c }) => (
            <div key={lbl} className={`kpi ${c}`}>
              <div className="kpi-lbl">{lbl}</div>
              <div className="kpi-val">{val}</div>
            </div>
          ))}
        </div>

        <div className="g2">
          <div className="panel">
            <div className="ph"><span className="ph-title">Threat Distribution</span><span className="badge b-gray">Today</span></div>
            <div className="chart-box"><Doughnut data={pieData} options={{ ...opts, cutout: '62%', plugins: { ...opts.plugins, legend: { position: 'right', labels: { color: '#4E6080', font: { size: 9 }, boxWidth: 10, padding: 12 } } } }} /></div>
          </div>
          <div className="panel">
            <div className="ph"><span className="ph-title">Alerts Over Time</span><span className="badge b-live">Live</span></div>
            <div className="chart-box"><Line data={lineChartData} options={{ ...opts, scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#2A3850' }, beginAtZero: true } } }} /></div>
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <span className="ph-title">Alert Management</span>
            <div className="ph-right">
              <button className="filt-btn" onClick={bulkDismiss}>Bulk Dismiss</button>
              <button className="filt-btn active" onClick={() => exportCSV(filtered)}>Export CSV</button>
            </div>
          </div>
          <div className="filter-row">
            <input className="filt-input" placeholder="Search user, file..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filt-sel" value={sev} onChange={e => setSev(e.target.value)}>
              <option value="">All severity</option>
              {['CRITICAL','HIGH','MEDIUM'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="filt-sel" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All types</option>
              {THREATS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="filt-sel" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All status</option>
              {['open','blocked','dismissed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Time</th><th>User</th><th>File / Action</th><th>Threat Type</th><th>Severity</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--t2)', padding: 24, fontFamily: 'var(--fm)', fontSize: 10 }}>No matching alerts</td></tr>
                  : filtered.map(a => (
                    <tr key={a._id} className={a.status === 'blocked' ? 'blocked' : ''}>
                      <td className="mono">{a.timestamp?.slice(11,19)}</td>
                      <td style={{ color: 'var(--cyan)' }} className="mono">{a.user}</td>
                      <td className="mono">{a.file_name}</td>
                      <td><span className="badge b-gray">{a.threat_type}</span></td>
                      <td className={`${sevClass(a.severity)} mono`}>{a.severity || '—'}</td>
                      <td><span className={`badge ${a.status==='blocked'?'b-amber':a.status==='dismissed'?'b-gray':'b-red'}`}>{(a.status||'open').toUpperCase()}</span></td>
                      <td style={{ display: 'flex', gap: 4 }}>
                        {a.status === 'open' && <>
                          <button className="btn-sm btn-block" style={{ padding: '3px 8px', fontSize: 7 }} onClick={() => doAction(a._id, 'block')}>BLOCK</button>
                          <button className="btn-sm btn-dismiss" style={{ padding: '3px 8px', fontSize: 7 }} onClick={() => doAction(a._id, 'dismiss')}>DISMISS</button>
                        </>}
                        <button className="btn-sm btn-report" style={{ padding: '3px 8px', fontSize: 7 }}>REPORT</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
