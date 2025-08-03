'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletProvider, useWallet } from '../contexts/WalletContext';
import WalletSetup from '../components/WalletSetup';
import WalletUnlock from '../components/WalletUnlock';
import WalletDashboard from '../components/WalletDashboard';

function WalletApp() {
  const [appState, setAppState] = useState<'loading' | 'setup' | 'unlock' | 'dashboard'>('loading');
  const { hasWallet, state } = useWallet();

  useEffect(() => {
    // Determine initial app state
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

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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

export default function Home() {
  return (
    <WalletProvider>
      <WalletApp />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </WalletProvider>
  );
}