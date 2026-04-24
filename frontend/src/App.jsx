import { useState, useCallback } from 'react'
import './index.css'
import { getLogs, getAlerts, getStats, getDevices, getUserRisk, getSettings, getWatchPaths } from './api'
import { usePolling } from './hooks/usePolling'
import { Toast } from './components/Toast'
import Dashboard from './pages/Dashboard'
import Threats   from './pages/Threats'
import Users     from './pages/Users'
import Devices   from './pages/Devices'
import Reports   from './pages/Reports'
import Settings  from './pages/Settings'

const PAGE_TITLES = {
  dashboard: '/ DASHBOARD OVERVIEW',
  threats:   '/ THREAT CENTER',
  users:     '/ USER ANALYTICS',
  devices:   '/ DEVICE MANAGEMENT',
  reports:   '/ REPORTS & ANALYTICS',
  settings:  '/ SETTINGS',
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  )},
  { id: 'threats', label: 'Threat Center', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  )},
  { id: 'users', label: 'Users', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
  )},
  { id: 'devices', label: 'Devices', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
  )},
  { sep: true },
  { id: 'reports', label: 'Reports', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  )},
  { id: 'settings', label: 'Settings', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
  )},
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [clock, setClock] = useState(new Date().toTimeString().slice(0,8))
  const [toast, setToast] = useState(null)

  // Data state
  const [logs,      setLogs]      = useState([])
  const [alerts,    setAlerts]    = useState([])
  const [stats,     setStats]     = useState(null)
  const [devices,   setDevices]   = useState([])
  const [userRisk,  setUserRisk]  = useState([])
  const [settings,  setSettings]  = useState({})
  const [watchPaths,setWatchPaths]= useState([])

  // Clock tick
  useState(() => { const id = setInterval(() => setClock(new Date().toTimeString().slice(0,8)), 1000); return () => clearInterval(id) })

  const showToast = (color, msg) => {
    setToast({ color, msg, show: true })
    setTimeout(() => setToast(t => t ? { ...t, show: false } : t), 3500)
  }

  const fetchAll = useCallback(async () => {
    try {
      const [l, a, s, d, u] = await Promise.allSettled([getLogs(), getAlerts(), getStats(), getDevices(), getUserRisk()])
      if (l.status === 'fulfilled') setLogs(l.value)
      if (a.status === 'fulfilled') setAlerts(a.value)
      if (s.status === 'fulfilled') setStats(s.value)
      if (d.status === 'fulfilled') setDevices(d.value)
      if (u.status === 'fulfilled') setUserRisk(u.value)
    } catch {}
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const [s, w] = await Promise.allSettled([getSettings(), getWatchPaths()])
      if (s.status === 'fulfilled') setSettings(s.value)
      if (w.status === 'fulfilled') setWatchPaths(w.value.paths || [])
    } catch {}
  }, [])

  usePolling(fetchAll, 3000)
  usePolling(fetchConfig, 10000)

  const activeAlerts = alerts.filter(a => a.status === 'open').length

  const showPage = (id) => setPage(id)

  const pageProps = { logs, alerts, stats, devices, userRisk, settings, setSettings, watchPaths, setWatchPaths, showToast }

  return (
    <>
      <div id="overlay-flash" />
      <Toast toast={toast} />
      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar" id="sidebar">
          <div className="logo-area">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" style={{ flexShrink:0 }}>
              <path d="M16 2L3 7.5V16c0 7.18 5.6 13.4 13 14.5 7.4-1.1 13-7.32 13-14.5V7.5L16 2z" stroke="#00CFFF" strokeWidth="1.5" fill="rgba(0,207,255,0.08)"/>
              <path d="M11 16.5l3 3 7-7" stroke="#00CFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="logo-text">SENTINEL</span>
          </div>
          <div className="nav-group">
            {NAV.map((n, i) => n.sep
              ? <div key={i} className="nav-sep" />
              : (
                <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => showPage(n.id)} title={n.label}>
                  {n.icon}
                  <span className="nav-label">{n.label}</span>
                </div>
              )
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <header className="topbar">
            <div id="page-title" className="page-title">{PAGE_TITLES[page]}</div>
            <div className="topbar-right">
              <div className="chip">PC_001 · 8001</div>
              <div id="clock">{clock}</div>
              <button className="notif-btn" onClick={() => showPage('threats')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                {activeAlerts > 0 && <div className="notif-dot" />}
              </button>
              <div className="status-pill"><div className="pulse-dot" />LIVE</div>
            </div>
          </header>

          {page === 'dashboard' && <Dashboard {...pageProps} />}
          {page === 'threats'   && <Threats   {...pageProps} />}
          {page === 'users'     && <Users     {...pageProps} />}
          {page === 'devices'   && <Devices   {...pageProps} />}
          {page === 'reports'   && <Reports   {...pageProps} />}
          {page === 'settings'  && <Settings  {...pageProps} />}
        </main>
      </div>
    </>
  )
}
