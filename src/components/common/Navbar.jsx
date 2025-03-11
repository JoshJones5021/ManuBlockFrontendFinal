import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleWalletConnect = async () => {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } else {
        alert('MetaMask is not installed. Please install it to connect your wallet.');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask', error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleWalletModal = () => {
    setShowWalletModal(!showWalletModal);
    if (!showWalletModal) {
      setWalletAddress('');
    }
  };

  // Get role display name with proper capitalization
  const getRoleDisplay = (role) => {
    if (!role) return '';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/dashboard" className="font-bold text-xl">ManuBlock</Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Dashboard
                </Link>
                <Link to="/supply-chains" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Supply Chains
                </Link>
                {currentUser?.role === 'ADMIN' && (
                  <Link to="/users" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                    User Management
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* User Menu */}
          {currentUser && (
            <div className="relative">
              <div className="flex items-center">
                {/* Wallet Status */}
                <button 
                  className="mr-4 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  onClick={toggleWalletModal}
                >
                  {currentUser.walletAddress ? (
                    <span>
                      Wallet Connected: {`${currentUser.walletAddress.substring(0, 6)}...${currentUser.walletAddress.substring(38)}`}
                    </span>
                  ) : (
                    <span>Connect Wallet</span>
                  )}
                </button>

                <button onClick={toggleDropdown} className="flex items-center">
                  <span className="mr-2">{currentUser.username}</span>
                  <div className="bg-gray-300 text-gray-800 rounded-full p-1 text-xs font-semibold">
                    {getRoleDisplay(currentUser.role)}
                  </div>
                </button>
              </div>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Wallet Connect Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Connect Blockchain Wallet</h3>
            
            {currentUser.walletAddress ? (
              <div>
                <p className="mb-4">Current wallet address:</p>
                <p className="p-2 bg-gray-100 rounded break-all font-mono text-sm">{currentUser.walletAddress}</p>
                <div className="flex justify-between mt-6">
                  <button 
                    onClick={() => setShowWalletModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleWalletConnect}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Reconnect
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4">Connect your wallet to interact with blockchain functions:</p>
                <div className="mt-4">
                  <button 
                    onClick={handleWalletConnect}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2"
                  >
                    Connect with MetaMask
                  </button>
                  <button 
                    onClick={() => setShowWalletModal(false)}
                    className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;