'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { CARD_TILT_SPRING_CONFIG, MAX_CARD_TILT_DEGREES } from './motion-budget';

interface CaseTiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Moment 3: Case card cursor-tracked tilt with Framer Motion spring physics.
 * Damped micro-lift and subtle cursor tracking (max ~7 deg).
 */
export function CaseTiltCard({ children, className = '', onClick }: CaseTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rawRotateX = useTransform(mouseY, [-0.5, 0.5], [MAX_CARD_TILT_DEGREES, -MAX_CARD_TILT_DEGREES]);
  const rawRotateY = useTransform(mouseX, [-0.5, 0.5], [-MAX_CARD_TILT_DEGREES, MAX_CARD_TILT_DEGREES]);

  const rotateX = useSpring(rawRotateX, CARD_TILT_SPRING_CONFIG);
  const rotateY = useSpring(rawRotateY, CARD_TILT_SPRING_CONFIG);

  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), CARD_TILT_SPRING_CONFIG);
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), CARD_TILT_SPRING_CONFIG);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{
          scale: 1.015,
          boxShadow: '0 20px 35px -10px rgba(200, 240, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.5)',
          transition: { duration: 0.18, ease: 'easeOut' }
        }}
        className={`relative overflow-hidden transition-colors duration-150 ${className}`}
      >
        {/* Subtle cursor-following radial light gradient */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(400px circle at ${gx}% ${gy}%, rgba(200, 240, 0, 0.06), transparent 70%)`
            ),
          }}
        />
        {children}
      </motion.div>
    </div>
  );
}
