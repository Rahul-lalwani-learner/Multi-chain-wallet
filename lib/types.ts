export interface Wallet {
  id: string;
  name: string;
  solanaAddress: string;
  ethereumAddress: string;
  solanaPrivateKey: string;
  ethereumPrivateKey: string;
  derivationIndex: number;
}

export interface WalletState {
  isUnlocked: boolean;
  mnemonic?: string;
  wallets: Wallet[];
  currentWalletId?: string;
  network: 'mainnet' | 'testnet';
}

export interface Balance {
  solana: string;
  ethereum: string;
}

export interface NetworkConfig {
  solana: {
    mainnet: string;
    devnet: string;
  };
  ethereum: {
    mainnet: string;
    sepolia: string;
  };
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
}

export interface Transaction {
  signature: string;
  timestamp: number;
  type: 'send' | 'receive';
  amount: string;
  from: string;
  to: string;
  status: 'success' | 'failed' | 'pending';
  fee?: string;
  blockNumber?: number;
  explorerUrl: string;
}

export interface TransactionHistory {
  solana: Transaction[];
  ethereum: Transaction[];
}
