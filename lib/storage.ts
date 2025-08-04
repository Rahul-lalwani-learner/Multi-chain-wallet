import { WalletState, EncryptedData, Wallet } from './types';
import { STORAGE_KEYS } from './constants';
import { encrypt, decrypt, decryptLegacy } from './encryption';

export function saveEncryptedMnemonic(mnemonic: string, password: string): void {
  const encryptedData = encrypt(mnemonic, password);
  localStorage.setItem(STORAGE_KEYS.ENCRYPTED_MNEMONIC, JSON.stringify(encryptedData));
}

export function loadEncryptedMnemonic(password: string): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
    if (!stored) return null;
    
    const encryptedData: EncryptedData = JSON.parse(stored);
    
    // Migration: Handle old format without salt
    if (!encryptedData.salt) {
      console.warn('Detected old encryption format. Consider re-encrypting for better security.');
      // For old format, we'll need to use the old decrypt method temporarily
      return decryptLegacy(encryptedData, password);
    }
    
    return decrypt(encryptedData, password);
  } catch (error) {
    console.error('Failed to decrypt mnemonic:', error);
    return null;
  }
}

/**
 * SECURITY CRITICAL: Saves encrypted wallet data containing private keys
 * This replaces the old insecure method of storing private keys in plain text
 * @param wallets - Array of wallet objects containing private keys
 * @param password - User's password for encryption
 */
export function saveEncryptedWalletData(wallets: Wallet[], password: string): void {
  const encryptedData = encrypt(JSON.stringify(wallets), password);
  localStorage.setItem(STORAGE_KEYS.ENCRYPTED_WALLET_DATA, JSON.stringify(encryptedData));
  
  // Remove old insecure data if it exists
  localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
}

/**
 * SECURITY CRITICAL: Loads and decrypts wallet data containing private keys
 * @param password - User's password for decryption
 * @returns Decrypted wallet array or empty array if failed
 */
export function loadEncryptedWalletData(password: string): Wallet[] {
  try {
    // First, try to load from new encrypted storage
    const encryptedStored = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_WALLET_DATA);
    
    if (encryptedStored) {
      const parsedData = JSON.parse(encryptedStored);
      
      if (parsedData.salt && parsedData.encrypted && parsedData.iv) {
        const decryptedData = decrypt(parsedData, password);
        const wallets = JSON.parse(decryptedData);
        return wallets;
      }
    }
    
    // Fallback: Check for old storage (migration path)
    const oldStored = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
    
    if (!oldStored) {
      return [];
    }
    
    const parsedData = JSON.parse(oldStored);
    
    // Check if this is old unencrypted data (security vulnerability!)
    if (Array.isArray(parsedData)) {
      console.warn('🚨 SECURITY RISK: Found unencrypted wallet data! Auto-migrating to encrypted storage...');
      // Immediately encrypt and move to secure storage
      saveEncryptedWalletData(parsedData, password);
      // Explicit cleanup of old data
      cleanupLegacyWalletData();
      console.log('✅ Successfully migrated unencrypted wallet data to secure storage');
      return parsedData;
    }
    
    // Handle legacy encrypted format in old location
    if (parsedData.encrypted && parsedData.iv) {
      console.warn('Found legacy encrypted wallet data. Migrating to enhanced security...');
      let decryptedData: string;
      
      if (parsedData.salt) {
        decryptedData = decrypt(parsedData, password);
      } else {
        decryptedData = decryptLegacy(parsedData, password);
      }
      
      const wallets = JSON.parse(decryptedData);
      // Migrate to new secure location and cleanup old data
      saveEncryptedWalletData(wallets, password);
      cleanupLegacyWalletData();
      console.log('✅ Successfully migrated legacy encrypted wallet data to enhanced security');
      return wallets;
    }
    
    throw new Error('Invalid wallet data format');
    
  } catch (error) {
    console.error('🚨 Failed to decrypt wallet data:', error);
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
  localStorage.removeItem(STORAGE_KEYS.WALLET_DATA); // Remove old insecure storage
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_WALLET_DATA); // Remove new secure storage
  localStorage.removeItem(STORAGE_KEYS.NETWORK);
}

/**
 * Removes legacy insecure wallet data from localStorage
 * This should be called after successful migration to encrypted storage
 */
export function cleanupLegacyWalletData(): void {
  const hadOldData = !!localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
  
  if (hadOldData) {
    localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
  }
}

/**
 * Force removes all legacy wallet data regardless of format
 * Use this for complete cleanup when you're sure migration is complete
 */
export function forceClearLegacyData(): void {
  localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
}

/**
 * Checks if there's any insecure (unencrypted) wallet data in storage
 * @returns True if vulnerable data is found
 */
export function hasInsecureWalletData(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
    if (!stored) return false;
    
    const parsedData = JSON.parse(stored);
    // If it's an array, it means private keys are stored in plain text!
    return Array.isArray(parsedData);
  } catch {
    return false;
  }
}

