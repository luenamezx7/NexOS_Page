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

const baseStyles = 'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-40 select-none';

const buttonVariants = {
  primary: 'overflow-hidden rounded-[0.625rem] bg-gradient-to-b from-[#f04484] via-pink-600 to-[#c2185b] px-7 py-3.5 text-sm font-bold tracking-[0.03em] text-white shadow-[0_0_0_1px_rgba(255, 92, 138,0.28),0_10px_28px_-10px_rgba(255, 92, 138,0.55),0_0_20px_rgba(255, 92, 138,0.28)] hover:brightness-[1.07] hover:shadow-[0_0_0_1px_rgba(255, 92, 138,0.4),0_12px_32px_-10px_rgba(255, 92, 138,0.6),0_0_26px_rgba(255, 92, 138,0.35)]',
  secondary: 'rounded-lg border border-ink/20 bg-ink/5 px-6 py-3 text-sm font-medium text-ink/90 hover:bg-ink/10 hover:border-ink/40',
  ghost: 'rounded-lg bg-transparent text-ink/80 hover:bg-ink/5 hover:text-ink',
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
    shimmer = false, 
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
      whileTap: { scale: 0.98 },
      transition: { duration: 0.2 } as const,
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