// src/components/dashboard/ManufacturerDashboard.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManufacturerDashboard from './ManufacturerDashboard';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      username: 'manufacturer',
      role: 'MANUFACTURER',
      email: 'manufacturer@example.com',
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
  supplierService: {
    // Add this missing mock
    getAllSuppliers: jest.fn().mockResolvedValue({
      data: [
        { id: 2, username: 'supplier1', role: 'SUPPLIER' },
        { id: 3, username: 'supplier2', role: 'SUPPLIER' }
      ]
    }),
    getMaterials: jest.fn().mockResolvedValue({
      data: []
    })
  },
  manufacturerService: {
    getProducts: jest.fn().mockResolvedValue({
      data: []
    }),
    getOrders: jest.fn().mockResolvedValue({
      data: []
    }),
    getMaterialRequests: jest.fn().mockResolvedValue({
      data: []
    }),
    getProductionBatches: jest.fn().mockResolvedValue({
      data: []
    }),
    getAvailableMaterials: jest.fn().mockResolvedValue({
      data: []
    })
  },
  blockchainService: {
    getAllBlockchainTransactions: jest.fn().mockResolvedValue({
      data: []
    }),
    getItemsByOwner: jest.fn().mockResolvedValue({
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

describe('ManufacturerDashboard Component', () => {
  test('renders the manufacturer dashboard title', async () => {
    renderWithRouter(<ManufacturerDashboard />);
    
    // Check for the dashboard title
    const dashboardTitle = await waitFor(() => 
      screen.getByText('Manufacturer Dashboard')
    );
    expect(dashboardTitle).toBeInTheDocument();
  });

  test('renders production batches section', async () => {
    renderWithRouter(<ManufacturerDashboard />);
    
    // Look for the specific heading element
    const batchesHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Production Batches' })
    );
    expect(batchesHeading).toBeInTheDocument();
    
    // Check for empty state message
    const emptyMessage = screen.getByText("You don't have any production batches yet.");
    expect(emptyMessage).toBeInTheDocument();
  });

  test('renders recent orders section', async () => {
    renderWithRouter(<ManufacturerDashboard />);
    
    // Look for the specific heading element
    const ordersHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Recent Orders' })
    );
    expect(ordersHeading).toBeInTheDocument();
  });

  test('renders material requests section', async () => {
    renderWithRouter(<ManufacturerDashboard />);
    
    // Look for the specific heading element
    const requestsHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Material Requests' })
    );
    expect(requestsHeading).toBeInTheDocument();
  });

  test('renders links to create new batches and request materials', async () => {
    renderWithRouter(<ManufacturerDashboard />);
    
    // Wait for links to appear
    await waitFor(() => {
      // Check for Create New Batch link
      expect(screen.getByText('Create New Batch')).toBeInTheDocument();
      
      // Check for Request Materials link
      expect(screen.getByText('Request Materials')).toBeInTheDocument();
    });
  });

  test('displays correct metrics in the dashboard headers', async () => {
    renderWithRouter(<ManufacturerDashboard />);
    
    // Check for metric headings
    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('Active Batches')).toBeInTheDocument();
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();
    });
    
    // Check the values (they should be 0 in our test case)
    const metricValues = screen.getAllByText('0');
    expect(metricValues.length).toBeGreaterThanOrEqual(3);
  });
});