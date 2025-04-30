import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { SoundProvider } from './context/SoundContext';
import { NotificationProvider } from './context/NotificationContext';
import { NetworkProvider } from './context/NetworkContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ShadowFun from './pages/ShadowFun';
import Staking from './pages/Staking';
import HowItWorks from './pages/HowItWorks';
import Features from './pages/Features';
import PostsIndex from './pages/PostsIndex';

function App() {
  return (
    <Router>
      <WalletProvider>
        <SoundProvider>
          <NotificationProvider>
            <NetworkProvider>
              <div className="min-h-screen bg-black text-white">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shadow-fun" element={<ShadowFun />} />
                  <Route path="/staking" element={<Staking />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/news" element={<PostsIndex />} />
                  <Route path="/docs" element={<Navigate to="https://shadow-19.gitbook.io/shadow-docs/" replace />} />
                </Routes>
              </div>
            </NetworkProvider>
          </NotificationProvider>
        </SoundProvider>
      </WalletProvider>
    </Router>
  );
}

export default App; 