import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.625,0.05,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary: [
          'relative overflow-hidden',
          'bg-white/10 text-white',
          'backdrop-blur-[24px] -webkit-backdrop-blur-[24px]',
          'border border-white/10',
          'shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_2px_8px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)]',
          'hover:bg-white/15',
          'hover:border-white/15',
          'hover:shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_4px_16px_rgba(0,0,0,0.15),0_12px_32px_rgba(0,0,0,0.1)]',
          'hover:-translate-y-0.5',
          'active:translate-y-0',
        ].join(' '),
        secondary: [
          'relative overflow-hidden',
          'bg-white/5 text-white',
          'backdrop-blur-[24px] -webkit-backdrop-blur-[24px]',
          'border border-white/8',
          'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_1px_3px_rgba(0,0,0,0.08)]',
          'hover:bg-white/10',
          'hover:border-white/12',
          'hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)]',
          'hover:-translate-y-0.5',
          'active:translate-y-0',
        ].join(' '),
        ghost: [
          'bg-transparent text-white',
          'hover:bg-white/5',
          'hover:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_8px_rgba(0,0,0,0.06)]',
          'hover:-translate-y-0.5',
          'active:translate-y-0',
        ].join(' '),
        outline: [
          'relative overflow-hidden',
          'bg-transparent text-white',
          'border border-white/15',
          'shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]',
          'hover:bg-white/5',
          'hover:border-white/20',
          'hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.05)]',
          'hover:-translate-y-0.5',
          'active:translate-y-0',
        ].join(' '),
        destructive: [
          'relative overflow-hidden',
          'bg-red-500/20 text-red-100',
          'backdrop-blur-[24px] -webkit-backdrop-blur-[24px]',
          'border border-red-500/20',
          'shadow-[0_1px_0_rgba(239,68,68,0.08)_inset,0_2px_8px_rgba(239,68,68,0.1),0_8px_24px_rgba(239,68,68,0.06)]',
          'hover:bg-red-500/30',
          'hover:border-red-500/30',
          'hover:shadow-[0_1px_0_rgba(239,68,68,0.12)_inset,0_4px_16px_rgba(239,68,68,0.15),0_12px_32px_rgba(239,68,68,0.1)]',
          'hover:-translate-y-0.5',
          'active:translate-y-0',
        ].join(' '),
        link: 'text-white/70 underline-offset-4 hover:text-white hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-xs rounded-lg gap-1.5',
        md: 'h-10 px-4 text-sm rounded-xl gap-2',
        lg: 'h-12 px-6 text-base rounded-xl gap-2',
        xl: 'h-14 px-8 text-lg rounded-2xl gap-2.5',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, fullWidth, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };