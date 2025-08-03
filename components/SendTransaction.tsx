'use client';

import React, { useState } from 'react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { Balance } from '../lib/types';
import { TransactionService } from '../lib/transactionService';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface SendTransactionProps {
  currentWallet: {
    id: string;
    name: string;
    solanaAddress: string;
    ethereumAddress: string;
    solanaPrivateKey: string;
    ethereumPrivateKey: string;
    derivationIndex: number;
  };
  balance: Balance;
  onBack: () => void;
  onTransactionSuccess: () => void;
}

export default function SendTransaction({ 
  currentWallet, 
  balance, 
  onBack, 
  onTransactionSuccess 
}: SendTransactionProps) {
  const { state } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'ethereum'>('solana');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const networkConfig = {
    solana: {
      name: 'Solana',
      symbol: 'SOL',
      color: 'bg-purple-600',
      availableBalance: balance.solana,
      address: currentWallet.solanaAddress,
      privateKey: currentWallet.solanaPrivateKey
    },
    ethereum: {
      name: 'Ethereum',
      symbol: 'ETH',
      color: 'bg-blue-600',
      availableBalance: balance.ethereum,
      address: currentWallet.ethereumAddress,
      privateKey: currentWallet.ethereumPrivateKey
    }
  };

  const currentNetworkConfig = networkConfig[selectedNetwork];

  const handleSendTransaction = async () => {
    if (!recipientAddress || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate recipient address
    if (!TransactionService.validateAddress(selectedNetwork, recipientAddress)) {
      toast.error(`Invalid ${currentNetworkConfig.name} address`);
      return;
    }

    const amountNum = parseFloat(amount);
    const availableBalance = parseFloat(currentNetworkConfig.availableBalance);

    if (amountNum <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (amountNum > availableBalance) {
      toast.error(`Insufficient balance. Available: ${availableBalance} ${currentNetworkConfig.symbol}`);
      return;
    }

    setIsLoading(true);

    try {
      const txHash = await TransactionService.sendTransaction(
        selectedNetwork,
        currentNetworkConfig.privateKey,
        recipientAddress,
        amountNum,
        state.network
      );
      
      toast.success(
        <div>
          <div>Transaction sent successfully!</div>
          <div className="text-sm text-gray-300 mt-1">
            {amount} {currentNetworkConfig.symbol} sent to {recipientAddress.slice(0, 8)}...
          </div>
          <div className="text-xs text-gray-400 mt-1">
            TX: {txHash.slice(0, 16)}...
          </div>
        </div>,
        { duration: 6000 }
      );
      
      // Clear form
      setRecipientAddress('');
      setAmount('');
      
      // Refresh balance
      onTransactionSuccess();
      
      // Go back to dashboard after a delay
      setTimeout(() => {
        onBack();
      }, 2000);
      
    } catch (error) {
      console.error('Transaction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Send Transaction</h2>
          <p className="text-gray-400">From {currentWallet.name}</p>
        </div>
      </div>

      {/* Network Selection */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Select Network</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(networkConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedNetwork(key as 'solana' | 'ethereum')}
              className={clsx(
                'p-4 rounded-lg border transition-all duration-200',
                selectedNetwork === key
                  ? 'border-purple-400 bg-purple-600/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center', config.color)}>
                  <span className="text-white font-bold text-sm">{config.symbol}</span>
                </div>
                <div className="text-left">
                  <h4 className="text-white font-medium">{config.name}</h4>
                  <p className="text-gray-400 text-sm">
                    Balance: {parseFloat(config.availableBalance).toFixed(4)} {config.symbol}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>
        
        <div className="space-y-4">
          {/* From Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              From Address
            </label>
            <div className="bg-black/20 border border-white/20 rounded-lg px-4 py-3">
              <span className="text-white font-mono text-sm break-all">
                {currentNetworkConfig.address}
              </span>
            </div>
          </div>

          {/* To Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Address *
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder={`Enter ${currentNetworkConfig.name} address`}
              className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount ({currentNetworkConfig.symbol}) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                max={currentNetworkConfig.availableBalance}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 pr-20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
              />
              <button
                onClick={() => setAmount(currentNetworkConfig.availableBalance)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
              >
                Max
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Available: {parseFloat(currentNetworkConfig.availableBalance).toFixed(4)} {currentNetworkConfig.symbol}
            </p>
          </div>

          {/* Network Status */}
          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3">
            <p className="text-yellow-200 text-sm">
              <strong>Network:</strong> {state.network === 'mainnet' ? 'Mainnet' : 'Testnet/Devnet'}
            </p>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendTransaction}
            disabled={isLoading || !recipientAddress || !amount}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold transition-all duration-200',
              isLoading || !recipientAddress || !amount
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending Transaction...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send {amount} {currentNetworkConfig.symbol}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
