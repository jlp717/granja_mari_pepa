import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show error state styling */
  error?: boolean;
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            /* 🎯 Base styles */
            `flex h-11 w-full rounded-lg border bg-background px-4 py-2.5 text-sm
             ring-offset-background transition-all duration-normal ease-premium
             
             /* Placeholder */
             placeholder:text-muted-foreground/60
             
             /* File input */
             file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
             
             /* Focus state - Premium glow effect */
             focus-visible:outline-none focus-visible:border-primary
             focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0
             focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]
             
             /* Hover state */
             hover:border-border-hover
             
             /* Disabled state */
             disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted`,
            
            /* Error state */
            error && `
              border-destructive 
              focus-visible:border-destructive focus-visible:ring-destructive/20
              focus-visible:shadow-[0_0_0_4px_hsl(var(--destructive)/0.1)]
            `,
            
            /* With left icon padding */
            leftIcon && 'pl-10',
            
            /* With right icon padding */
            rightIcon && 'pr-10',
            
            /* Default border */
            !error && 'border-input',
            
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* 🌟 Premium Search Input variant */
const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        type="search"
        className={cn(
          `bg-secondary/50 border-transparent
           focus-visible:bg-background focus-visible:border-primary
           placeholder:text-muted-foreground`,
          className
        )}
        leftIcon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        }
        ref={ref}
        {...props}
      />
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { Input, SearchInput };
