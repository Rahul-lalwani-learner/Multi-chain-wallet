import React from 'react';
import { Wallet } from 'lucide-react';

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/25 animate-pulse">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Loading Animation */}
        <div className="mb-6">
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-white mb-2">
          Initializing Wallet
        </h2>
        <p className="text-slate-400">
          Setting up your secure environment...
        </p>
      </div>
    </div>
  );
}
