import React from 'react';
import { Shield, Wallet, Download, Loader } from 'lucide-react';

const WalletConnect = ({ onConnect, loading }) => {
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum;

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-accent-primary rounded-full">
              <Shield className="h-12 w-12 text-text-cta" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            ReturnShield+
          </h1>
          <p className="text-text-secondary">
            Blockchain-Based Return & Coupon Fraud Prevention
          </p>
        </div>

        {/* Main Card */}
        <div className="card">
          <div className="text-center mb-6">
            <Wallet className="h-12 w-12 text-accent-secondary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-text-secondary">
              Connect your MetaMask wallet to access ReturnShield+ features
            </p>
          </div>

          {!isMetaMaskInstalled ? (
            <div className="space-y-4">
              <div className="bg-background-input border border-border-input-idle rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5 text-status-warning" />
                  <div>
                    <h3 className="font-medium text-text-primary">MetaMask Required</h3>
                    <p className="text-sm text-text-secondary">
                      Please install MetaMask to use ReturnShield+
                    </p>
                  </div>
                </div>
              </div>
              
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Install MetaMask</span>
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-background-input border border-border-input-idle rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-status-success rounded-full"></div>
                  <div>
                    <h3 className="font-medium text-text-primary">MetaMask Detected</h3>
                    <p className="text-sm text-text-secondary">
                      Your wallet is ready to connect
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={onConnect}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-3">Key Features</h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 bg-accent-primary rounded-full"></div>
                <span>Digital purchase receipts as blockchain tokens</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 bg-accent-primary rounded-full"></div>
                <span>One-time-use coupon tokens</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 bg-accent-primary rounded-full"></div>
                <span>Secure Web3 wallet authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 bg-accent-primary rounded-full"></div>
                <span>Immutable audit logs for all transactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect; 