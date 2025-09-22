'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ShineBorder } from './shine-border';

export interface GridItem {
  id: string;
  title: string;
  description?: string;
  header?: React.ReactNode;
  content?: React.ReactNode;
  className?: string;
  featured?: boolean;
  image?: string;
}

interface LayoutGridProps {
  cards: GridItem[];
  className?: string;
}

export const LayoutGrid = ({ cards, className }: LayoutGridProps) => {
  const [selected, setSelected] = useState<GridItem | null>(null);
  const [lastSelected, setLastSelected] = useState<GridItem | null>(null);

  const handleClick = (card: GridItem) => {
    setLastSelected(selected);
    setSelected(card);
  };

  const handleOutsideClick = () => {
    setLastSelected(selected);
    setSelected(null);
  };

  return (
    <div className={cn('relative w-full h-full', className)}>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto"
        layout
      >
        {cards.map((card) => (
          <motion.div
            key={card.id}
            className={cn(
              'relative overflow-hidden rounded-2xl cursor-pointer transform-gpu group',
              'bg-gradient-to-br from-slate-800/50 to-slate-900/80 backdrop-blur-sm',
              'border border-blue-400/20 hover:border-blue-400/60',
              'transition-all duration-500',
              card.featured 
                ? 'lg:col-span-2 lg:row-span-2 min-h-[400px]' 
                : 'h-60 hover:scale-105',
              card.className
            )}
            onClick={() => handleClick(card)}
            whileHover={{ 
              y: -5,
              boxShadow: '0 25px 50px rgba(59, 130, 246, 0.3)',
            }}
            layout
          >
            {/* SHINE BORDER EFFECT */}
            <ShineBorder 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"
              duration={3}
              color="rgba(147, 51, 234, 0.6)"
              borderRadius={16}
              borderWidth={2}
            >
              <div className="w-full h-full" />
            </ShineBorder>
            
            {/* SECONDARY SHINE EFFECT */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 pointer-events-none z-5"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)',
              }}
              animate={{
                x: [-100, 400],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
            />

            <motion.div className="absolute inset-0 w-full h-full z-0">
              {card.header || (
                <div className="w-full h-full relative">
                  {card.image && (
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      style={{
                        filter: 'contrast(1.1) saturate(1.2) brightness(0.8)'
                      }}
                    />
                  )}
                  
                  {/* Professional gradient overlay */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: card.featured 
                        ? `linear-gradient(135deg,
                            rgba(59, 130, 246, 0.3) 0%,
                            rgba(29, 78, 216, 0.4) 50%,
                            rgba(0, 0, 0, 0.7) 100%
                          )`
                        : `linear-gradient(135deg,
                            rgba(59, 130, 246, 0.2) 0%,
                            transparent 50%,
                            rgba(0, 0, 0, 0.6) 100%
                          )`
                    }}
                  />

                  {/* Featured badge */}
                  {card.featured && (
                    <div className="absolute top-4 left-4">
                      <motion.div 
                        className="px-4 py-2 rounded-full text-sm font-bold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 197, 253, 0.9))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                        }}
                        whileHover={{ scale: 1.1 }}
                      >
                        ⭐ DESTACADO
                      </motion.div>
                    </div>
                  )}

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <motion.h3 
                      className={cn(
                        'font-bold text-white mb-2',
                        card.featured ? 'text-3xl' : 'text-xl'
                      )}
                      style={{
                        textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                      }}
                    >
                      {card.title}
                    </motion.h3>
                    
                    {card.description && (
                      <motion.p 
                        className={cn(
                          'text-blue-200/90',
                          card.featured ? 'text-lg' : 'text-sm'
                        )}
                        style={{
                          textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                        }}
                      >
                        {card.description}
                      </motion.p>
                    )}
                  </div>

                  {/* Hover shine effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 hover:opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent)',
                      transition: 'opacity 0.5s ease'
                    }}
                    whileHover={{ opacity: 0.3 }}
                  />
                </div>
              )}
            </motion.div>

            {/* Glare effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-40"
              style={{
                background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.3), transparent 40%)`,
                transition: 'opacity 0.3s ease',
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Selected card modal overlay */}
      {selected && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOutsideClick}
        >
          <motion.div
            className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-auto border border-blue-400/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleOutsideClick}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-white transition-colors"
            >
              ×
            </button>
            
            {selected.image && (
              <img
                src={selected.image}
                alt={selected.title}
                className="w-full h-48 object-cover rounded-xl mb-6"
              />
            )}
            
            <h2 className="text-3xl font-bold text-white mb-4">{selected.title}</h2>
            
            {selected.description && (
              <p className="text-blue-200 mb-6 text-lg leading-relaxed">
                {selected.description}
              </p>
            )}
            
            {selected.content}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LayoutGrid;