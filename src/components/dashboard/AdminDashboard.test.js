// src/components/dashboard/AdminDashboard.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      username: 'admin',
      role: 'ADMIN',
      email: 'admin@example.com',
      walletAddress: '0x123456789abcdef'
    }
  })
}));

// Mock all the API services
jest.mock('../../services/api', () => ({
  adminService: {
    getAllUsers: jest.fn().mockResolvedValue({
      data: []
    })
  },
  blockchainService: {
    getAllBlockchainTransactions: jest.fn().mockResolvedValue({
      data: []
    })
  },
  supplyChainService: {
    getSupplyChains: jest.fn().mockResolvedValue({
      data: []
    }),
    getSupplyChainsByUser: jest.fn().mockResolvedValue([])
  }
}));

// Render with Router wrapper
const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('AdminDashboard Component', () => {
  test('renders the admin dashboard title', async () => {
    renderWithRouter(<AdminDashboard />);
    
    // Check for the dashboard title
    const dashboardTitle = await screen.findByText('Admin Dashboard');
    expect(dashboardTitle).toBeInTheDocument();
  });

  test('renders dashboard metrics section', async () => {
    renderWithRouter(<AdminDashboard />);
    
    // Check for key metrics
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Supply Chains')).toBeInTheDocument();
      expect(screen.getByText('Blockchain Status')).toBeInTheDocument();
    });
    
    // Check that the Connected status is displayed
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  test('renders users by role section', async () => {
    renderWithRouter(<AdminDashboard />);
    
    // Look for the users by role section
    const usersHeading = await screen.findByRole('heading', { name: 'Users by Role' });
    expect(usersHeading).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText('No user role data available')).toBeInTheDocument();
  });

  test('renders recent users section', async () => {
    renderWithRouter(<AdminDashboard />);
    
    // Look for recent users section heading
    const recentUsersHeading = await screen.findByRole('heading', { name: 'Recent Users' });
    expect(recentUsersHeading).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText('No user data available')).toBeInTheDocument();
  });

  test('renders recent supply chains section', async () => {
    renderWithRouter(<AdminDashboard />);
    
    // Look for recent supply chains section heading
    const supplyChainHeading = await screen.findByRole('heading', { name: 'Recent Supply Chains' });
    expect(supplyChainHeading).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText('No supply chain data available')).toBeInTheDocument();
  });
});