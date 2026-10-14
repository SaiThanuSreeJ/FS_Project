import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPortfolioSummary, getTopGainers, getTopLosers, getOrders } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StockCard from '../components/StockCard'
import { 
  FiDollarSign, 
  FiPieChart, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiShoppingBag, 
  FiArrowUpRight,
  FiArrowDownRight,
  FiList,
  FiClock,
  FiLayers
} from 'react-icons/fi'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [portfolioData, setPortfolioData] = useState(null)
  const [gainers, setGainers] = useState([])
  const [losers, setLosers] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [portfolioRes, gainersRes, losersRes, ordersRes] = await Promise.allSettled([
          getPortfolioSummary(),
          getTopGainers(),
          getTopLosers(),
          getOrders(),
        ])

        if (portfolioRes.status === 'fulfilled' && portfolioRes.value.data?.success) {
          setPortfolioData(portfolioRes.value.data.data)
        }
        if (gainersRes.status === 'fulfilled' && gainersRes.value.data?.success) {
          setGainers(gainersRes.value.data.data?.slice(0, 4) || [])
        }
        if (losersRes.status === 'fulfilled' && losersRes.value.data?.success) {
          setLosers(losersRes.value.data.data?.slice(0, 4) || [])
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success) {
          setRecentOrders(ordersRes.value.data.data?.slice(0, 5) || [])
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatCurrency = (val) => {
    const num = Number(val) || 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num)
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (loading) {
    return <LoadingSpinner size="large" message="Loading your dashboard..." />
  }

  const totals = portfolioData?.totals || {}
  const portfolioValue = Number(totals.currentValue || totals.totalValue || 0)
  const totalPL = Number(totals.totalPL || totals.profitLoss || 0)
  const totalPLPercentage = Number(totals.totalPLPercentage || totals.profitLossPercentage || 0)
  const totalHoldingsCount = portfolioData?.holdings?.length || 0
  const isPositivePL = totalPL >= 0

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Quick actions bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
            {currentDate}
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Welcome back, {user?.name || 'Trader'} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your portfolio growth and trade stocks in real time
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/market')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <FiTrendingUp className="text-base" />
            <span>Explore Market</span>
          </button>
          <button
            onClick={() => navigate('/portfolio')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2"
          >
            <FiPieChart className="text-base text-slate-400" />
            <span>Portfolio</span>
          </button>
          <button
            onClick={() => navigate('/watchlist')}
            className="hidden sm:flex px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all items-center gap-2"
          >
            <FiList className="text-base text-slate-400" />
            <span>Watchlist</span>
          </button>
        </div>
      </div>

      {/* Row of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Wallet Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FiDollarSign />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white tracking-tight">
              {formatCurrency(user?.walletBalance ?? 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Available cash to invest</p>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Portfolio Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FiPieChart />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white tracking-tight">
              {formatCurrency(portfolioValue)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total market value</p>
          </div>
        </div>

        {/* Total P&L */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total P&L
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isPositivePL ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {isPositivePL ? <FiArrowUpRight /> : <FiArrowDownRight />}
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-extrabold tracking-tight ${
                isPositivePL ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositivePL ? '+' : ''}
              {formatCurrency(totalPL)}
            </p>
            <p
              className={`text-xs mt-1 font-semibold ${
                isPositivePL ? 'text-emerald-500' : 'text-red-400'
              }`}
            >
              {isPositivePL ? '+' : ''}
              {totalPLPercentage.toFixed(2)}% overall return
            </p>
          </div>
        </div>

        {/* Total Holdings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Positions
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <FiLayers />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white tracking-tight">
              {totalHoldingsCount} <span className="text-sm font-normal text-slate-400">Stocks</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Active portfolio holdings</p>
          </div>
        </div>
      </div>

      {/* Market Movers: Gainers and Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers Column */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-bold text-white tracking-tight">Top Gainers</h2>
            </div>
            <Link
              to="/market"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gainers.length > 0 ? (
              gainers.map((stock) => <StockCard key={stock.symbol} stock={stock} />)
            ) : (
              <div className="col-span-2 text-center py-8 text-slate-500 text-sm">
                No gainer data available right now
              </div>
            )}
          </div>
        </div>

        {/* Top Losers Column */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <h2 className="text-lg font-bold text-white tracking-tight">Top Losers</h2>
            </div>
            <Link
              to="/market"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {losers.length > 0 ? (
              losers.map((stock) => <StockCard key={stock.symbol} stock={stock} />)
            ) : (
              <div className="col-span-2 text-center py-8 text-slate-500 text-sm">
                No loser data available right now
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <FiShoppingBag className="text-slate-400 text-lg" />
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Orders</h2>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Full order book →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-950/40 border border-slate-800/50">
            <FiClock className="mx-auto text-3xl text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">No orders executed yet</p>
            <p className="text-xs text-slate-500 mt-1">Explore the market to place your first trade</p>
            <button
              onClick={() => navigate('/market')}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
            >
              Start Trading Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 pl-2">Type</th>
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((order) => {
                  const isBuy = (order.type || order.side)?.toUpperCase() === 'BUY'
                  const status = (order.status || 'EXECUTED').toUpperCase()

                  return (
                    <tr
                      key={order._id || order.id || Math.random()}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/stocks/${order.symbol}`)}
                    >
                      <td className="py-3.5 pl-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            isBuy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isBuy ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-white">{order.symbol}</td>
                      <td className="py-3.5 text-slate-300">{order.quantity}</td>
                      <td className="py-3.5 text-slate-300 font-medium">
                        {formatCurrency(order.price || order.executionPrice || order.limitPrice)}
                      </td>
                      <td className="py-3.5 font-bold text-white">
                        {formatCurrency(
                          order.total ||
                            (order.quantity || 0) *
                              (order.price || order.executionPrice || order.limitPrice || 0)
                        )}
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            status === 'EXECUTED'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : status === 'PENDING'
                              ? 'text-yellow-400 bg-yellow-500/10'
                              : 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
