import React, { useState, useEffect } from 'react'
import { buyOrder, sellOrder } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FiX, FiCheck, FiAlertTriangle, FiDollarSign } from 'react-icons/fi'

const OrderModal = ({
  isOpen,
  onClose,
  stock,
  type = 'BUY', // 'BUY' or 'SELL'
  onSuccess,
  availableHoldingQuantity = 0,
}) => {
  const { user, updateUser } = useAuth()
  const { addToast } = useToast()

  const [quantity, setQuantity] = useState(1)
  const [category, setCategory] = useState('MARKET') // 'MARKET' or 'LIMIT'
  const [limitPrice, setLimitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentPrice = Number(stock?.currentPrice || stock?.price || 0)

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setCategory('MARKET')
      setLimitPrice(currentPrice ? currentPrice.toString() : '')
      setError('')
    }
  }, [isOpen, currentPrice])

  if (!isOpen || !stock) return null

  const effectivePrice = category === 'LIMIT' && Number(limitPrice) > 0 ? Number(limitPrice) : currentPrice
  const totalCost = Number(quantity || 0) * effectivePrice
  const walletBalance = Number(user?.walletBalance || 0)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity of at least 1')
      return
    }

    if (category === 'LIMIT') {
      const lPrice = parseFloat(limitPrice)
      if (isNaN(lPrice) || lPrice <= 0) {
        setError('Please enter a valid limit price')
        return
      }
    }

    if (type === 'BUY') {
      if (totalCost > walletBalance) {
        setError(`Insufficient funds. You need ${formatCurrency(totalCost)} but have ${formatCurrency(walletBalance)}`)
        return
      }
    } else {
      if (qty > availableHoldingQuantity) {
        setError(`Insufficient shares. You only own ${availableHoldingQuantity} shares of ${stock.symbol}`)
        return
      }
    }

    setLoading(true)

    try {
      const payload = {
        symbol: stock.symbol,
        quantity: qty,
        category,
        ...(category === 'LIMIT' ? { limitPrice: parseFloat(limitPrice) } : {}),
      }

      let res
      if (type === 'BUY') {
        res = await buyOrder(payload)
      } else {
        res = await sellOrder(payload)
      }

      if (res.data?.success) {
        addToast(
          `${type === 'BUY' ? 'Buy' : 'Sell'} order placed successfully for ${qty} shares of ${stock.symbol}!`,
          'success'
        )

        // If backend returned wallet balance or user, update AuthContext
        if (res.data?.data?.walletBalance !== undefined && user) {
          updateUser({
            ...user,
            walletBalance: res.data.data.walletBalance,
          })
        }

        if (onSuccess) {
          onSuccess(res.data)
        }
        onClose()
      } else {
        setError(res.data?.message || 'Order failed')
        addToast(res.data?.message || 'Order failed', 'error')
      }
    } catch (err) {
      const msg = err.message || 'An error occurred while placing order'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const isBuy = type === 'BUY'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                  isBuy
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {type}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">{stock.symbol}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{stock.name || stock.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <FiAlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Market Price */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-medium text-slate-400">Market Price</span>
            <span className="text-sm font-bold text-white">{formatCurrency(currentPrice)}</span>
          </div>

          {/* Order Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Order Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setCategory('MARKET')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  category === 'MARKET'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Market Order
              </button>
              <button
                type="button"
                onClick={() => setCategory('LIMIT')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  category === 'LIMIT'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Limit Order
              </button>
            </div>
          </div>

          {/* Limit Price Input (Only for LIMIT) */}
          {category === 'LIMIT' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Limit Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quantity (Shares)
              </label>
              {!isBuy && (
                <span className="text-xs text-slate-400">
                  Owned:{' '}
                  <button
                    type="button"
                    onClick={() => setQuantity(availableHoldingQuantity)}
                    className="text-emerald-400 underline font-semibold hover:text-emerald-300"
                  >
                    {availableHoldingQuantity}
                  </button>
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="1"
              required
            />
          </div>

          {/* Balance info & summary */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>{isBuy ? 'Available Wallet' : 'Shares Available'}</span>
              <span className="font-medium text-slate-200">
                {isBuy ? formatCurrency(walletBalance) : `${availableHoldingQuantity} shares`}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-800/40">
              <span className="text-slate-300">Estimated Total</span>
              <span className={`text-base ${isBuy ? 'text-emerald-400' : 'text-slate-100'}`}>
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
              isBuy
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-500/30'
                : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20 hover:shadow-red-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Confirm {isBuy ? 'Buy' : 'Sell'} Order</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default OrderModal
