import { Connection, PublicKey, SystemProgram, Transaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ethers } from 'ethers';
import bs58 from 'bs58';
import { NETWORK_CONFIG } from './constants';

export class TransactionService {
  private static async sendSolanaTransaction(
    fromPrivateKey: string,
    toAddress: string,
    amount: number,
    network: 'mainnet' | 'testnet'
  ): Promise<string> {
    try {
      // Connect to Solana network
      const connection = new Connection(
        network === 'mainnet' ? NETWORK_CONFIG.solana.mainnet : NETWORK_CONFIG.solana.devnet,
        'confirmed'
      );

      // Convert base58 private key to Keypair
      const privateKeyBytes = bs58.decode(fromPrivateKey);
      const fromKeypair = Keypair.fromSecretKey(privateKeyBytes);
      
      const toPublicKey = new PublicKey(toAddress);
      
      // Convert amount to lamports (1 SOL = 10^9 lamports)
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Check if the sender has enough balance
      const balance = await connection.getBalance(fromKeypair.publicKey);
      if (balance < lamports) {
        throw new Error('Insufficient balance for this transaction');
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();

      // Create transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromKeypair.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      // Send transaction (don't wait for confirmation to avoid timeouts)
      const signature = await connection.sendTransaction(transaction, [fromKeypair], {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Return signature immediately - don't wait for full confirmation
      return signature;
    } catch (error) {
      console.error('Solana transaction failed:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          throw new Error('Insufficient SOL balance for this transaction');
        }
        if (error.message.includes('blockhash')) {
          throw new Error('Network error: Unable to get latest blockhash. Please try again.');
        }
        if (error.message.includes('Invalid public key')) {
          throw new Error('Invalid recipient address');
        }
        if (error.message.includes('already processed')) {
          throw new Error('Transaction already processed. Please wait and refresh balance.');
        }
      }
      
      throw new Error(`Failed to send SOL transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async sendEthereumTransaction(
    fromPrivateKey: string,
    toAddress: string,
    amount: number,
    network: 'mainnet' | 'testnet'
  ): Promise<string> {
    try {
      // Connect to Ethereum network
      const provider = new ethers.JsonRpcProvider(
        network === 'mainnet' ? NETWORK_CONFIG.ethereum.mainnet : NETWORK_CONFIG.ethereum.sepolia
      );

      // Create wallet from private key
      const wallet = new ethers.Wallet(fromPrivateKey, provider);

      // Check balance before sending
      const balance = await provider.getBalance(wallet.address);
      const valueToSend = ethers.parseEther(amount.toString());
      
      if (balance < valueToSend) {
        throw new Error('Insufficient ETH balance for this transaction');
      }

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        to: toAddress,
        value: valueToSend,
        from: wallet.address,
      });

      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Calculate total cost (value + gas)
      const totalCost = valueToSend + (gasEstimate * gasPrice);
      
      if (balance < totalCost) {
        throw new Error('Insufficient ETH balance to cover transaction and gas fees');
      }

      // Create transaction
      const transaction = {
        to: toAddress,
        value: valueToSend,
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
      };

      // Send transaction
      const txResponse = await wallet.sendTransaction(transaction);
      
      // Return hash immediately - don't wait for confirmation
      return txResponse.hash;
    } catch (error) {
      console.error('Ethereum transaction failed:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          throw new Error('Insufficient ETH balance for this transaction and gas fees');
        }
        if (error.message.includes('gas')) {
          throw new Error('Gas estimation failed. Please check the recipient address.');
        }
        if (error.message.includes('nonce')) {
          throw new Error('Transaction nonce error. Please try again.');
        }
        if (error.message.includes('already known')) {
          throw new Error('Transaction already submitted. Please wait and refresh balance.');
        }
      }
      
      throw new Error(`Failed to send ETH transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async sendTransaction(
    network: 'solana' | 'ethereum',
    fromPrivateKey: string,
    toAddress: string,
    amount: number,
    currentNetwork: 'mainnet' | 'testnet'
  ): Promise<string> {
    if (network === 'solana') {
      return await this.sendSolanaTransaction(fromPrivateKey, toAddress, amount, currentNetwork);
    } else {
      return await this.sendEthereumTransaction(fromPrivateKey, toAddress, amount, currentNetwork);
    }
  }

  static validateAddress(network: 'solana' | 'ethereum', address: string): boolean {
    try {
      if (network === 'solana') {
        new PublicKey(address);
        return true;
      } else {
        return ethers.isAddress(address);
      }
    } catch {
      return false;
    }
  }
}
