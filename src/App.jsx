import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Features from './pages/Features';
import Platform from './pages/Platform';
import HowItWorks from './pages/HowItWorks';
import SuccessStories from './pages/SuccessStories';
import FAQ from './pages/FAQ';
import ShadowFun from './pages/ShadowFun';

// Components for managing effects
import SoundProvider from './context/SoundContext';
import Cursor from './components/Cursor';
import LoadingScreen from './components/LoadingScreen';

// Créer un composant wrapper pour gérer l'affichage conditionnel de la Navbar
function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/shadow-fun';

  return (
    <div className="app relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background amélioré */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grille cyberpunk */}
        <div className="absolute inset-0 grid-animation opacity-3" />
        
        {/* Orbes lumineux */}
        <div className="absolute -top-1/4 -left-1/4 w-[1000px] h-[1000px]">
          <div className="absolute inset-0 bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute inset-0 bg-fuchsia-500/5 rounded-full blur-[150px] animate-pulse-slower" />
        </div>
        
        <div className="absolute -bottom-1/4 -right-1/4 w-[1000px] h-[1000px]">
          <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-[150px] animate-pulse-slower" />
        </div>

        {/* Lignes de scan */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(217,70,239,0.03)_50%,transparent_100%)] animate-scanner" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(6,182,212,0.03)_50%,transparent_100%)] animate-scanner-reverse" />
        </div>

        {/* Bruit subtil */}
        <div className="absolute inset-0 bg-noise opacity-[0.02]" />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10">
        {!hideNavbar && <Navbar />}
        <main className="min-h-screen pb-96">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/features" element={<Features />} />
              <Route path="/platform" element={<Platform />} />
              <Route path="/shadow-fun" element={<ShadowFun />} />
            </Routes>
          </AnimatePresence>
        </main>
        {!hideNavbar && <Footer />}
      </div>

      {/* Effets globaux */}
      <Cursor />
      <LoadingScreen />
    </div>
  );
}

function App() {
  return (
    <Router>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </Router>
  );
}

export default App; 