'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Lock, 
  Copy, 
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wallet,
  Trash2,
  Menu,
  Send,
  Edit2,
  Shield
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { Balance } from '../lib/types';
import BalanceCard from './BalanceCard';
import SendTransaction from './SendTransaction';
import WalletTooltip from './WalletTooltip';
import PasswordConfirmationModal from './PasswordConfirmationModal';
import TransactionHistory from './TransactionHistory';
import SecurityDashboard from './SecurityDashboard';
import ViewSeedPhrase from './ViewSeedPhrase';
import SeedPhraseModal from './SeedPhraseModal';
import { hasInsecureWalletData } from '../lib/storage';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface WalletDashboardProps {
  onLock: () => void;
}

const NETWORKS = [
  { value: 'mainnet', label: 'Mainnet', icon: '🌐' },
  { value: 'testnet', label: 'Devnet/Testnet', icon: '🧪' },
] as const;

export default function WalletDashboard({ onLock }: WalletDashboardProps) {
  const {
    state,
    addNewAccount,
    updateWalletName,
    deleteAccount,
    switchAccount,
    switchNetwork,
    getBalances,
    lockWallet,
    verifyPassword,
  } = useWallet();

  const [balances, setBalances] = useState<Record<string, Balance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [balanceTimestamps, setBalanceTimestamps] = useState<Record<string, number>>({});
  const [showPrivateKey, setShowPrivateKey] = useState<Record<string, boolean>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingWalletId, setPendingWalletId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSendPage, setShowSendPage] = useState(false);
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Handle wallet hover with delay
  const handleWalletHover = (walletId: string | null, event?: React.MouseEvent) => {
    // Don't show tooltip on mobile devices
    if (window.innerWidth < 768) return; // md breakpoint
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    if (walletId && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.right,
        y: rect.top + rect.height / 2
      });
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredWallet(walletId);
      }, 300); // 300ms delay
    } else {
      // Add delay before hiding to allow moving to tooltip
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredWallet(null);
        setTooltipPosition(null);
      }, 100); // Short delay to allow mouse movement to tooltip
    }
  };

  // Handle tooltip hover to keep it visible
  const handleTooltipHover = (isEntering: boolean) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    if (!isEntering) {
      // Hide tooltip when leaving tooltip area
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredWallet(null);
        setTooltipPosition(null);
      }, 100);
    }
  };

  // Clean up timeout on unmount and handle clicks outside tooltip
  React.useEffect(() => {
    const handleClickOutside = () => {
      setHoveredWallet(null);
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Balance cache timeout in milliseconds (5 minutes)
  const BALANCE_CACHE_TIMEOUT = 5 * 60 * 1000;

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setSidebarCollapsed(true);
      }
    };

    // Set initial state based on screen size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [deleteConfirmWalletId, setDeleteConfirmWalletId] = useState<string | null>(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingContext, setEditingContext] = useState<'sidebar' | 'header' | null>(null);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [hasInsecureData, setHasInsecureData] = useState(false);

  const currentWallet = state.wallets.find(w => w.id === state.currentWalletId);

  // Cache refs to avoid dependency loops
  const balancesRef = React.useRef(balances);
  const timestampsRef = React.useRef(balanceTimestamps);
  const loadingRef = React.useRef(loadingBalances);
  
  // Update refs when state changes
  React.useEffect(() => { balancesRef.current = balances; }, [balances]);
  React.useEffect(() => { timestampsRef.current = balanceTimestamps; }, [balanceTimestamps]);
  React.useEffect(() => { loadingRef.current = loadingBalances; }, [loadingBalances]);

  // Rate limiting for balance fetches (max 1 request per wallet per 2 seconds)
  const lastFetchAttempt = React.useRef<Record<string, number>>({});

  const fetchBalance = React.useCallback(async (walletId: string, forceRefresh = false) => {
    const now = Date.now();
    
    // Rate limiting - prevent too frequent requests
    if (!forceRefresh) {
      const lastAttempt = lastFetchAttempt.current[walletId] || 0;
      if (now - lastAttempt < 2000) { // 2 second cooldown
        return;
      }
    }
    
    lastFetchAttempt.current[walletId] = now;

    // Check cache using refs to avoid dependency issues
    if (!forceRefresh) {
      const existingBalance = balancesRef.current[walletId];
      const lastFetch = timestampsRef.current[walletId];
      const isLoading = loadingRef.current[walletId];
      
      // Skip if already loading
      if (isLoading) return;
      
      // Skip if we have recent data (less than 5 minutes old)
      if (existingBalance && lastFetch && (now - lastFetch) < BALANCE_CACHE_TIMEOUT) {
        return;
      }
    }

    setLoadingBalances(prev => ({ ...prev, [walletId]: true }));

    try {
      const balance = await getBalances(walletId);
      if (balance) {
        const timestamp = Date.now();
        setBalances(prev => ({ ...prev, [walletId]: balance }));
        setBalanceTimestamps(prev => ({ ...prev, [walletId]: timestamp }));
      }
    } catch (error) {
      console.error('Error fetching balance for wallet', walletId, ':', error);
    } finally {
      setLoadingBalances(prev => ({ ...prev, [walletId]: false }));
    }
  }, [getBalances, BALANCE_CACHE_TIMEOUT]);

  // Clear cache when network changes
  useEffect(() => {
    setBalances({});
    setBalanceTimestamps({});
  }, [state.network]);

  // Security check: Detect insecure wallet data and warn user
  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const insecureData = hasInsecureWalletData();
        setHasInsecureData(insecureData);
        
        if (insecureData) {
          toast.error('Security Warning: Private keys are not encrypted!', {
            duration: 5000,
            position: 'top-center',
          });
        }
      } catch (error) {
        console.error('Security check failed:', error);
      }
    };

    checkSecurity();
  }, [state.wallets]); // Re-check when wallets change

  // Fetch balance for current wallet when it changes or network changes
  useEffect(() => {
    if (state.currentWalletId) {
      const timer = setTimeout(() => {
        // Call fetchBalance directly instead of through dependency
        (async () => {
          const now = Date.now();
          const walletId = state.currentWalletId!;
          
          // Check rate limiting
          const lastAttempt = lastFetchAttempt.current[walletId] || 0;
          if (now - lastAttempt < 1000) return; // 1 second for forced refresh
          
          lastFetchAttempt.current[walletId] = now;
          setLoadingBalances(prev => ({ ...prev, [walletId]: true }));

          try {
            const balance = await getBalances(walletId);
            if (balance) {
              setBalances(prev => ({ ...prev, [walletId]: balance }));
              setBalanceTimestamps(prev => ({ ...prev, [walletId]: now }));
            }
          } catch (error) {
            console.error('Error fetching balance for wallet', walletId, ':', error);
          } finally {
            setLoadingBalances(prev => ({ ...prev, [walletId]: false }));
          }
        })();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [state.currentWalletId, state.network, getBalances]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy');
    }
  };

  const handleLock = () => {
    lockWallet();
    onLock();
  };

  const togglePrivateKey = (walletId: string) => {
    // If already showing private key, hide it
    if (showPrivateKey[walletId]) {
      setShowPrivateKey(prev => ({
        ...prev,
        [walletId]: false
      }));
    } else {
      // If not showing, request password confirmation first
      setPendingWalletId(walletId);
      setShowPasswordModal(true);
    }
  };

  const handlePasswordConfirm = (password: string): boolean => {
    if (verifyPassword(password)) {
      if (pendingWalletId) {
        setShowPrivateKey(prev => ({
          ...prev,
          [pendingWalletId]: true
        }));
      }
      setShowPasswordModal(false);
      setPendingWalletId(null);
      return true;
    } else {
      return false;
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingWalletId(null);
  };

  const refreshBalance = React.useCallback((walletId: string) => {
    fetchBalance(walletId, true);
  }, [fetchBalance]);

  const handleNetworkChange = (network: 'mainnet' | 'testnet') => {
    switchNetwork(network);
    setShowNetworkDropdown(false);
    toast.success(`Switched to ${network === 'mainnet' ? 'Mainnet' : 'Devnet/Testnet'}`);
  };

  const handleCreateAccount = () => {
    if (!state.mnemonic) return;
    
    const newIndex = state.wallets.length;
    const defaultName = `Account ${newIndex + 1}`;
    const finalName = newAccountName.trim() || defaultName;
    
    addNewAccount(finalName);
    setShowCreateAccountModal(false);
    setNewAccountName('');
    toast.success(`${finalName} created successfully`);
  };

  const handleEditName = (walletId: string, currentName: string, context: 'sidebar' | 'header' = 'sidebar') => {
    setEditingWalletId(walletId);
    setEditingName(currentName);
    setEditingContext(context);
  };

  // Focus and select the input when editing starts
  React.useEffect(() => {
    if (editingWalletId && editingContext) {
      // Use more specific selector based on context
      const selector = editingContext === 'sidebar' 
        ? `input[data-editing="${editingWalletId}"][data-context="sidebar"]`
        : `input[data-editing="${editingWalletId}"][data-context="header"]`;
      
      const input = document.querySelector(selector) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select(); // Select all text for easy replacement
      }
    }
  }, [editingWalletId, editingContext]);

  const handleSaveEdit = () => {
    if (editingWalletId && editingName.trim()) {
      if (editingName.trim() !== state.wallets.find(w => w.id === editingWalletId)?.name) {
        updateWalletName(editingWalletId, editingName.trim());
      }
      setEditingWalletId(null);
      setEditingName('');
      setEditingContext(null);
    } else {
      // If empty name, cancel the edit
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setEditingWalletId(null);
    setEditingName('');
    setEditingContext(null);
  };

  const currentNetwork = NETWORKS.find(n => n.value === state.network);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col md:flex-row overflow-hidden h-screen">
      {/* Mobile Header (visible on sm/mobile only) */}
      <div className="md:hidden bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">
              {currentWallet ? (
                <div>
                  {editingWalletId === currentWallet.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        onBlur={handleSaveEdit}
                        className="bg-slate-900/60 border border-slate-600/50 rounded px-2 py-1 text-white text-lg font-bold focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 min-w-0 max-w-32"
                        placeholder="Enter new name"
                        data-editing={currentWallet.id}
                        data-context="header"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      <div>{currentWallet.name}</div>
                      <button
                        onClick={() => handleEditName(currentWallet.id, currentWallet.name, 'header')}
                        className="p-1 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Name"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-slate-400 font-normal">Account #{(currentWallet.derivationIndex ?? 0) + 1}</div>
                </div>
              ) : (
                'Multi-Chain Wallet'
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Send Button */}
            {currentWallet && (
              <button
                onClick={() => setShowSendPage(true)}
                className="p-2 bg-orange-600 rounded-lg text-white hover:bg-orange-700 transition-all duration-200"
                title="Send Transaction"
              >
                <Send className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Network Dropdown */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowNetworkDropdown(!showNetworkDropdown);
              }}
              className="flex items-center gap-1 bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-white hover:bg-slate-600/60 transition-all duration-200 text-sm"
            >
              <span>{currentNetwork?.icon}</span>
              <span className="hidden sm:inline">{currentNetwork?.label}</span>
              <ChevronDown className={clsx('w-3 h-3 transition-transform', showNetworkDropdown && 'rotate-180')} />
            </button>
            <button
              onClick={handleLock}
              className="p-2 bg-slate-700/60 rounded-lg text-white hover:bg-slate-600/60 transition-all duration-200"
              title="Lock Wallet"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 bg-slate-700/60 rounded-lg text-white hover:bg-slate-600/60 transition-all duration-200"
              title="Toggle Accounts"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={clsx(
        'bg-slate-800/90 backdrop-blur-lg border-r border-slate-700/50 transition-all duration-300 flex flex-col overflow-hidden',
        // Mobile behavior - slide in/out with transform
        'md:relative md:inset-auto md:z-auto fixed inset-y-0 left-0 z-40 w-80 h-full',
        sidebarCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0',
        // Desktop behavior
        'md:flex md:h-screen',
        sidebarCollapsed ? 'md:w-16' : 'md:w-80'
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Accounts</h1>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 bg-slate-700/60 rounded-lg text-white hover:bg-slate-600/60 transition-all duration-200 md:block hidden"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-2 bg-slate-700/60 rounded-lg text-white hover:bg-slate-600/60 transition-all duration-200 md:hidden"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Account Button */}
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={() => setShowCreateAccountModal(true)}
            className={clsx(
              'bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-all duration-200 flex items-center gap-2',
              sidebarCollapsed ? 'w-8 h-8 justify-center' : 'w-full py-3 px-4'
            )}
            title="Add New Account"
          >
            <Plus className="w-4 h-4" />
            {!sidebarCollapsed && <span className="font-semibold">Add Account</span>}
          </button>
        </div>

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-500/60 max-h-full" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-3">
            {state.wallets.map((wallet) => {
              const balance = balances[wallet.id];
              const isActive = wallet.id === state.currentWalletId;
              const isLoading = loadingBalances[wallet.id];

              return (
                <div
                  key={wallet.id}
                  onClick={() => {
                    switchAccount(wallet.id);
                    // Only fetch if we don't have cached data or it's old
                    fetchBalance(wallet.id);
                  }}
                  onMouseEnter={(e) => handleWalletHover(wallet.id, e)}
                  onMouseLeave={() => handleWalletHover(null)}
                  className={clsx(
                    'rounded-lg border cursor-pointer transition-all duration-200 relative group',
                    isActive
                      ? 'bg-orange-600/20 border-orange-500/50 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-700/30 border-slate-600/40 hover:bg-slate-600/40 hover:border-slate-500/60',
                    sidebarCollapsed ? 'p-3 mx-1 min-h-[80px]' : 'p-4'
                  )}
                >
                  {sidebarCollapsed ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-2">
                        <span className="text-white text-sm font-bold">
                          {(wallet.derivationIndex ?? 0) + 1}
                        </span>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold">
                              {(wallet.derivationIndex ?? 0) + 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            {editingWalletId === wallet.id && editingContext === 'sidebar' ? (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveEdit();
                                    } else if (e.key === 'Escape') {
                                      handleCancelEdit();
                                    }
                                  }}
                                  onBlur={handleSaveEdit}
                                  className="bg-slate-900/60 border border-orange-500/50 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 min-w-0 w-full"
                                  placeholder="Enter new account name"
                                  data-editing={wallet.id}
                                  data-context="sidebar"
                                  autoFocus
                                />
                                <span className="text-xs text-slate-400">Press Enter to save, Esc to cancel</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="font-medium text-white block truncate">{wallet.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditName(wallet.id, wallet.name, 'sidebar');
                                  }}
                                  className="p-1 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                  title="Edit Name"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <span className="text-xs text-slate-400">Account #{(wallet.derivationIndex ?? 0) + 1}</span>
                          </div>
                        </div>
                        {/* Only show action buttons when not editing */}
                        {!(editingWalletId === wallet.id && editingContext === 'sidebar') && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                refreshBalance(wallet.id);
                              }}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              disabled={isLoading}
                              title="Refresh Balance"
                            >
                              <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
                            </button>
                            {state.wallets.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmWalletId(wallet.id);
                                }}
                                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                title="Delete Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-slate-300 space-y-1">
                        {balance ? (
                          <>
                            <div className="flex justify-between">
                              <span>SOL:</span>
                              <span>{parseFloat(balance.solana).toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ETH:</span>
                              <span>{parseFloat(balance.ethereum).toFixed(4)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-500 text-center">Loading...</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* View Seed Phrase Button - Fixed at bottom */}
        <ViewSeedPhrase 
          isCollapsed={sidebarCollapsed} 
          onOpenSeedPhrase={() => setShowSeedPhraseModal(true)} 
        />
      </div>

      {/* Mobile sidebar backdrop */}
      <div 
        className={clsx(
          'md:hidden fixed inset-0 bg-black/50 z-30 transition-all duration-300',
          sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={() => setSidebarCollapsed(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 md:h-screen overflow-hidden">
        {/* Top Header (hidden on mobile, shown on md+) */}
        <div className="hidden md:block bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl lg:text-2xl font-bold text-white">
                  {currentWallet ? (
                    <div>
                      {editingWalletId === currentWallet.id && editingContext === 'header' ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            onBlur={handleSaveEdit}
                            className="bg-slate-900/60 border border-orange-500/50 rounded-lg px-3 py-1 text-white text-xl lg:text-2xl font-bold focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 min-w-0"
                            placeholder="Enter new account name"
                            data-editing={currentWallet.id}
                            data-context="header"
                            autoFocus
                          />
                          <span className="text-xs text-slate-400">Press Enter to save, Esc to cancel</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <div>{currentWallet.name}</div>
                          <button
                            onClick={() => handleEditName(currentWallet.id, currentWallet.name, 'header')}
                            className="p-1 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit Name"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      <div className="text-sm text-slate-400 font-normal">Account #{(currentWallet.derivationIndex ?? 0) + 1}</div>
                    </div>
                  ) : (
                    'Multi-Chain Wallet'
                  )}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Send Button */}
                {currentWallet && (
                  <button
                    onClick={() => setShowSendPage(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
                    title="Send Transaction"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                )}

                {/* Network Dropdown */}
                <div className="relative z-50">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowNetworkDropdown(!showNetworkDropdown);
                    }}
                    className="flex items-center gap-2 bg-slate-700/60 border border-slate-600/50 rounded-lg px-4 py-2 text-white hover:bg-slate-600/60 transition-all duration-200 relative z-50"
                  >
                    <span className="text-lg">{currentNetwork?.icon}</span>
                    <span className="font-medium">{currentNetwork?.label}</span>
                    <ChevronDown className={clsx('w-4 h-4 transition-transform', showNetworkDropdown && 'rotate-180')} />
                  </button>
                </div>

                <button
                  onClick={handleLock}
                  className="p-2 bg-slate-700/60 border border-slate-600/50 rounded-lg text-white hover:bg-slate-600/60 transition-all duration-200"
                  title="Lock Wallet"
                >
                  <Lock className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-500/60" style={{ scrollbarWidth: 'thin' }}>
          {showSendPage ? (
            currentWallet && balances[currentWallet.id] ? (
              <SendTransaction
                currentWallet={currentWallet}
                balance={balances[currentWallet.id]}
                onBack={() => setShowSendPage(false)}
                onTransactionSuccess={() => {
                  // Refresh balance after successful transaction
                  refreshBalance(currentWallet.id);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-lg">Loading wallet data...</p>
                </div>
              </div>
            )
          ) : (
            currentWallet ? (
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Solana Balance */}
                <BalanceCard
                  network="solana"
                  balance={currentWallet && balances[currentWallet.id]?.solana || '0.0000'}
                  isLoading={currentWallet ? loadingBalances[currentWallet.id] || false : false}
                  isTestnet={state.network === 'testnet'}
                  address={currentWallet?.solanaAddress || ''}
                  onRefresh={() => currentWallet && refreshBalance(currentWallet.id)}
                  onFaucetSuccess={() => currentWallet && refreshBalance(currentWallet.id)}
                />

                {/* Ethereum Balance */}
                <BalanceCard
                  network="ethereum"
                  balance={currentWallet && balances[currentWallet.id]?.ethereum || '0.0000'}
                  isLoading={currentWallet ? loadingBalances[currentWallet.id] || false : false}
                  isTestnet={state.network === 'testnet'}
                  address={currentWallet?.ethereumAddress || ''}
                  onRefresh={() => currentWallet && refreshBalance(currentWallet.id)}
                  onFaucetSuccess={() => currentWallet && refreshBalance(currentWallet.id)}
                />
              </div>

              {/* Address Information */}
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-slate-700/50">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">Addresses</h3>
                
                <div className="space-y-4 md:space-y-6">
                  {/* Solana Address */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-slate-300 mb-2 md:mb-3">
                      Solana Address
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 md:px-4 py-2 md:py-3">
                        <span className="text-white font-mono text-xs md:text-sm break-all">
                          {currentWallet?.solanaAddress}
                        </span>
                      </div>
                      <div className="flex sm:flex-row flex-col gap-2">
                        <button
                          onClick={() => currentWallet && copyToClipboard(currentWallet.solanaAddress, 'Solana address')}
                          className="p-2 md:p-3 bg-orange-600 rounded-lg text-white hover:bg-orange-700 transition-all duration-200 flex items-center justify-center"
                          title="Copy Address"
                        >
                          <Copy className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => currentWallet && window.open(`https://explorer.solana.com/address/${currentWallet.solanaAddress}${state.network === 'testnet' ? '?cluster=devnet' : ''}`, '_blank')}
                          className="p-2 md:p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ethereum Address */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-slate-300 mb-2 md:mb-3">
                      Ethereum Address
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 md:px-4 py-2 md:py-3">
                        <span className="text-white font-mono text-xs md:text-sm break-all">
                          {currentWallet?.ethereumAddress}
                        </span>
                      </div>
                      <div className="flex sm:flex-row flex-col gap-2">
                        <button
                          onClick={() => currentWallet && copyToClipboard(currentWallet.ethereumAddress, 'Ethereum address')}
                          className="p-2 md:p-3 bg-orange-600 rounded-lg text-white hover:bg-orange-700 transition-all duration-200 flex items-center justify-center"
                          title="Copy Address"
                        >
                          <Copy className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => currentWallet && window.open(`${state.network === 'mainnet' ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'}/address/${currentWallet.ethereumAddress}`, '_blank')}
                          className="p-2 md:p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Private Keys */}
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-slate-700/50">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Private Keys</h3>
                <p className="text-xs md:text-sm text-slate-400 mb-4 md:mb-6">
                  Keep your private keys secure and never share them with anyone.
                </p>
                
                <div className="space-y-4 md:space-y-6">
                  {/* Solana Private Key */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-slate-300 mb-2 md:mb-3">
                      Solana Private Key
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 md:px-4 py-2 md:py-3">
                        <span className={clsx(
                          'text-white font-mono text-xs md:text-sm break-all',
                          currentWallet && !showPrivateKey[currentWallet.id] && 'blur-sm select-none'
                        )}>
                          {currentWallet?.solanaPrivateKey}
                        </span>
                      </div>
                      <div className="flex sm:flex-row flex-col gap-2">
                        <button
                          onClick={() => currentWallet && togglePrivateKey(currentWallet.id)}
                          className="p-2 md:p-3 bg-slate-600 rounded-lg text-white hover:bg-slate-700 transition-all duration-200 flex items-center justify-center"
                          title="Toggle Visibility"
                        >
                          {currentWallet && showPrivateKey[currentWallet.id] ? <EyeOff className="w-3 h-3 md:w-4 md:h-4" /> : <Eye className="w-3 h-3 md:w-4 md:h-4" />}
                        </button>
                        <button
                          onClick={() => currentWallet && copyToClipboard(currentWallet.solanaPrivateKey, 'Solana private key')}
                          className="p-2 md:p-3 bg-orange-600 rounded-lg text-white hover:bg-orange-700 transition-all duration-200 flex items-center justify-center"
                          title="Copy Private Key"
                        >
                          <Copy className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ethereum Private Key */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-slate-300 mb-2 md:mb-3">
                      Ethereum Private Key
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 md:px-4 py-2 md:py-3">
                        <span className={clsx(
                          'text-white font-mono text-xs md:text-sm break-all',
                          currentWallet && !showPrivateKey[currentWallet.id] && 'blur-sm select-none'
                        )}>
                          {currentWallet?.ethereumPrivateKey}
                        </span>
                      </div>
                      <div className="flex sm:flex-row flex-col gap-2">
                        <button
                          onClick={() => currentWallet && togglePrivateKey(currentWallet.id)}
                          className="p-2 md:p-3 bg-slate-600 rounded-lg text-white hover:bg-slate-700 transition-all duration-200 flex items-center justify-center"
                          title="Toggle Visibility"
                        >
                          {currentWallet && showPrivateKey[currentWallet.id] ? <EyeOff className="w-3 h-3 md:w-4 md:h-4" /> : <Eye className="w-3 h-3 md:w-4 md:h-4" />}
                        </button>
                        <button
                          onClick={() => currentWallet && copyToClipboard(currentWallet.ethereumPrivateKey, 'Ethereum private key')}
                          className="p-2 md:p-3 bg-orange-600 rounded-lg text-white hover:bg-orange-700 transition-all duration-200 flex items-center justify-center"
                          title="Copy Private Key"
                        >
                          <Copy className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <TransactionHistory
                solanaAddress={currentWallet.solanaAddress}
                ethereumAddress={currentWallet.ethereumAddress}
                network={state.network}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/60 rounded-full flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400 text-lg">Select an account to view details</p>
              </div>
            </div>
          )
          )}
        </div>
      </div>

      {/* Network Dropdown - Rendered outside normal flow */}
      {showNetworkDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowNetworkDropdown(false);
            }}
          />
          {/* Dropdown */}
          <div className="fixed top-16 md:top-20 right-4 md:right-6 bg-slate-800/90 backdrop-blur-lg border border-slate-700/60 rounded-lg overflow-hidden z-[9999] min-w-[140px] md:min-w-[160px] shadow-xl">
            {NETWORKS.map((network) => (
              <button
                key={network.value}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNetworkChange(network.value);
                }}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/60 transition-colors',
                  state.network === network.value ? 'bg-orange-600/30 text-white border-l-2 border-orange-500' : 'text-slate-200 hover:text-white'
                )}
              >
                <span className="text-lg">{network.icon}</span>
                <span className="font-medium">{network.label}</span>
                {state.network === network.value && (
                  <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Create Account Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-slate-800 rounded-lg p-4 md:p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">Create New Account</h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Account Name (optional)
              </label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateAccount();
                  }
                }}
                className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                placeholder={`Account ${state.wallets.length + 1}`}
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">
                Leave empty to use default name: Account {state.wallets.length + 1}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateAccountModal(false);
                  setNewAccountName('');
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmWalletId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-slate-800 rounded-lg p-4 md:p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Account</h3>
            </div>
            
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this account? This action cannot be undone. 
              Make sure you have backed up your recovery phrase if you want to restore this account later.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmWalletId(null)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAccount(deleteConfirmWalletId);
                  setDeleteConfirmWalletId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Tooltip - Rendered as overlay (desktop only) */}
      {hoveredWallet && window.innerWidth >= 768 && (
        <WalletTooltip
          wallet={state.wallets.find(wallet => wallet.id === hoveredWallet)!}
          isVisible={!!hoveredWallet}
          position={tooltipPosition}
          onMouseEnter={() => handleTooltipHover(true)}
          onMouseLeave={() => handleTooltipHover(false)}
        />
      )}

      {/* Password Confirmation Modal */}
      <PasswordConfirmationModal
        isOpen={showPasswordModal}
        onConfirm={handlePasswordConfirm}
        onClose={handlePasswordCancel}
        title="Verify Password"
        description="Please enter your wallet password to view private keys."
      />

      {/* Floating Security Check Button */}
      <button
        onClick={() => setShowSecurityDashboard(true)}
        className={clsx(
          'fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-50 transition-all duration-200',
          hasInsecureData 
            ? 'bg-red-600 hover:bg-red-500 animate-pulse shadow-red-500/50' 
            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
        )}
        title={hasInsecureData ? 'SECURITY RISK - Click to fix!' : 'Security Dashboard'}
      >
        <Shield className="w-6 h-6 text-white" />
      </button>

      {/* Security Dashboard */}
      <SecurityDashboard
        isOpen={showSecurityDashboard}
        onClose={() => setShowSecurityDashboard(false)}
        userPassword={undefined} // Will prompt for password when needed
      />

      {/* Seed Phrase Modal */}
      <SeedPhraseModal
        isOpen={showSeedPhraseModal}
        onClose={() => setShowSeedPhraseModal(false)}
      />
    </div>
  );
}
