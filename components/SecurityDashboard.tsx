'use client';

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, X, Lock, Key, Activity, TrendingUp } from 'lucide-react';
import { analyzeWalletSecurity, autoFixCriticalVulnerabilities, SECURITY_BEST_PRACTICES, SecurityReport} from '../lib/security';

interface SecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userPassword?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ isOpen, onClose, userPassword }) => {
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fixResults, setFixResults] = useState<{ success: boolean; fixesApplied: string[]; errors: string[]; } | null>(null);
  const [showBestPractices, setShowBestPractices] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      performSecurityAnalysis();
    }
  }, [isOpen]);

  const performSecurityAnalysis = () => {
    setIsLoading(true);
    try {
      const report = analyzeWalletSecurity();
      setSecurityReport(report);
    } catch (error) {
      console.error('Security analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFix = async () => {
    if (!userPassword && !enteredPassword) {
      setPasswordPrompt(true);
      return;
    }

    const passwordToUse = userPassword || enteredPassword;
    setIsLoading(true);
    try {
      const results = await autoFixCriticalVulnerabilities(passwordToUse);
      setFixResults(results);
      setTimeout(() => performSecurityAnalysis(), 500);
    } catch (error) {
      console.error('Auto-fix failed:', error);
    } finally {
      setIsLoading(false);
      setPasswordPrompt(false);
      setEnteredPassword('');
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'from-red-500 to-red-600';
      case 'HIGH': return 'from-orange-500 to-orange-600';
      case 'MEDIUM': return 'from-yellow-500 to-yellow-600';
      case 'LOW': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Security Dashboard</h2>
                <p className="text-blue-100 text-sm">Monitor and improve your wallet security</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-lg">Analyzing security...</span>
              </div>
            </div>
          ) : securityReport ? (
            <>
              {/* Security Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-green-600 font-semibold">Security Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(securityReport.overallScore)}`}>
                        {securityReport.overallScore}/100
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border ${
                  securityReport.riskLevel === 'LOW' ? 'bg-green-50 border-green-200' :
                  securityReport.riskLevel === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                  securityReport.riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-gradient-to-r ${getRiskColor(securityReport.riskLevel)} rounded-lg`}>
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-semibold">Risk Level</p>
                      <p className={`text-xl font-bold ${
                        securityReport.riskLevel === 'LOW' ? 'text-green-700' :
                        securityReport.riskLevel === 'MEDIUM' ? 'text-yellow-700' :
                        securityReport.riskLevel === 'HIGH' ? 'text-orange-700' :
                        'text-red-700'
                      }`}>{securityReport.riskLevel}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-blue-700 font-semibold">Encryption</p>
                      <p className="text-xl font-bold text-blue-800">
                        {securityReport.vulnerabilities.some(f => f.severity === 'CRITICAL') ? 'Weak' : 'Strong'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Key className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-purple-700 font-semibold">Issues Found</p>
                      <p className="text-xl font-bold text-purple-800">{securityReport.vulnerabilities.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={handleAutoFix}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <Shield className="w-5 h-5" />
                  Auto-Fix Issues
                </button>
                
                <button
                  onClick={performSecurityAnalysis}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Analysis
                </button>

                <button
                  onClick={() => setShowBestPractices(!showBestPractices)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Security Tips
                </button>
              </div>

              {/* Status Message */}
              {securityReport.recommendations.length > 0 && (
                <div className={`p-4 rounded-xl mb-6 ${
                  securityReport.riskLevel === 'LOW' ? 'bg-green-50 border border-green-200 text-green-800' :
                  securityReport.riskLevel === 'MEDIUM' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                  'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {securityReport.riskLevel === 'LOW' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                    <span className="font-semibold">{securityReport.recommendations[0]}</span>
                  </div>
                </div>
              )}

              {/* Security Findings */}
              {securityReport.vulnerabilities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    Security Issues
                  </h3>
                  <div className="space-y-3">
                    {securityReport.vulnerabilities.map((finding, index) => (
                      <div key={index} className={`p-4 rounded-xl border-l-4 ${
                        finding.severity === 'CRITICAL' ? 'bg-red-50 border-red-500' :
                        finding.severity === 'HIGH' ? 'bg-orange-50 border-orange-500' :
                        finding.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-blue-50 border-blue-500'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-1 rounded-full ${
                            finding.severity === 'CRITICAL' ? 'bg-red-100' :
                            finding.severity === 'HIGH' ? 'bg-orange-100' :
                            finding.severity === 'MEDIUM' ? 'bg-yellow-100' :
                            'bg-blue-100'
                          }`}>
                            {finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? (
                              <XCircle className={`w-4 h-4 ${
                                finding.severity === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'
                              }`} />
                            ) : (
                              <AlertTriangle className={`w-4 h-4 ${
                                finding.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                              }`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                finding.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                                finding.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                                finding.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-blue-200 text-blue-800'
                              }`}>
                                {finding.severity}
                              </span>
                              <span className="font-semibold text-gray-800">{finding.title}</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{finding.description}</p>
                            {finding.fixAction && (
                              <p className="text-gray-700 text-sm bg-white/50 rounded-lg p-2">
                                <strong>Fix:</strong> {finding.fixAction}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fix Results */}
              {fixResults && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Auto-Fix Results</h3>
                  <div className={`p-4 rounded-xl ${fixResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {fixResults.success ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <span className={`font-semibold ${fixResults.success ? 'text-green-800' : 'text-red-800'}`}>
                        {fixResults.success ? 'Fixes Applied Successfully' : 'Some Fixes Failed'}
                      </span>
                    </div>
                    
                    {fixResults.fixesApplied.length > 0 && (
                      <div className="mb-3">
                        <p className="font-semibold text-green-700 mb-2">Applied Fixes:</p>
                        <ul className="space-y-1">
                          {fixResults.fixesApplied.map((fix, index) => (
                            <li key={index} className="text-green-600 text-sm flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {fix}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {fixResults.errors.length > 0 && (
                      <div>
                        <p className="font-semibold text-red-700 mb-2">Errors:</p>
                        <ul className="space-y-1">
                          {fixResults.errors.map((error, index) => (
                            <li key={index} className="text-red-600 text-sm flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Best Practices */}
              {showBestPractices && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Security Best Practices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SECURITY_BEST_PRACTICES.map((practice, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-blue-700 text-sm">{practice}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load security analysis</p>
              <button
                onClick={performSecurityAnalysis}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          )}
        </div>

        {/* Password Prompt Modal */}
        {passwordPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Enter Password</h3>
              <p className="text-gray-600 mb-4">Enter your wallet password to apply security fixes:</p>
              <input
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Wallet password"
                onKeyPress={(e) => e.key === 'Enter' && handleAutoFix()}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAutoFix}
                  disabled={!enteredPassword.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Fixes
                </button>
                <button
                  onClick={() => {
                    setPasswordPrompt(false);
                    setEnteredPassword('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;