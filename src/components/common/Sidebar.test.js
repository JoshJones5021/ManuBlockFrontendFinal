// src/components/common/Sidebar.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      username: 'testuser',
      role: 'ADMIN',
      email: 'test@example.com',
      walletAddress: '0x123456789abcdef'
    }
  })
}));

// Mock the admin service
jest.mock('../../services/api', () => ({
  adminService: {
    getAllUsers: jest.fn().mockResolvedValue({
      data: [
        { id: 1, username: 'admin', role: 'ADMIN', walletAddress: '0x123' }
      ]
    })
  }
}));

describe('Sidebar Component', () => {
  test('renders username and role', async () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // Check for username
    expect(screen.getByText('testuser')).toBeInTheDocument();
    
    // Check for formatted role
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
  
  test('renders admin menu items', async () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // Check for common menu items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Tracing')).toBeInTheDocument();
    
    // Check for admin-specific menu items
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Supply Chains')).toBeInTheDocument();
  });
  
  test('shows blockchain status indicator', async () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // Check for blockchain status section
    expect(screen.getByText('Blockchain Status')).toBeInTheDocument();
    
    // Since the mock user has a wallet address, it should show as enabled
    expect(screen.getByText(/Enabled/i)).toBeInTheDocument();
  });
});