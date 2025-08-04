/**
 * Secure Encryption Module for Multi-Chain Wallet
 * 
 * This module provides enterprise-grade encryption for sensitive wallet data.
 * 
 * Security Features:
 * - AES-256-CBC encryption (industry standard)
 * - PBKDF2 key derivation with 100,000 iterations
 * - Random salt per encryption (32 bytes)
 * - Random IV per encryption (16 bytes)
 * - Secure password strength validation
 * - Timing-attack resistant password comparison
 * - Backwards compatibility with legacy formats
 * 
 * Key Security Improvements:
 * 1. Random Salt: Each encryption uses a unique salt, preventing rainbow table attacks
 * 2. High Iterations: 100,000 PBKDF2 iterations make brute force attacks computationally expensive
 * 3. Password Validation: Enforces strong password requirements
 * 4. Secure Comparison: Prevents timing attacks during password verification
 * 
 * @author Multi-Chain Wallet Team
 * @version 2.0.0 - Enhanced Security
 */

import CryptoJS from 'crypto-js';
import { EncryptedData } from './types';

/**
 * Encrypts text using AES-256-CBC with PBKDF2 key derivation
 * 
 * Security improvements over basic encryption:
 * - Random salt per encryption (prevents rainbow table attacks)
 * - High iteration count (100,000) makes brute force attacks slower
 * - Random IV per encryption (prevents pattern analysis)
 * - 256-bit AES encryption (industry standard)
 * 
 * @param text - The plaintext to encrypt
 * @param password - The user's password
 * @returns Encrypted data with salt, IV, and ciphertext
 */
export function encrypt(text: string, password: string): EncryptedData {
  // Generate random salt for each encryption (32 bytes = 256 bits)
  const salt = CryptoJS.lib.WordArray.random(32);
  // Generate random initialization vector (16 bytes = 128 bits)
  const iv = CryptoJS.lib.WordArray.random(16);
  
  // Derive key using PBKDF2 with random salt and higher iteration count
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256-bit key
    iterations: 100000, // Increased from 1000 to 100000 for better security
  });
  
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encrypted: encrypted.toString(),
    iv: iv.toString(),
    salt: salt.toString(), // Store the random salt with the encrypted data
  };
}

/**
 * Decrypts data that was encrypted with the encrypt() function
 * 
 * @param encryptedData - The encrypted data containing salt, IV, and ciphertext
 * @param password - The user's password
 * @returns The original plaintext
 * @throws Error if decryption fails (wrong password or corrupted data)
 */
export function decrypt(encryptedData: EncryptedData, password: string): string {
  // Parse the stored salt from the encrypted data
  const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
  
  // Derive the same key using the stored salt and same parameters
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256-bit key
    iterations: 100000, // Must match encryption iterations
  });

  const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
    iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  
  // Verify decryption was successful
  if (!decryptedText) {
    throw new Error('Decryption failed - invalid password or corrupted data');
  }

  return decryptedText;
}

export function generateRandomPassword(): string {
  // Generate a cryptographically secure random password (32 bytes = 256 bits)
  return CryptoJS.lib.WordArray.random(32).toString();
}

export function hashPassword(password: string): string {
  // Use PBKDF2 for password hashing instead of simple SHA256
  // This makes password verification slower and more secure against brute force
  const salt = CryptoJS.SHA256(password + 'wallet_salt_2024').toString(); // App-specific salt
  
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000, // Lower than encryption but still secure for password verification
  }).toString();
}

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns Object with validation result and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-4 (weak to very strong)
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) {
    score++;
  } else {
    feedback.push('Password should be at least 12 characters long');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Include special characters');

  // Additional checks
  if (password.length >= 16) score = Math.min(score + 1, 5);
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(score - 1, 0);
    feedback.push('Avoid repeating characters');
  }

  const isValid = score >= 3; // Require at least 3/5 criteria

  return {
    isValid,
    score: Math.min(score, 4),
    feedback: isValid ? [] : feedback
  };
}

/**
 * Securely compare two strings to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Legacy decrypt function for backwards compatibility
 * @deprecated Use decrypt() instead - this uses weaker security parameters
 */
export function decryptLegacy(encryptedData: { encrypted: string; iv: string }, password: string): string {
  const key = CryptoJS.PBKDF2(password, 'salt', {
    keySize: 256 / 32,
    iterations: 1000,
  });

  const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
    iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  
  if (!decryptedText) {
    throw new Error('Legacy decryption failed - invalid password or corrupted data');
  }

  return decryptedText;
}
