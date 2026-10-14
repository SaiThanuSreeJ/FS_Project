import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getWatchlists,
  createWatchlist,
  removeFromWatchlist,
  deleteWatchlist,
} from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StockCard from '../components/StockCard'
import { useToast } from '../context/ToastContext'
import {
  FiList,
  FiPlus,
  FiTrash2,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiTrendingUp,
} from 'react-icons/fi'

const Watchlist = () => {
  const [watchlists, setWatchlists] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newWatchlistName, setNewWatchlistName] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedIds, setExpandedIds] = useState({})

  const { addToast } = useToast()
  const navigate = useNavigate()

  const fetchWatchlists = async () => {
    try {
      const res = await getWatchlists()
      if (res.data?.success) {
        const lists = res.data.data || []
        setWatchlists(lists)
        // Expand all by default
        const exp = {}
        lists.forEach((wl) => {
          exp[wl._id || wl.id] = true
        })
        setExpandedIds(exp)
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to load watchlists', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlists()
  }, [])

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleCreateWatchlist = async (e) => {
    e.preventDefault()
    if (!newWatchlistName.trim()) return

    setCreating(true)
    try {
      const res = await createWatchlist({ name: newWatchlistName.trim() })
      if (res.data?.success) {
        addToast(`Watchlist "${newWatchlistName}" created!`, 'success')
        setNewWatchlistName('')
        setCreateModalOpen(false)
        fetchWatchlists()
      } else {
        addToast(res.data?.message || 'Failed to create watchlist', 'error')
      }
    } catch (err) {
      addToast(err.message || 'Error creating watchlist', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleRemoveStock = async (watchlistId, symbol) => {
    try {
      const res = await removeFromWatchlist(watchlistId, symbol)
      if (res.data?.success) {
        addToast(`Removed ${symbol} from watchlist`, 'info')
        fetchWatchlists()
      } else {
        addToast(res.data?.message || 'Failed to remove stock', 'error')
      }
    } catch (err) {
      addToast(err.message || 'Error removing stock', 'error')
    }
  }

  const handleDeleteWatchlist = async (watchlistId, name) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" watchlist?`)) {
      return
    }

    try {
      const res = await deleteWatchlist(watchlistId)
      if (res.data?.success) {
        addToast(`Watchlist "${name}" deleted`, 'info')
        fetchWatchlists()
      } else {
        addToast(res.data?.message || 'Failed to delete watchlist', 'error')
      }
    } catch (err) {
      addToast(err.message || 'Error deleting watchlist', 'error')
    }
  }

  if (loading) {
    return <LoadingSpinner size="large" message="Loading your watchlists..." />
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Watchlists</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track tickers, organize portfolios, and monitor live price swings
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20"
        >
          <FiPlus className="text-base" />
          <span>New Watchlist</span>
        </button>
      </div>

      {/* Watchlist cards */}
      {watchlists.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
          <FiList className="mx-auto text-4xl text-slate-600 mb-3" />
          <h2 className="text-lg font-bold text-white">No Watchlists Yet</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Create custom lists to track top tech stocks, dividends, or high volatility movers.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20"
          >
            Create Your First Watchlist
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {watchlists.map((wl) => {
            const id = wl._id || wl.id
            const isExpanded = expandedIds[id] ?? true
            const stocksInList = wl.stocks || []

            return (
              <div
                key={id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-all"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between p-6 bg-slate-900/90 border-b border-slate-800/80">
                  <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => toggleExpand(id)}
                  >
                    <button className="text-slate-400 hover:text-white transition-colors">
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{wl.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {stocksInList.length} {stocksInList.length === 1 ? 'asset' : 'assets'} tracked
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/market')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <FiPlus />
                      <span>Add Symbols</span>
                    </button>
                    <button
                      onClick={() => handleDeleteWatchlist(id, wl.name)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Watchlist"
                    >
                      <FiTrash2 className="text-base" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-6">
                    {stocksInList.length === 0 ? (
                      <div className="text-center py-10 rounded-2xl bg-slate-950/40 border border-slate-800/50">
                        <p className="text-sm text-slate-400">No symbols added to this watchlist yet.</p>
                        <button
                          onClick={() => navigate('/market')}
                          className="mt-3 text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          <FiTrendingUp /> Browse Market & Add Stocks
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {stocksInList.map((stockItem) => {
                          // Handle if item is string symbol or object
                          const stockObj =
                            typeof stockItem === 'string'
                              ? { symbol: stockItem, name: stockItem, currentPrice: 0 }
                              : stockItem

                          return (
                            <StockCard
                              key={stockObj.symbol}
                              stock={stockObj}
                              showRemove={true}
                              onRemove={() => handleRemoveStock(id, stockObj.symbol)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Watchlist Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create New Watchlist</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateWatchlist} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Watchlist Name
                </label>
                <input
                  type="text"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="e.g. AI & Tech Leaders, High Dividends"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full mt-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Watchlist'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Watchlist
