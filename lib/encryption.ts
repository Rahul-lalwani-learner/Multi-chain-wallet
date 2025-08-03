import CryptoJS from 'crypto-js';
import { EncryptedData } from './types';

export function encrypt(text: string, password: string): EncryptedData {
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = CryptoJS.PBKDF2(password, 'salt', {
    keySize: 256 / 32,
    iterations: 1000,
  });
  
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encrypted: encrypted.toString(),
    iv: iv.toString(),
  };
}

export function decrypt(encryptedData: EncryptedData, password: string): string {
  const key = CryptoJS.PBKDF2(password, 'salt', {
    keySize: 256 / 32,
    iterations: 1000,
  });

  const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
    iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function generateRandomPassword(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}
