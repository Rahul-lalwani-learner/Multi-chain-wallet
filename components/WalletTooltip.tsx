'use client';

import React from 'react';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface WalletTooltipProps {
  wallet: {
    id: string;
    name: string;
    solanaAddress: string;
    ethereumAddress: string;
    derivationIndex: number;
  };
  isVisible: boolean;
  position: { x: number; y: number } | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

type WalletType = WalletTooltipProps['wallet'];

const WALLET_NETWORKS = [
  {
    name: 'Solana',
    symbol: 'SOL',
    icon: '◎',
    getAddress: (wallet: WalletType) => wallet.solanaAddress,
    color: 'text-orange-400'
  },
  {
    name: 'Ethereum',
    symbol: 'ETH', 
    icon: '⟠',
    getAddress: (wallet: WalletType) => wallet.ethereumAddress,
    color: 'text-blue-400'
  }
];

export default function WalletTooltip({ wallet, isVisible, position, onMouseEnter, onMouseLeave }: WalletTooltipProps) {
  if (!isVisible || !position) return null;
  const copyToClipboard = async (address: string, network: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${network} address copied!`);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy address');
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div 
      className={clsx(
        'fixed z-50 bg-slate-800/95 backdrop-blur-lg border border-slate-700/60 rounded-lg p-4 min-w-[280px] shadow-xl',
        'transform transition-all duration-200 ease-out',
        // Animation
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      )}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/60">
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {(wallet.derivationIndex ?? 0) + 1}
          </span>
        </div>
        <div>
          <h3 className="text-white font-semibold">{wallet.name}</h3>
          <p className="text-slate-400 text-xs">Wallet Addresses</p>
        </div>
      </div>

      {/* Address List */}
      <div className="space-y-3">
        {WALLET_NETWORKS.map((network) => {
          const address = network.getAddress(wallet);
          
          return (
            <div 
              key={network.symbol}
              className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/60 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{network.icon}</span>
                  <div className="min-w-0">
                    <div className={clsx('font-medium text-sm', network.color)}>
                      {network.name}
                    </div>
                    <div className="text-slate-300 text-xs font-mono">
                      {formatAddress(address)}
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(address, network.name);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                title={`Copy ${network.name} address`}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
