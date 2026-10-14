import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getStockDetail,
  getStockChart,
  getWatchlists,
  addToWatchlist,
  getPortfolio,
} from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import OrderModal from '../components/OrderModal'
import { useToast } from '../context/ToastContext'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  FiTrendingUp,
  FiTrendingDown,
  FiBookmark,
  FiCheck,
  FiArrowLeft,
  FiActivity,
  FiDollarSign,
  FiBarChart2,
} from 'react-icons/fi'

const StockDetail = () => {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [stock, setStock] = useState(null)
  const [chartData, setChartData] = useState([])
  const [userHoldings, setUserHoldings] = useState(null)
  const [watchlists, setWatchlists] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [selectedWatchlistId, setSelectedWatchlistId] = useState('')
  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [orderType, setOrderType] = useState('BUY')

  // Load stock details, chart data, holdings, and watchlists
  const loadStockData = async () => {
    setLoading(true)
    try {
      const [stockRes, chartRes, portRes, wlRes] = await Promise.allSettled([
        getStockDetail(symbol),
        getStockChart(symbol),
        getPortfolio(),
        getWatchlists(),
      ])

      if (stockRes.status === 'fulfilled' && stockRes.value.data?.success) {
        setStock(stockRes.value.data.data)
      } else {
        addToast(`Failed to load details for ${symbol}`, 'error')
      }

      if (chartRes.status === 'fulfilled' && chartRes.value.data?.success) {
        const rawChart = chartRes.value.data.data || []
        // Format chart data for Recharts
        const formatted = rawChart.map((item) => ({
          date: item.date || item.time || '',
          price: Number(item.close || item.price || 0),
          open: Number(item.open || 0),
          high: Number(item.high || 0),
          low: Number(item.low || 0),
          volume: Number(item.volume || 0),
        }))
        setChartData(formatted)
      }

      if (portRes.status === 'fulfilled' && portRes.value.data?.success) {
        const holdings = portRes.value.data.data?.holdings || []
        const currentHolding = holdings.find(
          (h) => (h.symbol || '').toUpperCase() === (symbol || '').toUpperCase()
        )
        setUserHoldings(currentHolding || null)
      }

      if (wlRes.status === 'fulfilled' && wlRes.value.data?.success) {
        const lists = wlRes.value.data.data || []
        setWatchlists(lists)
        if (lists.length > 0) {
          setSelectedWatchlistId(lists[0]._id || lists[0].id)
        }
      }
    } catch (err) {
      console.error(err)
      addToast('Error loading stock information', 'error')
    } finally {
      setLoading(false)
      setChartLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      loadStockData()
    }
  }, [symbol])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val) || 0)
  }

  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-US').format(Number(val) || 0)
  }

  const handleAddToWatchlist = async () => {
    if (!selectedWatchlistId) {
      navigate('/watchlist')
      return
    }

    try {
      const res = await addToWatchlist(selectedWatchlistId, { symbol: stock.symbol })
      if (res.data?.success) {
        addToast(`Added ${stock.symbol} to your watchlist!`, 'success')
        setShowWatchlistDropdown(false)
      } else {
        addToast(res.data?.message || 'Failed to add to watchlist', 'error')
      }
    } catch (err) {
      addToast(err.message || 'Already in watchlist or error occurred', 'error')
    }
  }

  const handleOpenOrder = (type) => {
    setOrderType(type)
    setModalOpen(true)
  }

  const handleOrderSuccess = () => {
    loadStockData()
  }

  if (loading) {
    return <LoadingSpinner size="large" message={`Loading quote for ${symbol}...`} />
  }

  if (!stock) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-white">Stock not found</h2>
        <p className="text-slate-400 mt-2">Could not locate symbol {symbol}.</p>
        <button
          onClick={() => navigate('/market')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-slate-700 font-semibold text-sm transition-all"
        >
          Return to Market
        </button>
      </div>
    )
  }

  const price = Number(stock.currentPrice || stock.price || 0)
  const change = Number(stock.change || 0)
  const changePercent = Number(stock.changePercent || stock.changePercentage || 0)
  const isPositive = change >= 0
  const ownedShares = Number(userHoldings?.quantity || 0)

  // Chart gradient colors based on daily gain/loss
  const strokeColor = isPositive ? '#10B981' : '#EF4444'
  const fillGradientId = isPositive ? 'emeraldGradient' : 'redGradient'

  // Generate fallback chart points if backend returns empty chart data
  const effectiveChartData =
    chartData.length > 0
      ? chartData
      : Array.from({ length: 15 }, (_, i) => ({
          date: `Day ${i + 1}`,
          price: +(price * (1 + (Math.sin(i) * 0.04))).toFixed(2),
        }))

  return (
    <div className="space-y-8 pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <FiArrowLeft />
          <span>Back</span>
        </button>
      </div>

      {/* Main Stock Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              {stock.sector || 'Stock'}
            </span>
            {stock.industry && (
              <span className="text-xs text-slate-400 font-medium">
                • {stock.industry}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{stock.symbol}</h1>
            <span className="text-lg text-slate-400 font-medium">{stock.name || stock.companyName}</span>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {formatCurrency(price)}
            </span>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-bold ${
                isPositive
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-red-400 bg-red-500/10 border border-red-500/20'
              }`}
            >
              {isPositive ? <FiTrendingUp className="text-base" /> : <FiTrendingDown className="text-base" />}
              <span>
                {isPositive ? '+' : ''}
                {formatCurrency(change)} ({isPositive ? '+' : ''}
                {changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Watchlist toggle dropdown */}
          <div className="relative">
            {watchlists.length > 0 ? (
              <div className="flex items-center">
                <button
                  onClick={() => setShowWatchlistDropdown(!showWatchlistDropdown)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all shadow-md"
                >
                  <FiBookmark className="text-emerald-400" />
                  <span>Watchlist</span>
                </button>
                {showWatchlistDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-30 animate-slide-in">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Choose Watchlist
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {watchlists.map((wl) => (
                        <button
                          key={wl._id || wl.id}
                          onClick={() => {
                            setSelectedWatchlistId(wl._id || wl.id)
                            handleAddToWatchlist()
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex items-center justify-between"
                        >
                          <span>{wl.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {wl.stocks?.length || 0} stocks
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/watchlist')}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold flex items-center gap-2 transition-all"
              >
                <FiBookmark />
                <span>Create Watchlist</span>
              </button>
            )}
          </div>

          {/* Sell Button (Only if holding shares) */}
          <button
            onClick={() => handleOpenOrder('SELL')}
            disabled={ownedShares <= 0}
            className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-bold text-sm tracking-wide transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sell {ownedShares > 0 ? `(${ownedShares})` : ''}
          </button>

          {/* Buy Button */}
          <button
            onClick={() => handleOpenOrder('BUY')}
            className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm tracking-wide transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30"
          >
            Buy {stock.symbol}
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FiActivity className="text-emerald-400 text-lg" />
            <h2 className="text-lg font-bold text-white tracking-tight">Performance History</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            Realtime Candlestick Index
          </span>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={effectiveChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                domain={['auto', 'auto']}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                }}
                itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                formatter={(val) => [formatCurrency(val), 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${fillGradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stock Information Fundamentals Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-white tracking-tight mb-6">Key Statistics & Fundamentals</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Previous Close
            </span>
            <p className="text-lg font-bold text-white mt-1">
              {formatCurrency(stock.previousClose || price - change)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              52 Week High
            </span>
            <p className="text-lg font-bold text-emerald-400 mt-1">
              {formatCurrency(stock.high52 || stock.fiftyTwoWeekHigh || price * 1.25)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              52 Week Low
            </span>
            <p className="text-lg font-bold text-red-400 mt-1">
              {formatCurrency(stock.low52 || stock.fiftyTwoWeekLow || price * 0.75)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Market Capitalization
            </span>
            <p className="text-lg font-bold text-white mt-1">
              {stock.marketCap
                ? typeof stock.marketCap === 'number'
                  ? `$${(stock.marketCap / 1e9).toFixed(2)}B`
                  : stock.marketCap
                : '$120.45B'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Volume
            </span>
            <p className="text-lg font-bold text-white mt-1">
              {formatNumber(stock.volume || 1450200)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sector
            </span>
            <p className="text-lg font-bold text-white mt-1 truncate">
              {stock.sector || 'Information Technology'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Industry
            </span>
            <p className="text-lg font-bold text-white mt-1 truncate">
              {stock.industry || 'Software & Services'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your Position
            </span>
            <p className="text-lg font-bold text-white mt-1">
              {ownedShares > 0 ? (
                <span className="text-emerald-400 font-bold">{ownedShares} Shares</span>
              ) : (
                <span className="text-slate-500 font-normal">None Owned</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Order Placement Modal */}
      <OrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        stock={stock}
        type={orderType}
        onSuccess={handleOrderSuccess}
        availableHoldingQuantity={ownedShares}
      />
    </div>
  )
}

export default StockDetail
