import { useState } from 'react'
import { saveSettings, addWatchPath, delWatchPath } from '../api'

export default function Settings({ settings, setSettings, watchPaths, setWatchPaths, showToast }) {
  const [wlInput, setWlInput] = useState('')

  const update = async (key, val) => {
    const next = { ...settings, [key]: val }
    setSettings(next)
    try { await saveSettings({ [key]: val }); showToast('cyan', 'Settings saved.') }
    catch { showToast('red', 'Save failed') }
  }

  const addWL = async () => {
    const v = wlInput.trim(); if (!v) return
    const wl = [...(settings.whitelist || []), v]
    setSettings(s => ({ ...s, whitelist: wl }))
    setWlInput('')
    try { await saveSettings({ whitelist: wl }); showToast('cyan', 'Whitelist path added.') }
    catch { showToast('red', 'Save failed') }
  }

  const removeWL = async (i) => {
    const wl = settings.whitelist.filter((_, idx) => idx !== i)
    setSettings(s => ({ ...s, whitelist: wl }))
    try { await saveSettings({ whitelist: wl }); showToast('gray', 'Whitelist entry removed.') }
    catch { showToast('red', 'Save failed') }
  }

  const handleAddPath = async () => {
    const v = wlInput.trim(); if (!v) return
    try { const res = await addWatchPath(v); setWatchPaths(res.paths); setWlInput(''); showToast('cyan', `Watch path added.`) }
    catch { showToast('red', 'Failed') }
  }

  return (
    <div className="page active" id="page-settings">
      <div className="content">
        <div className="g2">
          {/* Detection Settings */}
          <div className="panel">
            <div className="ph"><span className="ph-title">Detection Settings</span><span className="badge b-cyan">ML Config</span></div>
            <div className="pb">
              <div className="setting-row">
                <div className="sr-info">
                  <div className="sr-title">Sensitivity threshold</div>
                  <div className="sr-desc">Contamination parameter for Isolation Forest.</div>
                </div>
                <div className="sr-ctrl">
                  <div className="range-wrap">
                    <input type="range" min="1" max="20" value={Math.round((settings.sensitivity || 0.05)*100)}
                      onChange={e => update('sensitivity', e.target.value/100)} />
                    <span className="range-val">{(settings.sensitivity || 0.05).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="setting-row">
                <div className="sr-info">
                  <div className="sr-title">File size threshold</div>
                  <div className="sr-desc">Minimum file size (MB) to flag as potential exfiltration.</div>
                </div>
                <div className="sr-ctrl">
                  <div className="range-wrap">
                    <input type="range" min="10" max="1000" value={settings.file_size_threshold_mb || 100}
                      onChange={e => update('file_size_threshold_mb', parseInt(e.target.value))} />
                    <span className="range-val">{settings.file_size_threshold_mb || 100}MB</span>
                  </div>
                </div>
              </div>
              <div className="setting-row">
                <div className="sr-info">
                  <div className="sr-title">Failed login threshold</div>
                  <div className="sr-desc">Logins before triggering credential stuffing alert.</div>
                </div>
                <div className="sr-ctrl">
                  <div className="range-wrap">
                    <input type="range" min="3" max="30" value={settings.failed_login_threshold || 8}
                      onChange={e => update('failed_login_threshold', parseInt(e.target.value))} />
                    <span className="range-val">{settings.failed_login_threshold || 8}</span>
                  </div>
                </div>
              </div>
              <div className="setting-row" style={{ borderBottom:'none' }}>
                <div className="sr-info">
                  <div className="sr-title">Auto-block on critical</div>
                  <div className="sr-desc">Automatically block users when a critical threat is confirmed.</div>
                </div>
                <div className="sr-ctrl">
                  <label className="toggle">
                    <input type="checkbox" checked={!!settings.auto_block} onChange={e => update('auto_block', e.target.checked)} />
                    <div className="toggle-track" /><div className="toggle-thumb" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="panel">
            <div className="ph"><span className="ph-title">Notifications</span><span className="badge b-amber">Alerts</span></div>
            <div className="pb">
              {[
                { label:'Browser notifications', desc:'Show push notifications for critical threats.' },
                { label:'Alert sound', desc:'Play audio alert when a critical threat is detected.' },
                { label:'Screen flash on critical', desc:'Flash the screen red when a critical threat is detected.' },
              ].map(({ label, desc }) => (
                <div key={label} className="setting-row">
                  <div className="sr-info"><div className="sr-title">{label}</div><div className="sr-desc">{desc}</div></div>
                  <div className="sr-ctrl">
                    <label className="toggle">
                      <input type="checkbox" defaultChecked /><div className="toggle-track" /><div className="toggle-thumb" />
                    </label>
                  </div>
                </div>
              ))}
              <div className="setting-row" style={{ borderBottom:'none' }}>
                <div className="sr-info"><div className="sr-title">Min severity to notify</div><div className="sr-desc">Only notify at or above this level.</div></div>
                <div className="sr-ctrl"><select className="filt-sel"><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option></select></div>
              </div>
            </div>
          </div>
        </div>

        {/* Whitelist */}
        <div className="panel">
          <div className="ph"><span className="ph-title">Whitelist Manager</span><div className="ph-right"><span style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t2)' }}>Paths excluded from detection</span></div></div>
          <div className="pb">
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
              {(settings.whitelist || []).map((w, i) => (
                <span key={w} className="wl-tag">{w}<button className="wl-rm" onClick={() => removeWL(i)}>×</button></span>
              ))}
            </div>
            <div className="wl-add">
              <input className="wl-input" placeholder="Add path to whitelist e.g. /temp" value={wlInput} onChange={e => setWlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWL()} />
              <button className="btn-add" onClick={addWL}>ADD PATH</button>
            </div>
          </div>
        </div>

        {/* Pipeline Config */}
        <div className="panel">
          <div className="ph"><span className="ph-title">Pipeline Config</span><span className="badge b-gray">Backend</span></div>
          <div className="pb">
            <div className="g2" style={{ gap:16 }}>
              <div className="setting-row" style={{ borderBottom:'none', padding:0 }}>
                <div className="sr-info"><div className="sr-title">FastAPI endpoint</div><div className="sr-desc">Backend server receiving endpoint telemetry.</div></div>
                <div className="sr-ctrl"><input className="wl-input" type="text" defaultValue="http://localhost:8001" style={{ width:200 }} /></div>
              </div>
              <div className="setting-row" style={{ borderBottom:'none', padding:0 }}>
                <div className="sr-info"><div className="sr-title">Polling interval</div><div className="sr-desc">How often the dashboard syncs with backend (seconds).</div></div>
                <div className="sr-ctrl"><div className="range-wrap"><input type="range" min="1" max="30" defaultValue="3" /><span className="range-val">3s</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
