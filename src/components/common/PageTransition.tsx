import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export function PageTransition({
  children,
  stepKey,
  className = '',
}: {
  children: ReactNode;
  stepKey?: string;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      key={stepKey}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
