import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function BackgroundEffects() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Animated orbs */}
      {isVisible && (
        <>
          <motion.div 
            className="absolute -top-1/4 left-1/4 w-[800px] h-[800px]"
            animate={{
              opacity: [0.08, 0.25, 0.08],
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-[100px]" />
          </motion.div>

          <motion.div 
            className="absolute -bottom-1/4 right-1/4 w-[800px] h-[800px]"
            animate={{
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.2, 1],
              x: [0, -50, 0],
              y: [0, -30, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute inset-0 bg-indigo-900/25 rounded-full blur-[100px]" />
          </motion.div>

          <motion.div 
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px]"
            animate={{
              opacity: [0.08, 0.25, 0.08],
              scale: [1, 1.3, 1],
              x: [0, 30, 0],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute inset-0 bg-fuchsia-500/35 rounded-full blur-[100px]" />
          </motion.div>

          <motion.div 
            className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px]"
            animate={{
              opacity: [0.03, 0.15, 0.03],
              scale: [1, 1.2, 1],
              x: [0, -30, 0],
              y: [0, 20, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute inset-0 bg-indigo-800/20 rounded-full blur-[100px]" />
          </motion.div>
        </>
      )}

      {/* Mouse tracking gradient */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-25 blur-3xl"
        animate={{
          x: mousePosition.x - 400,
          y: mousePosition.y - 400,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 50,
        }}
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(49,46,129,0.08) 50%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Scanner effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,0,255,0.05),transparent)] animate-scanner-slow" />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/25" />
    </div>
  );
}