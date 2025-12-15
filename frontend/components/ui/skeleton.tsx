import { cn } from '@/lib/utils';

/* 🌟 Premium Skeleton with shimmer effect */
function Skeleton({
  className,
  shimmer = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { shimmer?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-muted relative overflow-hidden',
        shimmer && 'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

/* 📝 Text skeleton for lines of text */
function SkeletonText({
  lines = 1,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/* 🖼️ Avatar skeleton */
function SkeletonAvatar({
  size = 'default',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { 
  size?: 'sm' | 'default' | 'lg' 
}) {
  const sizes = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-14 w-14',
  };
  
  return (
    <Skeleton
      className={cn('rounded-full', sizes[size], className)}
      {...props}
    />
  );
}

/* 📦 Card skeleton for product cards */
function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 space-y-4',
        className
      )}
      {...props}
    >
      {/* Image placeholder */}
      <Skeleton className="h-48 w-full rounded-lg" />
      
      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Price and button row */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

/* 📋 Table row skeleton */
function SkeletonTableRow({
  columns = 4,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div
      className={cn('flex items-center gap-4 py-4 border-b border-border', className)}
      {...props}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === 0 ? 'w-10' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonCard,
  SkeletonTableRow 
};
