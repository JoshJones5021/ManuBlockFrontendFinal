import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaterialInventoryManagement from '../../components/supplier/MaterialInventoryManagement';
import { useAuth } from '../../context/AuthContext';
import { supplierService, blockchainService, supplyChainService, adminService } from '../../services/api';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API services
jest.mock('../../services/api', () => ({
  supplierService: {
    getMaterials: jest.fn(),
    updateMaterial: jest.fn(),
    deactivateMaterial: jest.fn(),
  },
  blockchainService: {
    getBlockchainItemDetails: jest.fn(),
  },
  supplyChainService: {
    getSupplyChainsByUser: jest.fn(),
  },
  adminService: {
    getAllUsers: jest.fn(),
  },
}));

describe('MaterialInventoryManagement Component', () => {
  const mockCurrentUser = { id: '1', username: 'supplier1', role: 'SUPPLIER' };

  const mockMaterials = [
    {
      id: '101',
      name: 'Aluminum',
      description: 'High-quality aluminum sheets',
      quantity: 1000,
      unit: 'kg',
      specifications: 'Grade A',
      supplierId: '1',
      supplyChainId: '1',
      active: true,
      blockchainItemId: '0x123',
    },
    {
      id: '102',
      name: 'Steel',
      description: 'Carbon steel sheets',
      quantity: 2000,
      unit: 'kg',
      specifications: 'Grade B',
      supplierId: '1',
      supplyChainId: '1',
      active: true,
      blockchainItemId: null,
    },
    {
      id: '103',
      name: 'Copper',
      description: 'Copper wire',
      quantity: 500,
      unit: 'kg',
      specifications: 'Grade C',
      supplierId: '1',
      supplyChainId: '2',
      active: false,
      blockchainItemId: null,
    },
  ];

  const mockBlockchainStatus = { '0x123': { status: 0, isActive: true } };
  const mockSupplyChains = [{ id: '1', name: 'Automotive' }, { id: '2', name: 'Electronics' }];
  const mockAdmins = [{ id: '999', username: 'admin', role: 'ADMIN', walletAddress: '0xadmin' }];

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: mockCurrentUser });
    supplierService.getMaterials.mockResolvedValue({ data: mockMaterials });
    blockchainService.getBlockchainItemDetails.mockImplementation((id) =>
      Promise.resolve({ data: { id, ...mockBlockchainStatus[id] } })
    );
    supplyChainService.getSupplyChainsByUser.mockResolvedValue(mockSupplyChains);
    adminService.getAllUsers.mockResolvedValue({ data: mockAdmins });
    supplierService.updateMaterial.mockImplementation((id, data) =>
      Promise.resolve({ data: { ...mockMaterials.find((m) => m.id === id), ...data } })
    );
    supplierService.deactivateMaterial.mockImplementation((id) =>
      Promise.resolve({ data: { ...mockMaterials.find((m) => m.id === id), active: false } })
    );
  });

  test('renders materials', async () => {
    render(<MaterialInventoryManagement />);
    await waitFor(() => {
      expect(screen.getByText('Material Inventory Management')).toBeInTheDocument();
    });
    expect(screen.getByText('Aluminum')).toBeInTheDocument();
    expect(screen.getByText('Steel')).toBeInTheDocument();
    expect(screen.getByText('Copper')).toBeInTheDocument();
  });

  test('deactivates material', async () => {
    window.confirm = jest.fn(() => true);
    render(<MaterialInventoryManagement />);
    await waitFor(() => screen.getByText('Aluminum'));

    fireEvent.click(screen.getAllByText('Deactivate')[0]);
    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(supplierService.deactivateMaterial).toHaveBeenCalledWith('101');
    });
  });
});
