import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: 'default' | 'gradient' | 'glass'
  hover?: boolean
}

const variantStyles = {
  default: 'bg-slate-900/50 border border-slate-800',
  gradient: 'bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20',
  glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = false, className = '', children, ...props }, ref) => {
    const Component = hover ? motion.div : 'div'
    
    const hoverProps = hover
      ? {
          whileHover: { scale: 1.02, y: -4 },
          transition: { duration: 0.2 },
        }
      : {}

    return (
      <Component
        ref={ref}
        className={`rounded-2xl p-6 ${variantStyles[variant]} ${className}`}
        {...hoverProps}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'
