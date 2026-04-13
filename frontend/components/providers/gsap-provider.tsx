'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.dataset.routeReady = pathname
  }, [pathname])

  return <>{children}</>
}
