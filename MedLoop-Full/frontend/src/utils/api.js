/**
 * MedLoop Frontend - Backend API istemcisi
 * ===========================================
 * Tüm gerçek backend çağrıları (../backend/app.py, Flask) buradan geçer.
 * Token (JWT) localStorage'da saklanır ve auth gerektiren her istekte
 * otomatik olarak Authorization header'ına eklenir.
 *
 * VITE_API_BASE_URL, frontend/.env dosyasında tanımlanır (örn.
 * http://10.243.236.114:5000 ya da http://localhost:5000).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const TOKEN_KEY = 'medloop-token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage kapalı/dolu olabilir — token sadece bu oturumda çalışır
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.', 0)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new ApiError(data?.error || 'Beklenmeyen bir hata oluştu', res.status)
  }
  return data
}

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  // "Şifremi unuttum" akışı 1. adım: e-posta gönderilir, hesap gerçekten
  // varsa 6 haneli kod e-postaya yollanır (bkz. backend auth/routes.py).
  forgotPassword: (payload) =>
    request('/auth/forgot-password', { method: 'POST', body: payload, auth: false }),
  // "Şifremi unuttum" akışı 2. adım: { email, code, newPassword }
  resetPassword: (payload) =>
    request('/auth/reset-password', { method: 'POST', body: payload, auth: false }),
}

export const medicationsApi = {
  list: (status) => request(`/medications${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  create: (payload) => request('/medications', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/medications/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => request(`/medications/${id}`, { method: 'DELETE' }),
}

export const catalogApi = {
  search: (query, limit = 15) =>
    request(`/catalog/search?q=${encodeURIComponent(query)}&limit=${limit}`),
}

export const notificationsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.unread) qs.set('unread', 'true')
    if (params.limit) qs.set('limit', String(params.limit))
    const suffix = qs.toString() ? `?${qs}` : ''
    return request(`/notifications${suffix}`)
  },
  unreadCount: () => request('/notifications/unread-count'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
}

export const deliveriesApi = {
  create: (medicationIds) =>
    request('/deliveries/request', { method: 'POST', body: { medicationIds } }),
  get: (token) => request(`/deliveries/${token}`),
  confirm: (token) => request(`/deliveries/${token}/confirm`, { method: 'POST' }),
  history: () => request('/deliveries'),
}

export const usersApi = {
  me: () => request('/users/me'),
  // Profil ekranındaki "İsmi düzenle" — şu an sadece { name } destekleniyor.
  updateMe: (payload) => request('/users/me', { method: 'PATCH', body: payload }),
  // Gizlilik ekranındaki "Verilerimi dışa aktar" — hesapla ilişkili tüm
  // verilerin (profil, ilaçlar, bildirimler, teslimatlar) JSON kopyası.
  exportData: () => request('/users/me/export'),
  // Gizlilik ekranındaki "Hesabımı sil" — hesabı ve ilişkili tüm verileri
  // backend'de kalıcı olarak siler. Geri alınamaz.
  deleteAccount: () => request('/users/me', { method: 'DELETE' }),
  // Ana Sayfa'daki "Çevresel Etkin" kartı — güvenle teslim edilen ilaçlardan
  // tahmini CO2/su tasarrufu (bkz. backend users/routes.py IMPACT_* sabitleri).
  impact: () => request('/users/me/impact'),
  // Profil'deki "Liderlik Tablosu" — cihaz GPS'inden alınan enlem/boylamı
  // backend'e gönderir, backend ters coğrafi kodlama ile ili bulup kaydeder.
  updateLocation: (payload) => request('/users/me/location', { method: 'PATCH', body: payload }),
  // Profil'deki "Liderlik Tablosu" — kullanıcının ilindeki ilk 3 + kendi sırası.
  leaderboard: () => request('/users/me/leaderboard'),
}
