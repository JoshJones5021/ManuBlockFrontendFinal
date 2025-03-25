import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaterialRequestsList from '../../components/supplier/MaterialRequestsList';
import { useAuth } from '../../context/AuthContext';
import { supplierService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API services
jest.mock('../../services/api', () => ({
  supplierService: {
    getPendingRequests: jest.fn(),
    getRequestsByStatus: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('MaterialRequestsList Component', () => {
  // Mock data for tests
  const mockCurrentUser = {
    id: '1',
    username: 'supplier1',
    role: 'SUPPLIER',
  };

  const mockPendingRequests = [
    {
      id: 101,
      requestNumber: 'REQ-2023-001',
      manufacturer: {
        id: '2',
        username: 'Acme Manufacturing',
      },
      status: 'Requested',
      createdAt: '2023-05-15T10:30:00Z',
      requestedDeliveryDate: '2023-06-15T00:00:00Z',
      items: [
        {
          id: 201,
          material: {
            id: 301,
            name: 'Aluminum',
            unit: 'kg',
          },
          requestedQuantity: 500,
          status: 'Requested',
        },
        {
          id: 202,
          material: {
            id: 302,
            name: 'Steel',
            unit: 'kg',
          },
          requestedQuantity: 800,
          status: 'Requested',
        },
      ],
    },
    {
      id: 102,
      requestNumber: 'REQ-2023-002',
      manufacturer: {
        id: '3',
        username: 'Global Industries',
      },
      status: 'Requested',
      createdAt: '2023-05-20T14:45:00Z',
      requestedDeliveryDate: '2023-07-01T00:00:00Z',
      items: [
        {
          id: 203,
          material: {
            id: 303,
            name: 'Copper',
            unit: 'kg',
          },
          requestedQuantity: 300,
          status: 'Requested',
        },
      ],
    },
  ];

  const mockApprovedRequests = [
    {
      id: 103,
      requestNumber: 'REQ-2023-003',
      manufacturer: {
        id: '2',
        username: 'Acme Manufacturing',
      },
      status: 'Approved',
      createdAt: '2023-05-10T09:15:00Z',
      requestedDeliveryDate: '2023-06-10T00:00:00Z',
      items: [
        {
          id: 204,
          material: {
            id: 304,
            name: 'Titanium',
            unit: 'kg',
          },
          requestedQuantity: 200,
          approvedQuantity: 150,
          status: 'Approved',
        },
      ],
    },
  ];

  const mockNavigate = jest.fn();

  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock useAuth hook
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
    });

    // Mock useNavigate
    useNavigate.mockReturnValue(mockNavigate);

    // Mock API responses
    supplierService.getPendingRequests.mockResolvedValue({
      data: mockPendingRequests,
    });

    supplierService.getRequestsByStatus.mockImplementation((userId, status) => {
      if (status === 'Approved') {
        return Promise.resolve({ data: mockApprovedRequests });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('switches to completed tab', async () => {
    render(<MaterialRequestsList />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('Material Requests')).toBeInTheDocument();
    });

    // Click on completed tab
    fireEvent.click(screen.getByText('Completed'));

    // API should be called with Completed status
    expect(supplierService.getRequestsByStatus).toHaveBeenCalledWith(
      '1',
      'Completed'
    );
  });

  test('navigates to approval page for pending requests', async () => {
    render(<MaterialRequestsList />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('Material Requests')).toBeInTheDocument();
    });

    // Find and click Review & Approve buttons
    const approveButtons = screen.getAllByText('Review & Approve');
    fireEvent.click(approveButtons[0]);

    // Should navigate to approval page
    expect(mockNavigate).toHaveBeenCalledWith('/supplier/requests/101/approve');
  });
});