import axios from 'axios'

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_API_URL) ||
  'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vesto_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors and auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('vesto_token')
      localStorage.removeItem('vesto_user')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// Auth APIs
export const registerUser = (data) => api.post('/auth/register', data)
export const loginUser = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')
export const updateProfile = (data) => api.put('/auth/profile', data)

// Stocks APIs
export const getAllStocks = () => api.get('/stocks')
export const searchStocks = (query) => api.get(`/stocks/search?q=${encodeURIComponent(query)}`)
export const getMarketOverview = () => api.get('/stocks/market/overview')
export const getTopGainers = () => api.get('/stocks/market/gainers')
export const getTopLosers = () => api.get('/stocks/market/losers')
export const getStockDetail = (symbol) => api.get(`/stocks/${symbol}`)
export const getStockChart = (symbol) => api.get(`/stocks/${symbol}/chart`)

// Watchlist APIs
export const getWatchlists = () => api.get('/watchlist')
export const createWatchlist = (data) => api.post('/watchlist', data)
export const addToWatchlist = (id, data) => api.post(`/watchlist/${id}/add`, data)
export const removeFromWatchlist = (id, symbol) => api.delete(`/watchlist/${id}/remove/${symbol}`)
export const deleteWatchlist = (id) => api.delete(`/watchlist/${id}`)

// Orders APIs
export const buyOrder = (data) => api.post('/orders/buy', data)
export const sellOrder = (data) => api.post('/orders/sell', data)
export const getOrders = () => api.get('/orders')
export const getActiveOrders = () => api.get('/orders/active')
export const getOrderHistory = () => api.get('/orders/history')
export const cancelOrder = (id) => api.delete(`/orders/${id}`)

// Portfolio APIs
export const getPortfolio = () => api.get('/portfolio')
export const getPortfolioSummary = () => api.get('/portfolio/summary')
export const depositFunds = (data) => api.post('/portfolio/deposit', data)
export const withdrawFunds = (data) => api.post('/portfolio/withdraw', data)

export default api
