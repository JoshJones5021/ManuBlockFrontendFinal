import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaterialsList from '../../components/supplier/MaterialsList';
import { useAuth } from '../../context/AuthContext';
import { supplierService, supplyChainService, adminService } from '../../services/api';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API services
jest.mock('../../services/api', () => ({
  supplierService: {
    getMaterials: jest.fn(),
    deactivateMaterial: jest.fn(),
    updateMaterial: jest.fn(),
  },
  supplyChainService: {
    getSupplyChainsByUser: jest.fn(),
  },
  adminService: {
    getAllUsers: jest.fn(),
  },
}));

// Mock MaterialCreationForm component
jest.mock('../../components/supplier/MaterialCreationForm', () => {
  return jest.fn(props => (
    <div data-testid="material-creation-form">
      <button onClick={() => props.onSuccess({ id: '999', name: 'New Material' })}>
        Mock Create Material
      </button>
    </div>
  ));
});

describe('MaterialsList Component', () => {
  // Mock data for tests
  const mockCurrentUser = {
    id: '1',
    username: 'supplier1',
    role: 'SUPPLIER',
  };

  const mockMaterials = [
    {
      id: '101',
      name: 'Aluminum',
      description: 'High-quality aluminum sheets',
      quantity: 1000,
      unit: 'kg',
      active: true,
      blockchainItemId: '0x123456789abcdef',
    },
    {
      id: '102',
      name: 'Steel',
      description: 'Carbon steel sheets',
      quantity: 2000,
      unit: 'kg',
      active: true,
      blockchainItemId: null,
    },
    {
      id: '103',
      name: 'Copper',
      description: 'Copper wire',
      quantity: 500,
      unit: 'kg',
      active: false,
      blockchainItemId: null,
    },
  ];

  const mockSupplyChains = [
    { id: '1', name: 'Automotive Supply Chain' },
    { id: '2', name: 'Electronics Supply Chain' },
  ];

  const mockAdmins = [
    {
      id: '999',
      username: 'admin',
      role: 'ADMIN',
      walletAddress: '0xadminwallet',
    },
  ];

  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock useAuth hook
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
    });

    // Mock API responses
    supplierService.getMaterials.mockResolvedValue({
      data: mockMaterials,
    });

    supplyChainService.getSupplyChainsByUser.mockResolvedValue(mockSupplyChains);

    adminService.getAllUsers.mockResolvedValue({
      data: mockAdmins,
    });

    supplierService.updateMaterial.mockImplementation((id, data) => {
      return Promise.resolve({
        data: {
          ...mockMaterials.find(m => m.id === id),
          ...data,
        },
      });
    });

    supplierService.deactivateMaterial.mockImplementation((id) => {
      return Promise.resolve({
        data: {
          ...mockMaterials.find(m => m.id === id),
          active: false,
        },
      });
    });

    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);
  });

  test('renders materials list', async () => {
    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Check if materials are displayed
    expect(screen.getByText('Aluminum')).toBeInTheDocument();
    expect(screen.getByText('Steel')).toBeInTheDocument();
    expect(screen.getByText('Copper')).toBeInTheDocument();

    // Check quantities
    expect(screen.getByText('1000 kg')).toBeInTheDocument();
    expect(screen.getByText('2000 kg')).toBeInTheDocument();
    expect(screen.getByText('500 kg')).toBeInTheDocument();

    // Check statuses
    expect(screen.getAllByText('Active').length).toBe(2);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('shows blockchain status information', async () => {
    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Check blockchain status information
    expect(screen.getByText('Blockchain Tracking Status')).toBeInTheDocument();
    expect(screen.getByText(/Materials will be tracked on the blockchain/)).toBeInTheDocument();

    // Check blockchain status for materials
    expect(screen.getByText('Tracked (Admin Wallet)')).toBeInTheDocument();
    expect(screen.getAllByText(/Pending/).length).toBeGreaterThan(0);
  });

  test('opens edit modal when Edit is clicked', async () => {
    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Click Edit button for first material
    fireEvent.click(screen.getAllByText('Edit')[0]);

    // Edit modal should be visible
    expect(screen.getByText('Edit Material')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Aluminum')).toBeInTheDocument();
  });

  test('updates material when edit form is submitted', async () => {
    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Click Edit button for first material
    fireEvent.click(screen.getAllByText('Edit')[0]);

    // Change material name
    fireEvent.change(screen.getByDisplayValue('Aluminum'), {
      target: { value: 'Modified Aluminum' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));

    // API should be called with updated data
    await waitFor(() => {
      expect(supplierService.updateMaterial).toHaveBeenCalledWith(
        '101',
        expect.objectContaining({
          name: 'Modified Aluminum',
        })
      );
    });

    // Modal should be closed
    expect(screen.queryByText('Edit Material')).not.toBeInTheDocument();
  });

  test('deactivates material when Deactivate is clicked', async () => {
    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Click Deactivate button for first material
    fireEvent.click(screen.getAllByText('Deactivate')[0]);

    // Confirm prompt should be shown
    expect(window.confirm).toHaveBeenCalled();

    // API should be called to deactivate
    await waitFor(() => {
      expect(supplierService.deactivateMaterial).toHaveBeenCalledWith('101');
    });
  });

  test('handles empty materials list', async () => {
    // Mock empty materials list
    supplierService.getMaterials.mockResolvedValue({
      data: [],
    });

    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Should show empty state message
    expect(screen.getByText("You haven't added any materials yet.")).toBeInTheDocument();
    
    // Should have a button to create first material
    expect(screen.getByText('Create Your First Material')).toBeInTheDocument();
  });

  test('handles API error', async () => {
    // Mock API error
    supplierService.getMaterials.mockRejectedValue(
      new Error('Failed to load materials')
    );

    render(<MaterialsList />);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load materials. Please try again.')).toBeInTheDocument();
    });
  });

  test('handles no admin wallet connected', async () => {
    // Mock admin without wallet
    adminService.getAllUsers.mockResolvedValue({
      data: [
        {
          id: '999',
          username: 'admin',
          role: 'ADMIN',
          walletAddress: null,
        },
      ],
    });

    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Should show warning about no admin wallet
    expect(screen.getByText(/Blockchain tracking is currently unavailable/)).toBeInTheDocument();
  });

  test('shows admin wallet info for non-admin users', async () => {
    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Should show admin wallet info
    expect(screen.getByText(/Materials will be tracked on the blockchain/)).toBeInTheDocument();
  });

  test('cancel button on edit modal closes the modal', async () => {
    render(<MaterialsList />);

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText('Materials Management')).toBeInTheDocument();
    });

    // Click Edit button for first material
    fireEvent.click(screen.getAllByText('Edit')[0]);

    // Edit modal should be visible
    expect(screen.getByText('Edit Material')).toBeInTheDocument();

    // Click Cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Modal should be closed
    expect(screen.queryByText('Edit Material')).not.toBeInTheDocument();
  });
});