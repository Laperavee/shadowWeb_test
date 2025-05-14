import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/globals.css';
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
import { WalletProvider } from './context/WalletContext';
import BackgroundEffects from './components/BackgroundEffects';

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();

  return (
    <div className="app relative min-h-screen text-white flex flex-col">
      <BackgroundEffects />

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
              <Route path="/news" element={<PostsIndex />} />
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
    <QueryClientProvider client={queryClient}>
      <Router>
        <SoundProvider>
          <NotificationProvider>
            <NetworkProvider>
              <WalletProvider>
                <AppContent />
              </WalletProvider>
            </NetworkProvider>
          </NotificationProvider>
        </SoundProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 