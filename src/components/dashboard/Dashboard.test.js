import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      username: 'testuser',
      role: 'ADMIN',
      email: 'test@example.com'
    }
  })
}));

// Mock API services
jest.mock('../../services/api', () => ({
  adminService: {
    getAllUsers: jest.fn().mockResolvedValue({
      data: [{ id: 1, username: 'testuser', role: 'ADMIN' }]
    })
  },
  supplierService: {
    getMaterials: jest.fn().mockResolvedValue({ data: [] }),
    getPendingRequests: jest.fn().mockResolvedValue({ data: [] })
  },
  manufacturerService: {
    getProducts: jest.fn().mockResolvedValue({ data: [] }),
    getOrders: jest.fn().mockResolvedValue({ data: [] })
  },
  distributorService: {
    getTransports: jest.fn().mockResolvedValue({ data: [] })
  },
  customerService: {
    getOrders: jest.fn().mockResolvedValue({ data: [] })
  },
  blockchainService: {
    getAllBlockchainTransactions: jest.fn().mockResolvedValue({ data: [] })
  },
  supplyChainService: {
    getSupplyChainsByUser: jest.fn().mockResolvedValue([])
  }
}));

// Helper to render with router
const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  test('initially shows loading spinner', () => {
    renderWithRouter(<Dashboard />);
    
    // Check for loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('renders dashboard content after loading', async () => {
    renderWithRouter(<Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Test for any dashboard content that should be rendered
    // These will vary based on your actual component implementation
    const dashboardContent = 
      screen.queryByText(/Dashboard/i) || 
      screen.queryByText(/Welcome/i) ||
      screen.queryByText(/Overview/i);
    
    expect(dashboardContent).toBeInTheDocument();
  });
});