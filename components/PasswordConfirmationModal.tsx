'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<boolean> | boolean;
  title: string;
  description: string;
  confirmButtonText?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function PasswordConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = "Confirm",
  icon
}: PasswordConfirmationModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await onConfirm(password);
      if (!result) {
        setError('Invalid password. Please try again.');
      }
      // If successful, the parent component will handle closing the modal
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.trim() && !isLoading) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-slate-800 rounded-lg p-4 md:p-6 max-w-md w-full border border-slate-700 relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors"
          disabled={isLoading}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
            {icon || <Lock className="w-4 h-4 text-orange-500" />}
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        {/* Description */}
        <p className="text-slate-300 mb-6 text-sm leading-relaxed">
          {description}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 pr-10 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                placeholder="Enter your password"
                autoFocus
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Error Message */}
            {error && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <span className="text-red-500">⚠</span>
                {error}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password.trim() || isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : confirmButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
