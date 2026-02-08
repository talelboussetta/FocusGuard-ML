import { useState, useEffect } from 'react'
import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Timer, MessageSquare, Sprout, Lock, ChevronRight, Play, Shield, Eye, Zap, TrendingUp, Users, Check } from 'lucide-react'
import moonImage from '../assets/images/moonjpg.jpg'

const LandingPage = () => {
  const navigate = useNavigate()
  
  // Mouse parallax for orb
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 })
  
  const [isOrbHovered, setIsOrbHovered] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0) // 0=Timer, 1=AI, 2=Garden
  const [starSpin, setStarSpin] = useState(0)
  const [moonSpin, setMoonSpin] = useState(0)
  const [showFeatureDetails, setShowFeatureDetails] = useState(false)
  const [floatingPos, setFloatingPos] = useState({ x: 0, y: 0 })
  const [hasFloatingInit, setHasFloatingInit] = useState(false)
  const [smallMoonIndex, setSmallMoonIndex] = useState(0)
  const [smallMoonBaseY, setSmallMoonBaseY] = useState<number | null>(null)

  // Feature data for orb navigation
  const orbFeatures = [
    {
      icon: Timer,
      name: 'Focus Timer',
      color: 'emerald',
      badge: 'Focus',
      headline: 'Focus is a skill. We help you grow it.',
      subtext: 'Science-backed Pomodoro sessions with real-time feedback'
    },
    {
      icon: MessageSquare,
      name: 'AI Coach',
      color: 'violet',
      badge: 'Coach',
      headline: 'Your personal productivity mentor.',
      subtext: 'Get insights from 40+ research docs on deep work'
    },
    {
      icon: Sprout,
      name: 'Personal Garden',
      color: 'amber',
      badge: 'Grow',
      headline: 'Watch your consistency bloom.',
      subtext: 'Visual progress tracking that motivates daily practice'
    },
  ]

  const cycleFeature = () => {
    setActiveFeature((prev) => (prev + 1) % 3)
  }

  const updateFloatingPosition = (index: number) => {
    const ids = ['feature-focus', 'feature-coach', 'feature-garden']
    const container = document.getElementById('pillars-section')
    const target = document.getElementById(ids[index])
    if (!target || !container) {
      return
    }
    const containerRect = container.getBoundingClientRect()
    const rect = target.getBoundingClientRect()
    const size = 80
    const x = rect.left - containerRect.left + (rect.width / 2) - (size / 2)
    const y = rect.bottom - containerRect.top + 35
    const baseY = smallMoonBaseY ?? y
    if (smallMoonBaseY === null) {
      setSmallMoonBaseY(y)
    }
    setFloatingPos({ x, y: baseY })
    setHasFloatingInit(true)
  }

  const scrollToFeature = (index: number) => {
    const ids = ['feature-focus', 'feature-coach', 'feature-garden']
    const target = document.getElementById(ids[index])
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  useEffect(() => {
    const init = () => updateFloatingPosition(0)
    const handleResize = () => updateFloatingPosition(0)
    window.addEventListener('resize', handleResize)
    const t = window.setTimeout(init, 150)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const currentFeature = orbFeatures[activeFeature]
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      
      // Convert to -1 to 1 range, then scale to 10-20px movement
      const x = ((clientX / innerWidth) - 0.5) * 20
      const y = ((clientY / innerHeight) - 0.5) * 20
      
      mouseX.set(x)
      mouseY.set(y)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  const pillars = [
    {
      icon: Timer,
      title: 'Focus Timer',
      description: 'Science-backed Pomodoro sessions that adapt to your rhythm',
      details: [
        'Start focused sprints with calibrated breaks so your energy doesn’t crash mid‑day.',
        'Live signals help you recover focus faster when attention drifts.',
      ],
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      icon: MessageSquare,
      title: 'AI Coach',
      description: 'Personalized insights from 40+ research docs on focus & productivity',
      details: [
        'Ask for context‑aware guidance grounded in cognitive science and learning research.',
        'Get actionable prompts that turn reflection into consistent habit change.',
      ],
      gradient: 'from-violet-400 to-purple-500',
    },
    {
      icon: Sprout,
      title: 'Personal Garden',
      description: 'Watch your dedication bloom into a thriving virtual ecosystem',
      details: [
        'Your streaks translate into visible growth, making progress feel tangible.',
        'Small wins stack into a visual record of your best focus weeks.',
      ],
      gradient: 'from-amber-400 to-orange-500',
    },
  ]

  const features = [
    { icon: Zap, text: 'Real-time blink detection & posture tracking' },
    { icon: TrendingUp, text: 'Deep analytics on focus patterns' },
    { icon: Users, text: 'Team leaderboards & accountability' },
    { icon: Eye, text: 'Camera never leaves your device' },
  ]

  const privacyFeatures = [
    { icon: Shield, label: 'Private by Design', detail: 'Video never leaves device' },
    { icon: Zap, label: 'Runs Locally', detail: 'Browser-based ML models' },
    { icon: Lock, label: 'No Cloud Processing', detail: '100% client-side analysis' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden text-slate-100">
      {/* Match global app background */}
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{
          background: currentFeature.color === 'emerald'
            ? [
                'radial-gradient(circle at 20% 10%, rgba(16,185,129,0.10), transparent 55%), linear-gradient(180deg, #020617 0%, #0b1220 100%)',
                'radial-gradient(circle at 80% 30%, rgba(16,185,129,0.18), transparent 60%), linear-gradient(180deg, #020617 0%, #0b1220 100%)'
              ]
            : currentFeature.color === 'violet'
            ? [
                'radial-gradient(circle at 20% 10%, rgba(139,92,246,0.10), transparent 55%), linear-gradient(180deg, #020617 0%, #0b1220 100%)',
                'radial-gradient(circle at 80% 30%, rgba(139,92,246,0.18), transparent 60%), linear-gradient(180deg, #020617 0%, #0b1220 100%)'
              ]
            : [
                'radial-gradient(circle at 20% 10%, rgba(245,158,11,0.12), transparent 55%), linear-gradient(180deg, #020617 0%, #0b1220 100%)',
                'radial-gradient(circle at 80% 30%, rgba(245,158,11,0.2), transparent 60%), linear-gradient(180deg, #020617 0%, #0b1220 100%)'
              ]
        }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      >
        <motion.div
          key={`bg-pulse-${activeFeature}`}
          initial={{ opacity: 0.0, scale: 0.6 }}
          animate={{ opacity: 0.35, scale: 1.2 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-0"
          style={{
            background:
              currentFeature.color === 'emerald'
                ? 'radial-gradient(circle at 50% 45%, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0.0) 60%)'
                : currentFeature.color === 'violet'
                ? 'radial-gradient(circle at 50% 45%, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0.0) 60%)'
                : 'radial-gradient(circle at 50% 45%, rgba(245,158,11,0.32) 0%, rgba(245,158,11,0.0) 60%)',
          }}
        />
      </motion.div>

      {/* Minimal Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-400" strokeWidth={2.5} />
          <span className="text-xl font-semibold text-slate-100">FocusGuard</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' })}
            className="hidden sm:flex items-center gap-1.5 text-sm text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Shield size={16} />
            Privacy
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="text-sm font-medium text-slate-100 hover:text-slate-300 transition-colors"
          >
            Sign In
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 pt-20 pb-32">
        <div className="relative z-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
        {/* Hero Content */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 text-sm font-medium text-slate-300">
              ✨ Private by design
            </div>
          </motion.div>

          <motion.h1
            key={`headline-${activeFeature}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-bold text-slate-100 mb-8 leading-[1.1] drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
          >
            <span className={`bg-gradient-to-br bg-clip-text text-transparent ${
              currentFeature.color === 'emerald'
                ? 'from-emerald-300 via-emerald-400 to-emerald-500'
                : currentFeature.color === 'violet'
                ? 'from-violet-300 via-violet-400 to-violet-500'
                : 'from-amber-300 via-amber-400 to-amber-500'
            }`}>
              {currentFeature.headline}
            </span>
          </motion.h1>

          {/* Interactive Feature Selector - More prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <p className="text-sm text-slate-400 mb-3 font-medium">Explore features</p>
            <div className="flex gap-3 justify-center lg:justify-start flex-wrap">
              {orbFeatures.map((feature, idx) => {
                const Icon = feature.icon
                return (
                  <motion.button
                    key={idx}
                    onClick={() => setActiveFeature(idx)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`group px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                      activeFeature === idx
                        ? feature.color === 'emerald'
                          ? 'bg-emerald-900/40 text-emerald-200 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : feature.color === 'violet'
                          ? 'bg-violet-900/40 text-violet-200 border-2 border-violet-500/50 shadow-lg shadow-violet-500/10'
                          : 'bg-amber-900/40 text-amber-200 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/70 text-slate-300 border-2 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {feature.name}
                    {activeFeature === idx && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-current"
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Subtext and CTA */}
          <div className="max-w-2xl mx-auto lg:mx-0">
            <motion.p
              key={`subtext-${activeFeature}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-lg md:text-xl text-slate-300 mb-5 leading-relaxed"
            >
              {currentFeature.subtext}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-slate-400 font-medium mb-8 flex items-center justify-center lg:justify-start gap-2"
            >
              <Lock className="w-4 h-4" />
              Local AI • No cloud video • Privacy-first
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center lg:items-start"
            >
              <button
                onClick={() => navigate('/auth')}
                className="group px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 flex items-center gap-2"
              >
                Start Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="group px-8 py-4 bg-slate-900/70 backdrop-blur-sm text-slate-100 rounded-xl font-semibold border border-slate-800/60 hover:bg-slate-900/80 transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10"
            >
              <p className="text-slate-400 mb-4 text-xs font-semibold uppercase tracking-wider">
                Privacy-First Architecture
              </p>
              <div className="flex flex-wrap gap-3">
                {privacyFeatures.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      className="flex items-center gap-3 px-5 py-3 bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800/60 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Icon className="w-5 h-5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.detail}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Interactive Feature Orb - Now below title */}
        <motion.div 
          whileHover={{ scale: 1.04 }}
          className="relative w-[360px] h-[360px] lg:w-[460px] lg:h-[460px] mx-auto my-8 lg:my-0 z-0"
        >
          {/* Clickable Moon */}
          <motion.button
            type="button"
            onClick={() => { cycleFeature(); setStarSpin((prev) => prev + 1); setMoonSpin((prev) => prev + 360); setShowFeatureDetails(true) }}
            onMouseEnter={() => setIsOrbHovered(true)}
            onMouseLeave={() => setIsOrbHovered(false)}
            className="absolute inset-[12%] rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
            aria-label="Cycle feature"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          >
            <motion.div
              className="absolute -inset-10 rounded-full blur-[70px]"
              animate={{
                background: currentFeature.color === 'emerald'
                  ? 'radial-gradient(circle, rgba(16, 185, 129, 0.75) 0%, rgba(16, 185, 129, 0.08) 68%)'
                  : currentFeature.color === 'violet'
                  ? 'radial-gradient(circle, rgba(139, 92, 246, 0.75) 0%, rgba(139, 92, 246, 0.08) 68%)'
                  : 'radial-gradient(circle, rgba(245, 158, 11, 0.75) 0%, rgba(245, 158, 11, 0.08) 68%)'
              }}
              transition={{ duration: 0.8 }}
            />
            <motion.div
              className="absolute -inset-16 rounded-full blur-[140px]"
              animate={{
                background: currentFeature.color === 'emerald'
                  ? 'radial-gradient(circle, rgba(110, 231, 183, 0.45) 0%, rgba(16, 185, 129, 0.06) 72%)'
                  : currentFeature.color === 'violet'
                  ? 'radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, rgba(139, 92, 246, 0.06) 72%)'
                  : 'radial-gradient(circle, rgba(251, 191, 36, 0.45) 0%, rgba(245, 158, 11, 0.06) 72%)'
              }}
              transition={{ duration: 0.8 }}
            />
            <motion.img
              src={moonImage}
              alt="Moon surface"
              className="relative z-0 w-full h-full object-cover rounded-full shadow-2xl shadow-black/40 opacity-80"
              animate={{ rotate: moonSpin }}
              transition={{ duration: 2.6, ease: 'easeInOut' }}
              style={{
                y: smoothMouseY,
                x: smoothMouseX,
              }}
            />
            <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_60px_rgba(0,0,0,0.45)]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.35em] text-white/95 bg-black/40 border border-white/30 backdrop-blur-sm shadow-[0_0_24px_rgba(0,0,0,0.45)]">
                {currentFeature.badge === 'Focus' ? 'FOCUS' : currentFeature.badge === 'Coach' ? 'COACH' : 'GROW'}
              </div>
            </div>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isOrbHovered ? 1 : 0, scale: isOrbHovered ? 1 : 0.95 }}
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <div className="px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap">
              Click the moon to explore
            </div>
          </motion.div>
        </motion.div>
        </div>
      </section>

      {/* How It Works Micro-Timeline */}
      <section className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
            {[
              { step: '1', title: 'Start a session', icon: Timer },
              { step: '2', title: 'AI observes locally', icon: Eye },
              { step: '3', title: 'Garden grows + insights', icon: Sprout },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                  i === 0 ? 'bg-gradient-to-br from-emerald-200 to-emerald-300 border-2 border-emerald-400/30' :
                  i === 1 ? 'bg-gradient-to-br from-violet-200 to-violet-300 border-2 border-violet-400/30' :
                  'bg-gradient-to-br from-amber-200 to-amber-300 border-2 border-amber-400/30'
                }`}>
                  <item.icon className={`w-6 h-6 ${
                    i === 0 ? 'text-emerald-700' :
                    i === 1 ? 'text-violet-700' :
                    'text-amber-700'
                  }`} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Step {item.step}</div>
                  <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                </div>
                {i < 2 && (
                  <ChevronRight className="hidden md:block w-5 h-5 text-slate-300" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Three Pillars */}
      <section id="how-it-works" className="container mx-auto px-6 py-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Three pillars of focused growth
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Everything you need to build deep work habits, backed by science and AI
          </p>
          <p className='text-lg text -slate-300 max-w-2xl mx-auto'>
            Click the moon on the bottom right to explore each pillar in detail
          </p>
        </motion.div>

        <div id="pillars-section" className="relative grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              id={i === 0 ? 'feature-focus' : i === 1 ? 'feature-coach' : 'feature-garden'}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`group relative p-8 bg-slate-900/70 backdrop-blur-sm border border-slate-800/60 rounded-2xl hover:shadow-2xl hover:shadow-slate-900/10 transition-all ${
                i === 1 ? 'md:-mt-6 md:scale-[1.03] shadow-xl' : ''
              }`}
            >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <pillar.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-3">
                {pillar.title}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {pillar.description}
              </p>
              <motion.div
                initial={false}
                animate={{
                  height: showFeatureDetails && activeFeature === i ? 'auto' : 0,
                  opacity: showFeatureDetails && activeFeature === i ? 1 : 0,
                  marginTop: showFeatureDetails && activeFeature === i ? 12 : 0,
                }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-2 text-sm text-slate-400">
                  {pillar.details.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
          {/* Floating Moon Navigator */}
          <motion.button
            type="button"
            onClick={() => {
              const next = (smallMoonIndex + 1) % 3
              setSmallMoonIndex(next)
              setActiveFeature(next)
              setShowFeatureDetails(true)
              updateFloatingPosition(next)
            }}
            className="absolute z-20 group"
            aria-label="Jump to feature section"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            animate={{ x: floatingPos.x, y: floatingPos.y }}
            style={{ left: 0, top: 0, visibility: hasFloatingInit ? 'visible' : 'hidden' }}
          >
            <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-xl border border-white/10">
              <motion.div
                className="absolute -inset-6 rounded-full blur-[30px]"
                animate={{
                  background: currentFeature.color === 'emerald'
                    ? 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0.0) 70%)'
                    : currentFeature.color === 'violet'
                    ? 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.0) 70%)'
                    : 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.0) 70%)'
                }}
                transition={{ duration: 0.8 }}
              />
              <img
                src={moonImage}
                alt=""
                className="relative z-10 w-full h-full object-cover rounded-full opacity-75 grayscale-[0.2] saturate-[0.8]"
              />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_24px_rgba(0,0,0,0.45)]" />
              <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
            </div>
            <div className="mt-2 text-xs text-slate-300 bg-slate-900/80 border border-slate-800/60 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              {smallMoonIndex === 0 ? 'Focus Timer' : smallMoonIndex === 1 ? 'AI Coach' : 'Personal Garden'}
            </div>
          </motion.button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24 bg-gradient-to-b from-transparent via-slate-900/40 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-slate-100 mb-4">
              Built for serious focus
            </h3>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-start gap-4 p-6 bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-xl"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-900/60 to-teal-900/60 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  <feature.icon className="w-5 h-5 text-emerald-200" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-300 font-medium">{feature.text}</p>
                </div>
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" strokeWidth={3} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes Strip */
      <section className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-100 mb-4">
              Built for real outcomes
            </h3>
            <p className="text-slate-300">
              Simple signals that compound into lasting focus habits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'More Focus Minutes',
                value: '+38%',
                detail: 'Sustained sessions with fewer resets'
              },
              {
                title: 'Fewer Distractions',
                value: '-27%',
                detail: 'Local signals nudge you back on track'
              },
              {
                title: 'Stronger Streaks',
                value: '+2.4x',
                detail: 'Visual growth drives daily consistency'
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800/60 shadow-lg"
              >
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Outcome
                </div>
                <div className="text-3xl font-bold text-slate-100 mb-2">
                  {item.value}
                </div>
                <div className="text-sm font-semibold text-slate-200 mb-1">
                  {item.title}
                </div>
                <div className="text-sm text-slate-400">
                  {item.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
/* Privacy Block */}
      <section id="privacy" className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-emerald-950/50 via-slate-900/70 to-teal-950/40 border border-emerald-500/20 rounded-3xl"
        >
          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/60 to-teal-500/60 flex items-center justify-center flex-shrink-0 border border-emerald-400/30">
              <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-100 mb-3">
                Runs locally — camera never leaves device
              </h3>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                All AI analysis happens on your machine. Zero data transmission. 
                Zero tracking. Zero compromise on privacy.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { label: '100% local ML', icon: Lock },
              { label: 'No cloud storage', icon: Shield },
              { label: 'Open source', icon: Eye },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-emerald-500/20">
                <item.icon className="w-5 h-5 text-emerald-300" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
            Start growing your focus today
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            No credit card. No commitments. Just focus.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-10 py-5 bg-slate-900 text-white rounded-xl text-lg font-semibold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30"
          >
            Get Started Free
          </button>
        </motion.div>
      </section>

      {/* Minimal Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-slate-800/60">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>&copy; 2026 FocusGuard. Made for focused minds.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </a>
            <button onClick={() => navigate('/auth')} className="hover:text-slate-300 transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage


