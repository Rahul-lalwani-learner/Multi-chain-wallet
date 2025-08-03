import { NetworkConfig } from './types';

export const NETWORK_CONFIG: NetworkConfig = {
  solana: {
    mainnet: 'https://solana-mainnet.g.alchemy.com/v2/weHxMuhXzFoJg-VR9ObJw',
    devnet: 'https://solana-devnet.g.alchemy.com/v2/weHxMuhXzFoJg-VR9ObJw',
  },
  ethereum: {
    mainnet: 'https://eth-mainnet.g.alchemy.com/v2/weHxMuhXzFoJg-VR9ObJw',
    sepolia: 'https://eth-sepolia.g.alchemy.com/v2/weHxMuhXzFoJg-VR9ObJw',
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
