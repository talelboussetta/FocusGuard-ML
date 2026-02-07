import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Brain, Leaf, Camera, TrendingUp, ArrowRight, ArrowUp, Clock, Target, Zap, Shield, Users, Award, Lock, Server, Eye, FileCheck } from 'lucide-react'
import gardenImage1 from '../assets/images/garden_images/GST DACAR 121-02.png'
import gardenImage2 from '../assets/images/garden_images/GST DACAR 121-03.png'
import gardenImage3 from '../assets/images/garden_images/GST DACAR 121-04.png'
import gardenImage4 from '../assets/images/garden_images/GST DACAR 121-05.png'

const LandingPage = () => {
  const navigate = useNavigate()
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToPrivacy = () => {
    const element = document.getElementById('privacy')
    element?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToSignin=()=>{
    const element=document.getElementById("bottom_arrow")
    element?.scrollIntoView({behavior:"smooth"}) 
  }

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Smart Focus Sessions',
      description: 'Pomodoro technique enhanced with AI-powered insights',
      gradient: 'from-primary-500 to-primary-700',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Insights',
      description: 'Understand your focus patterns with computer vision',
      gradient: 'from-purple-500 to-pink-700',
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: 'Personal Garden',
      description: 'Watch your productivity bloom into a beautiful garden',
      gradient: 'from-nature-500 to-emerald-700',
    },
  ]

  const stats = [
    { value: '23%', label: 'Average Productivity Increase' },
    { value: '85%', label: 'Users Report Better Focus' },
    { value: '2.5x', label: 'More Deep Work Sessions' },
    { value: '10k+', label: 'Focus Warriors Worldwide' },
  ]

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Start Your Session',
      description: 'Choose your focus duration and begin a Pomodoro session. Our AI-powered camera tracks your engagement in real-time.',
      icon: <Clock className="w-8 h-8" />,
      gradient: 'from-primary-500 to-primary-700',
    },
    {
      step: '02',
      title: 'Stay Focused',
      description: 'FocusGuard uses computer vision to monitor your attention level, providing gentle feedback to keep you on track.',
      icon: <Camera className="w-8 h-8" />,
      gradient: 'from-purple-500 to-pink-700',
    },
    {
      step: '03',
      title: 'Plant Your Progress',
      description: 'Complete sessions to earn seeds and plant trees in your personal garden. Watch your dedication grow into a beautiful forest.',
      icon: <Leaf className="w-8 h-8" />,
      gradient: 'from-nature-500 to-emerald-700',
    },
    {
      step: '04',
      title: 'Get AI Insights',
      description: 'Receive personalized analytics about your focus patterns, peak productivity times, and actionable recommendations.',
      icon: <Brain className="w-8 h-8" />,
      gradient: 'from-cyan-500 to-blue-700',
    },
  ]

  const benefits = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Science-Backed Technique',
      description: 'Based on the proven Pomodoro Technique, used by millions to enhance focus and productivity.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-Time Feedback',
      description: 'AI-powered camera detection helps you maintain focus by identifying distractions as they happen.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacy First',
      description: 'All camera processing happens locally. Your data stays on your device, ensuring complete privacy.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Build Streaks',
      description: 'Maintain daily streaks and unlock achievements as you build a consistent focus habit.',
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Gamified Progress',
      description: 'Turn productivity into a game with gardens, levels, and rewards that motivate you daily.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Deep Analytics',
      description: 'Understand your productivity patterns with detailed charts and AI-generated insights.',
    },
  ]

  const privacyFeatures = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: '100% Local Processing',
      description: 'All AI models run entirely on your device. Your camera feed is processed locally and never leaves your computer.',
      gradient: 'from-green-500 to-emerald-700',
    },
    {
      icon: <Server className="w-8 h-8" />,
      title: 'No Cloud Storage',
      description: 'We don\'t store your data on any servers. Everything stays on your local machine, giving you complete control.',
      gradient: 'from-blue-500 to-cyan-700',
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: 'Zero Tracking',
      description: 'No analytics, no telemetry, no tracking cookies. We don\'t collect, transmit, or sell any of your personal data.',
      gradient: 'from-purple-500 to-pink-700',
    },
    {
      icon: <FileCheck className="w-8 h-8" />,
      title: 'Open Source',
      description: 'Our code is transparent and auditable. You can verify exactly what happens with your data at any time.',
      gradient: 'from-primary-500 to-primary-700',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-0 left-0 w-full h-full">
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-nature-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-6 py-8 flex justify-between items-center"
        >
          <div className="flex items-center space-x-2">
            <Leaf className="w-8 h-8 text-nature-500" />
            <span className="text-2xl font-display font-bold gradient-text">
              FocusGuard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={scrollToPrivacy}
              className="text-slate-300 hover:text-nature-400 transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </motion.button>
            <button
              onClick={() => navigate('/auth')}
              className="btn-secondary"
            >
              Sign In
            </button>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-6 py-20 text-center"
        >
          <motion.div variants={itemVariants}>
            <motion.div
              className="inline-block mb-6 px-4 py-2 glass rounded-full"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-medium text-primary-400">
                ✨ AI-Powered Focus Platform
              </span>
            </motion.div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-6 leading-tight"
          >
            Grow your focus.
            <br />
            <span className="gradient-text">One session at a time.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto"
          >
            Transform your productivity with AI-powered insights, gamified progress,
            and a beautiful garden that grows with every focused moment.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              onClick={() => navigate('/auth')}
              className="btn-primary group flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Start Focusing</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              onClick={scrollToHowItWorks}
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              How It Works
            </motion.button>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            variants={itemVariants}
            className="mt-20 relative"
          >
            <div className="glass rounded-3xl p-8 max-w-5xl mx-auto overflow-hidden">
              <motion.div
                className="aspect-video rounded-2xl overflow-hidden relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={gardenImage1}
                  alt="Beautiful forest representing your productivity garden"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white text-lg font-medium">Your productivity garden awaits 🌳</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 py-20"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-center mb-16"
          >
            Everything you need to
            <span className="gradient-text"> focus better</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="card-soft group cursor-pointer"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 py-20"
        >
          <div className="glass rounded-3xl p-12">
            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <motion.div
                    className="text-4xl md:text-5xl font-display font-bold gradient-text mb-2"
                    whileHover={{ scale: 1.1 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          id="how-it-works"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 py-20"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-center mb-8"
          >
            How <span className="gradient-text">FocusGuard</span> Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-slate-400 text-center mb-16 max-w-3xl mx-auto"
          >
            Our AI-powered platform combines proven productivity techniques with cutting-edge technology
            to help you achieve deep focus and build lasting habits.
          </motion.p>

          <div className="space-y-12">
            {howItWorksSteps.map((step, index) => {
              const stepImages = [gardenImage2, gardenImage3, gardenImage4, gardenImage1]
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8`}
                >
                  <div className="flex-1">
                    <motion.div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6`}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="text-6xl font-display font-bold text-slate-800 mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-3xl font-display font-semibold mb-4">
                      {step.title}
                    </h3>
                    <p className="text-lg text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <div className="flex-1">
                    <motion.div
                      className="glass rounded-2xl overflow-hidden relative aspect-square"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={stepImages[index]}
                        alt={step.title}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} mix-blend-overlay opacity-20`} />
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 py-20"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-center mb-8"
          >
            Why Choose <span className="gradient-text">FocusGuard?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-slate-400 text-center mb-16 max-w-3xl mx-auto"
          >
            Research shows that the average person loses focus every 40 seconds when working on a computer.
            FocusGuard helps you reclaim your attention and achieve peak productivity.
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="card-soft"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-nature-500 flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">
                  {benefit.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Science Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 py-20"
        >
          <div className="glass rounded-3xl p-12 max-w-5xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-display font-bold text-center mb-6"
            >
              Backed by <span className="gradient-text">Science</span>
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg text-slate-300 leading-relaxed space-y-4"
            >
              <p>
                The Pomodoro Technique, developed by Francesco Cirillo in the late 1980s, 
                has been scientifically proven to improve focus and productivity. By breaking 
                work into focused intervals, you leverage your brain's natural attention span.
              </p>
              <p>
                Studies show that taking regular breaks can improve mental agility by up to 30%. 
                FocusGuard enhances this proven method with AI-powered insights, helping you 
                understand when you're most productive and how to optimize your work schedule.
              </p>
              <p>
                Our computer vision technology uses machine learning to detect signs of 
                distraction—all processed locally on your device for complete privacy. This 
                real-time feedback helps you develop better focus habits naturally.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Privacy Section */}
        <motion.section
          id="privacy"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 py-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center space-x-2 px-4 py-2 glass rounded-full mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                Your Privacy Matters
              </span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Your Data Stays <span className="gradient-text">With You</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              We built FocusGuard with privacy as our top priority. Your focus data, camera feed, 
              and personal information never leave your device. Period.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {privacyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="card-soft"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Privacy Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 md:p-12 max-w-5xl mx-auto"
          >
            <h3 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">
              How It Works <span className="gradient-text">Locally</span>
            </h3>
            <div className="space-y-6 text-slate-300 leading-relaxed">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-slate-200">AI Models Run on Your Device</h4>
                  <p>
                    Our computer vision models are downloaded once and run entirely on your local machine. 
                    When you start a session, your camera feed is processed in real-time by your own CPU/GPU—nothing 
                    is sent to any server or cloud service.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-nature-500 to-emerald-600 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-slate-200">Local Data Storage</h4>
                  <p>
                    All your focus sessions, analytics, and garden progress are stored in your browser's local 
                    storage or on your device's file system. We use IndexedDB for efficient local storage that 
                    never syncs to any external server.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-slate-200">No Network Requests</h4>
                  <p>
                    During your focus sessions, FocusGuard makes zero network requests. You can even disconnect 
                    from the internet completely and the app will continue to work perfectly. The only time we 
                    communicate with servers is during initial app download.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-slate-200">You're in Control</h4>
                  <p>
                    Want to export your data? No problem. Want to delete everything? One click. Want to verify 
                    our claims? Check our open-source code. Your privacy is not just a promise—it's built into 
                    our architecture.
                  </p>
                </div>
              </div>
            </div>
            <motion.div
              className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-green-400">Privacy Guarantee</h4>
                  <p className="text-slate-300">
                    We will never collect, transmit, sell, or share your personal data. This is not just 
                    a policy—it's impossible by design. Your trust is our foundation.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 py-20"
        >
          <div className="glass rounded-3xl p-12 text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Ready to transform your
                <span className="gradient-text"> productivity?</span>
              </h2>
              <p className="text-xl text-slate-400 mb-8">
                Join thousands of focused minds growing their potential every day.
              </p>
              <motion.button
                onClick={() => navigate('/auth')}
                className="btn-primary text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 text-center text-slate-500">
          <p>© 2026 FocusGuard. Made with 💚 for focused minds everywhere.</p>
            <motion.button
              onClick={scrollToSignin}
              className="text-slate-300 hover:text-nature-400 transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            ></motion.button>
        </footer>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-4 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-lg hover:shadow-xl transition-all z-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default LandingPage
