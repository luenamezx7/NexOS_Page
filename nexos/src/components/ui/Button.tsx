import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  shimmer?: boolean;
}

const baseStyles = 'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-40 select-none';

const buttonVariants = {
  primary: 'overflow-hidden rounded-lg bg-pink-600 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(219,39,119,0.5)] hover:shadow-[0_0_35px_rgba(219,39,119,0.8)] hover:bg-pink-500',
  secondary: 'rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 backdrop-blur-sm hover:bg-white/10 hover:border-white/40',
  ghost: 'rounded-lg bg-transparent text-white/80 hover:bg-white/5 hover:text-white',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-3 text-sm',
};

type MotionSafeProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 
  'onDrag' | 'onDragEnd' | 'onDragStart' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop' |
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' |
  'onTransitionStart' | 'onTransitionEnd' | 'onTransitionRun' | 'onTransitionCancel' |
  'whileHover' | 'whileTap' | 'whileFocus' | 'whileInView' | 'whileDrag' | 'animate' | 'initial' | 'exit' | 'transition' | 'variants' | 'custom' | 'layout' | 'layoutId' | 'style'
>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading, 
    disabled, 
    fullWidth, 
    shimmer = true, 
    children, 
    ...props 
  }, ref) => {
    const content = loading ? (
      <>
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
        {children}
      </>
    ) : (
      children
    );

    const baseClasses = cn(
      baseStyles,
      buttonVariants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    );

    const motionProps = {
      whileHover: { scale: variant === 'primary' ? 1.04 : 1.02 },
      whileTap: { scale: variant === 'primary' ? 0.96 : 0.98 },
      transition: { type: 'spring', stiffness: 300, damping: 20 } as const,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { onDrag, onDragEnd, onDragStart, onDragEnter, onDragLeave, onDragOver, onDrop,
      onAnimationStart, onAnimationEnd, onAnimationIteration,
      onTransitionStart, onTransitionEnd, onTransitionRun, onTransitionCancel,
      transition: _transition,
      whileHover, whileTap, whileFocus, whileInView, whileDrag, animate, initial, exit,
      variants: _variants, custom, layout, layoutId, style,
      ...restProps } = props as MotionSafeProps & Record<string, unknown>;

    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        aria-busy={loading}
        {...motionProps}
        {...restProps}
      >
        {content}
        {shimmer && variant === 'primary' && !loading && (
          <span className="shimmer-sweep" aria-hidden="true" />
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };