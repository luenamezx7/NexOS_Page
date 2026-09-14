import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_2px_8px_rgba(255,255,255,0.1)] hover:bg-gray-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2),_0_4px_16px_rgba(255,255,255,0.15)] hover:-translate-y-0.5',
        primary: 'bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_2px_8px_rgba(255,255,255,0.1)] hover:bg-gray-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2),_0_4px_16px_rgba(255,255,255,0.15)] hover:-translate-y-0.5',
        destructive: 'bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5',
        outline: 'border border-gray-700 bg-transparent hover:bg-gray-900 hover:border-gray-600 hover:-translate-y-0.5',
        secondary: 'bg-gray-900 text-white border border-gray-700 hover:bg-gray-800 hover:border-gray-600 hover:-translate-y-0.5',
        ghost: 'bg-transparent hover:bg-gray-900 hover:-translate-y-0.5',
        link: 'text-white underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };