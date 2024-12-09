import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Features() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const features = [
    {
      title: "Instant Creation",
      description: "Create your token in seconds with a simple tweet. No coding required.",
      icon: "⚡",
      details: [
        "One-click deployment",
        "Automatic smart contract generation",
        "Immediate trading capability"
      ]
    },
    {
      title: "Guaranteed Liquidity",
      description: "Launch with confidence knowing your token has built-in liquidity protection.",
      icon: "💧",
      details: [
        "Initial liquidity locked",
        "Anti-dump mechanisms",
        "Price stability features"
      ]
    },
    {
      title: "Social Integration",
      description: "Seamlessly manage your token through popular social platforms.",
      icon: "🔗",
      details: [
        "Twitter/X integration",
        "Community management tools",
        "Social engagement tracking"
      ]
    },
    {
      title: "Advanced Security",
      description: "Built-in protection mechanisms to ensure safe trading.",
      icon: "🛡️",
      details: [
        "Anti-bot measures",
        "Transaction limits",
        "Honeypot protection"
      ]
    },
    {
      title: "Real-time Analytics",
      description: "Track your token's performance with detailed analytics.",
      icon: "📊",
      details: [
        "Price tracking",
        "Volume analytics",
        "Holder statistics"
      ]
    },
    {
      title: "Community Tools",
      description: "Engage and grow your community with built-in tools.",
      icon: "👥",
      details: [
        "Holder rewards",
        "Voting mechanisms",
        "Community incentives"
      ]
    }
  ];

  return (
    <main ref={containerRef} className="bg-black">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="grid-animation opacity-5" />
        
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

        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(137,87,255,0.05)_50%,transparent_100%)] animate-scanner" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(59,130,246,0.05)_50%,transparent_100%)] animate-scanner-reverse" />
        </div>

        <div className="absolute inset-0 bg-noise opacity-5" />
      </div>

      <div className="min-h-screen pt-20 pb-16 relative">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-block mb-8 px-6 py-3 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/5 backdrop-blur-sm"
            >
              <span className="text-fuchsia-400 font-mono relative">
                <span className="absolute -inset-0.5 bg-fuchsia-500/20 blur-sm rounded-full animate-pulse" />
                <span className="relative">POWERFUL FEATURES</span>
              </span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight relative">
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 blur-xl" />
                <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 animate-gradient">
                  Everything You Need
                </span>
              </span>
            </h1>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 hover:border-fuchsia-500/50 transition-all duration-300 group"
              >
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center text-fuchsia-400/80">
                      <span className="mr-2">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 