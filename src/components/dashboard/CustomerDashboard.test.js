// src/components/dashboard/CustomerDashboard.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerDashboard from './CustomerDashboard';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      username: 'customer',
      role: 'CUSTOMER',
      email: 'customer@example.com',
      walletAddress: '0x123456789abcdef'
    }
  })
}));

// Mock all the API services
jest.mock('../../services/api', () => ({
  adminService: {
    getAllUsers: jest.fn().mockResolvedValue({
      data: [
        { id: 1, username: 'admin', role: 'ADMIN', walletAddress: '0x123' }
      ]
    })
  },
  customerService: {
    getOrders: jest.fn().mockResolvedValue({
      data: []
    }),
    getAvailableProducts: jest.fn().mockResolvedValue({
      data: []
    }),
    getChurnedProducts: jest.fn().mockResolvedValue({
      data: []
    }),
    getRecyclingTransports: jest.fn().mockResolvedValue({
      data: []
    })
  },
  blockchainService: {
    getAllBlockchainTransactions: jest.fn().mockResolvedValue({
      data: []
    })
  },
  supplyChainService: {
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

describe('CustomerDashboard Component', () => {
  test('renders the customer dashboard title', async () => {
    renderWithRouter(<CustomerDashboard />);
    
    // Check for the dashboard title
    const dashboardTitle = await screen.findByText('Customer Dashboard');
    expect(dashboardTitle).toBeInTheDocument();
  });

  test('renders welcome message with customer name', async () => {
    renderWithRouter(<CustomerDashboard />);
    
    // Check for welcome message - matches actual rendered content
    const welcomeMessage = await screen.findByText(/Welcome back, customer!/);
    expect(welcomeMessage).toBeInTheDocument();
  });

  test('renders order stats in dashboard', async () => {
    renderWithRouter(<CustomerDashboard />);
    
    // Check for order stats
    await waitFor(() => {
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Completed Orders')).toBeInTheDocument();
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();
    });
    
    // Check for stats values - they should be 0
    const statValues = screen.getAllByText('0');
    expect(statValues.length).toBe(3);
  });

  test('renders Recent Orders section', async () => {
    renderWithRouter(<CustomerDashboard />);
    
    // Look for Recent Orders heading
    const ordersHeading = await screen.findByRole('heading', { name: 'Recent Orders' });
    expect(ordersHeading).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText(/No orders found/i)).toBeInTheDocument();
    
    // Check for View All Orders link
    const ordersLink = screen.getByText('View All Orders');
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute('href', '/customer/orders');
  });

  test('renders Featured Products section', async () => {
    renderWithRouter(<CustomerDashboard />);
    
    // Look for Featured Products heading
    const productsHeading = await screen.findByRole('heading', { name: 'Featured Products' });
    expect(productsHeading).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText(/No products available/i)).toBeInTheDocument();
    
    // Check for View All Products link
    const productsLink = screen.getByText('View All Products');
    expect(productsLink).toBeInTheDocument();
    expect(productsLink).toHaveAttribute('href', '/customer/products');
  });

  test('renders Recycling section with action button', async () => {
    renderWithRouter(<CustomerDashboard />);
    
    // Look for Recycling heading
    const recyclingHeading = await screen.findByRole('heading', { name: 'Recycling' });
    expect(recyclingHeading).toBeInTheDocument();
    
    // Check for recycling description
    expect(screen.getByText(/Return and recycle your used products/i)).toBeInTheDocument();
    
    // Check for Start Recycling button
    const recyclingButton = screen.getByText('Start Recycling');
    expect(recyclingButton).toBeInTheDocument();
    expect(recyclingButton).toHaveAttribute('href', '/customer/recycling');
  });
});