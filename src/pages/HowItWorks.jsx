import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useScroll, useTransform } from 'framer-motion';

export default function HowItWorks() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const steps = [
    {
      title: "Mention @Shadow",
      description: "Start by mentioning @Shadow on X (Twitter) with your token parameters",
      icon: "🎯",
      example: "@Shadow Create my token"
    },
    {
      title: "Set Parameters",
      description: "Specify your token details in the same tweet",
      icon: "⚙️",
      example: "name: Test\nticker: $TEST\nliquidity: 100"
    },
    {
      title: "Instant Launch",
      description: "Your token will be created instantly with guaranteed liquidity",
      icon: "🚀",
      example: "Your token is live! Check the chart and start trading"
    }
  ];

  const exampleTweet = `@Shadow Create my token
name: Test
ticker: $TEST
liquidity: 100

Your social token will be created instantly with guaranteed liquidity! 🚀`;

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
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight relative">
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 blur-xl" />
                <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 animate-gradient">
                  How It Works
                </span>
              </span>
            </h1>
          </motion.div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gradient-to-b from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 hover:border-fuchsia-500/50 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                  {step.title}
                </h3>
                <p className="text-gray-400 mb-6">
                  {step.description}
                </p>
                <div className="bg-black/30 p-4 rounded-lg font-mono text-sm text-fuchsia-400/80">
                  {step.example}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Example Tweet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Example Tweet
            </h2>
            <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <pre className="font-mono text-fuchsia-400/80 whitespace-pre-wrap">
                {exampleTweet}
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 