'use client';

import React from 'react';
import { Wallet, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/25">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-4">
            404
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-orange-500 to-orange-600 mx-auto rounded-full"></div>
        </div>
        
        {/* Error Message */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Oops! Page Not Found
        </h2>
        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
          The page you&apos;re looking for seems to have vanished into the blockchain. 
          Don&apos;t worry, your crypto is safe with us!
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="group bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          <button
            onClick={() => router.push('/')}
            className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        </div>
        
        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <p className="text-slate-400 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              Dashboard
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => router.push('/')}
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
