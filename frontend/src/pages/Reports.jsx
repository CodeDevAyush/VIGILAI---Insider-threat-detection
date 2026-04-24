import { Bar, Line } from 'react-chartjs-2'
import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend } from 'chart.js'

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend)

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const opts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#4E6080', font:{ size:9, family:"'JetBrains Mono'" }, boxWidth:10 } }, tooltip:{ backgroundColor:'#0C1220', borderColor:'rgba(255,255,255,.08)', borderWidth:1 } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,.03)' }, ticks:{ color:'#2A3850' } }, y:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#2A3850' }, beginAtZero:false } } }

const perfData = {
  labels: DAYS,
  datasets: [
    { label:'Detection Rate', data:[91,93,92,95,94,96,94.8], borderColor:'rgba(0,207,255,.7)', backgroundColor:'rgba(0,207,255,.05)', borderWidth:1.5, pointRadius:3, tension:.4, fill:true },
    { label:'False Positive', data:[5.2,4.8,5.1,4.4,4.2,4.0,4.2], borderColor:'rgba(255,176,32,.6)', backgroundColor:'rgba(255,176,32,.04)', borderWidth:1.5, pointRadius:3, tension:.4, fill:true },
  ]
}

const bins = Array.from({ length:20 }, (_,i) => (-1+i*0.1).toFixed(1))
const distData = {
  labels: bins,
  datasets: [{ label:'Scores', data:[2,3,5,8,15,28,45,62,80,95,88,70,55,38,22,14,8,4,2,1], backgroundColor: bins.map(b => parseFloat(b) < -0.5 ? 'rgba(255,41,82,.5)' : 'rgba(0,207,255,.2)'), borderColor:'transparent', borderRadius:2 }]
}

function downloadJSON(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
  const link = document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=name; link.click()
}

export default function Reports({ alerts, stats, showToast }) {
  const reports = alerts.filter(a => a.status === 'blocked')
  const repCount = reports.length
  const openExports = [
    { key:'alerts',   label:'ALERTS LOG',    desc:'All detected threats as CSV' },
    { key:'blocked',  label:'BLOCKED USERS', desc:'All blocked users + reasons' },
    { key:'model',    label:'MODEL METRICS', desc:'Precision, recall, F1 report' },
  ]

  const doExport = (key) => {
    const data = {
      alerts: alerts,
      blocked: alerts.filter(a => a.status === 'blocked'),
      model: stats?.model || {},
    }
    downloadJSON(data[key] || [], `sentinel_${key}.json`)
    showToast('cyan', `${key.toUpperCase()} exported successfully.`)
  }

  return (
    <div className="page active" id="page-reports">
      <div className="content">
        <div className="g3">
          <div className="kpi c-cyan"><div className="kpi-lbl">Incidents Logged</div><div className="kpi-val">{repCount}</div><div className="kpi-sub">Blocked threats</div></div>
          <div className="kpi c-green"><div className="kpi-lbl">Total Alerts</div><div className="kpi-val">{alerts.length}</div><div className="kpi-sub">All time</div></div>
          <div className="kpi c-amber"><div className="kpi-lbl">Dismissed</div><div className="kpi-val">{alerts.filter(a=>a.status==='dismissed').length}</div><div className="kpi-sub">False positives</div></div>
        </div>

        <div className="g2">
          <div className="panel">
            <div className="ph"><span className="ph-title">Detection Performance</span><span className="badge b-gray">7-Day</span></div>
            <div className="chart-box"><Line data={perfData} options={{ ...opts, scales:{ ...opts.scales, y:{ ...opts.scales.y, ticks:{ ...opts.scales.y.ticks, callback: v => v+'%' } } } }} /></div>
          </div>
          <div className="panel">
            <div className="ph"><span className="ph-title">Anomaly Score Distribution</span><span className="badge b-purple">ML Model</span></div>
            <div className="chart-box"><Bar data={distData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ callbacks:{ title: t => 'Score: '+t[0].label } } }, scales:{ x:{ grid:{color:'rgba(255,255,255,.03)'}, ticks:{color:'#2A3850', maxTicksLimit:8} }, y:{ grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'#2A3850'}, beginAtZero:true } } }} /></div>
          </div>
        </div>

        <div className="panel">
          <div className="ph"><span className="ph-title">Incident Reports</span><div className="ph-right"><button className="filt-btn active" onClick={() => doExport('alerts')}>Export All</button></div></div>
          <div className="pb" style={{ paddingTop:10 }}>
            {reports.length === 0
              ? <div className="no-data">No incidents confirmed yet<small>Reports are generated when threats are blocked</small></div>
              : [...reports].reverse().map(r => (
                <div key={r._id} className="rep-card">
                  <div className="rc-hd">
                    <div><div className="rc-id">{r._id?.slice(-6)}</div><div className="rc-title">{r.threat_type}</div></div>
                    <span className={`badge ${r.severity==='CRITICAL'?'b-red':r.severity==='HIGH'?'b-amber':'b-purple'}`}>{r.severity||'—'}</span>
                  </div>
                  <div className="rc-meta">
                    <span>User: {r.user}</span><span>File: {r.file_name}</span><span>Time: {r.timestamp?.slice(11,19)}</span>
                  </div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t2)', marginBottom:10, borderLeft:'2px solid var(--b2)', paddingLeft:8 }}>{r.reason || '—'}</div>
                  <div className="rc-actions"><button className="btn-sm btn-report" style={{ padding:'5px 14px', fontSize:8, maxWidth:140 }} onClick={() => { downloadJSON(r,`report_${r._id}.json`); showToast('cyan','Report downloaded.') }}>DOWNLOAD</button></div>
                </div>
              ))}
          </div>
        </div>

        <div className="panel">
          <div className="ph"><span className="ph-title">Export Center</span><span className="badge b-gray">Download</span></div>
          <div className="pb">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
              {openExports.map(({ key, label, desc }) => (
                <button key={key} className="filt-btn" style={{ padding:14, textAlign:'left', height:'auto' }} onClick={() => doExport(key)}>
                  <div style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--cyan)', marginBottom:4 }}>{label}</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t2)' }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
