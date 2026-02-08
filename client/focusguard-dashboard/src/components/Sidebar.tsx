import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Home, Camera, BarChart3, MessageSquare, LogOut, Trophy, ChevronRight, Users, User } from 'lucide-react'
import moonImage from '../assets/images/moonjpg.jpg'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Leaf className="w-5 h-5" />, label: 'Garden', path: '/garden' },
    { icon: <Camera className="w-5 h-5" />, label: 'Camera', path: '/camera' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'AI Tutor', path: '/ai-tutor' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
    { icon: <Users className="w-5 h-5" />, label: 'Teams', path: '/teams' },
    { icon: <Trophy className="w-5 h-5" />, label: 'Leaderboard', path: '/leaderboard' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
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
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-white/10 shadow-[0_6px_14px_rgba(2,6,23,0.5)]">
            <img src={moonImage} alt="FocusGuard" className="w-full h-full object-cover" />
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
        <motion.button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-slate-400 hover:text-slate-200 hover:bg-white/5"
          whileHover={{ scale: 1.02, x: isExpanded ? 4 : 0 }}
          whileTap={{ scale: 0.98 }}
          title={!isExpanded ? 'Logout' : ''}
        >
          <span className="flex-shrink-0 text-slate-400">
            <LogOut className="w-5 h-5" />
          </span>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-medium whitespace-nowrap"
            >
              Logout
            </motion.span>
          )}
        </motion.button>
      </nav>
    </motion.div>
    </>
  )
}

export default Sidebar

