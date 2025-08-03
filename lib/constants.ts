import { NetworkConfig } from './types';

// For client-side, use NEXT_PUBLIC_ prefixed environment variables
// For server-side, use regular process.env variables
const getApiKey = () => {
  // Try client-side first (NEXT_PUBLIC_ prefix)
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  }
  // Server-side
  return process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
};

export const NETWORK_CONFIG: NetworkConfig = {
  solana: {
    mainnet: `https://solana-mainnet.g.alchemy.com/v2/${getApiKey()}`,
    devnet: `https://solana-devnet.g.alchemy.com/v2/${getApiKey()}`
  },
  ethereum: {
    mainnet: `https://eth-mainnet.g.alchemy.com/v2/${getApiKey()}`,
    sepolia: `https://eth-sepolia.g.alchemy.com/v2/${getApiKey()}`
  },
};

export const STORAGE_KEYS = {
  ENCRYPTED_MNEMONIC: 'crypto_wallet_mnemonic',
  WALLET_DATA: 'crypto_wallet_data',
  NETWORK: 'crypto_wallet_network',
} as const;

export const DERIVATION_PATHS = {
  SOLANA: "m/44'/501'/{index}'/0'",
  ETHEREUM: "m/44'/60'/0'/0/{index}",
} as const;
