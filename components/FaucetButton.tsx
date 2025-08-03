'use client';

import React, { useState } from 'react';
import { Droplets } from 'lucide-react';
import { FaucetService } from '../lib/faucetService';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface FaucetButtonProps {
  network: 'solana' | 'ethereum';
  address: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export default function FaucetButton({ network, address, onSuccess, disabled }: FaucetButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [requestCooldown, setRequestCooldown] = useState(false);
  const faucetInfo = FaucetService.getFaucetInfo(network);
  
  // Disable Ethereum faucet
  const isEthereumDisabled = network === 'ethereum';

  const handleFaucetRequest = async () => {
    if (!address || disabled || requestCooldown || isEthereumDisabled) return;

    setIsLoading(true);
    setRequestCooldown(true);
    
    try {
      await FaucetService.requestAirdrop(network, address);
      const faucetInfo = FaucetService.getFaucetInfo(network);
      
      if (network === 'solana') {
        toast.success(`${faucetInfo.amount} airdrop submitted! Tokens will appear in 10-30 seconds.`, {
          duration: 5000,
        });
        
        // Auto-refresh balance after a delay for Solana
        if (onSuccess) {
          setTimeout(onSuccess, 10000); // Wait 10 seconds for Solana transaction to process
        }
      } else {
        toast.success(`${faucetInfo.amount} requested successfully!`, {
          duration: 4000,
        });
        
        if (onSuccess) {
          setTimeout(onSuccess, 5000);
        }
      }
      
      // Keep button disabled for 30 seconds to prevent spam
      setTimeout(() => setRequestCooldown(false), 30000);
      
    } catch (error) {
      setRequestCooldown(false); // Reset cooldown on error
      const errorMessage = error instanceof Error ? error.message : 'Failed to request tokens';
      
      if (errorMessage.includes('manual') || errorMessage.includes('limit') || errorMessage.includes('unavailable')) {
        // Show manual faucet option for rate limits or other issues
        const faucetInfo = FaucetService.getFaucetInfo(network);
        toast.error(errorMessage, {
          duration: 8000,
        });
        // Open manual faucet in a new tab after showing error
        setTimeout(() => {
          if (network === 'solana') {
            window.open('https://docs.alchemy.com/docs/how-to-add-alchemy-rpc-endpoints-to-metamask', '_blank');
          } else {
            window.open(faucetInfo.manualUrl, '_blank');
          }
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFaucetRequest}
      disabled={disabled || isLoading || !address || requestCooldown || isEthereumDisabled}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        requestCooldown 
          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
          : isEthereumDisabled
          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700 text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isLoading && 'animate-pulse'
      )}
      title={
        isEthereumDisabled 
          ? 'Ethereum faucet currently unavailable' 
          : requestCooldown 
          ? 'Please wait before requesting again' 
          : `Get ${faucetInfo.amount} from faucet`
      }
    >
      <Droplets className={clsx('w-4 h-4', isLoading && 'animate-bounce')} />
      {isLoading 
        ? 'Requesting...' 
        : requestCooldown 
        ? 'Cooldown...'
        : isEthereumDisabled
        ? faucetInfo.amount
        : `Get ${faucetInfo.amount}`
      }
    </button>
  );
}
