'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Copy, X, Shield, AlertTriangle } from 'lucide-react';
import { loadEncryptedMnemonic } from '../lib/storage';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface SeedPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SeedPhraseModal: React.FC<SeedPhraseModalProps> = ({ isOpen, onClose }) => {
  const { verifyPassword } = useWallet();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [step, setStep] = useState<'password' | 'view'>('password');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('password');
      setPassword('');
      setSeedPhrase(null);
      setShowSeedPhrase(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setPassword('');
    setSeedPhrase(null);
    setShowSeedPhrase(false);
    setStep('password');
    onClose();
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      // Verify password first
      if (!verifyPassword(password)) {
        toast.error('Incorrect password');
        setIsLoading(false);
        return;
      }

      // Load the seed phrase
      const mnemonic = loadEncryptedMnemonic(password);
      if (!mnemonic) {
        toast.error('Failed to retrieve seed phrase');
        setIsLoading(false);
        return;
      }

      setSeedPhrase(mnemonic);
      setStep('view');
      toast.success('Seed phrase loaded successfully');
    } catch (error) {
      console.error('Failed to load seed phrase:', error);
      toast.error('Failed to retrieve seed phrase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySeedPhrase = async () => {
    if (!seedPhrase) return;
    
    try {
      await navigator.clipboard.writeText(seedPhrase);
      toast.success('Seed phrase copied to clipboard');
    } catch (error) {
      console.error('Failed to copy seed phrase:', error);
      toast.error('Failed to copy seed phrase');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'password') {
        handlePasswordSubmit();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-slate-800/95 backdrop-blur-lg rounded-2xl w-full max-w-lg border border-slate-700/50 shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white rounded-t-2xl">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Shield className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold mb-1">
                {step === 'password' ? 'Verify Password' : 'Your Seed Phrase'}
              </h3>
              <p className="text-blue-100 text-sm sm:text-base">
                {step === 'password' 
                  ? 'Enter your password to view seed phrase' 
                  : 'Keep this secret and secure'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {step === 'password' ? (
          <>
            {/* Security Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-orange-800 mb-1 text-sm sm:text-base">Security Warning</h4>
                  <p className="text-orange-700 text-xs sm:text-sm leading-relaxed">
                    Your seed phrase provides complete access to your wallet. Never share it with anyone or enter it on suspicious websites.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Wallet Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 pr-12 text-sm sm:text-base"
                  placeholder="Enter your wallet password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={!password.trim() || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {isLoading ? 'Verifying...' : 'View Seed Phrase'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Seed Phrase Display */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Your 12-Word Seed Phrase
              </label>
              <div className="relative">
                <div className={clsx(
                  'bg-slate-900/60 border border-slate-600/50 rounded-lg p-4 min-h-[120px] relative',
                  !showSeedPhrase && 'blur-sm'
                )}>
                  <p className="text-white font-mono text-xs sm:text-sm leading-relaxed break-all">
                    {seedPhrase}
                  </p>
                </div>
                {!showSeedPhrase && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setShowSeedPhrase(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm sm:text-base"
                    >
                      <Eye className="w-4 h-4" />
                      Click to reveal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Security Instructions */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-red-800 mb-2 text-sm sm:text-base">Security Instructions</h4>
                  <ul className="text-red-700 text-xs sm:text-sm space-y-1">
                    <li>• Write down these words in the exact order</li>
                    <li>• Store them offline in a safe location</li>
                    <li>• Never share with anyone or store digitally</li>
                    <li>• Anyone with these words can access your funds</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors order-2 sm:order-1"
              >
                Close
              </button>
              {showSeedPhrase && (
                <button
                  onClick={handleCopySeedPhrase}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default SeedPhraseModal;
