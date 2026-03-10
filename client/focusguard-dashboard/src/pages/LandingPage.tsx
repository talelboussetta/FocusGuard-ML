import { motion } from 'framer-motion'
import { Star, Coffee, Wifi, Server } from 'lucide-react'
import moonImage from '../assets/images/moonjpg.jpg'

const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden text-slate-100">
      {/* Background */}
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{
          background: [
            'radial-gradient(circle at 20% 10%, rgba(16,185,129,0.10), transparent 55%), linear-gradient(180deg, #020617 0%, #0b1220 100%)',
            'radial-gradient(circle at 80% 30%, rgba(16,185,129,0.14), transparent 60%), linear-gradient(180deg, #020617 0%, #0b1220 100%)',
          ],
        }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.28, scale: 1.2 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.0) 60%)',
          }}
        />
      </motion.div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 shadow-[0_6px_14px_rgba(2,6,23,0.5)]">
            <img src={moonImage} alt="FocusGuard" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-semibold text-slate-100">FocusGuard</span>
        </div>
        <a
          href="https://github.com/talelboussetta/FocusGuard-ML"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-lg text-sm font-medium text-slate-100 transition-all group"
        >
          <Star className="w-4 h-4 group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-colors" />
          Star on GitHub
        </a>
      </motion.nav>

      {/* Main content */}
      <section className="relative container mx-auto px-6 flex flex-col items-center justify-center min-h-[80vh] text-center">
        {/* Spinning moon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
            className="w-28 h-28 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.25)] mx-auto"
          >
            <img src={moonImage} alt="FocusGuard" className="w-full h-full object-cover" />
          </motion.div>
        </motion.div>

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 text-sm font-medium text-slate-300"
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-amber-400 inline-block"
          />
          Temporarily Offline
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl md:text-7xl font-bold text-slate-100 mb-6 leading-[1.1] drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        >
          <span className="bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
            We'll be back.
          </span>
        </motion.h1>

        {/* Sub-message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-slate-300 mb-4 max-w-xl leading-relaxed"
        >
          FocusGuard is momentarily down — we're running on a free server trial and, well,
          free things have limits.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-base text-slate-400 max-w-lg leading-relaxed mb-10"
        >
          The moment we get rich (accepting donations in vibes and GitHub stars), this thing
          goes fully live. Until then — hang tight.
        </motion.p>

        {/* Info cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap gap-4 justify-center mb-12"
        >
          {[
            { icon: Server, label: 'Free Tier', detail: 'Server goes to sleep 😴' },
            { icon: Wifi, label: 'No Downtime Alerts', detail: 'We found out just like you' },
            { icon: Coffee, label: 'ETA', detail: 'When the money hits' },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="flex items-center gap-3 px-5 py-3 bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <Icon className="w-5 h-5 text-emerald-400 flex-shrink-0" strokeWidth={2} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <a
            href="https://github.com/talelboussetta/FocusGuard-ML"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 flex items-center gap-2"
          >
            <Star className="w-5 h-5 group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-colors" />
            Star us while you wait
          </a>
          <a
            href="mailto:talelboussetta@gmail.com"
            className="px-8 py-4 bg-slate-900/70 backdrop-blur-sm text-slate-100 rounded-xl font-semibold border border-slate-800/60 hover:bg-slate-900/80 transition-all"
          >
            📬 Get notified when we're back
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-center pb-8 text-xs text-slate-600"
      >
        © {new Date().getFullYear()} FocusGuard · Built with love, running on prayers 🙏
      </motion.footer>
    </div>
  )
}

export default LandingPage
