import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Brain, Leaf, Camera, TrendingUp, ArrowRight } from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()

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
          <button
            onClick={() => navigate('/auth')}
            className="btn-secondary"
          >
            Sign In
          </button>
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
            <div className="glass rounded-3xl p-8 max-w-5xl mx-auto">
              <div className="aspect-video bg-gradient-to-br from-primary-500/20 to-nature-500/20 rounded-2xl flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Leaf className="w-32 h-32 text-nature-400 opacity-50" />
                </motion.div>
              </div>
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
        </footer>
      </div>
    </div>
  )
}

export default LandingPage
