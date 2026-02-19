import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui'

interface ErrorPageProps {
  title?: string
  message?: string
  statusCode?: number
  showHomeButton?: boolean
  showBackButton?: boolean
  showRefreshButton?: boolean
}

export default function ErrorPage({
  title = '404 - Page Not Found',
  message = "Oops! The page you're looking for seems to have wandered off. Let's get you back on track.",
  statusCode = 404,
  showHomeButton = true,
  showBackButton = true,
  showRefreshButton = false,
}: ErrorPageProps) {
  const navigate = useNavigate()

  const handleGoHome = () => navigate('/dashboard')
  const handleGoBack = () => navigate(-1)
  const handleRefresh = () => window.location.reload()

  // Floating animation for the error icon
  const floatVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  // Fade in animation for content
  const fadeInVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      }
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
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

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full">
        <motion.div
          className="text-center"
          initial="initial"
          animate="animate"
          variants={fadeInVariants}
        >
          {/* Error Icon */}
          <motion.div
            className="flex justify-center mb-8"
            variants={floatVariants}
            initial="initial"
            animate="animate"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-50" />
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-full border border-purple-500/30">
                <AlertCircle className="w-24 h-24 text-purple-400" strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>

          {/* Status Code */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-9xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {statusCode}
            </h1>
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {title}
          </motion.h2>

          {/* Message */}
          <motion.p
            className="text-lg text-slate-300 mb-12 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {message}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {showBackButton && (
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
            
            {showHomeButton && (
              <Button
                onClick={handleGoHome}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            )}

            {showRefreshButton && (
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white backdrop-blur-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            )}
          </motion.div>

          {/* Decorative elements */}
          <motion.div
            className="mt-16 flex justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500/50"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
