// src/components/dashboard/DistributorDashboard.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DistributorDashboard from './DistributorDashboard';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      username: 'distributor',
      role: 'DISTRIBUTOR',
      email: 'distributor@example.com',
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
  distributorService: {
    getTransports: jest.fn().mockResolvedValue({
      data: []
    }),
    getReadyMaterialRequests: jest.fn().mockResolvedValue({
      data: []
    }),
    getReadyOrders: jest.fn().mockResolvedValue({
      data: []
    }),
    getAvailableChurnedItems: jest.fn().mockResolvedValue({
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

describe('DistributorDashboard Component', () => {
  test('renders the distributor dashboard title', async () => {
    renderWithRouter(<DistributorDashboard />);
    
    // Check for the dashboard title
    const dashboardTitle = await waitFor(() => 
      screen.getByText('Distributor Dashboard')
    );
    expect(dashboardTitle).toBeInTheDocument();
  });

  test('renders transport metrics in dashboard', async () => {
    renderWithRouter(<DistributorDashboard />);
    
    // Check for the transport metrics
    await waitFor(() => {
      expect(screen.getByText('Total Transports')).toBeInTheDocument();
      expect(screen.getByText('In Transit')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });
    
    // Check metrics values (should be 0)
    const metricValues = screen.getAllByText('0');
    expect(metricValues.length).toBeGreaterThanOrEqual(3);
  });

  test('renders Material Pickups section', async () => {
    renderWithRouter(<DistributorDashboard />);
    
    // Look for the Material Pickups heading
    const pickupsHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Material Pickups' })
    );
    expect(pickupsHeading).toBeInTheDocument();
    
    // Check for schedule button
    const scheduleButton = screen.getByText('Schedule Material Pickup');
    expect(scheduleButton).toBeInTheDocument();
    expect(scheduleButton.getAttribute('href')).toBe('/distributor/transports');
  });

  test('renders Product Deliveries section', async () => {
    renderWithRouter(<DistributorDashboard />);
    
    // Look for the Product Deliveries heading
    const deliveriesHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Product Deliveries' })
    );
    expect(deliveriesHeading).toBeInTheDocument();
    
    // Check for schedule button
    const scheduleButton = screen.getByText('Schedule Product Delivery');
    expect(scheduleButton).toBeInTheDocument();
    expect(scheduleButton.getAttribute('href')).toBe('/distributor/transports');
  });

  test('renders Recent Transports section', async () => {
    renderWithRouter(<DistributorDashboard />);
    
    // Look for Recent Transports heading
    const recentTransportsHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Recent Transports' })
    );
    expect(recentTransportsHeading).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText(/No transports found/i)).toBeInTheDocument();
    
    // Check for View All link
    const viewAllLink = screen.getByText('View All Transports');
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink.getAttribute('href')).toBe('/distributor/transports');
  });

  test('renders workflow guide with steps', async () => {
    renderWithRouter(<DistributorDashboard />);
    
    // Look for Workflow Guide heading
    const workflowHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Distributor Workflow Guide' })
    );
    expect(workflowHeading).toBeInTheDocument();
    
    // Check for workflow steps
    const scheduleStep = screen.getByRole('heading', { name: 'Schedule' });
    const transportStep = screen.getByRole('heading', { name: 'Transport' });
    const deliverStep = screen.getByRole('heading', { name: 'Deliver' });
    
    expect(scheduleStep).toBeInTheDocument();
    expect(transportStep).toBeInTheDocument();
    expect(deliverStep).toBeInTheDocument();
  });
});