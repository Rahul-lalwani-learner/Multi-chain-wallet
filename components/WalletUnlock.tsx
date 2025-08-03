'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Wallet, RotateCcw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

  const router = useRouter();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-slate-700/50">
          {/* Go Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-sm">Back to Home</span>
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Reset Wallet
            </h2>
            <p className="text-slate-300 text-sm">
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
              className="w-full bg-slate-700/50 border border-slate-600/50 text-slate-200 py-3 px-6 rounded-lg font-semibold hover:bg-slate-700/70 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-slate-700/50">
        {/* Go Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm">Back to Home</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-300">
            Enter your password to unlock your wallet
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 pr-10 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                placeholder="Enter your password"
                autoFocus
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleUnlock}
              disabled={loading || !password}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Unlocking...' : 'Unlock Wallet'}
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-slate-700/50 border border-slate-600/50 text-slate-200 py-3 px-6 rounded-lg font-semibold hover:bg-slate-700/70 transition-all duration-200 text-sm"
            >
              Reset Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
