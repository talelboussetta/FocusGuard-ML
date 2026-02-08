import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ServerWakeUpBanner
 * Shows a humorous loading message when the free tier backend is waking up
 */
export default function ServerWakeUpBanner() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md"
      >
        <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 backdrop-blur-xl border border-primary-500/30 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            {/* Animated coffee cup */}
            <div className="relative">
              <div className="text-3xl animate-bounce">☕</div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-ping" />
            </div>
            
            <div className="flex-1">
              <p className="text-white font-semibold text-sm mb-1">
                Waking up our potato server{dots}
              </p>
              <p className="text-slate-300 text-xs leading-relaxed">
                <span className="text-yellow-400">If you didn't get logged in even though you have an account,</span>
                <br />
                let's wait together for our potato server... 🥔
                <br />
                <span className="text-primary-400">Usually takes 30-90 seconds. I am too broke for premium hosting 😅</span>
              </p>
            </div>

            {/* Spinner */}
            <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 90, ease: 'linear' }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
