'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import FaucetButton from './FaucetButton';
import clsx from 'clsx';

interface BalanceCardProps {
  network: 'solana' | 'ethereum';
  balance: string;
  isLoading: boolean;
  isTestnet: boolean;
  address: string;
  onRefresh: () => void;
  onFaucetSuccess?: () => void;
}

export default function BalanceCard({
  network,
  balance,
  isLoading,
  isTestnet,
  address,
  onRefresh,
  onFaucetSuccess
}: BalanceCardProps) {
  const networkConfig = {
    solana: {
      name: 'Solana',
      symbol: 'SOL',
      color: 'bg-purple-600',
      textColor: 'text-purple-600'
    },
    ethereum: {
      name: 'Ethereum',
      symbol: 'ETH',
      color: 'bg-blue-600',
      textColor: 'text-blue-600'
    }
  };

  const config = networkConfig[network];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx('w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center', config.color)}>
            <span className="text-white font-bold text-xs md:text-sm">{config.symbol}</span>
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white">{config.name}</h3>
            <p className="text-xs md:text-sm text-gray-400">{config.symbol} Balance</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 md:p-2 text-gray-400 hover:text-white transition-colors"
          disabled={isLoading}
          title="Refresh Balance"
        >
          <RefreshCw className={clsx('w-4 h-4 md:w-5 md:h-5', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="text-2xl md:text-3xl font-bold text-white mb-2">
        {parseFloat(balance).toFixed(4)}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs md:text-sm text-gray-400">{config.symbol}</div>
        {isTestnet && (
          <FaucetButton
            network={network}
            address={address}
            onSuccess={onFaucetSuccess}
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  );
}
