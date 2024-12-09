import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function BackgroundEffects() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Grille cyberpunk */}
      <div className="absolute inset-0 grid-animation opacity-20" />

      {/* Gradient dynamique qui suit la souris */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-3xl"
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
          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(30,64,175,0.1) 50%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-500 rounded-full opacity-20"
            animate={{
              x: ['0%', '100%'],
              y: [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
              ],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
              delay: -Math.random() * 20,
            }}
          />
        ))}
      </div>

      {/* Vignette pour assombrir les bords */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-50" />
    </div>
  );
} 