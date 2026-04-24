import axios from 'axios'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8001'
const ax = axios.create({ baseURL: API })

export const getLogs    = () => ax.get('/logs/recent').then(r => r.data)
export const getAlerts  = () => ax.get('/alerts').then(r => r.data)
export const getSummary = () => ax.get('/summary').then(r => r.data)
export const getStats   = () => ax.get('/dashboard/stats').then(r => r.data)
export const getDevices = () => ax.get('/devices').then(r => r.data)
export const getUserRisk= () => ax.get('/users/risk').then(r => r.data)
export const getSettings= () => ax.get('/settings').then(r => r.data)
export const saveSettings = (payload) => ax.post('/settings', payload).then(r => r.data)
export const getWatchPaths = () => ax.get('/watch-paths').then(r => r.data)
export const addWatchPath  = (path) => ax.post('/watch-paths', { path }).then(r => r.data)
export const delWatchPath  = (path) => ax.delete('/watch-paths', { data: { path } }).then(r => r.data)
export const alertAction   = (id, action) => ax.post(`/alerts/${id}/action`, { action }).then(r => r.data)
