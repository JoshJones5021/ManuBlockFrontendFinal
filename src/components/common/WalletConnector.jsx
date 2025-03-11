// src/components/common/WalletConnector.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const WalletConnector = () => {
  const { currentUser, walletStatus, connectToMetaMask, connectWallet } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnectMetaMask = async () => {
    setError('');
    setIsConnecting(true);
    try {
      await connectToMetaMask();
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualConnect = async () => {
    if (!manualAddress || !manualAddress.startsWith('0x') || manualAddress.length !== 42) {
      setError('Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)');
      return;
    }

    setError('');
    setIsConnecting(true);
    try {
      await connectWallet(manualAddress);
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError('');
    setIsConnecting(true);
    try {
      await connectWallet('');
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to disconnect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    setError('');
  };

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  // Get button color based on wallet status
  const getButtonColor = () => {
    switch (walletStatus) {
      case 'connected':
        return 'bg-green-600 hover:bg-green-700';
      case 'connecting':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <>
      <button 
        className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${getButtonColor()}`}
        onClick={toggleModal}
      >
        {currentUser?.walletAddress ? (
          <span>
            {walletStatus === 'connecting' ? 'Connecting...' : 'Wallet: ' + formatAddress(currentUser.walletAddress)}
          </span>
        ) : (
          <span>{walletStatus === 'connecting' ? 'Connecting...' : 'Connect Wallet'}</span>
        )}
      </button>

      {/* Wallet Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Connect Blockchain Wallet</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {currentUser?.walletAddress ? (
              <div>
                <p className="mb-4">Current wallet address:</p>
                <p className="p-2 bg-gray-100 rounded break-all font-mono text-sm">{currentUser.walletAddress}</p>
                <div className="flex justify-between mt-6">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={isConnecting}
                  >
                    Close
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDisconnect}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      disabled={isConnecting}
                    >
                      Disconnect
                    </button>
                    <button 
                      onClick={handleConnectMetaMask}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      disabled={isConnecting}
                    >
                      Switch Account
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4">Connect your wallet to interact with blockchain functions:</p>
                
                <div className="mb-4">
                  <button 
                    onClick={handleConnectMetaMask}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
                  </button>
                  
                  <div className="relative my-4 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-600">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Enter Wallet Address Manually
                    </label>
                    <input
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="0x..."
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      disabled={isConnecting}
                    />
                  </div>
                  
                  <button 
                    onClick={handleManualConnect}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-4"
                    disabled={isConnecting || !manualAddress}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Manually'}
                  </button>
                  
                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={isConnecting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnector;