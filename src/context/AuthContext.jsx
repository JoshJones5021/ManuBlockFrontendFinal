// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletStatus, setWalletStatus] = useState('disconnected');

  useEffect(() => {
    // Check if user is already logged in (token exists in local storage)
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = JSON.parse(localStorage.getItem('user'));
          setCurrentUser(userData);
          if (userData.walletAddress) {
            setWalletStatus('connected');
          }
        }
      } catch (err) {
        console.error('Failed to restore authentication state:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      const { token, walletAddress } = response.data;
      
      // Decode JWT to get user info
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      
      const userData = JSON.parse(jsonPayload);
      userData.walletAddress = walletAddress;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentUser(userData);
      
      if (walletAddress) {
        setWalletStatus('connected');
      }
      
      return userData;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      await authService.register(userData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
      throw err;
    }
  };

  const logout = () => {
    authService.logout().catch(err => console.error('Error logging out:', err));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setWalletStatus('disconnected');
  };

  const connectWallet = async (walletAddress) => {
    try {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      setWalletStatus('connecting');
      await authService.connectWallet(currentUser.id, walletAddress);
      
      // Update local user data
      const updatedUser = { ...currentUser, walletAddress };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setWalletStatus('connected');
      return updatedUser;
    } catch (err) {
      setWalletStatus('error');
      setError(err.response?.data?.error || 'Failed to connect wallet');
      throw err;
    }
  };

  // Function to detect and connect to MetaMask
  const connectToMetaMask = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it to connect your wallet.');
      throw new Error('MetaMask not installed');
    }
    
    try {
      setWalletStatus('connecting');
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      
      // Connect wallet through the API
      return await connectWallet(walletAddress);
    } catch (err) {
      setWalletStatus('error');
      setError(err.message || 'Failed to connect to MetaMask');
      throw err;
    }
  };

  // Listen for account changes in MetaMask
  useEffect(() => {
    if (window.ethereum && currentUser?.walletAddress) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          // User has disconnected their wallet
          console.log('MetaMask: wallet disconnected');
          
          // Update user record to remove wallet
          try {
            await connectWallet('');
            setWalletStatus('disconnected');
          } catch (err) {
            console.error('Failed to update wallet status:', err);
          }
        } else if (accounts[0] !== currentUser.walletAddress) {
          // User has switched accounts, update the wallet
          console.log('MetaMask: wallet account changed');
          try {
            await connectWallet(accounts[0]);
          } catch (err) {
            console.error('Failed to update wallet address:', err);
          }
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Cleanup
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [currentUser?.walletAddress]);

  const value = {
    currentUser,
    loading,
    error,
    walletStatus,
    login,
    register,
    logout,
    connectWallet,
    connectToMetaMask
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};