import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { NetworkProvider } from './context/NetworkContext'
import { SoundProvider } from './context/SoundContext'
import { NotificationProvider } from './context/NotificationContext'
import { WalletProvider } from './context/WalletContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NetworkProvider>
      <SoundProvider>
        <NotificationProvider>
          <WalletProvider>
            <App />
          </WalletProvider>
        </NotificationProvider>
      </SoundProvider>
    </NetworkProvider>
  </React.StrictMode>,
) 