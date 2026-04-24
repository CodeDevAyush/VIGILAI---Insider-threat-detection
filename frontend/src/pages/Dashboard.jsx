import { useState, useEffect, useCallback } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Filler, Tooltip, Legend } from 'chart.js'
import { alertAction } from '../api'

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Filler, Tooltip, Legend)

const CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0C1220', borderColor: 'rgba(255,255,255,.08)', borderWidth: 1 } },
}

export default function Dashboard({ stats, logs, alerts, showToast }) {
  const [alertList, setAlertList] = useState(alerts)
  const [alertPlaceholder, setAlertPlaceholder] = useState(true)

  useEffect(() => {
    setAlertList(alerts)
    if (alerts.length > 0) setAlertPlaceholder(false)
  }, [alerts])

  const score = Math.min(98, Math.round(8 + (stats?.active_threats || 0) * 18 - (stats?.blocked_count || 0) * 3))

  const handleAction = async (id, action) => {
    try {
      await alertAction(id, action)
      showToast(action === 'block' ? 'amber' : 'gray',
        action === 'block' ? 'User blocked. Incident logged.' : `Alert ${id} dismissed.`)
    } catch { showToast('red', 'Action failed') }
  }

  // Timeline chart data
  const timeline = stats?.timeline
  const timelineData = timeline ? {
    labels: timeline.labels,
    datasets: [
      { label: 'Normal', data: timeline.normal, backgroundColor: 'rgba(0,207,255,.1)', borderColor: 'rgba(0,207,255,.35)', borderWidth: 1, borderRadius: 3 },
      { label: 'Anomaly', data: timeline.anomaly, backgroundColor: 'rgba(255,41,82,.18)', borderColor: 'rgba(255,41,82,.5)', borderWidth: 1, borderRadius: 3 },
    ]
  } : null

  const sevColor = s => s === 'CRITICAL' ? 'var(--red)' : s === 'HIGH' ? 'var(--amber)' : 'var(--purple)'
  const statusBg  = s => s === 'open' ? 'rgba(255,41,82,.1)' : s === 'blocked' ? 'rgba(255,176,32,.1)' : 'var(--s3)'

  return (
    <div className="page active" id="page-dashboard">
      <div className="content">
        {/* KPIs */}
        <div className="g4">
          <div className="kpi c-cyan" style={{ animationDelay: '.05s' }}>
            <div className="kpi-lbl">Events Today</div>
            <div className="kpi-val">{(stats?.events_today ?? 0).toLocaleString()}</div>
            <div className="kpi-sub">Live monitoring</div>
            <div className="kpi-bg">⚡</div>
          </div>
          <div className="kpi c-red" style={{ animationDelay: '.1s' }}>
            <div className="kpi-lbl">Active Threats</div>
            <div className="kpi-val">{stats?.active_threats ?? 0}</div>
            <div className="kpi-sub">Unresolved alerts</div>
            <div className="kpi-bg">⚠</div>
          </div>
          <div className="kpi c-amber" style={{ animationDelay: '.15s' }}>
            <div className="kpi-lbl">Actions Blocked</div>
            <div className="kpi-val">{stats?.blocked_count ?? 0}</div>
            <div className="kpi-sub">Access revoked</div>
            <div className="kpi-bg">🛡</div>
          </div>
          <div className="kpi c-green" style={{ animationDelay: '.2s' }}>
            <div className="kpi-lbl">Detection Rate</div>
            <div className="kpi-val">{stats?.model?.precision ?? '—'}%</div>
            <div className="kpi-sub">Model precision</div>
            <div className="kpi-bg">✓</div>
          </div>
        </div>

        {/* Gauge + Pipeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: 12 }}>
          {/* Gauge */}
          <GaugePanel score={score} />

          {/* Pipeline */}
          <div className="panel" style={{ animationDelay: '.3s' }}>
            <div className="ph"><span className="ph-title">Agent Pipeline</span><span className="badge b-live">5/5 ACTIVE</span></div>
            <div className="pipe-row">
              {[
                { label: 'Endpoint', icon: '🖥', color: 'var(--cyan)', state: 'on' },
                { label: 'Trigger',  icon: '⚡', color: 'var(--cyan)', state: 'on' },
                { label: 'Detection',icon: '🔍', color: 'var(--cyan)', state: 'on' },
                { label: 'Verify',   icon: '🛡', color: 'var(--cyan)', state: 'on' },
                { label: 'Response', icon: '🚫', color: 'var(--red)',  state: 'armed' },
              ].map((ag, i, arr) => (
                <span key={ag.label} style={{ display: 'contents' }}>
                  <div className="agent">
                    <div className={`ag-box ${ag.state}`} style={{ fontSize: 18 }}>{ag.icon}</div>
                    <div className="ag-name">{ag.label}</div>
                    <div className="ag-s" style={{ color: ag.color }}>{ag.state === 'armed' ? 'ARMED' : 'ACTIVE'}</div>
                  </div>
                  {i < arr.length - 1 && <div className="pipe-conn"><div className="dot" style={{ animationDelay: `${i * 0.35}s` }} /><div className="dot" style={{ animationDelay: `${i * 0.35 + 0.7}s` }} /></div>}
                </span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, margin: '0 20px 18px', paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
              {[
                { v: `${logs.length}`, k: 'events/min' },
                { v: '99.2%', k: 'uptime' },
                { v: '142ms', k: 'avg latency' },
                { v: (stats?.events_today ?? 0).toLocaleString(), k: 'scored today' },
                { v: '4.2%', k: 'false pos.' },
              ].map(({ v, k }) => (
                <div key={k} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 15, fontWeight: 700, color: 'var(--cyan)' }}>{v}</div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 7, color: 'var(--t2)' }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feed + Alerts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 12 }}>
          {/* Live Feed */}
          <div className="panel" style={{ animationDelay: '.35s' }}>
            <div className="ph">
              <span className="ph-title">Live Event Stream</span>
              <div className="ph-right">
                <span className="badge b-gray">{logs.length}</span>
                <span className="badge b-live">● STREAMING</span>
              </div>
            </div>
            <div className="feed-header">
              {['Time', 'User', 'Activity', 'Size', 'Status'].map(h => <span key={h} className="fh">{h}</span>)}
            </div>
            <div className="feed-wrap" id="feed-wrap">
              {logs.slice(0, 30).map(log => {
                const st = log.status === 'suspicious' ? 'bad' : log.status === 'pending' ? 'warn' : 'ok'
                const tc = st === 'ok' ? 't-ok' : st === 'warn' ? 't-warn' : 't-bad'
                const tl = st === 'ok' ? 'NORMAL' : st === 'warn' ? 'PENDING' : 'THREAT'
                const sz = log.file_size ? `${(log.file_size / 1024 / 1024).toFixed(1)}MB` : '—'
                return (
                  <div key={log._id} className="fe">
                    <span className="fe-t">{log.timestamp?.slice(11, 19) || '—'}</span>
                    <span className="fe-u">{log.user}</span>
                    <span className="fe-a" title={log.event_type}>{log.event_type}</span>
                    <span className="fe-sz">{sz}</span>
                    <span className={`fe-tag ${tc}`}>{tl}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="panel" style={{ animationDelay: '.4s' }}>
            <div className="ph">
              <span className="ph-title">Critical Alerts</span>
              <span className="badge b-red">{alerts.filter(a => a.status === 'open').length} ACTIVE</span>
            </div>
            <div className="alerts-wrap">
              {alertList.length === 0
                ? <div className="no-data">No active alerts<small>Pipeline is monitoring...</small></div>
                : alertList.slice(0, 8).map(a => (
                    <div key={a._id} className={`ac ${a.severity === 'HIGH' ? 'sev-h' : a.severity === 'MEDIUM' ? 'sev-m' : ''}`}>
                      <div className="ac-hd">
                        <span className="ac-sev">● {a.severity || 'CRITICAL'}</span>
                        <span className="ac-t">{a.timestamp?.slice(11, 19)}</span>
                      </div>
                      <div className="ac-user">{a.user}</div>
                      <div className="ac-info">{a.file_name}</div>
                      <div className="ac-reason">{a.reason || a.threat_type}</div>
                      <div className="ac-btns">
                        {a.status === 'open' && <>
                          <button className="btn-sm btn-block" onClick={() => handleAction(a._id, 'block')}>BLOCK</button>
                          <button className="btn-sm btn-dismiss" onClick={() => handleAction(a._id, 'dismiss')}>DISMISS</button>
                        </>}
                        <button className="btn-sm btn-report" onClick={() => handleAction(a._id, 'report')}>REPORT</button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="panel" style={{ animationDelay: '.45s' }}>
          <div className="ph">
            <span className="ph-title">Activity Timeline — 12h</span>
            <div className="ph-right">
              <span style={{ fontFamily: 'var(--fm)', fontSize: 8, color: 'var(--cyan)' }}>■ Normal</span>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 8, color: 'var(--red)' }}>■ Anomaly</span>
            </div>
          </div>
          <div className="chart-box">
            {timelineData
              ? <Bar data={timelineData} options={{ ...CHART_DEFAULTS, scales: { x: { grid: { color: 'rgba(255,255,255,.03)' }, ticks: { color: '#2A3850' } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#2A3850' }, beginAtZero: true } } }} />
              : <div style={{ color: 'var(--t2)', padding: 20, textAlign: 'center', fontFamily: 'var(--fm)', fontSize: 10 }}>Waiting for data...</div>
            }
          </div>
        </div>

        {/* Bottom 3 */}
        <div className="g3">
          <ModelPerf model={stats?.model} />
          <ThreatBreakdown breakdown={stats?.threat_breakdown} />
          <TopRiskUsers alerts={alerts} />
        </div>
      </div>
    </div>
  )
}

function GaugePanel({ score }) {
  const circ = 428
  const offset = circ * (1 - score / 100)
  const color = score <= 30 ? 'var(--green)' : score <= 70 ? 'var(--amber)' : 'var(--red)'
  const grad = score <= 30 ? 'url(#grad-safe)' : score <= 70 ? 'url(#grad-mid)' : 'url(#grad-crit)'
  const label = score <= 30 ? 'SAFE' : score <= 70 ? 'ELEVATED' : 'CRITICAL'
  const status = score <= 30 ? '✓ All systems nominal' : score <= 70 ? '⚠ Elevated risk' : '● CRITICAL THREAT ACTIVE'
  const badgeBg = score <= 30 ? 'rgba(0,230,118,.1)' : score <= 70 ? 'rgba(255,176,32,.1)' : 'rgba(255,41,82,.1)'
  const badgeBd = score <= 30 ? 'rgba(0,230,118,.2)' : score <= 70 ? 'rgba(255,176,32,.2)' : 'rgba(255,41,82,.2)'
  return (
    <div className="panel" style={{ animationDelay: '.25s' }}>
      <div className="ph"><span className="ph-title">System Threat Level</span><span className="badge" style={{ background: badgeBg, color, border: `1px solid ${badgeBd}` }}>{label}</span></div>
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
          {[['0–30','var(--green)','Safe'],['31–70','var(--amber)','Elevated'],['71–100','var(--red)','Critical']].map(([v,c,k])=>(
            <div key={k} className="gs"><div className="gs-v" style={{ color: c }}>{v}</div><div className="gs-k">{k}</div></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ModelPerf({ model }) {
  const rows = model ? [
    ['Precision', `${model.precision}%`, 'var(--green)'],
    ['Recall', `${model.recall}%`, 'var(--green)'],
    ['F1 Score', model.f1, 'var(--cyan)'],
    ['Contamination', `${model.contamination * 100}%`, 'var(--t1)'],
    ['Version', model.version || 'IF v2.1', 'var(--t2)'],
  ] : []
  return (
    <div className="panel" style={{ animationDelay: '.5s' }}>
      <div className="ph"><span className="ph-title">Model Performance</span><span className="badge b-cyan">{model?.version || 'IF v2.1'}</span></div>
      <div className="pb" style={{ paddingBottom: 4 }}>
        {rows.map(([k, v, c]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--b1)' }}>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--t2)' }}>{k}</span>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 10, fontWeight: 700, color: c }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ThreatBreakdown({ breakdown }) {
  const TYPES = ['Mass exfiltration', 'USB exfiltration', 'Credential stuffing', 'After-hours access', 'Privilege abuse']
  const COLORS = ['var(--red)', 'var(--amber)', 'var(--amber)', 'var(--purple)', 'var(--cyan)']
  return (
    <div className="panel" style={{ animationDelay: '.55s' }}>
      <div className="ph"><span className="ph-title">Threat Breakdown</span><span className="badge b-amber">Today</span></div>
      <div className="pb" style={{ paddingBottom: 4 }}>
        {TYPES.map((t, i) => (
          <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < TYPES.length - 1 ? '1px solid var(--b1)' : 'none' }}>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--t2)' }}>{t}</span>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 10, fontWeight: 700, color: COLORS[i] }}>{breakdown?.[t] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopRiskUsers({ alerts }) {
  const users = {}
  alerts.forEach(a => { users[a.user] = (users[a.user] || 0) + (a.severity === 'CRITICAL' ? 30 : a.severity === 'HIGH' ? 20 : 10) })
  const sorted = Object.entries(users).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return (
    <div className="panel" style={{ animationDelay: '.6s' }}>
      <div className="ph"><span className="ph-title">Top Risk Users</span><span className="badge b-red">HIGH RISK</span></div>
      <div className="pb" style={{ paddingBottom: 4 }}>
        {sorted.length === 0
          ? <div className="no-data">No risk data<small>Alerts will populate this</small></div>
          : sorted.map(([user, score]) => {
              const pct = Math.min(score, 100)
              const c = pct > 70 ? 'var(--red)' : pct > 40 ? 'var(--amber)' : 'var(--green)'
              const rf = pct > 70 ? 'rf-red' : pct > 40 ? 'rf-amber' : 'rf-green'
              return (
                <div key={user} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--cyan)' }}>{user}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="risk-bar" style={{ width: 80 }}><div className={`risk-fill ${rf}`} style={{ width: `${pct}%` }} /></div>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: c }}>{pct}</span>
                  </div>
                </div>
              )
            })}
      </div>
    </div>
  )
}
