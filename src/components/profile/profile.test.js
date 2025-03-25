import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Profile from './Profile';

// Fully mock useAuth and API
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  adminService: {
    getAllUsers: jest.fn(),
  },
}));

describe('Profile Component', () => {
  const mockCurrentUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'SUPPLIER',
    walletAddress: '',
  };

  const mockConnectWallet = jest.fn();
  const mockLogout = jest.fn();

  const mockAdminUsers = [
    {
      id: '2',
      username: 'adminuser',
      email: 'admin@example.com',
      role: 'ADMIN',
      walletAddress: '0xAdminWalletAddress',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { useAuth } = require('../../context/AuthContext');
    const { adminService } = require('../../services/api');

    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
      connectWallet: mockConnectWallet,
      logout: mockLogout,
    });

    adminService.getAllUsers.mockResolvedValue({ data: mockAdminUsers });

    global.window.ethereum = {
      request: jest.fn().mockResolvedValue(['0xMockedWalletAddress']),
    };
  });

  afterEach(() => {
    delete global.window.ethereum;
  });

  test('renders profile info', async () => {
    render(<Profile />);
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
  });

  test('toggles edit mode', () => {
    render(<Profile />);
    const usernameInput = screen.getByLabelText('Username');
    expect(usernameInput).toBeDisabled();

    fireEvent.click(screen.getByText('Edit Profile'));
    expect(usernameInput).not.toBeDisabled();

    fireEvent.click(screen.getByText('Cancel'));
    expect(usernameInput).toBeDisabled();
  });

  test('fetches admin wallet for non-admin user', async () => {
    render(<Profile />);
    const { adminService } = require('../../services/api');
    expect(adminService.getAllUsers).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Admin wallet connected')).toBeInTheDocument();
    });
  });

  test('admin with no wallet shows correct message', () => {
    const { useAuth } = require('../../context/AuthContext');
    useAuth.mockReturnValue({
      currentUser: { ...mockCurrentUser, role: 'ADMIN', walletAddress: '' },
      connectWallet: mockConnectWallet,
      logout: mockLogout,
    });

    render(<Profile />);
    expect(screen.getByText('No wallet connected')).toBeInTheDocument();
  });

  test('admin with wallet displays wallet address', () => {
    const { useAuth } = require('../../context/AuthContext');
    useAuth.mockReturnValue({
      currentUser: { ...mockCurrentUser, role: 'ADMIN', walletAddress: '0xAdminWallet' },
      connectWallet: mockConnectWallet,
      logout: mockLogout,
    });

    render(<Profile />);
    expect(screen.getByText(/Connected: 0xAdminWallet/)).toBeInTheDocument();
  });

  test('manual wallet connect works for admin', async () => {
    const { useAuth } = require('../../context/AuthContext');
    useAuth.mockReturnValue({
      currentUser: { ...mockCurrentUser, role: 'ADMIN' },
      connectWallet: mockConnectWallet,
      logout: mockLogout,
    });

    render(<Profile />);
    const walletInput = screen.getByPlaceholderText('Enter wallet address manually or connect MetaMask');
    fireEvent.change(walletInput, { target: { value: '0xManualWallet' } });

    fireEvent.click(screen.getByText('Connect Manually'));

    expect(mockConnectWallet).toHaveBeenCalledWith('0xManualWallet');
    await waitFor(() => {
      expect(screen.getByText('Wallet connected successfully!')).toBeInTheDocument();
    });
  });

  test('MetaMask connection works for admin', async () => {
    const { useAuth } = require('../../context/AuthContext');
    useAuth.mockReturnValue({
      currentUser: { ...mockCurrentUser, role: 'ADMIN' },
      connectWallet: mockConnectWallet,
      logout: mockLogout,
    });

    render(<Profile />);
    fireEvent.click(screen.getByText('Connect with MetaMask'));

    await waitFor(() => {
      expect(window.ethereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
      expect(mockConnectWallet).toHaveBeenCalledWith('0xMockedWalletAddress');
      expect(screen.getByText('Wallet connected successfully!')).toBeInTheDocument();
    });
  });

  test('handles MetaMask not installed', async () => {
    delete global.window.ethereum;
    const { useAuth } = require('../../context/AuthContext');
    useAuth.mockReturnValue({
      currentUser: { ...mockCurrentUser, role: 'ADMIN' },
      connectWallet: mockConnectWallet,
      logout: mockLogout,
    });

    render(<Profile />);
    fireEvent.click(screen.getByText('Connect with MetaMask'));

    await waitFor(() => {
      expect(screen.getByText('MetaMask is not installed. Please install it to connect your wallet.')).toBeInTheDocument();
    });
  });

  test('logout triggers confirm and logout', () => {
    window.confirm = jest.fn(() => true);
    render(<Profile />);

    fireEvent.click(screen.getByText('Log Out'));
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to log out?');
    expect(mockLogout).toHaveBeenCalled();
  });
});
