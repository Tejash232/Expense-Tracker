const rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
const API_URL = rawApiUrl.replace(/\/+$/, '')

export default API_URL

