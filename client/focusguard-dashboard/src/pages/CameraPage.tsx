import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, Wifi, WifiOff, AlertCircle, ArrowLeft, Maximize2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSessionContext } from '../contexts/SessionContext'
import { useNotificationContext } from '../contexts/NotificationContext'

interface DetectionData {
  person_detected: boolean
  phone_detected: boolean
  phone_usage_duration: number
  should_alert: boolean
  distraction_active: boolean
  total_distractions: number
  fps: number
  person_count: number
  phone_count: number
}

const CameraPage = () => {
  const navigate = useNavigate()
  const { activeSession, isTimerRunning } = useSessionContext()
  const { success: showSuccess, error: showError, warning: showWarning } = useNotificationContext()

  const [connected, setConnected] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [annotatedFrame, setAnnotatedFrame] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  // Connect WebSocket when camera is enabled
  useEffect(() => {
    if (!activeSession?.id || !cameraEnabled) {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setConnected(false)
      isConnectingRef.current = false
      return
    }

    // Prevent duplicate connections
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('No authentication token found')
      showError('Please login to use camera monitoring')
      console.error('❌ No access token in localStorage')
      return
    }

    isConnectingRef.current = true
    console.log('🔌 Connecting to WebSocket...')
    console.log('Session ID:', activeSession.id)
    console.log('Token:', token.substring(0, 20) + '...')
    const wsUrl = `ws://localhost:8000/distraction/ws/monitor?session_id=${activeSession.id}&token=${token}`
    console.log('WebSocket URL:', wsUrl.replace(token, 'TOKEN'))
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      setConnected(true)
      setError(null)
      isConnectingRef.current = false
      showSuccess('Camera monitoring connected')
      // Start sending frames now that connection is ready
      console.log('🎬 Starting frame capture after WebSocket connect')
      startFrameCapture()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 WebSocket message:', data)

        if (data.type === 'connection') {
          console.log('Monitoring started:', data.message)
        } else if (data.type === 'detection') {
          setDetectionData(data.data)
          if (data.annotated_frame) {
            setAnnotatedFrame(data.annotated_frame)
          }
        } else if (data.type === 'alert') {
          showWarning(data.data.message)
          playAlertSound()
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.message)
          setError(data.message)
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onerror = (event) => {
      console.error('❌ WebSocket error:', event)
      setError('Connection error - check console')
      setConnected(false)
      isConnectingRef.current = false
    }

    ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', { code: event.code, reason: event.reason, wasClean: event.wasClean })
      setConnected(false)
      isConnectingRef.current = false
      // Stop sending frames
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (event.code === 1008) {
        setError('Authentication failed - invalid or expired token')
        showError('Session token expired, please login again')
      } else if (!event.wasClean) {
        setError(`Connection closed unexpectedly (code: ${event.code})`)
      }
    }

    wsRef.current = ws

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [activeSession?.id, cameraEnabled, showError, showSuccess, showWarning])

  // Start webcam
  const startCamera = async () => {
    console.log('📹 Starting camera...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      console.log('✅ Camera stream obtained')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        streamRef.current = stream
        console.log('✅ Video playing, enabling camera')
        setCameraEnabled(true)
        setError(null)
        console.log('Camera enabled, WebSocket will auto-connect')
      }
    } catch (err: any) {
      console.error('❌ Camera access denied:', err)
      const errorMsg = err.message || 'Failed to access camera'
      setError(errorMsg)
      showError(errorMsg)
      setCameraEnabled(false)
    }
  }

  // Stop webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCameraEnabled(false)
    setAnnotatedFrame(null)
    setDetectionData(null)
  }

  // Capture and send frames
  const startFrameCapture = () => {
    console.log('🎬 Starting frame capture...')
    if (intervalRef.current) {
      console.log('⚠️ Clearing existing interval')
      clearInterval(intervalRef.current)
    }

    let frameCount = 0
    intervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return
      }

      if (!videoRef.current || !canvasRef.current) {
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return
      }

      // Draw video frame to canvas
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0)

      // Convert to base64 with lower quality for speed
      const frameData = canvas.toDataURL('image/jpeg', 0.5)

      // Send to server
      try {
        wsRef.current.send(JSON.stringify({
          type: 'frame',
          frame: frameData
        }))
        frameCount++
        if (frameCount % 30 === 0) {
          console.log(`📤 Sent ${frameCount} frames`)
        }
      } catch (err) {
        console.error('Failed to send frame:', err)
      }
    }, 333) // ~3 FPS for faster processing
  }

  // Cleanup
  const cleanup = () => {
    stopCamera()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }

  // Play alert sound
  const playAlertSound = () => {
    try {
      const audio = new Audio('/sounds/alert.mp3')
      audio.play().catch(() => {
        // Fallback: use beep
        const ctx = new AudioContext()
        const oscillator = ctx.createOscillator()
        oscillator.connect(ctx.destination)
        oscillator.frequency.value = 800
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.2)
      })
    } catch (err) {
      console.error('Alert sound error:', err)
    }
  }

  // Toggle camera
  const toggleCamera = () => {
    if (cameraEnabled) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-2xl max-w-md text-center"
        >
          <Camera className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h2 className="text-2xl font-display font-bold mb-2">No Active Session</h2>
          <p className="text-slate-400 mb-6">
            Start a focus session to enable camera monitoring.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-2xl font-display font-bold gradient-text">
              Focus Monitoring
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300">Disconnected</span>
                </>
              )}
            </div>

            {/* Camera Toggle */}
            <motion.button
              onClick={toggleCamera}
              className={`btn-primary flex items-center gap-2 ${
                cameraEnabled ? 'bg-red-500 hover:bg-red-600' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cameraEnabled ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Start Camera
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Camera Feed */}
        {/* Always render video/canvas for refs, hide when not enabled */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence>
          {cameraEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <div className="relative bg-slate-900" style={{ minHeight: '70vh' }}>
                {/* Display annotated frame */}
                {annotatedFrame ? (
                  <div className="relative">
                    <img
                      src={annotatedFrame}
                      alt="Annotated feed"
                      className="w-full h-auto"
                    />

                    {/* Detection Overlay */}
                    {detectionData && (
                      <div className="absolute top-6 left-6 right-6 space-y-3">
                        {/* Status Badges */}
                        <div className="flex gap-3 flex-wrap">
                          <div className={`glass px-4 py-2 rounded-xl text-sm font-medium ${
                            detectionData.person_detected
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            👤 {detectionData.person_detected ? 'Present' : 'Absent'}
                            {detectionData.person_count > 1 && ` (${detectionData.person_count})`}
                          </div>

                          {detectionData.phone_detected && (
                            <div className="glass px-4 py-2 rounded-xl text-sm font-medium bg-orange-500/20 text-orange-300">
                              📱 Phone detected ({detectionData.phone_usage_duration.toFixed(1)}s)
                            </div>
                          )}

                          {detectionData.distraction_active && (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                              className="glass px-4 py-2 rounded-xl text-sm font-medium bg-red-500/30 text-red-200"
                            >
                              ⚠️ Distraction Alert!
                            </motion.div>
                          )}
                        </div>

                        {/* Stats Panel */}
                        <div className="glass p-4 rounded-xl">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400 mb-1">FPS</p>
                              <p className="text-white font-bold text-xl">{detectionData.fps}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Distractions</p>
                              <p className="text-white font-bold text-xl">{detectionData.total_distractions}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Persons</p>
                              <p className="text-white font-bold text-xl">{detectionData.person_count}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Phones</p>
                              <p className="text-white font-bold text-xl">{detectionData.phone_count}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                      <p className="text-lg">Initializing camera...</p>
                      <p className="text-sm mt-2">Connecting to AI detection service</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        {!cameraEnabled && (
          <div className="glass p-6 rounded-2xl max-w-3xl mx-auto">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-primary-400" />
              How Camera Monitoring Works
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">✅ What We Detect:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Your presence at the desk</li>
                  <li>• Phone usage with proximity detection</li>
                  <li>• Duration of distractions</li>
                  <li>• Real-time bounding boxes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">🔒 Privacy First:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Frames processed in real-time</li>
                  <li>• No video recording or storage</li>
                  <li>• All processing happens locally</li>
                  <li>• You can stop anytime</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
              <p className="text-sm text-slate-300">
                <strong className="text-primary-400">Tip:</strong> For best results, ensure good lighting and position your camera at eye level. The AI will draw green boxes around detected persons and red boxes around phones.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CameraPage
