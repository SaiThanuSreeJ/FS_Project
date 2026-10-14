import React, { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  FiTrendingUp, 
  FiPieChart, 
  FiList, 
  FiShoppingBag, 
  FiGrid, 
  FiUser, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiDollarSign,
  FiChevronDown
} from 'react-icons/fi'

const Navbar = () => {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
    { name: 'Market', path: '/market', icon: FiTrendingUp },
    { name: 'Portfolio', path: '/portfolio', icon: FiPieChart },
    { name: 'Watchlist', path: '/watchlist', icon: FiList },
    { name: 'Orders', path: '/orders', icon: FiShoppingBag },
  ]

  const formatCurrency = (val) => {
    const num = Number(val) || 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num)
  }

  const handleLogout = () => {
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
    logout()
  }

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
                <FiTrendingUp className="text-xl text-slate-950 font-bold" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                Vesto<span className="text-emerald-500">.</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'text-emerald-400 bg-emerald-500/10 shadow-sm border border-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="text-base" />
                    <span>{link.name}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>

          {/* Right: Wallet & Profile */}
          <div className="hidden md:flex items-center gap-4">
            {/* Wallet pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <FiDollarSign className="text-xs" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider leading-none">
                  Wallet
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  {formatCurrency(user?.walletBalance ?? 0)}
                </span>
              </div>
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-medium transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="max-w-[120px] truncate">{user?.name || 'Account'}</span>
                <FiChevronDown
                  className={`text-slate-400 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 animate-slide-in">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-200 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <FiUser className="text-slate-400" />
                    <span>Profile & Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <FiLogOut className="text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          {/* Mobile Wallet Display */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <FiDollarSign className="text-sm" />
              </div>
              <span className="text-sm text-slate-400">Available Cash</span>
            </div>
            <span className="text-base font-bold text-emerald-400">
              {formatCurrency(user?.walletBalance ?? 0)}
            </span>
          </div>

          {/* Mobile Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="text-lg" />
                  <span>{link.name}</span>
                </NavLink>
              )
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-1">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900"
            >
              <FiUser className="text-lg text-slate-400" />
              <span>Profile ({user?.name})</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10"
            >
              <FiLogOut className="text-lg text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
