// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WalletConnector from './WalletConnector';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Get role display name with proper capitalization
  const getRoleDisplay = (role) => {
    if (!role) return '';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  // Show wallet indicator badge for non-admin users
  const BlockchainIndicator = () => {
    // Only show for non-admin users
    if (currentUser.role === 'ADMIN' || !currentUser) return null;

    return (
      <div className="mr-4 bg-blue-50 text-blue-700 text-xs font-semibold py-1 px-2 rounded-md border border-blue-200">
        Using Admin Wallet for Blockchain
      </div>
    );
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
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed. */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Icon when menu is open. */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* User Menu */}
          {currentUser && (
            <div className="hidden md:flex items-center">
              {/* BlockchainIndicator for non-admins */}
              <BlockchainIndicator />

              {/* Wallet Connector - only shown for admins now */}
              <WalletConnector />

              <div className="relative">
                <button onClick={toggleDropdown} className="flex items-center">
                  <span className="mr-2">{currentUser.username}</span>
                  <div className="bg-gray-300 text-gray-800 rounded-full p-1 text-xs font-semibold">
                    {getRoleDisplay(currentUser.role)}
                  </div>
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
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
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link 
            to="/dashboard" 
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            to="/supply-chains" 
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Supply Chains
          </Link>
          {currentUser?.role === 'ADMIN' && (
            <Link 
              to="/users" 
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              User Management
            </Link>
          )}
        </div>
        
        {/* Mobile user menu */}
        {currentUser && (
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium text-white">{currentUser.username}</div>
                <div className="text-sm font-medium text-gray-400">{currentUser.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              {/* Show WalletConnector only for admin in mobile menu */}
              {currentUser.role === 'ADMIN' && (
                <div className="mb-2">
                  <WalletConnector />
                </div>
              )}
              <Link 
                to="/profile" 
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;