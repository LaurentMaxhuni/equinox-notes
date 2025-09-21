import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
type Mood = 'warm' | 'chilly';

type FallingLeavesProps = {
  mood: Mood;
};

type LeafConfig = {
  id: number;
  delay: number;
  duration: number;
  horizontal: number;
  scale: number;
  rotation: number;
};

const WARM_PALETTE = ['#fb923c', '#f97316', '#facc15', '#f59e0b'];
const CHILLY_PALETTE = ['#fbbf24', '#ea580c', '#f97316', '#fcd34d'];

const generateLeaves = (count: number): LeafConfig[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    delay: Math.random() * 6,
    duration: 10 + Math.random() * 8,
    horizontal: Math.random() * 100,
    scale: 0.5 + Math.random() * 1.1,
    rotation: Math.random() * 360,
  }));

const LeafSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
    <path
      d="M32 2c7 6 12 11 15 17 6 11 4 23-5 32s-21 11-32 5C4 53 0 42 2 32 4 20 15 8 32 2Z"
      fill={color}
      className="drop-shadow-[0_12px_20px_rgba(0,0,0,0.25)]"
    />
  </svg>
);

export default function FallingLeaves({ mood }: FallingLeavesProps) {
  const reducedMotion = useReducedMotion();
  const leaves = useMemo(() => generateLeaves(18), []);

  if (reducedMotion) {
    return null;
  }

  const palette = mood === 'warm' ? WARM_PALETTE : CHILLY_PALETTE;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {leaves.map((leaf) => {
        const color = palette[leaf.id % palette.length];
        return (
          <motion.div
            key={leaf.id}
            className="absolute -top-16"
            style={{ left: `${leaf.horizontal}%` }}
            initial={{ y: '-20vh', opacity: 0 }}
            animate={{
              y: '110vh',
              x: [0, 15, -20, 0],
              rotate: [leaf.rotation, leaf.rotation + 120, leaf.rotation + 240, leaf.rotation + 360],
              opacity: [0, 0.9, 0.75, 0],
            }}
            transition={{
              delay: leaf.delay,
              duration: leaf.duration,
              repeat: Infinity,
              repeatDelay: 1.2,
              ease: 'easeInOut',
            }}
          >
            <div style={{ transform: `scale(${leaf.scale})` }}>
              <LeafSvg color={color} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
