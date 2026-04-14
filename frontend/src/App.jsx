import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

// ── Icons (inline SVGs) ────────────────────────────────────────────────────────
const Icon = {
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Database: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Cpu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Wifi: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`toast ${type}`} onClick={onClose}>
      {type === 'success' && <Icon.CheckCircle />}
      {type === 'error' && <Icon.AlertTriangle />}
      {type === 'info' && <Icon.Activity />}
      <span>{msg}</span>
    </div>
  )
}

// ── Timeline chart ─────────────────────────────────────────────────────────────
function TimelineChart({ timeline }) {
  if (!timeline?.length) return <div className="empty-state"><p>No timeline data</p></div>
  const max = Math.max(...timeline.map(t => t.count), 1)
  const afterHours = h => h < 7 || h > 20
  return (
    <div className="timeline-bars">
      {timeline.map(({ hour, count }) => (
        <div key={hour} className="timeline-bar-wrap" title={`${hour}:00 — ${count} events`}>
          <div
            className={`timeline-bar ${afterHours(hour) && count > 0 ? 'danger' : ''}`}
            style={{ height: `${Math.max((count / max) * 90, count > 0 ? 4 : 2)}px` }}
          />
          <span className="timeline-label">{hour}</span>
        </div>
      ))}
    </div>
  )
}

// ── Score bars ─────────────────────────────────────────────────────────────────
function ScoreBars({ scores }) {
  if (!scores?.length) return <div className="empty-state"><p>No score data</p></div>
  // Group by user and take min (most anomalous)
  const userMap = {}
  scores.forEach(({ user, anomaly_score, confirmed }) => {
    if (!userMap[user] || anomaly_score < userMap[user].score)
      userMap[user] = { user, score: anomaly_score, confirmed }
  })
  const sorted = Object.values(userMap).sort((a, b) => a.score - b.score).slice(0, 10)
  const minSc = Math.min(...sorted.map(s => s.score))
  const maxSc = Math.max(...sorted.map(s => s.score), 0)
  const range = maxSc - minSc || 1
  return (
    <div>
      {sorted.map(({ user, score, confirmed }) => (
        <div key={user} className="score-bar-row">
          <span className="score-bar-label" title={user}>{user}</span>
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width: `${((score - minSc) / range) * 100}%` }} />
          </div>
          <span className="score-bar-val">{score.toFixed(3)}</span>
          {confirmed && <span className="badge badge-danger" style={{ fontSize: '.6rem', padding: '1px 5px' }}>THREAT</span>}
        </div>
      ))}
    </div>
  )
}

