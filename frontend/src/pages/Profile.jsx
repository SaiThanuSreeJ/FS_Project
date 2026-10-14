import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  updateProfile,
  getMe,
  depositFunds,
  withdrawFunds,
  getOrders,
} from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiTrendingUp,
  FiEdit2,
  FiPlus,
  FiMinus,
  FiShield,
  FiX,
} from 'react-icons/fi'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const { addToast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [updating, setUpdating] = useState(false)
  const [totalTrades, setTotalTrades] = useState(0)
  const [loading, setLoading] = useState(true)

  // Wallet deposit/withdraw modal state
  const [walletModalType, setWalletModalType] = useState(null)
  const [amount, setAmount] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)

  useEffect(() => {
    if (user?.name) {
      setName(user.name)
    }

    const loadProfileData = async () => {
      try {
        const [meRes, ordersRes] = await Promise.allSettled([getMe(), getOrders()])
        if (meRes.status === 'fulfilled' && meRes.value.data?.success) {
          updateUser(meRes.value.data.data)
          setName(meRes.value.data.data.name)
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success) {
          setTotalTrades(ordersRes.value.data.data?.length || 0)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setUpdating(true)
    try {
      const res = await updateProfile({ name: name.trim() })
      if (res.data?.success) {
        updateUser(res.data.data)
        addToast('Profile name updated successfully!', 'success')
      } else {
        addToast(res.data?.message || 'Failed to update profile', 'error')
      }
    } catch (err) {
      addToast(err.message || 'Error updating profile', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleWalletSubmit = async (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      addToast('Please enter a valid dollar amount', 'error')
      return
    }

    if (walletModalType === 'withdraw' && num > (user?.walletBalance || 0)) {
      addToast('Withdrawal exceeds available funds', 'error')
      return
    }

    setWalletLoading(true)
    try {
      let res
      if (walletModalType === 'deposit') {
        res = await depositFunds({ amount: num })
      } else {
        res = await withdrawFunds({ amount: num })
      }

      if (res.data?.success) {
        addToast(
          `Successfully ${walletModalType === 'deposit' ? 'deposited' : 'withdrew'} $${num.toLocaleString()}!`,
          'success'
        )
        if (res.data?.data) {
          updateUser(res.data.data)
        }
        setWalletModalType(null)
        setAmount('')
      } else {
        addToast(res.data?.message || 'Transaction failed', 'error')
      }
    } catch (err) {
      addToast(err.message || 'Transaction failed', 'error')
    } finally {
      setWalletLoading(false)
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val) || 0)
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '2026'

  if (loading) {
    return <LoadingSpinner size="large" message="Loading profile settings..." />
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Account Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account credentials, security preferences, and virtual trading capital
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info & Edit Form (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-800/80">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{user?.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <FiMail className="text-slate-500" />
                  {user?.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Active Paper Trader
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <FiCalendar className="text-xs" />
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Name Form */}
            <form onSubmit={handleUpdateName} className="mt-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Personal Information
              </h3>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <FiUser />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Email Address (Verified)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <FiMail />
                  </span>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <FiEdit2 className="text-xs" />
                  <span>{updating ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Summary & Wallet Controls (1 col) */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FiShield className="text-emerald-400" />
              <span>Trading Statistics</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Account Type</span>
                <span className="text-xs font-bold text-emerald-400">Virtual Simulation</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Executed Trades</span>
                <span className="text-xs font-bold text-white">{totalTrades} Orders</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Execution Commission</span>
                <span className="text-xs font-bold text-emerald-400">$0.00 (Zero Fee)</span>
              </div>
            </div>
          </div>

          {/* Wallet Management Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FiDollarSign className="text-emerald-400" />
              <span>Trading Wallet</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs uppercase font-semibold text-slate-400">Available Balance</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {formatCurrency(user?.walletBalance ?? 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setWalletModalType('deposit')
                  setAmount('')
                }}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <FiPlus className="text-sm" />
                <span>Deposit</span>
              </button>
              <button
                onClick={() => {
                  setWalletModalType('withdraw')
                  setAmount('')
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5"
              >
                <FiMinus className="text-sm" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Deposit/Withdraw Modal */}
      {walletModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white capitalize">
                {walletModalType} Capital
              </h3>
              <button
                onClick={() => setWalletModalType(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleWalletSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Amount ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1,000.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={walletLoading}
                className="w-full mt-4 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {walletLoading
                  ? 'Processing...'
                  : `Confirm ${walletModalType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
