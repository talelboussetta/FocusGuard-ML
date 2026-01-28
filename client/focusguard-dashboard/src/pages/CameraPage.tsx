import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, User, UserX, Activity, Eye } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PoseLandmarker, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const CameraPage = () => {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [userPresent, setUserPresent] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [blinkRate, setBlinkRate] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showRefreshNotification, setShowRefreshNotification] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastDetectionTimeRef = useRef<number>(0)
  const isDetectingRef = useRef<boolean>(false)
  const blinkCountRef = useRef<number>(0)
  const blinkTimestampsRef = useRef<number[]>([])
  const lastEyeStateRef = useRef<'open' | 'closed'>('open')

  // Initialize MediaPipe Detectors
  useEffect(() => {
    const initializeDetectors = async () => {
      setIsLoading(true)
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        
        // Initialize Pose Landmarker
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.3,
          minPosePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3
        })
        
        // Initialize Face Landmarker for blink detection
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.3,
          minFacePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
          outputFaceBlendshapes: true  // Enable blendshapes for blink detection
        })
        
        poseLandmarkerRef.current = poseLandmarker
        faceLandmarkerRef.current = faceLandmarker
        console.log('✅ MediaPipe Detectors initialized (Pose + Face)')
      } catch (error) {
        console.error('Failed to initialize MediaPipe:', error)
        setShowRefreshNotification(true)
      } finally {
        setIsLoading(false)
      }
    }

    initializeDetectors()

    return () => {
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close()
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close()
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsCameraOn(true)
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    console.log('🛑 Stopping camera...')
    
    // Stop detection first
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      console.log('✅ Cancelled animation frame')
    }
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
    
    // Pause and stop video
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      console.log('✅ Video paused and cleared')
    }
    
    // Stop all media tracks
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      console.log(`🎥 Stopping ${tracks.length} media tracks`)
      tracks.forEach((track) => {
        console.log(`  Stopping track: ${track.kind} (${track.label})`)
        track.stop()
      })
      streamRef.current = null
    }
    
    // Reset states
    setIsCameraOn(false)
    setIsDetecting(false)
    isDetectingRef.current = false
    setUserPresent(false)
    setConfidence(0)
    setBlinkRate(0)
    blinkCountRef.current = 0
    blinkTimestampsRef.current = []
    lastEyeStateRef.current = 'open'
    
    console.log('✅ Camera stopped successfully')
  }

  const detectPose = async () => {
    if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
      console.warn('⚠️ Missing refs:', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        landmarker: !!poseLandmarkerRef.current
      })
      return
    }
    
    if (!isDetectingRef.current) {
      console.log('⏸️ Detection stopped, exiting loop')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectPose)
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Run pose detection
    const startTimeMs = performance.now()
    const poseResults = poseLandmarkerRef.current.detectForVideo(video, startTimeMs)
    
    // Run face detection for blink tracking
    let faceResults = null
    if (faceLandmarkerRef.current) {
      faceResults = faceLandmarkerRef.current.detectForVideo(video, startTimeMs)
    }

    // Check if person detected
    const detected = poseResults.landmarks && poseResults.landmarks.length > 0
    setUserPresent(detected)

    if (detected) {
      const landmark = poseResults.landmarks[0]
      
      // Calculate average confidence from key landmarks
      const keyLandmarks = [0, 11, 12, 23, 24] // nose, shoulders, hips
      const avgConfidence = keyLandmarks.reduce((sum, idx) => {
        return sum + (landmark[idx]?.visibility || 0)
      }, 0) / keyLandmarks.length
      setConfidence(Math.round(avgConfidence * 100))

      // Draw beautiful pose visualization
      drawPoseVisualization(ctx, landmark, canvas.width, canvas.height)
      
      lastDetectionTimeRef.current = Date.now()
    } else {
      // Check if we recently lost detection
      if (Date.now() - lastDetectionTimeRef.current > 2000) {
        setConfidence(0)
      }
    }

    // Detect blinks
    if (faceResults && faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
      const blendshapes = faceResults.faceBlendshapes[0].categories
      
      // Get eye closure values (eyeBlinkLeft and eyeBlinkRight)
      const leftEyeBlink = blendshapes.find(b => b.categoryName === 'eyeBlinkLeft')?.score || 0
      const rightEyeBlink = blendshapes.find(b => b.categoryName === 'eyeBlinkRight')?.score || 0
      const avgBlink = (leftEyeBlink + rightEyeBlink) / 2
      
      // Detect blink (threshold ~0.5)
      const isBlinking = avgBlink > 0.5
      
      if (isBlinking && lastEyeStateRef.current === 'open') {
        // New blink detected
        blinkCountRef.current++
        const now = Date.now()
        blinkTimestampsRef.current.push(now)
        
        // Keep only blinks from last 60 seconds
        blinkTimestampsRef.current = blinkTimestampsRef.current.filter(
          timestamp => now - timestamp < 60000
        )
        
        // Calculate blinks per minute
        const bpm = blinkTimestampsRef.current.length
        setBlinkRate(bpm)
        
        lastEyeStateRef.current = 'closed'
      } else if (!isBlinking && lastEyeStateRef.current === 'closed') {
        lastEyeStateRef.current = 'open'
      }
    }

    // Continue detection loop
    animationFrameRef.current = requestAnimationFrame(detectPose)
  }

  const drawPoseVisualization = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) => {
    // Draw glowing aura around person
    const nose = landmarks[0]
    if (nose && nose.visibility > 0.5) {
      const x = nose.x * width
      const y = nose.y * height

      // Create radial gradient for glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 200)
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)')
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)')
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }

    // Draw skeleton connections
    const connections = [
      [11, 12], // shoulders
      [11, 23], [12, 24], // torso
      [23, 24], // hips
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28], // right leg
    ]

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start]
      const endPoint = landmarks[end]
      
      if (startPoint && endPoint && 
          startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
        ctx.beginPath()
        ctx.moveTo(startPoint.x * width, startPoint.y * height)
        ctx.lineTo(endPoint.x * width, endPoint.y * height)
        ctx.stroke()
      }
    })

    // Draw landmark points
    landmarks.forEach((landmark, index) => {
      if (landmark && landmark.visibility > 0.5) {
        const x = landmark.x * width
        const y = landmark.y * height
        
        // Key points are larger and brighter
        const isKeyPoint = [0, 11, 12, 23, 24].includes(index)
        const radius = isKeyPoint ? 6 : 4
        
        // Glow effect
        ctx.shadowColor = 'rgba(139, 92, 246, 0.8)'
        ctx.shadowBlur = 10
        
        ctx.fillStyle = isKeyPoint ? '#a78bfa' : '#c4b5fd'
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
        
        ctx.shadowBlur = 0
      }
    })

    // Draw bounding box
    const visibleLandmarks = landmarks.filter(l => l && l.visibility > 0.5)
    if (visibleLandmarks.length > 0) {
      const xs = visibleLandmarks.map(l => l.x * width)
      const ys = visibleLandmarks.map(l => l.y * height)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      
      const padding = 20
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 5])
      ctx.strokeRect(
        minX - padding,
        minY - padding,
        maxX - minX + padding * 2,
        maxY - minY + padding * 2
      )
      ctx.setLineDash([])
    }
  }

  const toggleDetection = () => {
    console.log('🎯 toggleDetection called, current state:', { isCameraOn, isDetecting })
    
    if (!isCameraOn) {
      alert('Please start the camera first')
      return
    }
    
    if (!poseLandmarkerRef.current || !faceLandmarkerRef.current) {
      alert('Detection models not ready. Please wait...')
      console.error('❌ Landmarkers not initialized')
      return
    }
    
    const newState = !isDetecting
    console.log('📊 Setting detection state to:', newState)
    
    // Update both state and ref
    setIsDetecting(newState)
    isDetectingRef.current = newState
    
    if (newState) {
      console.log('✅ Starting detection loop...')
      blinkCountRef.current = 0
      blinkTimestampsRef.current = []
      setBlinkRate(0)
      console.log('🚀 Calling detectPose() immediately')
      detectPose()
    } else {
      console.log('⏸️ Stopping detection...')
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Hard Refresh Notification */}
      {showRefreshNotification && (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center">
          <div className="bg-red-600 text-white px-6 py-3 rounded-b-lg shadow-lg flex items-center gap-4 mt-0 animate-fade-in">
            <span className="font-semibold">Failed to load AI models.</span>
            <span>Please <b>hard refresh</b> (Ctrl+Shift+R or Cmd+Shift+R) to fix this issue.</span>
            <button
              className="ml-4 px-3 py-1 bg-red-800 rounded hover:bg-red-700 transition"
              onClick={() => setShowRefreshNotification(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <Sidebar />
      <div className="flex-1 p-8 ml-64">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Camera className="w-10 h-10 text-purple-400" />
            Presence Detection
          </h1>
          <p className="text-slate-400">
            AI-powered presence monitoring using MediaPipe (runs locally in your browser)
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera Feed */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-500/20 p-6">
              <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
                {/* Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Canvas Overlay for Pose Detection */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                />

                {/* Status Overlay */}
                <AnimatePresence>
                  {!isCameraOn && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-slate-950/80"
                    >
                      <div className="text-center">
                        <CameraOff className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg">Camera is off</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Detection Status Badge */}
                {isCameraOn && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge
                      variant={userPresent ? 'success' : 'warning'}
                      className="text-sm px-4 py-2 flex items-center gap-2"
                    >
                      {userPresent ? (
                        <>
                          <User className="w-4 h-4" />
                          User Present ({confidence}%)
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4" />
                          No User Detected
                        </>
                      )}
                    </Badge>
                    
                    {isDetecting && (
                      <Badge className="bg-purple-600 text-white px-3 py-2 animate-pulse">
                        <Activity className="w-4 h-4" />
                      </Badge>
                    )}
                  </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-white">Loading AI model...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-4 mt-6">
                <Button
                  onClick={isCameraOn ? stopCamera : startCamera}
                  variant={isCameraOn ? 'secondary' : 'primary'}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isCameraOn ? (
                    <>
                      <CameraOff className="mr-2 w-5 h-5" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 w-5 h-5" />
                      Start Camera
                    </>
                  )}
                </Button>

                <Button
                  onClick={toggleDetection}
                  variant={isDetecting ? 'danger' : 'success'}
                  className="flex-1"
                  disabled={!isCameraOn || isLoading}
                >
                  {isDetecting ? (
                    <>
                      <UserX className="mr-2 w-5 h-5" />
                      Stop Detection
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 w-5 h-5" />
                      Start Detection
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Detection Stats */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Live Metrics
              </h3>
              
              <div className="space-y-4">
                {/* User Status */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">User Status</span>
                    {userPresent ? (
                      <User className="w-5 h-5 text-green-400" />
                    ) : (
                      <UserX className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {userPresent ? (
                      <span className="text-green-400">Detected</span>
                    ) : (
                      <span className="text-slate-500">Not Detected</span>
                    )}
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Detection Confidence</span>
                    <span className={`font-semibold ${confidence > 60 ? 'text-green-400' : confidence > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {confidence}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${confidence > 60 ? 'bg-gradient-to-r from-green-600 to-green-400' : confidence > 30 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Blink Rate */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Blink Rate</span>
                    <Eye className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{blinkRate}</span>
                    <span className="text-slate-400 text-sm">blinks/min</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {blinkRate < 10 ? '😴 Low' : blinkRate < 20 ? '👁️ Normal' : '😳 High'}
                  </div>
                </div>

                {/* Detection Status */}
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Detection</span>
                    <Badge variant={isDetecting ? 'success' : 'default'} className="text-sm">
                      {isDetecting ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        'Inactive'
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 backdrop-blur-xl border-purple-500/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                🔒 Privacy First
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Runs entirely in your browser</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>No video data sent to servers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>AI model runs locally</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Powered by Google MediaPipe</span>
                </li>
              </ul>
            </Card>

            {/* Tips Card */}
            <Card className="bg-slate-900/30 backdrop-blur-xl border-slate-700/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                💡 Tips
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Ensure good lighting for better detection</li>
                <li>• Position yourself centered in frame</li>
                <li>• Keep upper body visible</li>
                <li>• Works best at arm's length distance</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraPage
