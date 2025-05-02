import { motion } from 'framer-motion';
import { useState } from 'react';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <main className="min-h-screen bg-black overflow-x-hidden mt-24">
      {/* Background effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.8)_2px,transparent_2px),linear-gradient(to_bottom,rgba(0,0,0,0.8)_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-blue-500/10" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,0,255,0.05),transparent)] animate-scanner-slow" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-20"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 mb-4 sm:mb-6">
            How Shadow Protocol Works
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto px-4">
            Discover the technical architecture and features that power Shadow Protocol
          </p>
        </motion.div>

        {/* Key Features Section */}
        <section className="mb-20">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Key Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-all duration-300"
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

        {/* How It Works Section */}
        <section className="mb-20">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            How It Works
          </motion.h2>
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative flex items-start gap-8 mb-12"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center border border-fuchsia-500/20">
                  <span className="text-xl font-bold text-white">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Security Features Section */}
        <section className="mb-20">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Security Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Technical Implementation Section */}
        <section>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-8 sm:mb-12"
          >
            Technical Implementation
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 mb-12 sm:mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 sm:space-y-6"
            >
              {technicalSteps.map((step, index) => (
                <div
                  key={step.title}
                  className={`group relative bg-black/50 backdrop-blur-xl border rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                    activeStep === index
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/5'
                      : 'border-gray-800 hover:border-fuchsia-500/30'
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400">{step.description}</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6"
            >
              <div className="sticky top-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4">{technicalSteps[activeStep].title}</h3>
                <pre className="bg-black/50 rounded-xl p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm">
                  <code className="text-fuchsia-400">
                    {technicalSteps[activeStep].code}
                  </code>
                </pre>
                <div className="mt-4 space-y-3 sm:space-y-4">
                  {technicalSteps[activeStep].details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                        <span className="text-xs sm:text-sm text-fuchsia-400">{index + 1}</span>
                      </div>
                      <p className="text-sm sm:text-base text-gray-400">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}

const features = [
  {
    title: "Token Deployment",
    description: "Deploy ERC20 tokens with customizable parameters including name, symbol, supply, and liquidity.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    )
  },
  {
    title: "Uniswap V3 Integration",
    description: "Automatic liquidity pool creation and management with sophisticated price calculation mechanisms.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Position Management",
    description: "Track and manage Uniswap V3 positions with automated fee collection and distribution.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Fee Management",
    description: "Sophisticated fee collection system with automated distribution to stakeholders.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: "Price Management",
    description: "Advanced price calculation utilities with TWAP oracle integration for accurate pricing.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    )
  }
];

const steps = [
  {
    title: "Token Creation",
    description: "Start by configuring your token parameters including name, symbol, supply, and initial liquidity."
  },
  {
    title: "Address Prediction & Salt Generation",
    description: "The system generates a unique salt and predicts the token address to ensure Uniswap V3 compatibility."
  },
  {
    title: "Price Calculation",
    description: "Advanced algorithms calculate optimal pricing using TWAP oracles and sophisticated price management mechanisms."
  },
  {
    title: "Pool Creation",
    description: "Automatic creation and initialization of Uniswap V3 pool with calculated parameters and initial liquidity."
  },
  {
    title: "Position Management",
    description: "Track and manage your liquidity positions with automated fee collection and distribution systems."
  }
];

const securityFeatures = [
  {
    title: "Access Control",
    description: "Robust permission system with role-based access control for critical functions."
  },
  {
    title: "Atomic Transactions",
    description: "All deployment steps are atomic - if any step fails, the entire transaction reverts ensuring fund safety."
  },
  {
    title: "Parameter Validation",
    description: "Comprehensive parameter validation and security checks before any operation."
  },
  {
    title: "Anti-Sniper Protection",
    description: "Advanced salt generation mechanism to prevent front-running and sniping attacks."
  }
];

const technicalSteps = [
  {
    title: "Token Deployment Process",
    description: "Deep dive into the token deployment process and initial setup",
    code: `function deployToken(
  string name,
  string symbol,
  uint256 supply,
  uint256 liquidity,
  uint24 fee,
  bytes32 salt,
  address deployer
) external payable {
  // Validation and deployment logic
}`,
    details: [
      "Initial parameter validation and security checks",
      "Salt generation for deterministic address creation",
      "Token contract deployment with CREATE2",
      "Automatic liquidity pool creation",
      "Initial market making operations"
    ]
  },
  {
    title: "Price Calculation Mechanism",
    description: "Understanding how token prices are calculated and managed",
    code: `function calculatePrice(
  uint256 supply,
  uint256 liquidity
) public view returns (uint256) {
  // TWAP oracle integration
  // Price calculation logic
}`,
    details: [
      "Integration with Uniswap V3 TWAP oracles",
      "Dynamic price adjustment based on liquidity",
      "Slippage protection mechanisms",
      "Price impact calculations"
    ]
  },
  {
    title: "Liquidity Management",
    description: "How liquidity is managed and optimized in Uniswap V3",
    code: `struct Position {
  address token;
  int24 tickLower;
  int24 tickUpper;
  uint128 liquidity;
}`,
    details: [
      "Concentrated liquidity position management",
      "Fee tier selection and optimization",
      "Position rebalancing strategies",
      "Fee collection and distribution"
    ]
  }
]; 