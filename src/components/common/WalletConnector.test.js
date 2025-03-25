// src/components/common/WalletConnector.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WalletConnector from './WalletConnector';

// Mock the window.ethereum object
window.ethereum = {
  request: jest.fn().mockResolvedValue(['0xmockedaddress123']),
  on: jest.fn(),
  removeListener: jest.fn()
};

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      username: 'admin',
      role: 'ADMIN',
      walletAddress: null
    },
    walletStatus: 'disconnected',
    connectToMetaMask: jest.fn().mockResolvedValue({}),
    connectWallet: jest.fn().mockResolvedValue({})
  })
}));

describe('WalletConnector Component', () => {
  test('renders connect wallet button for admin users', () => {
    render(<WalletConnector />);
    
    // Should show the Connect Wallet button
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });
  
  test('opens wallet modal when button is clicked', () => {
    render(<WalletConnector />);
    
    // Click the Connect Wallet button
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Modal should be visible
    expect(screen.getByText('Connect Blockchain Wallet')).toBeInTheDocument();
    expect(screen.getByText('Connect with MetaMask')).toBeInTheDocument();
  });
});