'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { WalletState, Wallet, Balance } from '../lib/types';
import { 
  loadWalletState, 
  saveWalletState,
  hasExistingWallet,
  loadEncryptedMnemonic,
  saveEncryptedMnemonic,
  clearWalletData,
  loadNetwork,
  saveNetwork 
} from '../lib/storage';
import { generateMultipleWallets, generateWallet, validateMnemonic } from '../lib/walletUtils';
import { BlockchainService } from '../lib/blockchainService';

interface WalletContextType {
  state: WalletState;
  createWallet: (mnemonic: string, password: string) => Promise<boolean>;
  unlockWallet: (password: string) => Promise<boolean>;
  verifyPassword: (password: string) => boolean;
  lockWallet: () => void;
  addNewAccount: (name?: string) => void;
  updateWalletName: (walletId: string, name: string) => void;
  deleteAccount: (walletId: string) => void;
  switchAccount: (walletId: string) => void;
  switchNetwork: (network: 'mainnet' | 'testnet') => void;
  getBalances: (walletId: string) => Promise<Balance | null>;
  hasWallet: () => boolean;
  importWallet: (mnemonic: string, password: string) => Promise<boolean>;
  resetWallet: () => void;
}

type WalletAction = 
  | { type: 'SET_UNLOCKED'; payload: boolean }
  | { type: 'SET_MNEMONIC'; payload: string }
  | { type: 'SET_WALLETS'; payload: Wallet[] }
  | { type: 'ADD_WALLET'; payload: Wallet }
  | { type: 'UPDATE_WALLET'; payload: { walletId: string; updates: Partial<Wallet> } }
  | { type: 'DELETE_WALLET'; payload: string }
  | { type: 'SET_CURRENT_WALLET'; payload: string }
  | { type: 'SET_NETWORK'; payload: 'mainnet' | 'testnet' }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'CLEAR_PASSWORD' }
  | { type: 'RESET_STATE' };

// Extended state to include password in memory for secure operations
interface ExtendedWalletState extends WalletState {
  password?: string; // Temporary in-memory storage for encryption operations
}

const initialState: ExtendedWalletState = {
  isUnlocked: false,
  wallets: [],
  network: 'mainnet',
};

