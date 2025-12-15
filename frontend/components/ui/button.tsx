import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  /* 🎯 Base styles - Premium transitions & interactions */
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold
   ring-offset-background transition-all duration-normal ease-premium
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed
   active:scale-[0.98] select-none`,
  {
    variants: {
      variant: {
        /* 🔵 Primary - Vibrant with glow */
        default: `
          bg-primary text-primary-foreground 
          hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-glow
          active:translate-y-0 active:shadow-md
        `,
        /* 🔴 Destructive - Alert with subtle glow */
        destructive: `
          bg-destructive text-destructive-foreground 
          hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)]
          active:translate-y-0
        `,
        /* ⬜ Outline - Elegant border with fill on hover */
        outline: `
          border border-border bg-transparent text-foreground
          hover:bg-accent/10 hover:border-accent hover:text-accent-foreground hover:-translate-y-0.5
          active:translate-y-0 active:bg-accent/20
        `,
        /* 🔘 Secondary - Subtle but distinct */
        secondary: `
          bg-secondary text-secondary-foreground 
          hover:bg-secondary/80 hover:-translate-y-0.5
          active:translate-y-0
        `,
        /* 👻 Ghost - Invisible until interaction */
        ghost: `
          text-foreground
          hover:bg-accent/10 hover:text-accent-foreground
          active:bg-accent/20
        `,
        /* 🔗 Link - Minimal with underline */
        link: `
          text-primary underline-offset-4 
          hover:underline hover:text-primary-hover
        `,
        /* ✨ Premium - Gradient with shimmer effect */
        premium: `
          relative overflow-hidden
          bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]
          text-white font-bold
          hover:bg-[position:100%_0] hover:-translate-y-0.5 hover:shadow-glow-lg
          active:translate-y-0
          before:absolute before:inset-0 before:bg-shimmer before:bg-[length:200%_100%] 
          before:animate-shimmer before:opacity-0 hover:before:opacity-100
        `,
        /* 🌟 Success - Green with glow */
        success: `
          bg-success text-success-foreground
          hover:bg-success/90 hover:-translate-y-0.5 hover:shadow-[0_0_20px_hsl(var(--success)/0.4)]
          active:translate-y-0
        `,
        /* 🌙 Glass - Elevated surface effect (no transparency) */
        glass: `
          bg-surface-raised border border-border text-foreground
          hover:bg-surface-overlay hover:border-border hover:-translate-y-0.5
          active:translate-y-0 active:bg-surface
        `,
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0 rounded-md',
        'icon-lg': 'h-12 w-12 p-0 rounded-lg',
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            {/* Premium loading spinner */}
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Cargando...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