// ── Users table ────────────────────────────────────────────────────────────────
function UsersTable({ users }) {
  if (!users?.length) return (
    <div className="empty-state">
      <Icon.Users />
      <h3>No confirmed threats</h3>
      <p>Run the pipeline on a dataset to see results</p>
    </div>
  )
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Windows</th>
            <th>Score</th>
            <th>After-Hours</th>
            <th>USB</th>
            <th>Files</th>
            <th>Emails</th>
            <th>HTTP</th>
            <th>Rules Fired</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.user}>
              <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{u.user}</td>
              <td><span className="badge badge-danger">{u.threat_windows}</span></td>
              <td style={{ color: 'var(--danger)', fontFamily: 'monospace' }}>{u.min_anomaly_score.toFixed(4)}</td>
              <td>{u.after_hours_hits}</td>
              <td>{u.usb_events}</td>
              <td>{u.file_ops.toLocaleString()}</td>
              <td>{u.emails_sent.toLocaleString()}</td>
              <td>{u.http_requests.toLocaleString()}</td>
              <td>
                <div className="rules-list">
                  {u.active_rules?.map(r => (
                    <span key={r} className="rule-tag">{r.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Datasets page ──────────────────────────────────────────────────────────────
function DatasetsPage({ datasets, selected, onSelect, onRun, running, summary }) {
  return (
    <div className="page-content">
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">Select Dataset</span>
          <button
            className="btn btn-primary"
            onClick={() => onRun(selected)}
            disabled={running || !selected}
          >
            {running ? <div className="spinner" /> : <Icon.Play />}
            {running ? 'Running Pipeline…' : 'Run Pipeline'}
          </button>
        </div>
        <div className="section-body">
          <div className="dataset-grid">
            {datasets.map(ds => (
              <div
                key={ds.id}
                className={`dataset-card ${selected === ds.id ? 'selected' : ''} ${!ds.available ? 'unavailable' : ''}`}
                onClick={() => ds.available && onSelect(ds.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="dataset-name">{ds.name}</span>
                  <div className={`status-dot ${ds.available ? 'green' : 'red'}`} />
                </div>
                <span className="dataset-desc">{ds.description}</span>
                <span className={`badge dataset-type ${ds.type === 'real' ? 'badge-info' : 'badge-warning'}`}>
                  {ds.type === 'real' ? 'Real CERT Data' : 'Synthetic'}
                </span>
                {!ds.available && (
                  <p style={{ fontSize: '.7rem', color: 'var(--danger)', marginTop: 6 }}>
                    ⚠ Directory not found — data unavailable
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className="kpi-grid">
          <div className="kpi-card blue">
            <span className="kpi-label">Feature Rows</span>
            <span className="kpi-value">{summary.total.toLocaleString()}</span>
            <span className="kpi-sub">User × hour records</span>
            <div className="kpi-icon"><Icon.Database /></div>
          </div>
          <div className="kpi-card red">
            <span className="kpi-label">Anomalies Detected</span>
            <span className="kpi-value" style={{ color: 'var(--danger)' }}>{summary.anomalies.toLocaleString()}</span>
            <span className="kpi-sub">{summary.anomaly_rate_pct}% anomaly rate</span>
            <div className="kpi-icon"><Icon.AlertTriangle /></div>
          </div>
          <div className="kpi-card purple">
            <span className="kpi-label">Confirmed Threats</span>
            <span className="kpi-value" style={{ color: 'var(--accent2)' }}>{summary.confirmed.toLocaleString()}</span>
            <span className="kpi-sub">{summary.confirmation_rate_pct}% confirmation rate</span>
            <div className="kpi-icon"><Icon.Shield /></div>
          </div>
          <div className="kpi-card green">
            <span className="kpi-label">Dataset</span>
            <span className="kpi-value" style={{ fontSize: '1rem', lineHeight: 1.4, paddingTop: 4 }}>{summary.dataset}</span>
            <span className="kpi-sub">Last run: {new Date(summary.run_at).toLocaleTimeString()}</span>
            <div className="kpi-icon"><Icon.CheckCircle /></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dashboard overview ─────────────────────────────────────────────────────────
function DashboardPage({ summary, users, timeline, scores, onGoRun }) {
  if (!summary) {
    return (
      <div className="page-content">
        <div className="empty-state" style={{ flex: 1 }}>
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <h3>No pipeline results yet</h3>
          <p>Go to the Datasets page and run the pipeline to analyse insider threats.</p>
          <button className="btn btn-primary" onClick={onGoRun}>
            <Icon.Play /> Run Pipeline
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="page-content">
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <span className="kpi-label">Total Records</span>
          <span className="kpi-value">{summary.total.toLocaleString()}</span>
          <span className="kpi-sub">Feature rows analysed</span>
          <div className="kpi-icon"><Icon.Database /></div>
        </div>
        <div className="kpi-card red">
          <span className="kpi-label">Anomalies</span>
          <span className="kpi-value" style={{ color: 'var(--danger)' }}>{summary.anomalies.toLocaleString()}</span>
          <span className="kpi-sub">{summary.anomaly_rate_pct}% of total</span>
          <div className="kpi-icon"><Icon.AlertTriangle /></div>
        </div>
        <div className="kpi-card purple">
          <span className="kpi-label">Confirmed Threats</span>
          <span className="kpi-value" style={{ color: 'var(--accent2)' }}>{summary.confirmed.toLocaleString()}</span>
          <span className="kpi-sub">{summary.confirmation_rate_pct}% rule confirmation</span>
          <div className="kpi-icon"><Icon.Shield /></div>
        </div>
        <div className="kpi-card green">
          <span className="kpi-label">Unique Users at Risk</span>
          <span className="kpi-value" style={{ color: 'var(--success)' }}>{users.length}</span>
          <span className="kpi-sub">Across {summary.dataset}</span>
          <div className="kpi-icon"><Icon.Users /></div>
        </div>
      </div>

      <div className="two-col">
        <div className="section-card">
          <div className="section-header">
            <span className="section-title">Threat Activity by Hour</span>
            <span className="badge badge-info">24h</span>
          </div>
          <div className="section-body">
            <TimelineChart timeline={timeline} />
          </div>
        </div>
        <div className="section-card">
          <div className="section-header">
            <span className="section-title">Anomaly Scores (Top Users)</span>
            <span className="badge badge-danger">Ranked</span>
          </div>
          <div className="section-body">
            <ScoreBars scores={scores} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Threats page ───────────────────────────────────────────────────────────────
function ThreatsPage({ users }) {
  return (
    <div className="page-content">
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">Confirmed Insider Threats</span>
          <span className="badge badge-danger">{users.length} users</span>
        </div>
        <div className="section-body">
          <UsersTable users={users} />
        </div>
      </div>
    </div>
  )
}

// ── Model info page ────────────────────────────────────────────────────────────
function ModelPage({ modelInfo }) {
  if (!modelInfo) return (
    <div className="page-content">
      <div className="section-card">
        <div className="section-body">
          <div className="empty-state">
            <Icon.Cpu />
            <h3>Model not loaded</h3>
            <p>Train the model first by running the pipeline</p>
          </div>
        </div>
      </div>
    </div>
  )
  const rows = [
    ['Type', modelInfo.type],
    ['Estimators', modelInfo.n_estimators],
    ['Contamination', modelInfo.contamination],
    ['Max Samples', modelInfo.max_samples],
    ['Features', modelInfo.n_features],
    ['Path', modelInfo.model_path],
    ['Trained', modelInfo.trained ? 'Yes' : 'No'],
  ]
  return (
    <div className="page-content">
      <div className="section-card" style={{ maxWidth: 540 }}>
        <div className="section-header">
          <span className="section-title">Model Information</span>
          <span className="badge badge-success">Loaded</span>
        </div>
        <div className="section-body">
          <table>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: 'var(--text-muted)', width: 150 }}>{k}</td>
                  <td style={{ fontWeight: 600 }}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('dashboard')
  const [apiOk, setApiOk] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [selected, setSelected] = useState('exfiltration')
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState(null)
  const [users, setUsers] = useState([])
  const [timeline, setTimeline] = useState([])
  const [scores, setScores] = useState([])
  const [modelInfo, setModelInfo] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'info') => setToast({ msg, type })

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/api/health`)
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false))

    axios.get(`${API}/api/datasets`)
      .then(r => {
        setDatasets(r.data.datasets)
        const first = r.data.datasets.find(d => d.available)
        if (first) setSelected(first.id)
      })
      .catch(console.error)

    axios.get(`${API}/api/model/info`)
      .then(r => setModelInfo(r.data))
      .catch(() => {}) // model not present yet — ok

    refreshResults()
  }, [])

  const refreshResults = useCallback(async () => {
    try {
      const [sumR, usrR, tlR, scR] = await Promise.all([
        axios.get(`${API}/api/results/summary`),
        axios.get(`${API}/api/results/users`),
        axios.get(`${API}/api/results/timeline`),
        axios.get(`${API}/api/results/scores`),
      ])
      setSummary(sumR.data)
      setUsers(usrR.data.users)
      setTimeline(tlR.data.timeline)
      setScores(scR.data.scores)
    } catch (_) {
      // no results yet — fine
    }
  }, [])

  const runPipeline = async (datasetId) => {
    setRunning(true)
    showToast('Running pipeline…', 'info')
    try {
      await axios.post(`${API}/api/pipeline/run`, { dataset_id: datasetId })
      showToast('Pipeline complete! Results updated.', 'success')
      await refreshResults()
      // refresh model info too
      axios.get(`${API}/api/model/info`).then(r => setModelInfo(r.data)).catch(() => {})
      setPage('dashboard')
    } catch (e) {
      showToast(e.response?.data?.detail || 'Pipeline failed', 'error')
    } finally {
      setRunning(false)
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icon.Activity /> },
    { id: 'datasets', label: 'Datasets & Run', icon: <Icon.Database /> },
    { id: 'threats', label: 'Threat Actors', icon: <Icon.AlertTriangle /> },
    { id: 'model', label: 'Model Info', icon: <Icon.Cpu /> },
  ]

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>SENTINEL</h1>
          <p>Insider Threat Command Center</p>
        </div>
        {navItems.map(n => (
          <div
            key={n.id}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => setPage(n.id)}
          >
            {n.icon} {n.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.75rem' }}>
            <div className={`status-dot ${apiOk === true ? 'green' : apiOk === false ? 'red' : 'yellow'}`} />
            <span style={{ color: 'var(--text-muted)' }}>
              API: {apiOk === true ? 'Connected' : apiOk === false ? 'Offline' : 'Checking…'}
            </span>
          </div>
          <div style={{ marginTop: 6, fontSize: '.7rem', color: 'var(--text-muted)' }}>
            {modelInfo ? `IsoForest · ${modelInfo.n_estimators} trees` : 'Model: not loaded'}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">
            {navItems.find(n => n.id === page)?.label}
          </span>
          <div className="topbar-actions">
            {summary && (
              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                Last run: {new Date(summary.run_at).toLocaleString()}
              </span>
            )}
            <button className="btn btn-outline" onClick={refreshResults} title="Refresh">
              <Icon.Refresh />
            </button>
          </div>
        </header>

        {page === 'dashboard' && (
          <DashboardPage
            summary={summary}
            users={users}
            timeline={timeline}
            scores={scores}
            onGoRun={() => setPage('datasets')}
          />
        )}
        {page === 'datasets' && (
          <DatasetsPage
            datasets={datasets}
            selected={selected}
            onSelect={setSelected}
            onRun={runPipeline}
            running={running}
            summary={summary}
          />
        )}
        {page === 'threats' && <ThreatsPage users={users} />}
        {page === 'model' && <ModelPage modelInfo={modelInfo} />}
      </div>

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
