'use client';

import * as React from 'react';
import { Button as CnippetButton } from './cnippet-button';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  shimmer?: boolean;
}

const variants = { primary: 'default', secondary: 'outline', ghost: 'ghost', inverse: 'secondary' } as const;
const sizes = { sm: 'sm', md: 'default', lg: 'lg' } as const;

/** Preserve the established Button API while sharing the new visual model. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'primary', size = 'md', fullWidth, shimmer, className, ...props }, ref) {
    void shimmer;
    return <CnippetButton ref={ref} variant={variants[variant]} size={sizes[size]} className={cn('min-h-11', fullWidth && 'w-full', className)} {...props} />;
  },
);
