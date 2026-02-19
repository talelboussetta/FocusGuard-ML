import { motion } from 'framer-motion'
import { Camera, Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DistractionMonitorProps {
  sessionId: string | null
  isActive: boolean
}

const DistractionMonitor = ({ sessionId, isActive }: DistractionMonitorProps) => {
  const navigate = useNavigate()

  const handleOpenCamera = () => {
    navigate('/camera')
  }

  if (!isActive || !sessionId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-6 rounded-xl text-center"
      >
        <Camera className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className="text-slate-300 mb-2">No Active Session</p>
        <p className="text-slate-400 text-sm">
          Start a focus session to enable camera monitoring
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold">Focus Monitoring</h3>
            <p className="text-slate-400 text-sm">AI-powered distraction detection</p>
          </div>
        </div>
        <motion.button
          onClick={handleOpenCamera}
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Video className="w-4 h-4" />
          Open Camera
        </motion.button>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">👤</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Presence Detection</p>
            <p className="text-xs text-slate-400">Monitors if you're at your desk</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📱</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Phone Detection</p>
            <p className="text-xs text-slate-400">Alerts when phone usage detected</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Real-time Analysis</p>
            <p className="text-xs text-slate-400">Live bounding boxes & metrics</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
        <p className="text-xs text-slate-300">
          <strong className="text-primary-400">🔒 Privacy:</strong> All processing happens locally. No video is recorded or stored.
        </p>
      </div>
    </motion.div>
  )
}

export default DistractionMonitor
