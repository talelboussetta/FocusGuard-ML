import { motion } from 'framer-motion'
import { Leaf, Home, Camera, Brain, BarChart3, MessageSquare, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Leaf className="w-5 h-5" />, label: 'Garden', path: '/garden' },
    { icon: <Camera className="w-5 h-5" />, label: 'Camera', path: '/camera' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'AI Tutor', path: '/ai-tutor' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
  ]

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-72 glass border-r border-slate-800/50 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nature-500 to-emerald-600 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold gradient-text">
              FocusGuard
            </h1>
            <p className="text-xs text-slate-400">Grow your focus</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
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
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <span
                className={isActive ? 'text-primary-400' : 'text-slate-400'}
              >
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {isActive && (
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
      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl glass-hover cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
            FW
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-200">Focus Warrior</p>
            <p className="text-xs text-slate-400">Level 12</p>
          </div>
          <LogOut className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.div>
  )
}

export default Sidebar
