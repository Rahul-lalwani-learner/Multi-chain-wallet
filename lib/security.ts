/**
 * Security Analysis and Protection Module
 * 
 * This module provides security analysis, vulnerability detection, and protection
 * for the multi-chain wallet application.
 * 
 * @author Multi-Chain Wallet Security Team
 * @version 1.0.0
 */

import { getWalletDataStatus, hasInsecureWalletData, migrateToSecureStorage, forceClearLegacyData } from './storage';
import { validatePasswordStrength } from './encryption';

export interface SecurityReport {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
  overallScore: number; // 0-100, higher is more secure
}

export interface SecurityVulnerability {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact: string;
  fixAction?: string;
}

/**
 * Performs comprehensive security analysis of the wallet
 * @returns Detailed security report
 */
export function analyzeWalletSecurity(): SecurityReport {
  const vulnerabilities: SecurityVulnerability[] = [];
  const recommendations: string[] = [];
  
  // Check for unencrypted private keys
  if (hasInsecureWalletData()) {
    vulnerabilities.push({
      id: 'UNENCRYPTED_PRIVATE_KEYS',
      severity: 'CRITICAL',
      title: 'Private Keys Stored in Plain Text',
      description: 'Private keys are stored unencrypted in localStorage, allowing anyone with device access to steal funds',
      impact: 'Complete wallet compromise - all funds can be stolen',
      fixAction: 'Migrate to encrypted storage immediately'
    });
  }

  // Check wallet data status
  const status = getWalletDataStatus();
  
  if (status.hasLegacyEncrypted) {
    vulnerabilities.push({
      id: 'WEAK_ENCRYPTION',
      severity: 'MEDIUM',
      title: 'Using Legacy Encryption',
      description: 'Wallet data uses older encryption with fixed salt and lower iteration count',
      impact: 'Vulnerable to rainbow table attacks and faster brute force',
      fixAction: 'Upgrade to enhanced encryption with random salts'
    });
  }

  // Check for old storage locations
  if (status.hasInsecureData || status.hasLegacyEncrypted) {
    recommendations.push('🔐 Migrate to secure encryption format');
    recommendations.push('🗑️ Remove old insecure data after migration');
  }

  // Browser security checks
  if (typeof window !== 'undefined') {
    // Check if running over HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      vulnerabilities.push({
        id: 'INSECURE_CONNECTION',
        severity: 'HIGH',
        title: 'Not Using HTTPS',
        description: 'Wallet is accessed over unencrypted HTTP connection',
        impact: 'Sensitive data can be intercepted by attackers',
        fixAction: 'Always use HTTPS in production'
      });
    }

    // Check for developer tools (basic detection)
    if (process.env.NODE_ENV === 'production') {
      recommendations.push('🛡️ Disable developer tools in production builds');
    }
  }

  // Calculate overall security score
  let score = 100;
  vulnerabilities.forEach(vuln => {
    switch (vuln.severity) {
      case 'CRITICAL': score -= 40; break;
      case 'HIGH': score -= 25; break;
      case 'MEDIUM': score -= 15; break;
      case 'LOW': score -= 5; break;
    }
  });

  // Bonus points for secure practices
  if (status.hasSecureData && !status.hasInsecureData && !status.hasLegacyEncrypted) {
    score += 10; // Bonus for using latest security
  }

  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let riskLevel: SecurityReport['riskLevel'] = 'LOW';
  if (vulnerabilities.some(v => v.severity === 'CRITICAL')) riskLevel = 'CRITICAL';
  else if (vulnerabilities.some(v => v.severity === 'HIGH')) riskLevel = 'HIGH';
  else if (vulnerabilities.some(v => v.severity === 'MEDIUM')) riskLevel = 'MEDIUM';

  // Add general recommendations
  if (score < 80) {
    recommendations.push('🔒 Review and fix security vulnerabilities');
  }
  if (score >= 90) {
    recommendations.push('✅ Excellent security posture! Keep monitoring.');
  }

  return {
    riskLevel,
    vulnerabilities,
    recommendations,
    overallScore: score
  };
}

/**
 * Automatically fixes critical security vulnerabilities
 * @param password - User's password for encryption
 * @returns Results of the security fixes applied
 */
export async function autoFixCriticalVulnerabilities(password: string): Promise<{
  success: boolean;
  fixesApplied: string[];
  errors: string[];
}> {
  const result = {
    success: true,
    fixesApplied: [] as string[],
    errors: [] as string[]
  };

  try {
    // Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      result.errors.push(`Weak password: ${passwordCheck.feedback.join(', ')}`);
      result.success = false;
    }

    // Run migration to secure storage
    const migrationResult = migrateToSecureStorage(password);
    
    if (migrationResult.foundInsecureData) {
      result.fixesApplied.push('🔒 Encrypted unprotected private keys');
      result.fixesApplied.push('🔐 Upgraded to enhanced encryption');
      // Force cleanup any remaining legacy data
      forceClearLegacyData();
    }

    if (result.fixesApplied.length === 0) {
      result.fixesApplied.push('✅ No security fixes needed - already secure');
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Generates a user-friendly security status message
 * @returns Security status message with emojis
 */
export function getSecurityStatusMessage(): string {
  const report = analyzeWalletSecurity();
  
  const statusEmojis = {
    'CRITICAL': '🚨',
    'HIGH': '⚠️',
    'MEDIUM': '🔶',
    'LOW': '✅'
  };

  const emoji = statusEmojis[report.riskLevel];
  const scoreColor = report.overallScore >= 90 ? '🟢' : 
                     report.overallScore >= 70 ? '🟡' : '🔴';

  return `${emoji} Security Level: ${report.riskLevel} ${scoreColor} Score: ${report.overallScore}/100`;
}

/**
 * Security best practices for users
 */
export const SECURITY_BEST_PRACTICES = [
  '🔐 Use a strong, unique password for your wallet',
  '🔒 Never share your mnemonic phrase or private keys',
  '💾 Keep secure backups of your mnemonic phrase offline',
  '🔍 Always verify transaction details before signing',
  '🌐 Only use the wallet on trusted devices and networks',
  '🛡️ Keep your device and browser updated',
  '👀 Be suspicious of phishing attempts and fake websites',
  '🚫 Never enter your seed phrase on suspicious websites',
  '💻 Use hardware wallets for large amounts',
  '📱 Enable two-factor authentication where possible'
] as const;

/**
 * Emergency security actions for compromised wallets
 */
export const EMERGENCY_ACTIONS = [
  '🚨 Immediately transfer funds to a new secure wallet',
  '🔄 Create a new mnemonic phrase and wallet',
  '🗑️ Clear all wallet data from the compromised device',
  '🔍 Scan device for malware',
  '📞 Contact support if funds were stolen',
  '📝 Report the incident to relevant authorities if needed'
] as const;
