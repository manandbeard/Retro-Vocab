'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function BackgroundGame() {
  const [stars, setStars] = useState<any[]>([]);
  const [floatingItems, setFloatingItems] = useState<any[]>([]);

  useEffect(() => {
    // Initialize random values only on client
    const newStars = [...Array(20)].map(() => ({
      x: Math.random() * 100 + '%',
      y: Math.random() * 60 + '%',
      duration: 20 + Math.random() * 40,
      delay: -Math.random() * 40
    }));

    const newItems = [...Array(3)].map((_, i) => ({
      y: 100 + Math.random() * 100,
      duration: 8 + Math.random() * 5,
      delay: i * 3,
      icon: ['💎', '⭐', '🍎'][i % 3]
    }));

    const timer = setTimeout(() => {
      setStars(newStars);
      setFloatingItems(newItems);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 select-none">
      {/* Sky Layer */}
      <div className="absolute inset-0 bg-[#0A0A1F]" />
      
      {/* Stars/Clouds Layer */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white"
            initial={{ x: star.x, y: star.y }}
            animate={{ x: '-10%' }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              ease: "linear",
              delay: star.delay
            }}
          />
        ))}
      </div>

      {/* Far Mountains Layer (Slow) */}
      <div className="absolute bottom-[20%] left-0 right-0 flex">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`mtn-far-${i}`}
            className="flex-shrink-0 w-full h-40 bg-[#1A1A3F]"
            style={{ clipPath: 'polygon(0% 100%, 25% 40%, 50% 100%, 75% 20%, 100% 100%)' }}
            animate={{ x: ['0%', '-100%'] }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      {/* Near Mountains Layer (Medium) */}
      <div className="absolute bottom-[10%] left-0 right-0 flex">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`mtn-near-${i}`}
            className="flex-shrink-0 w-full h-32 bg-[#2A2A5F]"
            style={{ clipPath: 'polygon(0% 100%, 15% 60%, 30% 100%, 45% 40%, 60% 100%, 80% 50%, 100% 100%)' }}
            animate={{ x: ['0%', '-100%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      {/* Ground Layer (Fast) */}
      <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-[#00FFD5]/20 border-t-4 border-[#00FFD5]">
        <motion.div
          className="absolute inset-0 flex"
          animate={{ x: ['0%', '-100%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(20)].map((_, i) => (
            <div key={`grid-${i}`} className="w-20 h-full border-r border-[#00FFD5]/30" />
          ))}
        </motion.div>
      </div>

      {/* Character */}
      <motion.div
        className="absolute bottom-[10%] left-[20%] w-12 h-12 flex items-center justify-center text-3xl"
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 0.6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        🏃‍♂️
      </motion.div>

      {/* Floating Items */}
      {floatingItems.map((item, i) => (
        <motion.div
          key={`item-${i}`}
          className="absolute bottom-[30%] text-2xl"
          initial={{ x: '110%', y: item.y }}
          animate={{ x: '-10%' }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: "linear",
            delay: item.delay
          }}
        >
          {item.icon}
        </motion.div>
      ))}

      {/* Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10" style={{ 
        backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,1) 50%)', 
        backgroundSize: '100% 4px' 
      }} />
    </div>
  );
}
