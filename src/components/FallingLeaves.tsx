import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

function random(min: number, max: number) { return Math.random() * (max - min) + min; }

export default function FallingLeaves({ count = 12 }: { count?: number }) {
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    // nothing for now; kept for possible accessibility hooks
  }, []);

  if (shouldReduce) return null;

  const leaves = Array.from({ length: count }).map((_, i) => {
    const left = `${random(0, 100)}%`;
    const delay = random(0, 6);
    const duration = random(6, 14);
    const rotate = random(-360, 360);
    return (
      <motion.div
        key={i}
        initial={{ y: -50, opacity: 0, rotate: 0 }}
        animate={{ y: 1200, opacity: 1, rotate }}
        transition={{ delay, duration, ease: 'linear', repeat: Infinity }}
        style={{ left, position: 'absolute', top: -50 }}
        className="pointer-events-none"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 2c2 2 3 5 2 8-1 3-1 5-4 8-3-3-5-5-6-8-1-3 1-6 4-8 2-1 3-1 4 0z" fill="currentColor" />
        </svg>
      </motion.div>
    );
  });

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      {leaves}
    </div>
  );
}
