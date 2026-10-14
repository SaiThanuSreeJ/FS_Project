import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getOrders,
  getActiveOrders,
  getOrderHistory,
  cancelOrder,
} from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../context/ToastContext'
import {
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiTrash2,
  FiFilter,
} from 'react-icons/fi'

const Orders = () => {
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL', 'ACTIVE', 'HISTORY'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  const { addToast } = useToast()

  const fetchOrders = async (tab = activeTab) => {
    setLoading(true)
    try {
      let res
      if (tab === 'ACTIVE') {
        res = await getActiveOrders()
      } else if (tab === 'HISTORY') {
        res = await getOrderHistory()
      } else {
        res = await getOrders()
      }

      if (res.data?.success) {
        setOrders(res.data.data || [])
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(activeTab)
  }, [activeTab])

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this pending order?')) {
      return
    }

    setCancellingId(orderId)
    try {
      const res = await cancelOrder(orderId)
      if (res.data?.success) {
        addToast('Order cancelled successfully', 'info')
        fetchOrders(activeTab)
      } else {
        addToast(res.data?.message || 'Failed to cancel order', 'error')
      }
    } catch (err) {
      addToast(err.message || 'Error cancelling order', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val) || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Order Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review execution logs, active limit orders, and past trading records
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          All Orders
        </button>

        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Active & Pending
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'HISTORY'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Order History
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {loading ? (
          <LoadingSpinner size="medium" message="Fetching order records..." />
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-950/40 border border-slate-800/60 rounded-2xl">
            <FiShoppingBag className="mx-auto text-4xl text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">No orders found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              There are no orders matching this filter view.
            </p>
            <Link
              to="/market"
              className="inline-block mt-5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20"
            >
              Browse Stock Market
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Date & Time</th>
                  <th className="pb-3.5">Symbol</th>
                  <th className="pb-3.5">Type</th>
                  <th className="pb-3.5">Category</th>
                  <th className="pb-3.5 text-right">Quantity</th>
                  <th className="pb-3.5 text-right">Price</th>
                  <th className="pb-3.5 text-right">Total</th>
                  <th className="pb-3.5 text-center">Status</th>
                  <th className="pb-3.5 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => {
                  const id = order._id || order.id
                  const isBuy = (order.type || order.side)?.toUpperCase() === 'BUY'
                  const status = (order.status || 'EXECUTED').toUpperCase()
                  const category = (order.category || 'MARKET').toUpperCase()
                  const price = Number(order.price || order.executionPrice || order.limitPrice || 0)
                  const quantity = Number(order.quantity || 0)
                  const total = Number(order.total || quantity * price)
                  const date = order.createdAt || order.date || order.timestamp

                  return (
                    <tr key={id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 pl-2 text-xs text-slate-400 font-medium">
                        {formatDate(date)}
                      </td>
                      <td className="py-4 font-bold text-white">
                        <Link
                          to={`/stocks/${order.symbol}`}
                          className="hover:text-emerald-400 transition-colors"
                        >
                          {order.symbol}
                        </Link>
                      </td>
                      <td className="py-4">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                            isBuy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isBuy ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {category}
                        </span>
                      </td>
                      <td className="py-4 text-right font-medium text-slate-200">{quantity}</td>
                      <td className="py-4 text-right font-medium text-slate-300">
                        {formatCurrency(price)}
                      </td>
                      <td className="py-4 text-right font-bold text-white">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-4 text-center">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            status === 'EXECUTED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : status === 'PENDING'
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : status === 'CANCELLED'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-4 pr-2 text-right">
                        {status === 'PENDING' ? (
                          <button
                            onClick={() => handleCancelOrder(id)}
                            disabled={cancellingId === id}
                            className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {cancellingId === id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
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

export default Orders
