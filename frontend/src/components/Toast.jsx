import { useEffect, useRef } from 'react'

export function Toast({ toast }) {
  if (!toast) return null
  const colors = { cyan: 'var(--cyan)', amber: 'var(--amber)', red: 'var(--red)', gray: 'var(--t1)' }
  const borders = { cyan: 'rgba(0,207,255,.4)', amber: 'rgba(255,176,32,.4)', red: 'rgba(255,41,82,.4)', gray: 'var(--b3)' }
  return (
    <div style={{
      position: 'fixed', bottom: 22, right: 22,
      background: 'var(--s2)', border: `1px solid ${borders[toast.color] || 'var(--b3)'}`,
      borderRadius: 10, padding: '11px 16px',
      fontFamily: 'var(--fm)', fontSize: 10, color: colors[toast.color] || 'var(--t1)',
      zIndex: 500, maxWidth: 300,
      transition: 'transform .3s ease',
      transform: toast.show ? 'translateX(0)' : 'translateX(120%)',
    }}>
      <span style={{ marginRight: 6 }}>●</span>{toast.msg}
    </div>
  )
}
