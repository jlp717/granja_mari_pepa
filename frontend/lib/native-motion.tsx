'use client'

import React, { createElement, forwardRef, Fragment, type ReactNode } from 'react'

type NativeMotionProps = Record<string, unknown> & {
  children?: ReactNode
}

const motionOnlyProps = new Set([
  'animate',
  'custom',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'exit',
  'initial',
  'layout',
  'layoutId',
  'onAnimationComplete',
  'onDrag',
  'onDragEnd',
  'onDragStart',
  'onTap',
  'transition',
  'variants',
  'viewport',
  'whileFocus',
  'whileHover',
  'whileInView',
  'whileTap'
])

const cache = new Map<string, React.ForwardRefExoticComponent<NativeMotionProps & React.RefAttributes<unknown>>>()

function createNativeMotionElement(tag: string) {
  const cached = cache.get(tag)
  if (cached) return cached

  const Component = forwardRef<unknown, NativeMotionProps>(({ children, ...props }, ref) => {
    const domProps: Record<string, unknown> = {}

    Object.entries(props).forEach(([key, value]) => {
      if (!motionOnlyProps.has(key)) {
        domProps[key] = value
      }
    })

    return createElement(tag, { ...domProps, ref }, children)
  })

  Component.displayName = `NativeMotion.${tag}`
  cache.set(tag, Component)
  return Component
}

export const motion = new Proxy({} as Record<string, React.ForwardRefExoticComponent<NativeMotionProps & React.RefAttributes<unknown>>>, {
  get(_target, tag: string) {
    return createNativeMotionElement(tag)
  }
}) as {
  [K in keyof JSX.IntrinsicElements]: React.ForwardRefExoticComponent<
    NativeMotionProps & React.RefAttributes<unknown>
  >
}

export function AnimatePresence({ children }: { children?: ReactNode; initial?: boolean; mode?: string; onExitComplete?: () => void }) {
  return <Fragment>{children}</Fragment>
}
