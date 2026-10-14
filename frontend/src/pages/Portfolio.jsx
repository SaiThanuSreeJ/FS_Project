import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getPortfolioSummary,
  depositFunds,
  withdrawFunds,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import OrderModal from '../components/OrderModal'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiPlus,
  FiMinus,
  FiArrowUpRight,
  FiArrowDownRight,
  FiShoppingBag,
  FiX,
  FiLayers,
} from 'react-icons/fi'

const COLORS = [
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#14B8A6',
  '#6366F1',
  '#06B6D4',
]

const Portfolio = () => {
  const { user, updateUser } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [portfolioData, setPortfolioData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sell modal state
  const [sellModalOpen, setSellModalOpen] = useState(false)
  const [stockToSell, setStockToSell] = useState(null)
  const [maxHoldingQty, setMaxHoldingQty] = useState(0)

  // Deposit & Withdraw modal states
  const [walletModalType, setWalletModalType] = useState(null) // 'deposit' or 'withdraw' or null
  const [transferAmount, setTransferAmount] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)

  const fetchPortfolio = async () => {
    try {
      const res = await getPortfolioSummary()
      if (res.data?.success) {
        setPortfolioData(res.data.data)
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to load portfolio', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val) || 0)
  }

  const handleOpenSell = (holding) => {
    setStockToSell({
      symbol: holding.symbol,
      name: holding.companyName || holding.name,
      currentPrice: holding.currentPrice,
    })
    setMaxHoldingQty(holding.quantity)
    setSellModalOpen(true)
  }

  const handleWalletTransfer = async (e) => {
    e.preventDefault()
    const amt = parseFloat(transferAmount)
    if (isNaN(amt) || amt <= 0) {
      addToast('Please enter a valid positive dollar amount', 'error')
      return
    }

    if (walletModalType === 'withdraw' && amt > (user?.walletBalance || 0)) {
      addToast('Insufficient funds in wallet', 'error')
      return
    }

    setTransferLoading(true)
    try {
      let res
      if (walletModalType === 'deposit') {
        res = await depositFunds({ amount: amt })
      } else {
        res = await withdrawFunds({ amount: amt })
      }

      if (res.data?.success) {
        addToast(
          `Successfully ${walletModalType === 'deposit' ? 'deposited' : 'withdrew'} ${formatCurrency(amt)}!`,
          'success'
        )
        if (res.data?.data) {
          updateUser(res.data.data)
        }
        setWalletModalType(null)
        setTransferAmount('')
        fetchPortfolio()
      } else {
        addToast(res.data?.message || 'Transaction failed', 'error')
      }
    } catch (err) {
      addToast(err.message || 'Transaction failed', 'error')
    } finally {
      setTransferLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="large" message="Loading your portfolio assets..." />
  }

  const totals = portfolioData?.totals || {}
  const holdings = portfolioData?.holdings || []
  const rawAllocation = portfolioData?.allocation || []

  const totalInvested = Number(totals.totalInvested || 0)
  const currentValue = Number(totals.currentValue || totals.totalValue || 0)
  const totalPL = Number(totals.totalPL || totals.profitLoss || 0)
  const totalPLPercentage = Number(totals.totalPLPercentage || totals.profitLossPercentage || 0)
  const isPositivePL = totalPL >= 0

  // Sector allocation data for pie chart
  const allocationData =
    rawAllocation.length > 0
      ? rawAllocation.map((item) => ({
          name: item.sector || item.name || 'Unclassified',
          value: Number(item.percentage || item.value || 0),
        }))
      : holdings.map((h) => ({
          name: h.symbol,
          value: Number((h.currentPrice * h.quantity).toFixed(2)),
        }))

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Wallet Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Portfolio & Holdings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time valuation, net returns, and asset distribution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setWalletModalType('deposit')
              setTransferAmount('')
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20"
          >
            <FiPlus />
            <span>Deposit Cash</span>
          </button>
          <button
            onClick={() => {
              setWalletModalType('withdraw')
              setTransferAmount('')
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all"
          >
            <FiMinus />
            <span>Withdraw Cash</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Invested
          </span>
          <p className="text-2xl font-extrabold text-white tracking-tight mt-2">
            {formatCurrency(totalInvested)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Cost basis across positions</p>
        </div>

        {/* Current Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Current Value
          </span>
          <p className="text-2xl font-extrabold text-white tracking-tight mt-2">
            {formatCurrency(currentValue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Mark-to-market holdings</p>
        </div>

        {/* Total P&L */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Unrealized P&L
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <p
              className={`text-2xl font-extrabold tracking-tight ${
                isPositivePL ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositivePL ? '+' : ''}
              {formatCurrency(totalPL)}
            </p>
          </div>
          <p
            className={`text-xs mt-1 font-semibold ${
              isPositivePL ? 'text-emerald-500' : 'text-red-400'
            }`}
          >
            {isPositivePL ? '+' : ''}
            {totalPLPercentage.toFixed(2)}% net returns
          </p>
        </div>

        {/* Available Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cash In Wallet
          </span>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight mt-2">
            {formatCurrency(user?.walletBalance ?? 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Ready for purchasing</p>
        </div>
      </div>

      {/* Holdings & Allocation layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Holdings Table (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FiLayers className="text-emerald-400 text-lg" />
              <h2 className="text-lg font-bold text-white tracking-tight">Active Holdings</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {holdings.length} Positions
            </span>
          </div>

          {holdings.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/40 border border-slate-800/60 rounded-2xl">
              <FiShoppingBag className="mx-auto text-4xl text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-white">Your portfolio is currently empty</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Build your wealth today by investing in blue-chips, tech leaders, and growth stocks.
              </p>
              <button
                onClick={() => navigate('/market')}
                className="mt-5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20"
              >
                Start Trading Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 pl-1">Asset</th>
                    <th className="pb-3 text-right">Shares</th>
                    <th className="pb-3 text-right">Avg Price</th>
                    <th className="pb-3 text-right">Cur. Price</th>
                    <th className="pb-3 text-right">Total Value</th>
                    <th className="pb-3 text-right">P&L</th>
                    <th className="pb-3 pr-1 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {holdings.map((holding) => {
                    const avg = Number(holding.averagePrice || holding.avgPrice || 0)
                    const cur = Number(holding.currentPrice || 0)
                    const qty = Number(holding.quantity || 0)
                    const holdingValue = qty * cur
                    const pl = Number(holding.profitLoss ?? (holdingValue - qty * avg))
                    const plPercent = Number(
                      holding.profitLossPercentage ?? (avg > 0 ? ((cur - avg) / avg) * 100 : 0)
                    )
                    const isHoldingPositive = pl >= 0

                    return (
                      <tr
                        key={holding.symbol}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-4 pl-1">
                          <Link
                            to={`/stocks/${holding.symbol}`}
                            className="font-bold text-white hover:text-emerald-400 transition-colors block"
                          >
                            {holding.symbol}
                          </Link>
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {holding.companyName || holding.name}
                          </span>
                        </td>
                        <td className="py-4 text-right font-medium text-slate-200">{qty}</td>
                        <td className="py-4 text-right text-slate-300 font-medium">
                          {formatCurrency(avg)}
                        </td>
                        <td className="py-4 text-right font-bold text-white">
                          {formatCurrency(cur)}
                        </td>
                        <td className="py-4 text-right font-bold text-white">
                          {formatCurrency(holdingValue)}
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={`font-bold block ${
                              isHoldingPositive ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isHoldingPositive ? '+' : ''}
                            {formatCurrency(pl)}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              isHoldingPositive ? 'text-emerald-500' : 'text-red-400'
                            }`}
                          >
                            {isHoldingPositive ? '+' : ''}
                            {plPercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4 pr-1 text-right">
                          <button
                            onClick={() => handleOpenSell(holding)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold transition-all"
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Asset Allocation Pie Chart (1 Col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiPieChart className="text-blue-400 text-lg" />
              <h2 className="text-lg font-bold text-white tracking-tight">Portfolio Allocation</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Distribution of capital by sector & market exposure
            </p>

            {allocationData.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No active asset allocation data
              </div>
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {allocationData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="#0f172a"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                        }}
                        itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {allocationData.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-slate-300 font-medium truncate max-w-[140px]">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-white">
                        {typeof item.value === 'number' && item.value <= 100
                          ? `${item.value.toFixed(1)}%`
                          : formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deposit / Withdraw Modal */}
      {walletModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white capitalize">
                {walletModalType} Virtual Funds
              </h3>
              <button
                onClick={() => setWalletModalType(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleWalletTransfer} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Amount in USD ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="1,000.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                  <span>Current Wallet: {formatCurrency(user?.walletBalance ?? 0)}</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTransferAmount(preset.toString())}
                    className="py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    +${preset.toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={transferLoading}
                className="w-full mt-4 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {transferLoading
                  ? 'Processing Transfer...'
                  : `Confirm ${walletModalType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {stockToSell && (
        <OrderModal
          isOpen={sellModalOpen}
          onClose={() => setSellModalOpen(false)}
          stock={stockToSell}
          type="SELL"
          onSuccess={() => {
            fetchPortfolio()
          }}
          availableHoldingQuantity={maxHoldingQty}
        />
      )}
    </div>
  )
}

export default Portfolio
