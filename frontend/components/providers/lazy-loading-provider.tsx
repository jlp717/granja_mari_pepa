'use client'

import { Suspense, ReactNode, ComponentType, lazy } from 'react'

interface LazyLoadingProviderProps {
  children: ReactNode
}

interface LazyComponentProps {
  Component: ComponentType<any>
  fallback?: ReactNode
  props?: any
}

const LazyLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-8 bg-gray-200 rounded w-full"></div>
  </div>
)

export const LazyComponent = ({ Component, fallback = <LazyLoadingSkeleton />, props = {} }: LazyComponentProps) => (
  <Suspense fallback={fallback}>
    <Component {...props} />
  </Suspense>
)

export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) => {
  const LazyWrapper = (props: P) => (
    <Suspense fallback={fallback || <LazyLoadingSkeleton />}>
      <Component {...props} />
    </Suspense>
  )

  LazyWrapper.displayName = `withLazyLoading(${Component.displayName || Component.name})`
  return LazyWrapper
}

export const dynamicImport = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
  return lazy(importFn)
}

export function LazyLoadingProvider({ children }: LazyLoadingProviderProps) {
  return <>{children}</>
}