/**
 * Checks if user has any wallet data (encrypted or unencrypted)
 * @returns Object indicating what storage formats are found
 */
export function getWalletDataStatus(): {
  hasSecureData: boolean;
  hasInsecureData: boolean;
  hasLegacyEncrypted: boolean;
} {
  const status = {
    hasSecureData: false,
    hasInsecureData: false,
    hasLegacyEncrypted: false
  };

  try {
    // Check for new secure encrypted storage
    const secureStored = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_WALLET_DATA);
    if (secureStored) {
      const parsedSecure = JSON.parse(secureStored);
      if (parsedSecure.salt && parsedSecure.encrypted && parsedSecure.iv) {
        status.hasSecureData = true;
      }
    }

    // Check for old storage location
    const oldStored = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
    if (oldStored) {
      const parsedOld = JSON.parse(oldStored);
      
      if (Array.isArray(parsedOld)) {
        status.hasInsecureData = true;
      } else if (parsedOld.encrypted && parsedOld.iv) {
        status.hasLegacyEncrypted = true;
      }
    }
  } catch (error) {
    console.error('Error checking wallet data status:', error);
  }

  return status;
}

export function saveWalletState(state: Partial<WalletState>, password?: string): void {
  const currentState = loadWalletState();
  const newState = { ...currentState, ...state };
  
  if (newState.wallets) {
    if (password) {
      // Use secure encrypted storage when password is available
      saveEncryptedWalletData(newState.wallets, password);
    } else {
      // Security: Don't save unencrypted wallet data - require password
      console.error('🚨 Cannot save wallet data without encryption! Password required.');
      throw new Error('Password required for secure wallet storage');
    }
  }
  
  if (newState.network) {
    saveNetwork(newState.network);
  }
}

export function loadWalletState(password?: string): Partial<WalletState> {
  // Security improvement: Don't load wallet data without password to prevent loading insecure data
  let wallets: Wallet[] = [];
  
  if (password) {
    // Load encrypted wallet data when password is available
    wallets = loadEncryptedWalletData(password);
  } else {
    // Check if there's secure encrypted data available
    const hasSecureData = !!localStorage.getItem(STORAGE_KEYS.ENCRYPTED_WALLET_DATA);
    
    if (!hasSecureData) {
      // Check for insecure data and warn user
      const hasInsecureData = hasInsecureWalletData();
      if (hasInsecureData) {
        console.warn('🚨 CRITICAL: Wallet has unencrypted private keys! User must unlock wallet to migrate.');
        // Don't load the insecure data - force user to unlock wallet first
        wallets = [];
      } else {
        // No secure data, no insecure data - user needs to create wallet or unlock
        wallets = [];
      }
    } else {
      // Secure data exists but no password provided - user needs to unlock
      wallets = [];
    }
  }

  return {
    wallets,
    network: loadNetwork(),
    isUnlocked: false,
  };
}

/**
 * Simplified migration function for secure storage
 * @param password - The user's password
 * @returns Object indicating what was migrated
 */
export function migrateToSecureStorage(password: string): {
  foundInsecureData: boolean;
  migrationSummary: string;
} {
  try {
    let foundInsecureData = false;
    const messages: string[] = [];

    // Check for insecure wallet data (plain text private keys)
    const walletStored = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
    if (walletStored) {
      const parsedData = JSON.parse(walletStored);
      
      if (Array.isArray(parsedData)) {
        // Found unencrypted wallet data - critical security issue
        foundInsecureData = true;
        saveEncryptedWalletData(parsedData, password);
        cleanupLegacyWalletData();
        messages.push('🔒 Secured wallet data with encryption');
      } else if (parsedData.encrypted) {
        // Found old encrypted format - migrate to new secure storage
        const wallets = parsedData.salt 
          ? JSON.parse(decrypt(parsedData, password))
          : JSON.parse(decryptLegacy(parsedData, password));
        
        saveEncryptedWalletData(wallets, password);
        cleanupLegacyWalletData();
        messages.push('� Upgraded to secure storage');
      }
    }

    // Check for old mnemonic encryption format
    const mnemonicStored = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
    if (mnemonicStored) {
      const encryptedMnemonic: EncryptedData = JSON.parse(mnemonicStored);
      if (!encryptedMnemonic.salt) {
        const mnemonic = decryptLegacy(encryptedMnemonic, password);
        saveEncryptedMnemonic(mnemonic, password);
        messages.push('� Upgraded mnemonic encryption');
      }
    }

    return {
      foundInsecureData,
      migrationSummary: messages.length > 0 ? messages.join(' | ') : '✅ Already secure'
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      foundInsecureData: false,
      migrationSummary: '❌ Migration failed - please check password'
    };
  }
}

/**
 * @deprecated Use migrateToSecureStorage() instead for comprehensive migration
 */
export function migrateToNewEncryption(password: string): boolean {
  const result = migrateToSecureStorage(password);
  return result.foundInsecureData; // Return if any insecure data was found and migrated
}
