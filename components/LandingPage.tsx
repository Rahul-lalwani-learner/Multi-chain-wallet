'use client';

import React from 'react';
import { 
  Wallet, 
  Shield, 
  Zap, 
  Globe, 
  ArrowRight, 
  Check,
  Lock,
  Smartphone,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const features = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Multi-Chain Support",
      description: "Manage Solana and Ethereum assets in one secure wallet"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bank-Level Security",
      description: "Military-grade encryption protects your private keys"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Instant transactions with optimized blockchain connections"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Access",
      description: "Access your wallet from anywhere in the world"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile Responsive",
      description: "Perfect experience on desktop, tablet, and mobile"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-time Analytics",
      description: "Track your portfolio with live price updates"
    }
  ];

  const benefits = [
    "No registration required - start in seconds",
    "Your keys, your crypto - full custody control",
    "Support for mainnet and testnet environments",
    "Built-in faucet for testnet tokens",
    "Advanced transaction management",
    "Beautiful, intuitive interface"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjY1MDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/25">
                <Wallet className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Your Gateway to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Multi-Chain Finance
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the future of cryptocurrency management with our secure, 
              fast, and intuitive multi-chain wallet supporting Solana and Ethereum.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => router.push('/dashboard')}
                className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 flex items-center justify-center gap-2"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={scrollToFeatures}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500"
              >
                Learn More
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" />
                <span>Bank-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span>Fully Audited</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-500" />
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features Built for You
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to manage your cryptocurrency portfolio with confidence and ease.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-slate-900/60 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                  <div className="text-orange-500">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Choose Our Wallet?
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Built with cutting-edge technology and user experience in mind, 
                our wallet provides everything you need for secure crypto management.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
              >
                Start Your Journey
              </button>
            </div>
            
            <div className="relative">
              {/* Mockup Container */}
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
                <div className="bg-slate-900/60 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Account 1</div>
                      <div className="text-slate-400 text-sm">Primary Wallet</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">SOL:</span>
                      <span className="text-white">12.5847</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">ETH:</span>
                      <span className="text-white">0.8429</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-900/60 rounded-lg p-4">
                  <div className="text-white font-medium mb-2">Recent Activity</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Received SOL</span>
                      <span className="text-green-400">+2.5 SOL</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Sent ETH</span>
                      <span className="text-red-400">-0.1 ETH</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-orange-500/10 to-orange-600/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Crypto?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of users who trust our wallet for their cryptocurrency needs.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-12 py-4 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 text-lg"
          >
            Launch Wallet Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-700/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Multi-Chain Wallet</span>
            </div>
            
            <div className="text-slate-400 text-sm">
              © 2025 Multi-Chain Wallet. Built with security and privacy in mind.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
