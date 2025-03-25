// Mock external dependencies before imports
jest.mock('axios', () => ({
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    })),
    defaults: {
      headers: {
        common: {}
      }
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }));
  
  import React from 'react';
  import { render, screen, fireEvent } from '@testing-library/react';
  import Navbar from './Navbar';
  
  // Mock the modules
  jest.mock('react-router-dom', () => ({
    Link: ({ children, to, onClick }) => (
      <a href={to} onClick={onClick} data-testid={`link-${to}`}>{children}</a>
    ),
    useNavigate: () => jest.fn(),
    // Add other router components/hooks as needed
  }));
  
  // Mock the auth service
  jest.mock('../../services/auth', () => ({
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    connectWallet: jest.fn()
  }));
  
  // Mock the auth context
  jest.mock('../../context/AuthContext', () => {
    return {
      useAuth: jest.fn()
    };
  });
  
  // Mock the WalletConnector component
  jest.mock('./WalletConnector', () => () => <div data-testid="wallet-connector">Wallet Connector</div>);
  
  describe('Navbar Component', () => {
    const mockLogout = jest.fn();
    
    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
      
      // Default auth context mock
      const { useAuth } = require('../../context/AuthContext');
      useAuth.mockReturnValue({
        currentUser: {
          id: 1,
          username: 'testuser',
          role: 'ADMIN',
          email: 'test@example.com'
        },
        logout: mockLogout,
        walletStatus: 'disconnected'
      });
    });
  
    test('renders user information', () => {
      render(<Navbar />);
      
      // Use getAllByText instead of getByText since there are multiple elements
      const usernameElements = screen.getAllByText('testuser');
      expect(usernameElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  
  
    test('logout function is called when logout button is clicked', () => {
      // Mock showDropdown to be true so the dropdown with logout is visible
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [true, jest.fn()])  // showDropdown is true
        .mockImplementationOnce(() => [false, jest.fn()]); // isMobileMenuOpen
      
      render(<Navbar />);
      
      // Find and click the logout button
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      // Check if the logout function was called
      expect(mockLogout).toHaveBeenCalled();
      
      // Restore the original implementation
      React.useState.mockRestore();
    });

  
    test('renders BlockchainIndicator for non-admin users', () => {
      // Mock auth context for a non-admin user
      const { useAuth } = require('../../context/AuthContext');
      useAuth.mockReturnValue({
        currentUser: {
          id: 2,
          username: 'regularuser',
          role: 'USER',
          email: 'user@example.com',
          walletAddress: '0x123456789'
        },
        logout: mockLogout,
        walletStatus: 'connected'
      });
      
      render(<Navbar />);
      
      // Check for the blockchain indicator text
      expect(screen.getByText(/using admin wallet for blockchain/i)).toBeInTheDocument();
    });
  });