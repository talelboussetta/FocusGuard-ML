import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, User, UserX, Activity, Eye, AlertCircle, CheckCircle2, Brain, TrendingDown, TrendingUp } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PoseLandmarker, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import notificationIcon from '../assets/images/garden_images/GST DACAR 121-02.png'

type FocusState = 'focused' | 'distracted' | 'neutral'
type DistractionReason = 'out_of_frame' | 'looking_away' | 'head_down_too_long' | 'no_face' | null

const CameraPage = () => {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [userPresent, setUserPresent] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [blinkRate, setBlinkRate] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showRefreshNotification, setShowRefreshNotification] = useState(false)
  const [cameraError, setCameraError] = useState<'permission' | 'not-found' | null>(null)
  
  // New focus tracking states
  const [focusState, setFocusState] = useState<FocusState>('neutral')
  const [headPitch, setHeadPitch] = useState(0) // Up/down (-90 to +90)
  const [headYaw, setHeadYaw] = useState(0)     // Left/right (-90 to +90)
  const [distractionReason, setDistractionReason] = useState<DistractionReason>(null)
  const [focusedTime, setFocusedTime] = useState(0)
  const [distractedTime, setDistractionTime] = useState(0)
  const [totalDistractions, setTotalDistractions] = useState(0)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  
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
  
  // New refs for focus tracking
  const lastFocusStateRef = useRef<FocusState>('neutral')
  const focusStartTimeRef = useRef<number>(Date.now())
  const distractionStartTimeRef = useRef<number | null>(null)
  const headDownStartTimeRef = useRef<number | null>(null)
  const lastNotificationTimeRef = useRef<number>(0)

  // Request notification permission
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        setNotificationsEnabled(permission === 'granted')
      } else if (Notification.permission === 'granted') {
        setNotificationsEnabled(true)
      }
    }
    requestNotificationPermission()
  }, [])

  // Timer to track focus/distraction duration
  useEffect(() => {
    if (!isDetecting) return

    const interval = setInterval(() => {
      if (focusState === 'focused') {
        setFocusedTime(prev => prev + 1)
      } else if (focusState === 'distracted') {
        setDistractionTime(prev => prev + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isDetecting, focusState])

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
      setCameraError(null)
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
    } catch (error: any) {
      console.error('Error accessing camera:', error)
      
      // Determine error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('permission')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('not-found')
      } else {
        setCameraError('permission') // Default to permission error
      }
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
    
    // Reset focus tracking
    setFocusState('neutral')
    setHeadPitch(0)
    setHeadYaw(0)
    setDistractionReason(null)
    setFocusedTime(0)
    setDistractionTime(0)
    setTotalDistractions(0)
    lastFocusStateRef.current = 'neutral'
    focusStartTimeRef.current = Date.now()
    distractionStartTimeRef.current = null
    headDownStartTimeRef.current = null
    
    console.log('✅ Camera stopped successfully')
  }

  // Show browser notification for distraction
  const showDistractionNotification = (reason: string) => {
    if (!notificationsEnabled) return
    
    const now = Date.now()
    // Throttle notifications to max 1 per 10 seconds
    if (now - lastNotificationTimeRef.current < 10000) return
    
    lastNotificationTimeRef.current = now
    
    new Notification('FocusGuard - Stay Focused! 🎯', {
      body: reason,
      icon: notificationIcon,
      badge: notificationIcon,
      tag: 'focus-distraction',
      requireInteraction: false,
    })
  }

  // Calculate head pose from face landmarks
  const calculateHeadPose = (faceLandmarks: any[]): { pitch: number; yaw: number } => {
    // Key face landmarks for pose estimation
    // 1: Nose tip, 33: Left eye outer corner, 263: Right eye outer corner
    // 152: Chin, 10: Upper lip
    
    const noseTip = faceLandmarks[1]
    const leftEye = faceLandmarks[33]
    const rightEye = faceLandmarks[263]
    const chin = faceLandmarks[152]
    const forehead = faceLandmarks[10]
    
    if (!noseTip || !leftEye || !rightEye || !chin || !forehead) {
      return { pitch: 0, yaw: 0 }
    }
    
    // Yaw (left-right rotation): based on eye symmetry
    const eyeMidpoint = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2
    }
    const yaw = (noseTip.x - eyeMidpoint.x) * 180 // Scale to degrees
    
    // Pitch (up-down rotation): based on nose-chin distance
    const verticalCenter = (forehead.y + chin.y) / 2
    const pitch = (noseTip.y - verticalCenter) * 100 // Scale to degrees
    
    return { 
      pitch: Math.max(-90, Math.min(90, pitch)), 
      yaw: Math.max(-90, Math.min(90, yaw))
    }
  }

  // Classify focus state based on head pose and presence
  const classifyFocusState = (
    faceDetected: boolean,
    poseDetected: boolean,
    pitch: number,
    yaw: number,
    faceInFrame: boolean
  ): { state: FocusState; reason: DistractionReason } => {
    const now = Date.now()
    
    // Priority 1: No face or pose detected
    if (!poseDetected) {
      return { state: 'distracted', reason: 'out_of_frame' }
    }
    
    if (!faceDetected || !faceInFrame) {
      return { state: 'distracted', reason: 'no_face' }
    }
    
    // Priority 2: Looking away (yaw > 30 degrees left/right OR pitch up > 20)
    if (Math.abs(yaw) > 30 || pitch > 20) {
      return { state: 'distracted', reason: 'looking_away' }
    }
    
    // Priority 3: Head down (reading/writing) - focused for short periods, distracted if too long
    if (pitch < -15) {
      if (!headDownStartTimeRef.current) {
        headDownStartTimeRef.current = now
      }
      
      const headDownDuration = (now - headDownStartTimeRef.current) / 1000
      
      // Head down for < 30 seconds = focused (studying)
      // Head down for > 30 seconds = might be sleeping/distracted
      if (headDownDuration < 30) {
        return { state: 'focused', reason: null }
      } else {
        return { state: 'distracted', reason: 'head_down_too_long' }
      }
    } else {
      headDownStartTimeRef.current = null
    }
    
    // Default: Focused (looking at screen)
    return { state: 'focused', reason: null }
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
    
    // Run face detection for blink tracking + head pose
    let faceResults = null
    if (faceLandmarkerRef.current) {
      faceResults = faceLandmarkerRef.current.detectForVideo(video, startTimeMs)
    }

    // Check if person detected
    const poseDetected = poseResults.landmarks && poseResults.landmarks.length > 0
    const faceDetected = !!(faceResults && faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0)
    
    setUserPresent(poseDetected)

    let currentPitch = 0
    let currentYaw = 0
    let faceInFrame = false

    if (poseDetected) {
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

    // Process face landmarks for head pose and blinks
    if (faceDetected && faceResults && faceResults.faceLandmarks && faceResults.faceLandmarks[0]) {
      const faceLandmarks = faceResults.faceLandmarks[0]
      
      // Check if face is reasonably centered in frame (x between 0.2 and 0.8)
      const noseTip = faceLandmarks[1]
      if (noseTip && noseTip.x > 0.15 && noseTip.x < 0.85 && noseTip.y > 0.1 && noseTip.y < 0.9) {
        faceInFrame = true
      }
      
      // Calculate head pose
      const pose = calculateHeadPose(faceLandmarks)
      currentPitch = pose.pitch
      currentYaw = pose.yaw
      setHeadPitch(pose.pitch)
      setHeadYaw(pose.yaw)
      
      // Draw face landmarks
      drawFaceLandmarks(ctx, faceLandmarks, canvas.width, canvas.height)
    }

    // Classify focus state
    const { state: newFocusState, reason } = classifyFocusState(
      faceDetected,
      poseDetected,
      currentPitch,
      currentYaw,
      faceInFrame
    )
    
    setFocusState(newFocusState)
    setDistractionReason(reason)
    
    // Track state changes
    if (newFocusState !== lastFocusStateRef.current) {
      if (newFocusState === 'distracted' && lastFocusStateRef.current === 'focused') {
        setTotalDistractions(prev => prev + 1)
        distractionStartTimeRef.current = Date.now()
        
        // Show notification
        const reasonText = reason === 'out_of_frame' ? 'You moved out of frame!' :
                          reason === 'looking_away' ? 'You\'re looking away from the screen' :
                          reason === 'head_down_too_long' ? 'Head down for too long - take a break?' :
                          reason === 'no_face' ? 'Face not detected' :
                          'Stay focused!'
        showDistractionNotification(reasonText)
      } else if (newFocusState === 'focused' && lastFocusStateRef.current === 'distracted') {
        distractionStartTimeRef.current = null
      }
      
      lastFocusStateRef.current = newFocusState
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

  const drawFaceLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) => {
    // Draw key face points (eyes, nose, mouth outline)
    const keyPoints = [1, 33, 133, 263, 362, 61, 291] // Nose, eye corners, mouth corners
    
    ctx.fillStyle = 'rgba(34, 197, 94, 0.7)' // Green
    keyPoints.forEach(idx => {
      const point = landmarks[idx]
      if (point) {
        ctx.beginPath()
        ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
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
      
      // Reset focus tracking
      setFocusState('neutral')
      setFocusedTime(0)
      setDistractionTime(0)
      setTotalDistractions(0)
      lastFocusStateRef.current = 'neutral'
      focusStartTimeRef.current = Date.now()
      distractionStartTimeRef.current = null
      headDownStartTimeRef.current = null
      
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

  // Helper to format time in MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get distraction reason text
  const getDistractionText = (reason: DistractionReason): string => {
    switch (reason) {
      case 'out_of_frame': return '📹 You moved out of frame'
      case 'looking_away': return '👀 Looking away from screen'
      case 'head_down_too_long': return '😴 Head down too long'
      case 'no_face': return '👤 Face not detected'
      default: return ''
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

        {/* Main Layout - Camera and Right Side Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Camera Feed - Takes 2/3 width on desktop */}
          <div className="lg:col-span-3 space-y-6">
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
                      <div className="text-center max-w-md px-6">
                        {cameraError ? (
                          <>
                            <div className="mb-6">
                              {cameraError === 'permission' ? (
                                <AlertCircle className="w-24 h-24 text-amber-500 mx-auto mb-4" />
                              ) : (
                                <CameraOff className="w-24 h-24 text-slate-500 mx-auto mb-4" />
                              )}
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white mb-3">
                              {cameraError === 'permission' ? 'Camera Access Denied' : 'No Webcam Found'}
                            </h3>
                            
                            <p className="text-slate-300 mb-6">
                              {cameraError === 'permission' 
                                ? 'Please allow camera access in your browser settings to use presence detection.'
                                : 'No webcam detected. Please connect a webcam to use this feature.'}
                            </p>
                            
                            <div className="space-y-3">
                              <Button
                                onClick={startCamera}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Try Again
                              </Button>
                              
                              {cameraError === 'permission' && (
                                <div className="text-xs text-slate-400 bg-slate-800/50 rounded-lg p-3">
                                  <p className="font-semibold mb-1">How to enable camera:</p>
                                  <p>1. Click the camera icon in your browser's address bar</p>
                                  <p>2. Select "Allow" for camera access</p>
                                  <p>3. Click "Try Again" above</p>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <CameraOff className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">Camera is off</p>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Detection Status Badge */}
                {isCameraOn && (
                  <div className="absolute top-4 right-4 flex gap-2 flex-col items-end">
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
                      <>
                        <Badge className="bg-purple-600 text-white px-3 py-2 animate-pulse">
                          <Activity className="w-4 h-4" />
                        </Badge>
                        
                        {/* Focus State Badge */}
                        <motion.div
                          animate={{
                            scale: focusState === 'distracted' ? [1, 1.05, 1] : 1
                          }}
                          transition={{ duration: 0.5, repeat: focusState === 'distracted' ? Infinity : 0 }}
                        >
                          <Badge className={`text-sm px-4 py-2 flex items-center gap-2 font-semibold ${
                            focusState === 'focused' 
                              ? 'bg-green-600 text-white' 
                              : focusState === 'distracted'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-600 text-white'
                          }`}>
                            {focusState === 'focused' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Focused
                              </>
                            ) : focusState === 'distracted' ? (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                Distracted
                              </>
                            ) : (
                              'Idle'
                            )}
                          </Badge>
                        </motion.div>
                      </>
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

            {/* Cards Below Camera - Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Productivity Stats */}
              <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Session Stats
                </h3>
                
                <div className="space-y-4">
                  {/* Focused Time */}
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        Focused Time
                      </span>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatTime(focusedTime)}
                    </div>
                  </div>

                  {/* Distracted Time */}
                  <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg p-4 border border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        Distracted Time
                      </span>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      {formatTime(distractedTime)}
                    </div>
                  </div>

                  {/* Distraction Count */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Total Distractions</span>
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="text-3xl font-bold text-orange-400">{totalDistractions}</div>
                  </div>

                  {/* Focus Rate */}
                  {(focusedTime + distractedTime) > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Focus Rate</span>
                        <span className="font-semibold text-purple-400">
                          {Math.round((focusedTime / (focusedTime + distractedTime)) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-600 to-green-500"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(focusedTime / (focusedTime + distractedTime)) * 100}%` 
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Detection Metrics */}
              <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Detection Metrics
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
            </div>
          </div>

          {/* Right Side Stats Panel - Smaller width */}
          <div className="lg:col-span-1 space-y-6">
            {/* Focus State Card - NEW */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className={`backdrop-blur-xl border-2 p-6 transition-all duration-300 ${
                focusState === 'focused' 
                  ? 'bg-green-900/30 border-green-500/50 shadow-green-500/20' 
                  : focusState === 'distracted'
                  ? 'bg-red-900/30 border-red-500/50 shadow-red-500/20'
                  : 'bg-slate-900/50 border-purple-500/20'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Brain className={`w-5 h-5 ${
                      focusState === 'focused' ? 'text-green-400' : 
                      focusState === 'distracted' ? 'text-red-400' : 
                      'text-purple-400'
                    }`} />
                    Focus Status
                  </h3>
                  {focusState === 'focused' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400 animate-pulse" />
                  ) : focusState === 'distracted' ? (
                    <AlertCircle className="w-6 h-6 text-red-400 animate-pulse" />
                  ) : null}
                </div>
                
                <div className={`text-3xl font-bold mb-2 ${
                  focusState === 'focused' ? 'text-green-400' :
                  focusState === 'distracted' ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {focusState === 'focused' ? '🎯 Focused' :
                   focusState === 'distracted' ? '⚠️ Distracted' :
                   '⏸️ Idle'}
                </div>
                
                {distractionReason && (
                  <p className="text-sm text-red-300 mb-3">
                    {getDistractionText(distractionReason)}
                  </p>
                )}
                
                {/* Head Pose Indicators */}
                {isDetecting && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Head Tilt</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          Math.abs(headYaw) < 15 ? 'bg-green-400' :
                          Math.abs(headYaw) < 30 ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`} />
                        <span className="text-sm font-semibold text-white">
                          {headYaw > 0 ? 'Right' : headYaw < 0 ? 'Left' : 'Center'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Head Angle</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          headPitch > -15 && headPitch < 20 ? 'bg-green-400' :
                          'bg-yellow-400'
                        }`} />
                        <span className="text-sm font-semibold text-white">
                          {headPitch < -15 ? 'Down' : headPitch > 20 ? 'Up' : 'Level'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Productivity Stats - NEW */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Session Stats
              </h3>
              
              <div className="space-y-4">
                {/* Focused Time */}
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      Focused Time
                    </span>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatTime(focusedTime)}
                  </div>
                </div>

                {/* Distracted Time */}
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      Distracted Time
                    </span>
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {formatTime(distractedTime)}
                  </div>
                </div>

                {/* Distraction Count */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Total Distractions</span>
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-3xl font-bold text-orange-400">{totalDistractions}</div>
                </div>

                {/* Focus Rate */}
                {(focusedTime + distractedTime) > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Focus Rate</span>
                      <span className="font-semibold text-purple-400">
                        {Math.round((focusedTime / (focusedTime + distractedTime)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-600 to-green-500"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(focusedTime / (focusedTime + distractedTime)) * 100}%` 
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Detection Stats */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Detection Metrics
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
              
              {/* Notification Toggle */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Browser Notifications</div>
                    <div className="text-xs text-slate-400">Alert when distracted</div>
                  </div>
                  <div className={`relative inline-flex items-center cursor-pointer ${
                    notificationsEnabled ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <span className="text-xs text-slate-400 mr-2">
                      {notificationsEnabled ? 'ON' : 'OFF'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      notificationsEnabled ? 'bg-green-400 animate-pulse' : 'bg-slate-600'
                    }`} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="bg-slate-900/30 backdrop-blur-xl border-slate-700/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                💡 Focus Tips
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Head down = Studying (focused)</li>
                <li>• Looking at screen = Focused</li>
                <li>• Looking away = Distracted</li>
                <li>• Out of frame = Distracted</li>
                <li>• Good lighting improves accuracy</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraPage
