'use client';

import React, { useRef, useState, useCallback, MouseEvent } from 'react';
import { cn } from '@/lib/utils';

export interface GlareCardProps {
  children: React.ReactNode;
  className?: string;
  glareColor?: string;
  glareIntensity?: number;
  rotateIntensity?: number;
  scaleOnHover?: number;
}

export const GlareCard: React.FC<GlareCardProps> = ({
  children,
  className,
  glareColor = 'rgba(255, 255, 255, 0.4)',
  glareIntensity = 0.7,
  rotateIntensity = 20,
  scaleOnHover = 1.05,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(0);
  const [glareY, setGlareY] = useState(0);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate rotation based on mouse position
    const rotY = ((e.clientX - centerX) / (rect.width / 2)) * rotateIntensity;
    const rotX = ((centerY - e.clientY) / (rect.height / 2)) * rotateIntensity;

    // Calculate glare position
    const glareXPos = ((e.clientX - rect.left) / rect.width) * 100;
    const glareYPos = ((e.clientY - rect.top) / rect.height) * 100;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlareX(glareXPos);
    setGlareY(glareYPos);
  }, [rotateIntensity]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlareX(50);
    setGlareY(50);
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/50 to-black/30 backdrop-blur-sm border border-white/10",
        "transition-all duration-300 ease-out cursor-pointer",
        "transform-gpu will-change-transform",
        className
      )}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleOnHover})`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Glare effect */}
      <div
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? glareIntensity : 0,
          background: `radial-gradient(800px circle at ${glareX}% ${glareY}%, ${glareColor}, transparent 40%)`,
        }}
      />

      {/* Enhanced border glow */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 0.6 : 0.2,
          background: 'linear-gradient(145deg, transparent, rgba(59, 130, 246, 0.4), transparent)',
          padding: '1px',
          maskImage: 'linear-gradient(#000 0%, transparent 50%, transparent 50%, #000 100%)',
          WebkitMaskImage: 'linear-gradient(#000 0%, transparent 50%, transparent 50%, #000 100%)',
        }}
      />

      {/* Shine effect */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 0.3 : 0,
          background: `linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)`,
          transform: `translateX(${(glareX - 50) / 2}%) translateY(${(glareY - 50) / 2}%)`,
        }}
      />

      {/* Reflection effect */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl pointer-events-none transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 0.1 : 0,
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent)',
        }}
      />
    </div>
  );
};

export default GlareCard;