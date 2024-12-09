import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Protocol');

  useEffect(() => {
    if (isLoading) {
      document.body.style.cursor = 'none';
    }
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isLoading]);

  useEffect(() => {
    const loadingSteps = [
      'Initializing Protocol',
      'Connecting to Network',
      'Loading Smart Contracts',
      'Synchronizing Data',
      'Launching Interface'
    ];

    let currentStep = 0;
    const textInterval = setInterval(() => {
      currentStep = (currentStep + 1) % loadingSteps.length;
      setLoadingText(loadingSteps[currentStep]);
    }, 2000);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          clearInterval(textInterval);
          setTimeout(() => setIsLoading(false), 1000);
          return 100;
        }
        return prev + 0.5; // Ralenti la progression
      });
    }, 30);

    return () => {
      clearInterval(timer);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 bg-black cursor-none"
        >
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 grid-animation opacity-5" />
            
            {/* Orbs */}
            <div className="absolute -top-1/4 left-1/4 w-[800px] h-[800px]">
              <div className="absolute inset-0 bg-fuchsia-500/20 rounded-full blur-[150px] animate-pulse" />
              <div className="absolute inset-0 bg-fuchsia-500/10 rounded-full blur-[100px] animate-pulse delay-300" />
            </div>

            <div className="absolute -bottom-1/4 right-1/4 w-[800px] h-[800px]">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-[150px] animate-pulse delay-500" />
              <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
            </div>

            {/* Scanner Lines */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(217,70,239,0.05)_50%,transparent_100%)] animate-scanner" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(6,182,212,0.05)_50%,transparent_100%)] animate-scanner-reverse" />
            </div>
          </div>

          {/* Content Container */}
          <div className="relative h-full flex flex-col items-center justify-center px-4">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-center mb-24"
            >
              <motion.span 
                className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                SHADOW
              </motion.span>
            </motion.div>

            {/* Loading Content */}
            <div className="w-full max-w-xl">
              {/* Loading Bar Container */}
              <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden mb-8 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 blur-md" />
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-400 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-scanner" />
                </motion.div>
              </div>

              {/* Loading Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-4"
              >
                <motion.div 
                  className="text-base md:text-lg font-mono"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-fuchsia-400">{">>"}</span>
                  <span className="text-gray-400"> {loadingText}</span>
                  <span className="text-cyan-400 ml-2">{Math.round(progress)}%</span>
                </motion.div>
                
                {/* Status Messages */}
                <div className="text-sm text-gray-600 font-mono space-y-2">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: progress > 20 ? 1 : 0 }}
                    className="text-green-500"
                  >
                    [OK] Network Connected
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: progress > 40 ? 1 : 0 }}
                    className="text-green-500"
                  >
                    [OK] Smart Contracts Loaded
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: progress > 60 ? 1 : 0 }}
                    className="text-green-500"
                  >
                    [OK] Data Synchronized
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 