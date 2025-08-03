import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from './constants';
import { Balance } from './types';

export class BlockchainService {
  private solanaConnection!: Connection;
  private ethereumProvider!: ethers.JsonRpcProvider;
  private network: 'mainnet' | 'testnet';

  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
    this.network = network;
    this.initializeConnections();
  }

  private initializeConnections() {
    // Initialize Solana connection
    const solanaRpc = this.network === 'mainnet' 
      ? NETWORK_CONFIG.solana.mainnet 
      : NETWORK_CONFIG.solana.devnet;
    this.solanaConnection = new Connection(solanaRpc, 'confirmed');

    // Initialize Ethereum provider
    const ethereumRpc = this.network === 'mainnet' 
      ? NETWORK_CONFIG.ethereum.mainnet 
      : NETWORK_CONFIG.ethereum.sepolia;
    this.ethereumProvider = new ethers.JsonRpcProvider(ethereumRpc);
  }

  public switchNetwork(network: 'mainnet' | 'testnet') {
    this.network = network;
    this.initializeConnections();
  }

  public async getSolanaBalance(address: string): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.solanaConnection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toFixed(6);
    } catch (error) {
      console.error('Error fetching Solana balance:', error);
      return '0';
    }
  }

  public async getEthereumBalance(address: string): Promise<string> {
    try {
      const balance = await this.ethereumProvider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching Ethereum balance:', error);
      return '0';
    }
  }

  public async getBalances(solanaAddress: string, ethereumAddress: string): Promise<Balance> {
    const [solanaBalance, ethereumBalance] = await Promise.all([
      this.getSolanaBalance(solanaAddress),
      this.getEthereumBalance(ethereumAddress),
    ]);

    return {
      solana: solanaBalance,
      ethereum: ethereumBalance,
    };
  }

  public async getLatestSolanaBlockhash(): Promise<string> {
    try {
      const { blockhash } = await this.solanaConnection.getLatestBlockhash();
      return blockhash;
    } catch (error) {
      console.error('Error fetching Solana blockhash:', error);
      return '';
    }
  }

  public async getLatestEthereumBlock(): Promise<string> {
    try {
      const block = await this.ethereumProvider.getBlock('latest');
      return block?.hash || '';
    } catch (error) {
      console.error('Error fetching Ethereum block:', error);
      return '';
    }
  }

  public getSolanaExplorerUrl(address: string): string {
    const baseUrl = this.network === 'mainnet' 
      ? 'https://explorer.solana.com/address/' 
      : 'https://explorer.solana.com/address/';
    const cluster = this.network === 'mainnet' ? '' : '?cluster=devnet';
    return `${baseUrl}${address}${cluster}`;
  }

  public getEthereumExplorerUrl(address: string): string {
    const baseUrl = this.network === 'mainnet' 
      ? 'https://etherscan.io/address/' 
      : 'https://sepolia.etherscan.io/address/';
    return `${baseUrl}${address}`;
  }
}
