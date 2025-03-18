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

  const getRoleDisplay = (role) => {
    if (!role) return '';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  const BlockchainIndicator = () => {
    if (currentUser.role === 'ADMIN' || !currentUser) return null;

    return (
      <div className="mr-4 bg-blue-50 text-blue-700 text-xs font-semibold py-1 px-2 rounded-md border border-blue-200">
        Using Admin Wallet for Blockchain
      </div>
    );
  };

  return (
    <nav className="bg-gray-800 text-white">
      {/* ✅ Flexbox now pushes content to the right */}
      <div className="flex items-center justify-end h-16 px-4">
        {/* User Menu and Wallet Connector */}
        {currentUser && (
          <div className="hidden md:flex items-center">
            <BlockchainIndicator />
            <WalletConnector />

            <div className="relative ml-3">
              <button onClick={toggleDropdown} className="flex items-center">
                <span className="mr-2">{currentUser.username}</span>
                <div className="bg-gray-300 text-gray-800 rounded-full p-1 text-xs font-semibold">
                  {getRoleDisplay(currentUser.role)}
                </div>
              </button>

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

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span className="sr-only">Open main menu</span>
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
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        {currentUser && (
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium text-white">{currentUser.username}</div>
                <div className="text-sm font-medium text-gray-400">{currentUser.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
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
