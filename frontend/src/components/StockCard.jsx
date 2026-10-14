import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

const StockCard = ({ stock, showRemove = false, onRemove = null }) => {
  const navigate = useNavigate()

  if (!stock) return null

  const symbol = stock.symbol || ''
  const name = stock.name || stock.companyName || symbol
  const price = Number(stock.currentPrice || stock.price || 0)
  const change = Number(stock.change || 0)
  const changePercent = Number(stock.changePercent || stock.changePercentage || 0)
  const isPositive = change >= 0

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val)
  }

  const handleClick = (e) => {
    // If clicked on remove button, do not navigate
    if (e.target.closest('.card-action-btn')) {
      return
    }
    navigate(`/stocks/${symbol}`)
  }

  return (
    <div
      onClick={handleClick}
      className="group relative bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-emerald-950/20 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Subtle background glow on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

      {/* Header: Symbol & Name */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
            {stock.sector || 'Stock'}
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight mt-2 group-hover:text-emerald-400 transition-colors">
            {symbol}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-medium">{name}</p>
        </div>

        {showRemove && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(symbol)
            }}
            className="card-action-btn text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            title="Remove from watchlist"
          >
            ✕
          </button>
        )}
      </div>

      {/* Price & Change */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-end justify-between relative z-10">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Price
          </span>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {formatCurrency(price)}
          </p>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
            isPositive
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-red-400 bg-red-500/10 border border-red-500/20'
          }`}
        >
          {isPositive ? (
            <FiTrendingUp className="text-sm flex-shrink-0" />
          ) : (
            <FiTrendingDown className="text-sm flex-shrink-0" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default StockCard
