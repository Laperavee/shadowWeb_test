import { motion } from 'framer-motion';

export function LiquidityAnimation() {
  return (
    <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-3xl"
        style={{
          top: '20%',
          right: '10%'
        }}
      />
      {/* Ajoutez d'autres éléments d'animation similaires */}
    </div>
  );
} 