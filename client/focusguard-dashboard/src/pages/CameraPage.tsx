import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, CameraOff, Play, Pause, Eye, TrendingUp, Clock } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Progress } from '../components/ui/Progress'

const CameraPage = () => {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [blinkCount, setBlinkCount] = useState(0)
  const [focusQuality, setFocusQuality] = useState(85)
  const [sessionTime, setSessionTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isMonitoring) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1)
        // Simulate focus quality changes
        setFocusQuality((prev) => Math.max(60, Math.min(100, prev + (Math.random() - 0.5) * 5)))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isMonitoring])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setIsCameraOn(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOn(false)
    setIsMonitoring(false)
  }

  const toggleMonitoring = () => {
    if (!isCameraOn) {
      alert('Please start the camera first')
      return
    }
    setIsMonitoring(!isMonitoring)
    if (!isMonitoring) {
      setBlinkCount(0)
      setSessionTime(0)
      setFocusQuality(85)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-display font-bold mb-2">
              Focus <span className="gradient-text">Detection</span>
            </h1>
            <p className="text-slate-400">
              AI-powered focus tracking (100% local processing)
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Camera Feed */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="relative overflow-hidden h-[500px]">
                {isCameraOn ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {isMonitoring && (
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-medium">Recording</span>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                      <Button
                        variant={isMonitoring ? 'danger' : 'success'}
                        onClick={toggleMonitoring}
                      >
                        {isMonitoring ? (
                          <>
                            <Pause size={18} className="mr-2" />
                            Stop Monitoring
                          </>
                        ) : (
                          <>
                            <Play size={18} className="mr-2" />
                            Start Monitoring
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" onClick={stopCamera}>
                        <CameraOff size={18} className="mr-2" />
                        Stop Camera
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <CameraOff className="text-slate-600 mb-4" size={64} />
                    <h3 className="text-xl font-bold text-slate-300 mb-2">
                      Camera Off
                    </h3>
                    <p className="text-slate-500 mb-6 text-center max-w-md">
                      Start your camera to begin focus detection. All processing happens locally on your device.
                    </p>
                    <Button onClick={startCamera}>
                      <Camera size={18} className="mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Stats Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Focus Quality */}
              <Card variant="gradient">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Focus Quality</p>
                    <p className="text-3xl font-bold text-white">{focusQuality}%</p>
                  </div>
                  <div className="p-3 bg-primary-500/20 rounded-xl">
                    <TrendingUp className="text-primary-400" size={24} />
                  </div>
                </div>
                <Progress
                  value={focusQuality}
                  variant={focusQuality > 80 ? 'success' : focusQuality > 60 ? 'warning' : 'danger'}
                />
                <Badge
                  variant={focusQuality > 80 ? 'success' : focusQuality > 60 ? 'warning' : 'danger'}
                  className="mt-3"
                >
                  {focusQuality > 80 ? 'Excellent' : focusQuality > 60 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </Card>

              {/* Blink Count */}
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Blinks Detected</p>
                    <p className="text-3xl font-bold text-white">{blinkCount}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Normal: 15-20 per minute
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Eye className="text-purple-400" size={24} />
                  </div>
                </div>
              </Card>

              {/* Session Time */}
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Session Time</p>
                    <p className="text-3xl font-bold text-white">{formatTime(sessionTime)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isMonitoring ? 'Active monitoring' : 'Not monitoring'}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Clock className="text-emerald-400" size={24} />
                  </div>
                </div>
              </Card>

              {/* Instructions */}
              <Card variant="glass">
                <h4 className="text-sm font-semibold text-white mb-2">
                  💡 Tips for Best Results
                </h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li>• Ensure good lighting on your face</li>
                  <li>• Position camera at eye level</li>
                  <li>• Maintain 50-70cm distance</li>
                  <li>• Look directly at the screen</li>
                </ul>
              </Card>
            </motion.div>
          </div>

          {/* Integration Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card variant="glass">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Camera className="text-blue-400" size={24} />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">
                    Ready for Backend Integration
                  </h4>
                  <p className="text-sm text-slate-400">
                    This UI is ready to connect with your OpenCV blink detector. Video feed can be sent to{' '}
                    <code className="text-primary-400">http://localhost:5000/api/detect</code> for real-time analysis.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CameraPage
