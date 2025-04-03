import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaterialAllocationManagement from '../../../src/components/supplier/MaterialAllocationManagement';
import { useAuth } from '../../../src/context/AuthContext';
import { supplierService } from '../../../src/services/api';
import { useNavigate } from 'react-router-dom';

// Mock AuthContext
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock API services
jest.mock('../../../src/services/api', () => ({
  supplierService: {
    getRequestsByStatus: jest.fn(),
    allocateMaterials: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('MaterialAllocationManagement Component', () => {
  const mockCurrentUser = {
    id: '1',
    username: 'supplier1',
    email: 'supplier@example.com',
    role: 'SUPPLIER',
  };

  const mockApprovedRequests = [
    {
      id: 101,
      requestNumber: 'REQ-2023-001',
      manufacturer: { id: '2', username: 'Acme Manufacturing' },
      createdAt: '2023-11-01',
      requestedDeliveryDate: '2023-12-15',
      items: [
        {
          id: 201,
          status: 'Approved',
          approvedQuantity: 500,
          material: { id: 301, name: 'Aluminum', unit: 'kg' },
        },
      ],
    },
  ];

  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: mockCurrentUser });
    useNavigate.mockReturnValue(mockNavigate);
    supplierService.getRequestsByStatus.mockResolvedValue({ data: mockApprovedRequests });
    supplierService.allocateMaterials.mockResolvedValue({ data: { success: true } });
  });

  test('renders approved requests', async () => {
    render(<MaterialAllocationManagement />);

    await waitFor(() => {
      expect(screen.getByText('Material Allocation Management')).toBeInTheDocument();
    });

    expect(screen.getByText('REQ-2023-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Manufacturing')).toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();
    expect(screen.getByText('Allocate Materials')).toBeInTheDocument();
  });

  test('opens confirmation modal', async () => {
    render(<MaterialAllocationManagement />);

    await screen.findByText('REQ-2023-001');

    fireEvent.click(screen.getByText('Allocate Materials'));

    expect(await screen.findByText('Confirm Material Allocation')).toBeInTheDocument();
    expect(screen.getByText(/Aluminum - 500 kg/i)).toBeInTheDocument();
  });

  test('allocates materials successfully', async () => {
    render(<MaterialAllocationManagement />);

    await screen.findByText('REQ-2023-001');

    fireEvent.click(screen.getByText('Allocate Materials'));
    await screen.findByText('Confirm Material Allocation');

    fireEvent.click(screen.getByText('Confirm Allocation'));

    expect(supplierService.allocateMaterials).toHaveBeenCalledWith(101);

    await waitFor(() => {
      expect(screen.getByText(/Materials for request REQ-2023-001 have been allocated successfully/i)).toBeInTheDocument();
    });
  });

  test('handles allocation API error', async () => {
    supplierService.allocateMaterials.mockRejectedValueOnce(new Error('Allocation failed'));

    render(<MaterialAllocationManagement />);

    await screen.findByText('REQ-2023-001');
    fireEvent.click(screen.getByText('Allocate Materials'));
    await screen.findByText('Confirm Material Allocation');

    fireEvent.click(screen.getByText('Confirm Allocation'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to allocate materials: Allocation failed/i)).toBeInTheDocument();
    });
  });

  test('closes confirmation modal on cancel', async () => {
    render(<MaterialAllocationManagement />);

    await screen.findByText('REQ-2023-001');
    fireEvent.click(screen.getByText('Allocate Materials'));

    await screen.findByText('Confirm Material Allocation');
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Confirm Material Allocation')).not.toBeInTheDocument();
    });

    expect(supplierService.allocateMaterials).not.toHaveBeenCalled();
  });

  test('displays information panel', async () => {
    render(<MaterialAllocationManagement />);

    await screen.findByText('Material Allocation Management');

    expect(screen.getByText('What is Material Allocation?')).toBeInTheDocument();
    expect(screen.getByText(/Allocation creates blockchain records/i)).toBeInTheDocument();
  });

  test('displays formatted dates correctly', async () => {
    render(<MaterialAllocationManagement />);

    await screen.findByText('REQ-2023-001');

    const createdDate = new Date('2023-11-01').toLocaleDateString();
    const deliveryDate = new Date('2023-12-15').toLocaleDateString();

    expect(screen.getByText(createdDate)).toBeInTheDocument();
    expect(screen.getByText(deliveryDate)).toBeInTheDocument();
  });
});
