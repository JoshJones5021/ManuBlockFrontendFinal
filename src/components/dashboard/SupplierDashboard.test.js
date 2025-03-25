import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SupplierDashboard from './SupplierDashboard';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      username: 'supplier',
      role: 'SUPPLIER',
      email: 'supplier@example.com',
      walletAddress: '0x123456789abcdef'
    }
  })
}));

// Mock all the API services used in SupplierDashboard with correct response structure
jest.mock('../../services/api', () => ({
  adminService: {
    getAllUsers: jest.fn().mockResolvedValue({
      data: [
        { id: 1, username: 'admin', role: 'ADMIN', walletAddress: '0x123' }
      ]
    })
  },
  supplierService: {
    getMaterials: jest.fn().mockResolvedValue({
      data: []
    }),
    getPendingRequests: jest.fn().mockResolvedValue({
      data: []
    }),
    getRequestsByStatus: jest.fn().mockResolvedValue({
      data: []
    })
  },
  blockchainService: {
    getAllBlockchainTransactions: jest.fn().mockResolvedValue({
      data: []
    })
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

describe('SupplierDashboard Component', () => {
  test('renders the supplier dashboard title', async () => {
    renderWithRouter(<SupplierDashboard />);
    
    // Check for the dashboard title
    const dashboardTitle = await waitFor(() => screen.getByText('Supplier Dashboard'));
    expect(dashboardTitle).toBeInTheDocument();
  });

  test('renders the materials overview section', async () => {
    renderWithRouter(<SupplierDashboard />);
    
    // Look for the specific heading element
    const materialsHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Materials Overview' })
    );
    expect(materialsHeading).toBeInTheDocument();
  });

  test('renders the pending material requests section', async () => {
    renderWithRouter(<SupplierDashboard />);
    
    // Look for the specific heading element
    const requestsHeading = await waitFor(() => 
      screen.getByRole('heading', { name: 'Pending Material Requests' })
    );
    expect(requestsHeading).toBeInTheDocument();
  });

  test('renders quick actions section with navigation links', async () => {
    renderWithRouter(<SupplierDashboard />);
    
    // Wait for the quick actions heading to appear
    await waitFor(() => 
      screen.getByRole('heading', { name: 'Quick Actions' })
    );
    
    // Find links by their parent elements for more specificity
    const quickActionsSection = screen.getByRole('heading', { name: 'Quick Actions' }).closest('div').parentElement;
    
    // Now search within that section
    const manageInventoryLink = quickActionsSection.querySelector('a[href="/supplier/materials"]');
    const approveRequestsLink = quickActionsSection.querySelector('a[href="/supplier/requests"]');
    const allocateMaterialsLink = quickActionsSection.querySelector('a[href="/supplier/allocations"]');
    
    expect(manageInventoryLink).toBeInTheDocument();
    expect(approveRequestsLink).toBeInTheDocument();
    expect(allocateMaterialsLink).toBeInTheDocument();
  });

  test('renders supplier workflow guide', async () => {
    renderWithRouter(<SupplierDashboard />);
    
    // Wait for the specific heading to appear
    const workflowHeading = await waitFor(() => 
      screen.getByText('Supplier Workflow Guide')
    );
    expect(workflowHeading).toBeInTheDocument();
    
    // Check for workflow steps by role
    const materialManagement = screen.getByRole('heading', { name: 'Material Management' });
    const requestHandling = screen.getByRole('heading', { name: 'Request Handling' });
    const deliveryTracking = screen.getByRole('heading', { name: 'Delivery Tracking' });
    
    expect(materialManagement).toBeInTheDocument();
    expect(requestHandling).toBeInTheDocument();
    expect(deliveryTracking).toBeInTheDocument();
  });
});