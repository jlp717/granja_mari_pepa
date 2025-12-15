import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* 🎨 Card variants for different visual styles */
const cardVariants = cva(
  /* Base styles */
  `rounded-xl border transition-all duration-normal ease-premium`,
  {
    variants: {
      variant: {
        /* Default - Clean with subtle border */
        default: `
          bg-card text-card-foreground border-border
          shadow-sm hover:shadow-md
        `,
        /* Glass - Elevated surface effect (no transparency) */
        glass: `
          bg-surface-raised border-border
          text-foreground shadow-lg
          hover:bg-surface-overlay hover:border-border
        `,
        /* Elevated - Lifted appearance */
        elevated: `
          bg-card text-card-foreground border-transparent
          shadow-lg hover:shadow-xl hover:-translate-y-1
        `,
        /* Interactive - Click feedback */
        interactive: `
          bg-card text-card-foreground border-border
          shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/30
          cursor-pointer active:translate-y-0 active:shadow-md
        `,
        /* Gradient border - Premium accent */
        gradient: `
          relative bg-card text-card-foreground
          before:absolute before:inset-0 before:rounded-xl before:p-[1px]
          before:bg-gradient-to-br before:from-primary/50 before:via-accent/30 before:to-transparent
          before:-z-10 before:content-['']
          shadow-md hover:shadow-lg
        `,
        /* Outlined - Minimal with border emphasis */
        outlined: `
          bg-transparent text-card-foreground border-2 border-border
          hover:border-primary/50 hover:bg-card/50
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
