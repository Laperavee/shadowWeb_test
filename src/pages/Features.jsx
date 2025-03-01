import { motion } from 'framer-motion';

export default function Features() {
  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,0,255,0.15),transparent_50%)] animate-pulse-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.15),transparent_50%)] animate-pulse-slow delay-75" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,0,255,0.05),transparent)] animate-scanner" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-20"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 mb-4 sm:mb-6">
            Advanced Features
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto px-4">
            Explore the powerful features and capabilities that make Shadow Protocol the ultimate solution for token deployment
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.capabilities.map((capability, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4 text-fuchsia-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Uniswap V3 Integration */}
        <section className="mb-12 sm:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-8 sm:mb-12"
          >
            Uniswap V3 Integration
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto px-4">
            {uniswapFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 mb-4">{feature.description}</p>
                  <pre className="bg-black/50 rounded-xl p-4 overflow-x-auto">
                    <code className="text-sm text-fuchsia-400">{feature.code}</code>
                  </pre>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Security Features */}
        <section className="mb-12 sm:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-8 sm:mb-12"
          >
            Security Features
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Cross-Chain Features */}
        <section>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-8 sm:mb-12"
          >
            Cross-Chain Capabilities
          </motion.h2>
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8 px-4">
            {crossChainFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center border border-fuchsia-500/20">
                    <span className="text-2xl font-bold text-white">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 mb-4">{feature.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                          <svg className="w-4 h-4 text-fuchsia-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                          </svg>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const mainFeatures = [
  {
    title: "Advanced Token Deployment",
    description: "Deploy ERC20 tokens with sophisticated features and customization options",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    capabilities: [
      "Customizable token parameters",
      "Automatic liquidity pool creation",
      "Initial market making",
      "Flexible fee structures"
    ]
  },
  {
    title: "Price Management",
    description: "Sophisticated price calculation and management mechanisms",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    capabilities: [
      "TWAP oracle integration",
      "Dynamic price adjustments",
      "Slippage protection",
      "Price impact calculations"
    ]
  },
  {
    title: "Liquidity Management",
    description: "Advanced liquidity pool management and optimization",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    capabilities: [
      "Concentrated liquidity positions",
      "Fee tier optimization",
      "Position rebalancing",
      "Automated fee collection"
    ]
  }
];

const uniswapFeatures = [
  {
    title: "Concentrated Liquidity",
    description: "Optimize liquidity provision with concentrated positions",
    code: `function provideLiquidity(
  int24 tickLower,
  int24 tickUpper,
  uint256 amount
) external {
  // Calculate optimal tick range
  // Provide concentrated liquidity
}`
  },
  {
    title: "Fee Management",
    description: "Advanced fee collection and distribution system",
    code: `function collectFees(
  uint256 tokenId
) external returns (
  uint256 amount0,
  uint256 amount1
) {
  // Collect and distribute fees
}`
  }
];

const securityFeatures = [
  {
    title: "Access Control",
    description: "Role-based access control system for critical functions",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )
  },
  {
    title: "Anti-Sniper Protection",
    description: "Advanced mechanisms to prevent front-running and sniping",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  {
    title: "Parameter Validation",
    description: "Comprehensive validation of all deployment parameters",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const crossChainFeatures = [
  {
    title: "LayerZero Integration",
    description: "Seamless cross-chain communication and token deployment",
    benefits: [
      "Multi-chain deployment",
      "Cross-chain messaging",
      "Unified liquidity",
      "Chain-agnostic operations"
    ]
  },
  {
    title: "Chain Optimization",
    description: "Optimized deployment parameters for different chains",
    benefits: [
      "Chain-specific configurations",
      "Gas optimization",
      "Performance tuning",
      "Network-specific features"
    ]
  },
  {
    title: "Cross-Chain Liquidity",
    description: "Manage liquidity across multiple chains efficiently",
    benefits: [
      "Unified liquidity view",
      "Cross-chain rebalancing",
      "Optimized routing",
      "Multi-chain yield"
    ]
  }
]; 