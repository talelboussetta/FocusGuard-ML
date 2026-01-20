import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Home, Camera, Brain, BarChart3, MessageSquare, LogOut, Trophy, ChevronRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Leaf className="w-5 h-5" />, label: 'Garden', path: '/garden' },
    { icon: <Camera className="w-5 h-5" />, label: 'Camera', path: '/camera' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'AI Tutor', path: '/ai-tutor' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
    { icon: <Trophy className="w-5 h-5" />, label: 'Leaderboard', path: '/leaderboard' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <>
      {/* Hover Indicator - shows when sidebar is collapsed */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none"
          >
            <div className="flex items-center">
              <div className="w-1 h-16 bg-gradient-to-b from-transparent via-primary-500/50 to-transparent rounded-r-full" />
              <ChevronRight className="w-4 h-4 text-primary-400 animate-pulse ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isExpanded ? '18rem' : '5rem'
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="glass border-r border-slate-800/50 flex flex-col relative z-50"
      >
      {/* Logo */}
      <div className="p-6 border-b border-slate-800/50 overflow-hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nature-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <h1 className="text-xl font-display font-bold gradient-text whitespace-nowrap">
                FocusGuard
              </h1>
              <p className="text-xs text-slate-400 whitespace-nowrap">Grow your focus</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-hidden">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path
          return (
            <motion.button
              key={index}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02, x: isExpanded ? 4 : 0 }}
              whileTap={{ scale: 0.98 }}
              title={!isExpanded ? item.label : ''}
            >
              <span
                className={`flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-slate-400'}`}
              >
                {item.icon}
              </span>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && isExpanded && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800/50 overflow-hidden">
        <div className="group">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-xl glass-hover cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.username?.substring(0, 2).toUpperCase() || 'FW'}
            </div>
            {isExpanded && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1"
                >
                  <p className="text-sm font-medium text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis">{user?.username || 'Guest'}</p>
                  <p className="text-xs text-slate-400 whitespace-nowrap">Level {user?.lvl || 1} • {user?.xp_points || 0} XP</p>
                </motion.div>
                <button
                  onClick={handleLogout}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400 transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
    </>
  )
}

export default Sidebar
