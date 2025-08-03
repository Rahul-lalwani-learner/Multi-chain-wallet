import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NETWORK_CONFIG } from './constants';

export class FaucetService {
  private static async requestSolanaAirdrop(address: string): Promise<string> {
    try {
      // Use Alchemy devnet RPC for faucet requests
      const connection = new Connection(NETWORK_CONFIG.solana.devnet, 'confirmed');
      const publicKey = new PublicKey(address);
      
      // Request 2 SOL (2 * LAMPORTS_PER_SOL)
      const signature = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
      
      console.log('Airdrop signature:', signature);
      
      // Don't wait for confirmation to avoid timeout - just return success
      // The tokens will appear after a few seconds
      return signature;
    } catch (error) {
      console.error('Solana airdrop failed:', error);
      
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please wait a moment before requesting again.');
      }
      
      // Check if it's an airdrop amount error
      if (error instanceof Error && error.message.includes('airdrop')) {
        throw new Error('Airdrop failed. You may have reached the daily limit or the faucet is temporarily unavailable.');
      }
      
      throw new Error('Failed to request SOL airdrop. Please try again or use the manual faucet.');
    }
  }

  private static async requestEthereumAirdrop(): Promise<string> {
    // Ethereum faucet is currently disabled
    throw new Error('Ethereum faucet is currently unavailable. Please use manual faucets.');
  }

  static async requestAirdrop(network: 'solana' | 'ethereum', address: string): Promise<string> {
    if (network === 'solana') {
      return await this.requestSolanaAirdrop(address);
    } else {
      return await this.requestEthereumAirdrop();
    }
  }

  static getFaucetInfo(network: 'solana' | 'ethereum') {
    const faucets = {
      solana: {
        name: 'Solana Devnet Faucet',
        amount: '2 SOL',
        description: 'Get test SOL tokens for development (Alchemy)',
        manualUrl: 'https://www.alchemy.com/docs/node/solana/solana-api-endpoints/request-airdrop'
      },
      ethereum: {
        name: 'Ethereum Faucet',
        amount: 'No faucet available currently',
        description: 'Ethereum faucet temporarily unavailable',
        manualUrl: 'https://faucet.sepolia.dev/'
      }
    };

    return faucets[network];
  }
}
