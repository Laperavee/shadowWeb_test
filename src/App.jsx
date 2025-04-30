import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import ShadowFun from './pages/ShadowFun';
import TokenDetail from './pages/TokenDetail';
import Staking from './pages/Staking';
import PostsIndex from './pages/PostsIndex';
import PostDetail from './pages/PostDetail';
import { SoundProvider } from './context/SoundContext';
import { NotificationProvider } from './context/NotificationContext';
import { NetworkProvider } from './context/NetworkContext';

function AppContent() {
  const location = useLocation();

  return (
    <div className="app relative min-h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Background amélioré */}
      <div className="fixed inset-0 pointer-events-none">
        
        {/* Orbes lumineux */}
        <div className="absolute -top-1/4 -left-1/4 w-[1000px] h-[1000px]">
          <div className="absolute inset-0 bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute inset-0 bg-fuchsia-500/5 rounded-full blur-[150px] animate-pulse-slower" />
        </div>
        
        <div className="absolute -bottom-1/4 -right-1/4 w-[1000px] h-[1000px]">
          <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-[150px] animate-pulse-slower" />
        </div>
        {/* Bruit subtil */}
        <div className="absolute inset-0 bg-noise opacity-[0.02]" />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/features" element={<Features />} />
              <Route path="/shadow-fun" element={<ShadowFun />} />
              <Route path="/token/:address" element={<TokenDetail />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/posts" element={<PostsIndex />} />
              <Route path="/post/:id" element={<PostDetail />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer className="mt-auto" />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <SoundProvider>
        <NotificationProvider>
          <NetworkProvider>
            <AppContent />
          </NetworkProvider>
        </NotificationProvider>
      </SoundProvider>
    </Router>
  );
}

export default App; 