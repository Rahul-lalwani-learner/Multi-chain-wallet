'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Wallet, RotateCcw } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface WalletUnlockProps {
  onUnlock: () => void;
  onReset: () => void;
}

export default function WalletUnlock({ onUnlock, onReset }: WalletUnlockProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { unlockWallet, resetWallet } = useWallet();

  const handleUnlock = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const success = await unlockWallet(password);
      if (success) {
        toast.success('Wallet unlocked successfully!');
        onUnlock();
      } else {
        toast.error('Incorrect password');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      toast.error('Failed to unlock wallet');
    }
    setLoading(false);
  };

  const handleReset = () => {
    resetWallet();
    toast.success('Wallet reset successfully');
    onReset();
    setShowResetConfirm(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  if (showResetConfirm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Reset Wallet
            </h2>
            <p className="text-gray-300 text-sm">
              This will permanently delete your wallet and all associated data. 
              Make sure you have your seed phrase backed up.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleReset}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200"
            >
              Yes, Reset Wallet
            </button>

            <button
              onClick={() => setShowResetConfirm(false)}
              className="w-full bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-300">
            Enter your password to unlock your wallet
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 pr-10"
                placeholder="Enter your password"
                autoFocus
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleUnlock}
              disabled={loading || !password}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Unlocking...' : 'Unlock Wallet'}
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 text-sm"
            >
              Reset Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
