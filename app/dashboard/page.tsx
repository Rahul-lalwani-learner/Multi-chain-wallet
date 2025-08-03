'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletProvider, useWallet } from '../../contexts/WalletContext';
import WalletSetup from '../../components/WalletSetup';
import WalletUnlock from '../../components/WalletUnlock';
import WalletDashboard from '../../components/WalletDashboard';

function WalletApp() {
  const [appState, setAppState] = useState<'setup' | 'unlock' | 'dashboard'>('setup');
  const { hasWallet, state } = useWallet();

  useEffect(() => {
    // Determine initial app state without loading screen
    if (hasWallet()) {
      setAppState(state.isUnlocked ? 'dashboard' : 'unlock');
    } else {
      setAppState('setup');
    }
  }, [hasWallet, state.isUnlocked]);

  const handleSetupComplete = () => {
    setAppState('dashboard');
  };

  const handleUnlock = () => {
    setAppState('dashboard');
  };

  const handleLock = () => {
    setAppState('unlock');
  };

  const handleReset = () => {
    setAppState('setup');
  };

  if (appState === 'setup') {
    return <WalletSetup onComplete={handleSetupComplete} />;
  }

  if (appState === 'unlock') {
    return <WalletUnlock onUnlock={handleUnlock} onReset={handleReset} />;
  }

  if (appState === 'dashboard') {
    return <WalletDashboard onLock={handleLock} />;
  }

  return null;
}

export default function DashboardPage() {
  return (
    <WalletProvider>
      <WalletApp />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: 'white',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
          },
          success: {
            iconTheme: {
              primary: '#ff6500',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </WalletProvider>
  );
}
