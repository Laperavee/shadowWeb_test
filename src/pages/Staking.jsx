import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Staking() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // VIP Tiers configuration
  const VIP_TIERS = {
    BRONZE: {
      name: 'Bronze VIP',
      requirement: 50000,
      color: 'from-orange-400 to-orange-600',
      benefits: [
        'Access to Bronze VIP chat',
        'Early access to new features',
        '5% bonus rewards'
      ]
    },
    SILVER: {
      name: 'Silver VIP',
      requirement: 100000,
      color: 'from-gray-300 to-gray-100',
      benefits: [
        'All Bronze benefits',
        'Priority customer support',
        '10% bonus rewards',
        'Exclusive Silver events'
      ]
    },
    GOLD: {
      name: 'Gold VIP',
      requirement: 200000,
      color: 'from-yellow-400 to-yellow-600',
      benefits: [
        'All Silver benefits',
        'Direct line to developers',
        '20% bonus rewards',
        'Voting rights on project decisions',
        'Exclusive Gold events'
      ]
    }
  };

  // États pour le staking
  const [stakingData, setStakingData] = useState({
    totalStaked: 0,
    userStaked: 0,
    rewards: 0,
    apr: 120,
    lockPeriod: 30,
    minimumStake: 1000
  });

  // Fonction pour déterminer le niveau VIP actuel
  const getCurrentVipTier = (stakedAmount) => {
    if (stakedAmount >= VIP_TIERS.GOLD.requirement) return 'GOLD';
    if (stakedAmount >= VIP_TIERS.SILVER.requirement) return 'SILVER';
    if (stakedAmount >= VIP_TIERS.BRONZE.requirement) return 'BRONZE';
    return null;
  };

  // Fonction pour calculer la progression vers le prochain niveau
  const getNextTierProgress = (stakedAmount) => {
    const currentTier = getCurrentVipTier(stakedAmount);
    if (currentTier === 'GOLD') return 100;
    
    const tiers = Object.entries(VIP_TIERS);
    const currentTierIndex = currentTier ? tiers.findIndex(([key]) => key === currentTier) : -1;
    const nextTier = tiers[currentTierIndex + 1];
    
    if (!nextTier) return (stakedAmount / VIP_TIERS.BRONZE.requirement) * 100;
    
    const prevRequirement = currentTier ? VIP_TIERS[currentTier].requirement : 0;
    const progress = ((stakedAmount - prevRequirement) / (nextTier[1].requirement - prevRequirement)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const [stakingAmount, setStakingAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  // Handler pour le staking
  const handleStake = async () => {
    if (!isWalletConnected) {
      addNotification("Please connect your wallet first!", "error");
      return;
    }

    if (!stakingAmount || parseFloat(stakingAmount) < stakingData.minimumStake) {
      addNotification(`Minimum stake amount is ${stakingData.minimumStake} SHDW`, "error");
      return;
    }

    setIsStaking(true);
    try {
      // TODO: Implement staking logic
      addNotification("Staking successful!", "success");
      setStakingAmount('');
    } catch (error) {
      addNotification("Failed to stake tokens", "error");
    }
    setIsStaking(false);
  };

  // Handler pour le unstaking
  const handleUnstake = async () => {
    if (!isWalletConnected) {
      addNotification("Please connect your wallet first!", "error");
      return;
    }

    if (stakingData.userStaked <= 0) {
      addNotification("No tokens to unstake", "error");
      return;
    }

    setIsStaking(true);
    try {
      // TODO: Implement unstaking logic
      addNotification("Unstaking successful!", "success");
    } catch (error) {
      addNotification("Failed to unstake tokens", "error");
    }
    setIsStaking(false);
  };

  // Handler pour réclamer les récompenses
  const handleClaimRewards = async () => {
    if (!isWalletConnected) {
      addNotification("Please connect your wallet first!", "error");
      return;
    }

    if (stakingData.rewards <= 0) {
      addNotification("No rewards to claim", "error");
      return;
    }

    setIsStaking(true);
    try {
      // TODO: Implement claim rewards logic
      addNotification("Rewards claimed successfully!", "success");
    } catch (error) {
      addNotification("Failed to claim rewards", "error");
    }
    setIsStaking(false);
  };

  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,255,0.1),transparent_50%)] animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-fuchsia-900/20 to-cyan-900/30 animate-gradient-slow" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.9),transparent_50%,rgba(0,0,0,0.9))]" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-fuchsia-500/20 shadow-lg">
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="container mx-auto flex justify-between items-center py-4 px-6"
        >
          <motion.div
            className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Link to="/shadow-fun" className="cursor-pointer">
              Shadow Protocol
            </Link>
          </motion.div>
          <Link
            to="/shadow-fun"
            className="relative px-6 py-2.5 rounded-xl group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative flex items-center gap-2">
              <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span className="text-white font-semibold">
                Back to Shadow Fun
              </span>
            </div>
          </Link>
        </motion.div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* VIP Staking Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-4">
            VIP Staking Platform
          </h2>
          <p className="text-gray-400">
            Stake your tokens to unlock exclusive VIP tiers and earn rewards
          </p>
        </motion.div>

        {/* Current VIP Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 bg-black/30 backdrop-blur-xl border border-fuchsia-500/20 rounded-xl p-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Your VIP Status
              </h3>
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
                  getCurrentVipTier(stakingData.userStaked) 
                    ? VIP_TIERS[getCurrentVipTier(stakingData.userStaked)].color
                    : 'from-gray-500 to-gray-400'
                }`}>
                  {getCurrentVipTier(stakingData.userStaked) 
                    ? VIP_TIERS[getCurrentVipTier(stakingData.userStaked)].name
                    : 'Not VIP Yet'}
                </div>
                <span className="text-gray-400">
                  ({stakingData.userStaked.toLocaleString()} SHDW staked)
                </span>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress to Next Tier</span>
                <span>{Math.round(getNextTierProgress(stakingData.userStaked))}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 transition-all duration-1000"
                  style={{ width: `${getNextTierProgress(stakingData.userStaked)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* VIP Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {Object.entries(VIP_TIERS).map(([tier, { name, requirement, color, benefits }]) => (
            <div
              key={tier}
              className={`relative bg-black/30 backdrop-blur-xl border border-fuchsia-500/20 rounded-xl p-6 ${
                stakingData.userStaked >= requirement ? 'border-opacity-100' : 'border-opacity-20'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <h3 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${color} mb-4`}>
                  {name}
                </h3>
                <div className="text-lg font-semibold text-white mb-4">
                  {requirement.toLocaleString()} SHDW
                </div>
                <ul className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-400">
                      <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Staking Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/30 backdrop-blur-xl border border-fuchsia-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400">APR</h3>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                {stakingData.apr}%
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500"
                style={{ width: `${Math.min(stakingData.apr/2, 100)}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/30 backdrop-blur-xl border border-fuchsia-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400">Total Staked</h3>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                {stakingData.totalStaked.toLocaleString()} SHDW
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500"
                style={{ width: '60%' }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/30 backdrop-blur-xl border border-fuchsia-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400">Lock Period</h3>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                {stakingData.lockPeriod} Days
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500"
                style={{ width: `${(stakingData.lockPeriod/365)*100}%` }}
              />
            </div>
          </motion.div>
        </div>

        {/* Staking Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/30 backdrop-blur-xl border border-fuchsia-500/20 rounded-xl p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stake Section */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Stake Tokens</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Amount to Stake</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={stakingAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setStakingAmount(value);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500/50"
                      placeholder={`Minimum ${stakingData.minimumStake} SHDW`}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <button 
                      onClick={() => setStakingAmount(stakingData.userStaked.toString())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 backdrop-blur-sm border border-fuchsia-400/20 px-4 py-1.5 rounded-xl hover:border-fuchsia-400/50 transition-all interactive relative group"
                    >
                      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                        MAX
                      </span>
                    </button>
                  </div>
                </div>
                <motion.button
                  onClick={handleStake}
                  disabled={isStaking || stakingAmount <= 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all disabled:opacity-50"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    {isStaking ? "Staking..." : "Stake Now"}
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Unstake Section */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Your Staking</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Staked Balance</span>
                    <span>{stakingData.userStaked.toLocaleString()} SHDW</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500"
                      style={{ width: '40%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Rewards Earned</span>
                    <span>{stakingData.rewards.toLocaleString()} SHDW</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500"
                      style={{ width: '25%' }}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <motion.button
                    onClick={handleClaimRewards}
                    disabled={isStaking || stakingData.rewards <= 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all disabled:opacity-50"
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                      {isStaking ? "Claiming..." : "Claim Rewards"}
                    </span>
                  </motion.button>
                  <motion.button
                    onClick={handleUnstake}
                    disabled={isStaking || stakingData.userStaked <= 0}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 backdrop-blur-sm border border-fuchsia-400/20 px-4 py-1.5 rounded-xl hover:border-fuchsia-400/50 transition-all interactive relative group"
                  >
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                      Unstake
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Staking Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-black/30 backdrop-blur-xl border border-fuchsia-500/20 rounded-xl"
        >
          <h3 className="text-xl font-bold text-white mb-4">Staking Information</h3>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Minimum stake amount: {stakingData.minimumStake.toLocaleString()} SHDW
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lock period: {stakingData.lockPeriod} days
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rewards are distributed daily
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Early unstaking will result in a penalty
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(({ id, message, type }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-3 ${
              type === 'error' 
                ? 'bg-red-500/10 border border-red-500/50 text-red-400'
                : type === 'success'
                ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                : 'bg-gray-900/50 border border-fuchsia-500/50 text-fuchsia-400'
            }`}
          >
            {type === 'error' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {message}
          </motion.div>
        ))}
      </div>
    </main>
  );
} 