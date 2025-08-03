'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Wallet, Download, Upload } from 'lucide-react';
import { generateMnemonic, validateMnemonic } from '../lib/walletUtils';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface WalletSetupProps {
  onComplete: () => void;
}

export default function WalletSetup({ onComplete }: WalletSetupProps) {
  const [mode, setMode] = useState<'welcome' | 'create' | 'import'>('welcome');
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const { createWallet, importWallet } = useWallet();

  const handleGenerateMnemonic = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
  };

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!mnemonicConfirmed) {
      toast.error('Please confirm you have saved your seed phrase');
      return;
    }

    setLoading(true);
    try {
      const success = await createWallet(mnemonic, password);
      if (success) {
        toast.success('Wallet created successfully!');
        onComplete();
      } else {
        toast.error('Failed to create wallet');
      }
    } catch (error) {
      console.error('Wallet creation error:', error);
      toast.error('Failed to create wallet');
    }
    setLoading(false);
  };

  const handleImportWallet = async () => {
    if (!validateMnemonic(mnemonic)) {
      toast.error('Invalid seed phrase');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const success = await importWallet(mnemonic, password);
      if (success) {
        toast.success('Wallet imported successfully!');
        onComplete();
      } else {
        toast.error('Failed to import wallet');
      }
    } catch (error) {
      console.error('Wallet import error:', error);
      toast.error('Failed to import wallet');
    }
    setLoading(false);
  };

  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Multi-Chain Wallet
            </h1>
            <p className="text-gray-300">
              Manage your Solana and Ethereum assets in one place
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                setMode('create');
                handleGenerateMnemonic();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Create New Wallet
            </button>

            <button
              onClick={() => setMode('import')}
              className="w-full bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Import Existing Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Create New Wallet
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seed Phrase (Save this securely!)
              </label>
              <div className="relative">
                <div className={`bg-black/20 border border-white/20 rounded-lg p-4 ${showMnemonic ? '' : 'blur-sm'}`}>
                  <p className="text-white text-sm font-mono break-all">
                    {mnemonic}
                  </p>
                </div>
                <button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  {showMnemonic ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirmed"
                  checked={mnemonicConfirmed}
                  onChange={(e) => setMnemonicConfirmed(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="confirmed" className="text-sm text-gray-300">
                  I have saved my seed phrase securely
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 pr-10"
                  placeholder="Enter password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                placeholder="Confirm password"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCreateWallet}
                disabled={loading || !mnemonicConfirmed || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Wallet'}
              </button>

              <button
                onClick={() => setMode('welcome')}
                className="w-full bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'import') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Import Wallet
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seed Phrase
              </label>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                rows={4}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none"
                placeholder="Enter your 12-word seed phrase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 pr-10"
                  placeholder="Enter password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                placeholder="Confirm password"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleImportWallet}
                disabled={loading || !mnemonic || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Import Wallet'}
              </button>

              <button
                onClick={() => setMode('welcome')}
                className="w-full bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
