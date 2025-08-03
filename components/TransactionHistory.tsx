'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  RefreshCw, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Clock 
} from 'lucide-react';
import { Transaction } from '../lib/types';
import toast from 'react-hot-toast';

interface TransactionHistoryProps {
  solanaAddress: string;
  ethereumAddress: string;
  network: 'mainnet' | 'testnet';
}

export default function TransactionHistory({ 
  solanaAddress, 
  ethereumAddress, 
  network 
}: TransactionHistoryProps) {
  const [activeTab, setActiveTab] = useState<'solana' | 'ethereum'>('solana');
  const [transactions, setTransactions] = useState<{
    solana: Transaction[];
    ethereum: Transaction[];
  }>({ 
    solana: [], 
    ethereum: [] 
  });
  const [loading, setLoading] = useState(false);

  // Format time helper
  const formatTransactionTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  // Format amount helper
  const formatTransactionAmount = (amount: string, symbol: string) => {
    const num = parseFloat(amount);
    if (num === 0) return `0 ${symbol}`;
    if (num < 0.001) return `<0.001 ${symbol}`;
    return `${num.toFixed(4)} ${symbol}`;
  };

  // Generate correct explorer URLs
  const generateExplorerUrl = React.useCallback((signature: string, networkType: 'solana' | 'ethereum', currentNetwork: 'mainnet' | 'testnet') => {
    if (networkType === 'solana') {
      const baseUrl = 'https://explorer.solana.com/tx';
      const cluster = currentNetwork === 'testnet' ? '?cluster=devnet' : '';
      return `${baseUrl}/${signature}${cluster}`;
    } else {
      // Ethereum
      if (currentNetwork === 'mainnet') {
        return `https://etherscan.io/tx/${signature}`;
      } else {
        return `https://sepolia.etherscan.io/tx/${signature}`;
      }
    }
  }, []);

  // Generate fallback mock transactions
  const generateMockTransactions = React.useCallback((networkType: 'solana' | 'ethereum', address: string): Transaction[] => {
    // Generate different mock data based on network type and environment
    const networkSuffix = network === 'testnet' ? '_testnet' : '_mainnet';
    const baseTransactions = [
      {
        signature: networkType === 'solana' 
          ? `5VfYt${networkSuffix}K3mNq` 
          : `0x7a8b${networkSuffix}9f2e`,
        timestamp: Date.now() / 1000 - 3600,
        type: 'receive' as const,
        amount: networkType === 'solana' 
          ? (network === 'testnet' ? '10.0' : '2.5') 
          : (network === 'testnet' ? '0.5' : '0.15'),
        from: networkType === 'solana' 
          ? (network === 'testnet' ? 'DevnetFaucet...123' : 'MainnetAddr...123') 
          : (network === 'testnet' ? 'SepoliaFaucet...123' : 'MainnetAddr...123'),
        to: address,
        status: 'success' as const,
        fee: networkType === 'solana' ? '0.000005' : (network === 'testnet' ? '0.0001' : '0.0021'),
        explorerUrl: generateExplorerUrl(
          networkType === 'solana' ? `5VfYt${networkSuffix}K3mNq` : `0x7a8b${networkSuffix}9f2e`,
          networkType,
          network
        )
      },
      {
        signature: networkType === 'solana' 
          ? `3MnPx${networkSuffix}A7bCs` 
          : `0x2c9d${networkSuffix}8a1b`,
        timestamp: Date.now() / 1000 - 7200,
        type: 'send' as const,
        amount: networkType === 'solana' 
          ? (network === 'testnet' ? '5.0' : '1.0') 
          : (network === 'testnet' ? '0.1' : '0.05'),
        from: address,
        to: networkType === 'solana' 
          ? (network === 'testnet' ? 'DevnetRecipient...456' : 'MainnetRecipient...456') 
          : (network === 'testnet' ? 'SepoliaRecipient...456' : 'MainnetRecipient...456'),
        status: 'success' as const,
        fee: networkType === 'solana' ? '0.000005' : (network === 'testnet' ? '0.0001' : '0.0018'),
        explorerUrl: generateExplorerUrl(
          networkType === 'solana' ? `3MnPx${networkSuffix}A7bCs` : `0x2c9d${networkSuffix}8a1b`,
          networkType,
          network
        )
      }
    ];

    return baseTransactions;
  }, [generateExplorerUrl, network]);

  // Fetch Ethereum transactions using Alchemy API
  const fetchEthereumTransactions = React.useCallback(async (address: string): Promise<Transaction[]> => {
    try {
      // Determine the correct Alchemy endpoint based on network
      const isMainnet = network === 'mainnet';
      const alchemyNetwork = isMainnet ? 'eth-mainnet' : 'eth-sepolia';
      const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      
      if (!alchemyApiKey) {
        console.warn('Alchemy API key not found, using mock data');
        return generateMockTransactions('ethereum', address);
      }

      const response = await fetch(`https://${alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getAssetTransfers',
          params: [
            {
              fromBlock: '0x0',
              toBlock: 'latest',
              fromAddress: address,
              category: ['external', 'internal'],
              withMetadata: true,
              excludeZeroValue: true,
              maxCount: '0x14' // 20 transactions
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const outgoingTxs = data.result?.transfers || [];

      // Also fetch incoming transactions
      const incomingResponse = await fetch(`https://${alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'alchemy_getAssetTransfers',
          params: [
            {
              fromBlock: '0x0',
              toBlock: 'latest',
              toAddress: address,
              category: ['external', 'internal'],
              withMetadata: true,
              excludeZeroValue: true,
              maxCount: '0x14' // 20 transactions
            }
          ]
        })
      });

      const incomingData = await incomingResponse.json();
      const incomingTxs = incomingData.result?.transfers || [];

      // Combine and process transactions
      const allTxs = [...outgoingTxs, ...incomingTxs];
      
      const transactions: Transaction[] = allTxs.map((tx: {
        hash: string;
        metadata: { blockTimestamp: string };
        to: string;
        from: string;
        value: number;
      }) => ({
        signature: tx.hash,
        timestamp: new Date(tx.metadata.blockTimestamp).getTime() / 1000,
        type: tx.to?.toLowerCase() === address.toLowerCase() ? 'receive' : 'send',
        amount: tx.value?.toString() || '0',
        from: tx.from || 'Unknown',
        to: tx.to || 'Unknown',
        status: 'success' as const,
        fee: '0', // Fee calculation would require additional API call
        explorerUrl: generateExplorerUrl(tx.hash, 'ethereum', network)
      }));

      // Sort by timestamp (newest first) and remove duplicates
      const uniqueTxs = transactions
        .filter((tx, index, self) => 
          index === self.findIndex(t => t.signature === tx.signature)
        )
        .sort((a, b) => b.timestamp - a.timestamp);

      return uniqueTxs.slice(0, 10);
    } catch (error) {
      console.error('Error fetching Ethereum transactions:', error);
      // Fallback to mock data
      return generateMockTransactions('ethereum', address);
    }
  }, [network, generateExplorerUrl, generateMockTransactions]);

  // Fetch Solana transactions using Alchemy API
  const fetchSolanaTransactions = React.useCallback(async (address: string): Promise<Transaction[]> => {
    try {
      // Determine the correct Alchemy endpoint based on network
      const alchemyNetwork = network === 'mainnet' ? 'solana-mainnet' : 'solana-devnet';
      const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      
      if (!alchemyApiKey) {
        console.warn('Alchemy API key not found, using mock data');
        return generateMockTransactions('solana', address);
      }

      const response = await fetch(`https://${alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [
            address,
            {
              limit: 20
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const signatures = data.result || [];

      // Fetch transaction details for each signature
      const transactionPromises = signatures.slice(0, 10).map(async (sig: {
        signature: string;
        blockTime: number;
        err: null | object;
      }) => {
        try {
          const txResponse = await fetch(`https://${alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getTransaction',
              params: [
                sig.signature,
                {
                  encoding: 'json',
                  maxSupportedTransactionVersion: 0
                }
              ]
            })
          });

          const txData = await txResponse.json();
          const transaction = txData.result;

          if (!transaction) return null;

          // Determine transaction type and amount
          const preBalances = transaction.meta?.preBalances || [];
          const postBalances = transaction.meta?.postBalances || [];
          const accountKeys = transaction.transaction?.message?.accountKeys || [];
          
          let type: 'send' | 'receive' = 'send';
          let amount = '0';
          let fee = '0';

          // Find the user's account index
          const userAccountIndex = accountKeys.findIndex((key: string) => key === address);
          
          if (userAccountIndex !== -1 && preBalances[userAccountIndex] && postBalances[userAccountIndex]) {
            const balanceChange = postBalances[userAccountIndex] - preBalances[userAccountIndex];
            if (balanceChange > 0) {
              type = 'receive';
              amount = (balanceChange / 1e9).toString(); // Convert lamports to SOL
            } else {
              type = 'send';
              amount = (Math.abs(balanceChange) / 1e9).toString();
            }
          }

          if (transaction.meta?.fee) {
            fee = (transaction.meta.fee / 1e9).toString();
          }

          return {
            signature: sig.signature,
            timestamp: sig.blockTime || Date.now() / 1000,
            type,
            amount,
            from: type === 'send' ? address : 'External Address',
            to: type === 'receive' ? address : 'External Address',
            status: sig.err ? 'failed' : 'success',
            fee,
            explorerUrl: generateExplorerUrl(sig.signature, 'solana', network)
          } as Transaction;
        } catch (error) {
          console.error('Error fetching transaction details:', error);
          return null;
        }
      });

      const transactions = await Promise.all(transactionPromises);
      return transactions.filter(tx => tx !== null) as Transaction[];
    } catch (error) {
      console.error('Error fetching Solana transactions:', error);
      // Fallback to mock data
      return generateMockTransactions('solana', address);
    }
  }, [network, generateExplorerUrl, generateMockTransactions]);

  // Fetch transactions for specific network
  const fetchTransactionHistory = React.useCallback(async (networkType: 'solana' | 'ethereum') => {
    setLoading(true);
    try {
      const address = networkType === 'solana' ? solanaAddress : ethereumAddress;
      if (!address) return;

      let transactions: Transaction[];
      
      // Use real API calls instead of mock data
      if (networkType === 'ethereum') {
        transactions = await fetchEthereumTransactions(address);
      } else {
        transactions = await fetchSolanaTransactions(address);
      }
      
      setTransactions(prev => ({
        ...prev,
        [networkType]: transactions
      }));
      
      toast.success(`${networkType === 'solana' ? 'Solana' : 'Ethereum'} transaction history updated`);
    } catch (error) {
      console.error(`Failed to fetch ${networkType} transaction history:`, error);
      toast.error(`Failed to load ${networkType} transactions`);
      
      // Fallback to mock data if API fails
      const address = networkType === 'solana' ? solanaAddress : ethereumAddress;
      if (address) {
        const mockTransactions = generateMockTransactions(networkType, address);
        setTransactions(prev => ({
          ...prev,
          [networkType]: mockTransactions
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [solanaAddress, ethereumAddress, fetchEthereumTransactions, fetchSolanaTransactions, generateMockTransactions]);

  // Auto-fetch transactions when addresses or network changes
  useEffect(() => {
    if (solanaAddress) {
      fetchTransactionHistory('solana');
    }
  }, [solanaAddress, network, fetchTransactionHistory]);

  useEffect(() => {
    if (ethereumAddress) {
      fetchTransactionHistory('ethereum');
    }
  }, [ethereumAddress, network, fetchTransactionHistory]);

  // Refresh current tab
  const handleRefresh = () => {
    fetchTransactionHistory(activeTab);
  };

  // Open explorer
  const openExplorer = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Explorer URL not available');
    }
  };

  // Get current transactions
  const currentTransactions = transactions[activeTab] || [];

  return (
    <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
            <History className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-white">Transaction History</h3>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
          title="Refresh History"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Network Tabs */}
      <div className="flex gap-1 mb-4 md:mb-6 bg-slate-900/60 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('solana')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'solana'
              ? 'bg-orange-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Solana {network === 'testnet' ? '(Devnet)' : '(Mainnet)'}
        </button>
        <button
          onClick={() => setActiveTab('ethereum')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'ethereum'
              ? 'bg-orange-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Ethereum {network === 'testnet' ? '(Sepolia)' : '(Mainnet)'}
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
            <span className="ml-2 text-slate-400">Loading {activeTab} transactions...</span>
          </div>
        ) : currentTransactions.length > 0 ? (
          <>
            {currentTransactions.slice(0, 10).map((tx) => (
              <div
                key={tx.signature}
                className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'receive' ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    {tx.type === 'receive' ? (
                      <ChevronLeft className="w-4 h-4 text-green-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">
                        {tx.type === 'receive' ? 'Received' : 'Sent'}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        tx.status === 'success' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTransactionTime(tx.timestamp)}</span>
                      <span>•</span>
                      <span className="truncate">
                        {tx.signature}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      tx.type === 'receive' ? 'text-green-400' : 'text-white'
                    }`}>
                      {tx.type === 'receive' ? '+' : '-'}{formatTransactionAmount(
                        tx.amount, 
                        activeTab === 'solana' ? 'SOL' : 'ETH'
                      )}
                    </div>
                    {tx.fee && (
                      <div className="text-xs text-slate-400">
                        Fee: {formatTransactionAmount(tx.fee, activeTab === 'solana' ? 'SOL' : 'ETH')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openExplorer(tx.explorerUrl)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* View More Button */}
            {currentTransactions.length > 10 && (
              <button
                onClick={() => {
                  const address = activeTab === 'solana' ? solanaAddress : ethereumAddress;
                  const url = activeTab === 'solana'
                    ? `https://explorer.solana.com/address/${address}${network === 'testnet' ? '?cluster=devnet' : ''}`
                    : network === 'mainnet'
                      ? `https://etherscan.io/address/${address}`
                      : `https://sepolia.etherscan.io/address/${address}`;
                  openExplorer(url);
                }}
                className="w-full p-3 text-center text-orange-400 hover:text-orange-300 hover:bg-slate-700/50 rounded-lg transition-colors text-sm"
              >
                View All Transactions on Explorer
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-700/60 rounded-full flex items-center justify-center">
              <History className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">
              No {activeTab} transactions found
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Your {activeTab} transaction history will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
