import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', '20%']
  );

  // Définition des couleurs harmonieuses
  const colors = {
    primary: {
      from: "from-purple-500",
      to: "to-blue-500",
      via: "via-indigo-500"
    }
  };

  return (
    <main ref={containerRef} className="bg-black">
      {/* Background qui s'étend sur toute la page */}
      <div className="fixed inset-0">
        {/* Matrix-like grid with enhanced effects */}
        <div className="grid-animation opacity-5" />
        
        {/* Dynamic Glowing Orbs */}
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute -top-1/4 left-1/4 w-[800px] h-[800px]"
        >
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-300" />
          <div className="absolute inset-0 bg-purple-500/5 rounded-full blur-[50px] animate-pulse delay-700" />
        </motion.div>

        <motion.div 
          style={{ y: backgroundY }}
          className="absolute -bottom-1/4 right-1/4 w-[800px] h-[800px]"
        >
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[150px] animate-pulse delay-500" />
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
          <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[50px] animate-pulse delay-1000" />
        </motion.div>
        
        {/* Enhanced Cyberpunk lines */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(137,87,255,0.05)_50%,transparent_100%)] animate-scanner" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(59,130,246,0.05)_50%,transparent_100%)] animate-scanner-reverse" />
        </div>

        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-noise opacity-5" />
      </div>

      {/* Hero Section */}
      <section className="min-h-screen relative overflow-hidden">
        <div className="relative min-h-screen flex items-center">
          <div className="container mx-auto px-4">
            <motion.div
              style={{ y: textY }}
              className="max-w-4xl mx-auto text-center relative"
            >
              {/* Badge Protocol amélioré */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="inline-block mb-8 px-6 py-3 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/5 backdrop-blur-sm"
              >
                <span className="text-fuchsia-400 font-mono relative">
                  <span className="absolute -inset-0.5 bg-fuchsia-500/20 blur-sm rounded-full animate-pulse" />
                  <span className="relative">SHADOW PROTOCOL v1.0</span>
                </span>
              </motion.div>
              
              {/* Titre principal amélioré */}
              <motion.h1 
                className="text-7xl sm:text-8xl font-bold mb-8 leading-tight relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                <span className="relative inline-block">
                  <span className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 blur-xl" />
                  <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 animate-gradient">
                    Social Tokens<br />Made Simple
                  </span>
                </span>
              </motion.h1>
              
              {/* Sous-titre amélioré */}
              <motion.p 
                className="text-xl sm:text-2xl mb-12 font-light"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/90 to-cyan-400/90">
                  Create and launch your token in seconds
                </span>
                <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/90 to-cyan-400/90">
                  with guaranteed liquidity and social integration.
                </span>
              </motion.p>

              {/* Boutons CTA améliorés */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-6 items-center justify-center"
              >
                <Link 
                  to="/how-it-works" 
                  className="group relative px-8 py-4 rounded-lg overflow-hidden interactive w-full sm:w-auto text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                  <div className="absolute inset-0 backdrop-blur-sm" />
                  <motion.span 
                    className="relative text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400"
                    whileHover={{ scale: 1.02 }}
                  >
                    Get Started →
                  </motion.span>
                </Link>
                
                <a 
                  href="https://shadow.fun" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group interactive relative"
                >
                  <motion.span 
                    className="text-xl inline-block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/90 to-cyan-400/90"
                    whileHover={{ 
                      scale: 1.05,
                      backgroundImage: "linear-gradient(to right, #D946EF, #06B6D4)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    View Platform
                  </motion.span>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 animate-gradient">
              Why Choose Shadow?
            </h2>
            <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
              Experience the future of social tokens with our innovative platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                className={`group p-8 rounded-2xl bg-gradient-to-b from-gray-900/50 to-black/50 backdrop-blur-sm border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300`}
              >
                <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    icon: "⚡",
    title: "Instant Creation",
    description: "Create your token with a single tweet or message on social media."
  },
  {
    icon: "💧",
    title: "Guaranteed Liquidity",
    description: "Launch with confidence knowing your token has immediate trading capability."
  },
  {
    icon: "🔗",
    title: "Social Integration",
    description: "Seamlessly manage your token through Twitter and Warpcast."
  }
]; 