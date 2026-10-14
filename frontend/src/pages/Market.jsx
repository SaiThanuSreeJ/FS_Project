import React, { useState, useEffect } from 'react'
import { getAllStocks, searchStocks, getTopGainers, getTopLosers } from '../services/api'
import StockCard from '../components/StockCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiSearch, FiFilter, FiTrendingUp, FiTrendingDown, FiGrid } from 'react-icons/fi'

const Market = () => {
  const [stocks, setStocks] = useState([])
  const [gainers, setGainers] = useState([])
  const [losers, setLosers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL', 'GAINERS', 'LOSERS'
  const [selectedSector, setSelectedSector] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  // Fetch baseline stock categories
  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true)
      try {
        const [allRes, gainersRes, losersRes] = await Promise.allSettled([
          getAllStocks(),
          getTopGainers(),
          getTopLosers(),
        ])

        if (allRes.status === 'fulfilled' && allRes.value.data?.success) {
          setStocks(allRes.value.data.data || [])
        }
        if (gainersRes.status === 'fulfilled' && gainersRes.value.data?.success) {
          setGainers(gainersRes.value.data.data || [])
        }
        if (losersRes.status === 'fulfilled' && losersRes.value.data?.success) {
          setLosers(losersRes.value.data.data || [])
        }
      } catch (err) {
        console.error('Failed to load market data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchStocks(searchQuery.trim())
        if (res.data?.success) {
          setStocks(res.data.data || [])
          setActiveTab('ALL')
        }
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset to all stocks if search cleared
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    if (val.trim() === '') {
      getAllStocks().then((res) => {
        if (res.data?.success) {
          setStocks(res.data.data || [])
        }
      })
    }
  }

  // Derive unique sectors
  const sectors = ['ALL', ...new Set(stocks.map((s) => s.sector).filter(Boolean))]

  // Determine current active list
  let displayStocks = stocks
  if (activeTab === 'GAINERS') {
    displayStocks = gainers
  } else if (activeTab === 'LOSERS') {
    displayStocks = losers
  }

  // Filter by sector if selected
  if (selectedSector !== 'ALL') {
    displayStocks = displayStocks.filter(
      (s) => (s.sector || '').toLowerCase() === selectedSector.toLowerCase()
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Market Discovery</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore real-time tickers, sector momentum, and top performing equities
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-lg">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by symbol or company (e.g. AAPL, Tesla, Microsoft)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="inline-block w-4 h-4 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Sector dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2">
            <FiFilter className="text-slate-500 text-sm" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent text-sm text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">
                All Sectors
              </option>
              {sectors
                .filter((s) => s !== 'ALL')
                .map((sector) => (
                  <option key={sector} value={sector} className="bg-slate-900 text-slate-200">
                    {sector}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FiGrid className="text-sm" />
          <span>All Stocks</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-slate-400">
            {stocks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('GAINERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'GAINERS'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FiTrendingUp className="text-sm text-emerald-400" />
          <span>Top Gainers</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-emerald-400">
            {gainers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('LOSERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'LOSERS'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FiTrendingDown className="text-sm text-red-400" />
          <span>Top Losers</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-red-400">
            {losers.length}
          </span>
        </button>
      </div>

      {/* Grid of Stock Cards */}
      {loading ? (
        <LoadingSpinner size="large" message="Scanning market instruments..." />
      ) : displayStocks.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl">
          <FiSearch className="mx-auto text-4xl text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No stocks found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn't find any instruments matching your query or sector filter. Try adjusting your search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayStocks.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Market
