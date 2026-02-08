import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Timer, MessageSquare, Sprout, Lock, ChevronRight, Play, Shield, Eye, Zap, TrendingUp, Users, Check } from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  
  // Parallax effect for hero orb
  const orbY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const orbScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])

  const pillars = [
    {
      icon: Timer,
      title: 'Focus Timer',
      description: 'Science-backed Pomodoro sessions that adapt to your rhythm',
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      icon: MessageSquare,
      title: 'AI Coach',
      description: 'Personalized insights from 40+ research docs on focus & productivity',
      gradient: 'from-violet-400 to-purple-500',
    },
    {
      icon: Sprout,
      title: 'Personal Garden',
      description: 'Watch your dedication bloom into a thriving virtual ecosystem',
      gradient: 'from-amber-400 to-orange-500',
    },
  ]

  const features = [
    { icon: Zap, text: 'Real-time blink detection & posture tracking' },
    { icon: TrendingUp, text: 'Deep analytics on focus patterns' },
    { icon: Users, text: 'Team leaderboards & accountability' },
    { icon: Eye, text: 'Camera never leaves your device' },
  ]

  const socialProof = [
    { label: 'Students', count: '2,500+' },
    { label: 'Creators', count: '890+' },
    { label: 'Teams', count: '120+' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Dawn Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-sage-50 via-sand-50 to-teal-50 -z-10" />
      
      {/* Texture Overlay */}
      <div 
        className="fixed inset-0 opacity-[0.02] -z-10" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Minimal Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
          <span className="text-xl font-semibold text-slate-900">FocusGuard</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' })}
            className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Shield size={16} />
            Privacy
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 pt-20 pb-32 text-center">
        {/* Floating Orb Visual */}
        <motion.div 
          style={{ y: orbY, scale: orbScale }}
          className="absolute top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] pointer-events-none"
        >
          {/* Glass Orb */}
          <motion.div
            animate={{ 
              rotate: 360,
            }}
            transition={{ 
              duration: 120, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200/40 via-violet-200/30 to-amber-200/40 blur-3xl" />
            <div className="absolute inset-[20%] rounded-full bg-gradient-to-tr from-white/60 to-white/20 backdrop-blur-md border border-white/40" />
            
            {/* Orbiting Icons */}
            {[Timer, MessageSquare, Sprout].map((Icon, i) => (
              <motion.div
                key={i}
                animate={{ rotate: -360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
                style={{ rotate: i * 120 }}
              >
                <motion.div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  whileHover={{ scale: 1.2 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur border border-slate-200/50 shadow-lg flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${
                      i === 0 ? 'text-emerald-600' : 
                      i === 1 ? 'text-violet-600' : 
                      'text-amber-600'
                    }`} strokeWidth={2} />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto pt-64">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200/50 text-sm font-medium text-slate-700">
              ✨ Private by design
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-[1.1]"
          >
            Focus is a skill.
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-violet-600 to-amber-600 bg-clip-text text-transparent">
              We help you grow it.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            FocusGuard combines a Pomodoro timer, AI coaching, and a personal growth garden 
            to build consistent study habits — all processed locally.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
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
              className="group px-8 py-4 bg-white/60 backdrop-blur-sm text-slate-900 rounded-xl font-semibold border border-slate-200/50 hover:bg-white/80 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              See How It Works
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm"
          >
            <span className="text-slate-500">Used by</span>
            {socialProof.map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-900">{item.count}</span>
                <span className="text-slate-600">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Three Pillars */}
      <section id="how-it-works" className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Three pillars of focused growth
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to build deep work habits, backed by science and AI
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative p-8 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-2xl hover:shadow-2xl hover:shadow-slate-900/10 transition-all"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <pillar.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {pillar.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24 bg-gradient-to-b from-transparent via-slate-50/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
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
                className="flex items-start gap-4 p-6 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 font-medium">{feature.text}</p>
                </div>
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" strokeWidth={3} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Block */}
      <section id="privacy" className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200/50 rounded-3xl"
        >
          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-3">
                Runs locally — camera never leaves device
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
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
              <div key={i} className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-emerald-200/30">
                <item.icon className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
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
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Start growing your focus today
          </h2>
          <p className="text-xl text-slate-600 mb-10">
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
      <footer className="container mx-auto px-6 py-12 border-t border-slate-200/50">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2026 FocusGuard. Made for focused minds.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/auth')} className="hover:text-slate-700 transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/auth')} className="hover:text-slate-700 transition-colors">
              Terms
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
