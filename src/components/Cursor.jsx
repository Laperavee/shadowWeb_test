import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Cursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleHoverStart = () => setIsHovering(true);
    const handleHoverEnd = () => setIsHovering(false);

    document.addEventListener('mousemove', handleMouseMove);
    
    const interactiveElements = document.querySelectorAll('.interactive');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleHoverStart);
      element.addEventListener('mouseleave', handleHoverEnd);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleHoverStart);
        element.removeEventListener('mouseleave', handleHoverEnd);
      });
    };
  }, []);

  return (
    <>
      {/* Point central */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-white pointer-events-none z-50"
        animate={{
          x: mousePosition.x - 1,
          y: mousePosition.y - 1,
          scale: isHovering ? 2 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 1000,
          damping: 50,
          mass: 0.1,
        }}
      />

      {/* Cercle principal */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white/50 pointer-events-none z-50"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0.5 : 0.2,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 0.8,
        }}
      />

      {/* Cercle d'effet */}
      <motion.div
        className="fixed top-0 left-0 w-24 h-24 rounded-full pointer-events-none z-40"
        animate={{
          x: mousePosition.x - 48,
          y: mousePosition.y - 48,
          scale: isHovering ? 1.2 : 1,
          opacity: isHovering ? 0.2 : 0.1,
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 20,
          mass: 0.2,
        }}
      >
        <div className="absolute inset-0 rounded-full border border-white/20" />
      </motion.div>

      {/* Effet de traînée */}
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 rounded-full pointer-events-none z-40 opacity-20"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          scale: isHovering ? 2 : 1,
        }}
        transition={{
          type: "tween",
          duration: 0.5,
          ease: "linear"
        }}
      >
        <div className="absolute inset-0 rounded-full bg-white" />
      </motion.div>
    </>
  );
} 