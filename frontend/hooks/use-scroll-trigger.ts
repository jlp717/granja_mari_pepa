'use client'

import { useCallback, useEffect } from 'react'

export function useNativeScrollRefresh() {
  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return

    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }, [])

  const cleanup = useCallback(() => {}, [])

  useEffect(() => {
    const handleRouteChange = () => refresh()
    const handleResize = () => refresh()

    window.addEventListener('popstate', handleRouteChange)
    window.addEventListener('resize', handleResize)
    refresh()

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.removeEventListener('resize', handleResize)
    }
  }, [refresh])

  return {
    refresh,
    cleanup
  }
}