const walletReducer = (state: ExtendedWalletState, action: WalletAction): ExtendedWalletState => {
  switch (action.type) {
    case 'SET_UNLOCKED':
      return { ...state, isUnlocked: action.payload };
    case 'SET_MNEMONIC':
      return { ...state, mnemonic: action.payload };
    case 'SET_WALLETS':
      return { ...state, wallets: action.payload };
    case 'ADD_WALLET':
      return { ...state, wallets: [...state.wallets, action.payload] };
    case 'UPDATE_WALLET':
      return {
        ...state,
        wallets: state.wallets.map(wallet =>
          wallet.id === action.payload.walletId
            ? { ...wallet, ...action.payload.updates }
            : wallet
        )
      };
    case 'DELETE_WALLET':
      return { 
        ...state, 
        wallets: state.wallets.filter(w => w.id !== action.payload),
        currentWalletId: state.currentWalletId === action.payload 
          ? (state.wallets.length > 1 ? state.wallets.find(w => w.id !== action.payload)?.id : undefined)
          : state.currentWalletId
      };
    case 'SET_CURRENT_WALLET':
      return { ...state, currentWalletId: action.payload };
    case 'SET_NETWORK':
      return { ...state, network: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'CLEAR_PASSWORD':
      return { ...state, password: undefined };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const [blockchainService] = React.useState(() => new BlockchainService(state.network));

  useEffect(() => {
    // Only load network setting on initial load, avoid loading any wallet data
    const network = loadNetwork();
    dispatch({ type: 'SET_NETWORK', payload: network });
  }, []); // Only run once on mount

  useEffect(() => {
    // Update blockchain service when network changes
    blockchainService.switchNetwork(state.network);
    // Save network directly without touching wallet data
    saveNetwork(state.network);
  }, [state.network, blockchainService]);

  const createWallet = async (mnemonic: string, password: string): Promise<boolean> => {
    try {
      if (!validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Generate initial wallet
      const wallets = generateMultipleWallets(mnemonic, 1);
      
      // Save encrypted mnemonic
      saveEncryptedMnemonic(mnemonic, password);
      
      // Save wallet data using the provided password
      saveWalletState({ wallets }, password);
      
      // Update state
      dispatch({ type: 'SET_MNEMONIC', payload: mnemonic });
      dispatch({ type: 'SET_WALLETS', payload: wallets });
      dispatch({ type: 'SET_CURRENT_WALLET', payload: wallets[0].id });
      dispatch({ type: 'SET_UNLOCKED', payload: true });
      dispatch({ type: 'SET_PASSWORD', payload: password }); // Store password for future operations
      
      return true;
    } catch (error) {
      console.error('❌ Failed to create wallet:', error);
      return false;
    }
  };

  const unlockWallet = async (password: string): Promise<boolean> => {
    try {
      const mnemonic = loadEncryptedMnemonic(password);
      if (!mnemonic) {
        console.error('❌ Failed to decrypt mnemonic - incorrect password or no encrypted mnemonic found');
        return false;
      }

      // Load encrypted wallet data using the password
      const walletState = loadWalletState(password);
      const wallets = walletState.wallets || [];
      
      dispatch({ type: 'SET_MNEMONIC', payload: mnemonic });
      dispatch({ type: 'SET_WALLETS', payload: wallets });
      dispatch({ type: 'SET_UNLOCKED', payload: true });
      dispatch({ type: 'SET_PASSWORD', payload: password }); // Store password for secure operations
      
      if (wallets.length > 0) {
        dispatch({ type: 'SET_CURRENT_WALLET', payload: wallets[0].id });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to unlock wallet:', error);
      if (error instanceof Error && error.message.includes('Malformed UTF-8')) {
        console.error('💡 This usually means the password is incorrect or the encrypted data is corrupted');
      }
      return false;
    }
  };

  const verifyPassword = (password: string): boolean => {
    try {
      const mnemonic = loadEncryptedMnemonic(password);
      return !!mnemonic;
    } catch {
      return false;
    }
  };

  const lockWallet = () => {
    dispatch({ type: 'SET_UNLOCKED', payload: false });
    dispatch({ type: 'SET_MNEMONIC', payload: '' });
    dispatch({ type: 'CLEAR_PASSWORD' }); // Clear password from memory
  };

  const addNewAccount = (name?: string) => {
    if (!state.mnemonic) return;
    
    const newIndex = state.wallets.length;
    const defaultName = `Account ${newIndex + 1}`;
    const finalName = name?.trim() || defaultName;
    
    const newWallet = generateWallet(state.mnemonic, newIndex, finalName);
    
    const updatedWallets = [...state.wallets, newWallet];
    saveWalletState({ wallets: updatedWallets }, state.password);
    
    dispatch({ type: 'ADD_WALLET', payload: newWallet });
    
    // Switch to the new account
    dispatch({ type: 'SET_CURRENT_WALLET', payload: newWallet.id });
  };

  const updateWalletName = (walletId: string, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    dispatch({ type: 'UPDATE_WALLET', payload: { walletId, updates: { name: trimmedName } } });
    
    // Update storage
    const updatedWallets = state.wallets.map(wallet =>
      wallet.id === walletId ? { ...wallet, name: trimmedName } : wallet
    );
    saveWalletState({ wallets: updatedWallets }, state.password);
    
    toast.success(`Account renamed to "${trimmedName}"`);
  };

  const deleteAccount = (walletId: string) => {
    if (state.wallets.length <= 1) {
      toast.error('Cannot delete the last account');
      return;
    }

    const updatedWallets = state.wallets.filter(w => w.id !== walletId);
    saveWalletState({ wallets: updatedWallets }, state.password);
    
    dispatch({ type: 'DELETE_WALLET', payload: walletId });
    
    // If deleted account was current, switch to first available
    if (state.currentWalletId === walletId && updatedWallets.length > 0) {
      dispatch({ type: 'SET_CURRENT_WALLET', payload: updatedWallets[0].id });
    }
  };

  const switchAccount = (walletId: string) => {
    dispatch({ type: 'SET_CURRENT_WALLET', payload: walletId });
  };

  const switchNetwork = (network: 'mainnet' | 'testnet') => {
    dispatch({ type: 'SET_NETWORK', payload: network });
  };

  const getBalances = async (walletId: string): Promise<Balance | null> => {
    const wallet = state.wallets.find(w => w.id === walletId);
    if (!wallet) return null;

    try {
      return await blockchainService.getBalances(wallet.solanaAddress, wallet.ethereumAddress);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      return null;
    }
  };

  const hasWallet = (): boolean => {
    return hasExistingWallet();
  };

  const importWallet = async (mnemonic: string, password: string): Promise<boolean> => {
    return await createWallet(mnemonic, password);
  };

  const resetWallet = () => {
    clearWalletData();
    dispatch({ type: 'RESET_STATE' });
  };

  const value: WalletContextType = {
    state,
    createWallet,
    unlockWallet,
    lockWallet,
    addNewAccount,
    updateWalletName,
    deleteAccount,
    switchAccount,
    switchNetwork,
    getBalances,
    hasWallet,
    importWallet,
    resetWallet,
    verifyPassword,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
