import { WalletState, EncryptedData, Wallet } from './types';
import { STORAGE_KEYS } from './constants';
import { encrypt, decrypt } from './encryption';

export function saveEncryptedMnemonic(mnemonic: string, password: string): void {
  const encryptedData = encrypt(mnemonic, password);
  localStorage.setItem(STORAGE_KEYS.ENCRYPTED_MNEMONIC, JSON.stringify(encryptedData));
}

export function loadEncryptedMnemonic(password: string): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
    if (!stored) return null;
    
    const encryptedData: EncryptedData = JSON.parse(stored);
    return decrypt(encryptedData, password);
  } catch (error) {
    console.error('Failed to decrypt mnemonic:', error);
    return null;
  }
}

export function saveWalletData(wallets: Wallet[]): void {
  localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(wallets));
}

export function loadWalletData(): Wallet[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load wallet data:', error);
    return [];
  }
}

export function saveNetwork(network: 'mainnet' | 'testnet'): void {
  localStorage.setItem(STORAGE_KEYS.NETWORK, network);
}

export function loadNetwork(): 'mainnet' | 'testnet' {
  return (localStorage.getItem(STORAGE_KEYS.NETWORK) as 'mainnet' | 'testnet') || 'mainnet';
}

export function hasExistingWallet(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
}

export function clearWalletData(): void {
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
  localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
  localStorage.removeItem(STORAGE_KEYS.NETWORK);
}

export function saveWalletState(state: Partial<WalletState>): void {
  const currentState = loadWalletState();
  const newState = { ...currentState, ...state };
  
  if (newState.wallets) {
    saveWalletData(newState.wallets);
  }
  
  if (newState.network) {
    saveNetwork(newState.network);
  }
}

export function loadWalletState(): Partial<WalletState> {
  return {
    wallets: loadWalletData(),
    network: loadNetwork(),
    isUnlocked: false,
  };
}
