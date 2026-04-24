import { useState } from 'react'
import { login } from '../api'

export default function Login({ onLogin, showToast }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      showToast('red', 'Please enter username and password.')
      return
    }
    setLoading(true)
    try {
      const data = await login(username, password)
      if (data.token) {
        localStorage.setItem('sentinel_token', data.token)
        onLogin(true)
        showToast('cyan', 'Authentication successful.')
      }
    } catch (err) {
      showToast('red', 'Access denied. Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 0%, #0a1120 0%, #030610 100%)', color: '#fff',
      fontFamily: 'var(--fs)'
    }}>
      <div className="panel" style={{ width: 400, padding: 32, background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(0,207,255,0.2)', boxShadow: '0 0 40px rgba(0, 207, 255, 0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 16px' }}>
            <path d="M16 2L3 7.5V16c0 7.18 5.6 13.4 13 14.5 7.4-1.1 13-7.32 13-14.5V7.5L16 2z" stroke="#00CFFF" strokeWidth="1.5" fill="rgba(0,207,255,0.08)"/>
            <path d="M11 16.5l3 3 7-7" stroke="#00CFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize: 24, letterSpacing: 4, color: '#fff', fontWeight: 600 }}>SENTINEL</div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t2)', marginTop: 4 }}>RESTRICTED ACCESS</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--cyan)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Username</label>
            <input 
              type="text" 
              className="filt-input" 
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)' }}
              value={username} onChange={e => setUsername(e.target.value)} 
              disabled={loading}
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--cyan)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
            <input 
              type="password" 
              className="filt-input" 
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)' }}
              value={password} onChange={e => setPassword(e.target.value)} 
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            style={{ 
              marginTop: 16, padding: '12px', background: 'rgba(0,207,255,0.1)', border: '1px solid var(--cyan)', 
              color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: 2,
              opacity: loading ? 0.5 : 1
            }}
            onMouseOver={e => { if(!loading) { e.target.style.background = 'var(--cyan)'; e.target.style.color = '#000' } }}
            onMouseOut={e => { if(!loading) { e.target.style.background = 'rgba(0,207,255,0.1)'; e.target.style.color = 'var(--cyan)' } }}
            disabled={loading}
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
          </button>
        </form>
      </div>
    </div>
  )
}
