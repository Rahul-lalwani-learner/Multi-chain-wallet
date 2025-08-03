import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import bs58 from 'bs58';
import { Wallet } from './types';
import { DERIVATION_PATHS } from './constants';

export function generateMnemonic(): string {
  return bip39.generateMnemonic();
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

export function generateSolanaWallet(mnemonic: string, index: number): {
  address: string;
  privateKey: string;
} {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const derivationPath = DERIVATION_PATHS.SOLANA.replace('{index}', index.toString());
  const derived = derivePath(derivationPath, seed.toString('hex'));
  
  const keypair = Keypair.fromSeed(derived.key);
  
  return {
    address: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
  };
}

export function generateEthereumWallet(mnemonic: string, index: number): {
  address: string;
  privateKey: string;
} {
  const derivationPath = DERIVATION_PATHS.ETHEREUM.replace('{index}', index.toString());
  const hdNode = ethers.HDNodeWallet.fromMnemonic(
    ethers.Mnemonic.fromPhrase(mnemonic),
    derivationPath
  );
  
  return {
    address: hdNode.address,
    privateKey: hdNode.privateKey,
  };
}

export function generateWallet(mnemonic: string, index: number, name?: string): Wallet {
  const solanaWallet = generateSolanaWallet(mnemonic, index);
  const ethereumWallet = generateEthereumWallet(mnemonic, index);
  
  return {
    id: `wallet-${index}`,
    name: name || `Account ${index + 1}`,
    solanaAddress: solanaWallet.address,
    ethereumAddress: ethereumWallet.address,
    solanaPrivateKey: solanaWallet.privateKey,
    ethereumPrivateKey: ethereumWallet.privateKey,
    derivationIndex: index,
  };
}

export function generateMultipleWallets(mnemonic: string, count: number): Wallet[] {
  const wallets: Wallet[] = [];
  
  for (let i = 0; i < count; i++) {
    wallets.push(generateWallet(mnemonic, i));
  }
  
  return wallets;
}
