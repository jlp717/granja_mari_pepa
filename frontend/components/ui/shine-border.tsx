"use client";

import { motion } from "framer-motion";
import React from "react";

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  color?: string;
  borderRadius?: number;
  borderWidth?: number;
}

export const ShineBorder: React.FC<ShineBorderProps> = ({
  children,
  className = "",
  duration = 3,
  color = "rgba(255, 255, 255, 0.5)",
  borderRadius = 8,
  borderWidth = 2,
}) => {
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
      }}
    >
      {/* Animated border */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          borderRadius: `${borderRadius}px`,
        }}
        initial={{ transform: "translateX(-100%)" }}
        animate={{ transform: "translateX(100%)" }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Content wrapper */}
      <div
        className="relative z-10 h-full w-full"
        style={{
          borderRadius: `${borderRadius - borderWidth}px`,
          margin: `${borderWidth}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};