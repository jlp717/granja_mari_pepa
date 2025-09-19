'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button as UIButton, ButtonProps } from '@/components/ui/button';
import { useHapticFeedback, useTouchGestures, mobileAnimationConfig, getTouchClasses } from '@/lib/mobile-utils';
import { cn } from '@/lib/utils';

interface TouchOptimizedButtonProps extends ButtonProps {
  haptic?: boolean;
  touchSize?: 'small' | 'medium' | 'large';
  onLongPress?: () => void;
  loading?: boolean;
  ripple?: boolean;
}

/**
 * Botón optimizado para dispositivos táctiles
 * Incluye feedback háptico, gestos táctiles y animaciones suaves
 */
export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  className,
  onClick,
  onLongPress,
  haptic = true,
  touchSize = 'medium',
  loading = false,
  ripple = true,
  disabled,
  ...props
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const { isTouchDevice, createTouchHandler } = useTouchGestures();
  const [isPressed, setIsPressed] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    // Feedback háptico
    if (haptic && isTouchDevice) {
      triggerHaptic('light');
    }
    
    onClick?.(e);
  };

  const touchHandlers = createTouchHandler(
    () => {
      if (disabled || loading) return;
      // Para touch, creamos un evento sintético básico
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.MouseEvent<HTMLButtonElement>;
      handleClick(syntheticEvent);
    },
    onLongPress ? () => {
      if (haptic && isTouchDevice) {
        triggerHaptic('medium');
      }
      onLongPress();
    } : undefined
  );

  return (
    <motion.div
      className="inline-block"
      {...mobileAnimationConfig.scaleOnTap}
      animate={loading ? { scale: 0.98 } : { scale: 1 }}
    >
      <UIButton
        {...props}
        className={cn(
          'touch-optimized mobile-optimized transition-all duration-200',
          getTouchClasses(touchSize),
          isPressed && 'scale-95',
          loading && 'pointer-events-none',
          className
        )}
        onClick={handleClick}
        disabled={disabled || loading}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        {...(isTouchDevice ? touchHandlers : {})}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            <span>Cargando...</span>
          </div>
        ) : (
          children
        )}
      </UIButton>
    </motion.div>
  );
};

export default TouchOptimizedButton;