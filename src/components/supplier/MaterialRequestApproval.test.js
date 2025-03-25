import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaterialRequestApproval from '../../components/supplier/MaterialRequestApproval';
import { useAuth } from '../../context/AuthContext';
import { supplierService } from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API services
jest.mock('../../services/api', () => ({
  supplierService: {
    getPendingRequests: jest.fn(),
    approveRequest: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

describe('MaterialRequestApproval Component', () => {
  // Mock data for tests
  const mockCurrentUser = {
    id: '1',
    username: 'supplier1',
    role: 'SUPPLIER',
  };

  const mockRequestId = '101';

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
      notes: 'Urgent production requirements',
      items: [
        {
          id: 201,
          material: {
            id: 301,
            name: 'Aluminum',
            quantity: 2000,
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
            quantity: 3000,
            unit: 'kg',
          },
          requestedQuantity: 800,
          status: 'Requested',
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

    // Mock useParams and useNavigate
    useParams.mockReturnValue({ requestId: mockRequestId });
    useNavigate.mockReturnValue(mockNavigate);

    // Mock API responses
    supplierService.getPendingRequests.mockResolvedValue({
      data: mockPendingRequests,
    });

    supplierService.approveRequest.mockResolvedValue({
      data: { success: true },
    });
  });

  test('handles quantity changes', async () => {
    render(<MaterialRequestApproval />);

    // Wait for request to load
    await waitFor(() => {
      expect(screen.getByText('Material Request Approval')).toBeInTheDocument();
    });

    // Find quantity inputs
    const quantityInputs = screen.getAllByRole('spinbutton');
    
    // Change the first quantity (Aluminum)
    fireEvent.change(quantityInputs[0], {
      target: { value: '400' },
    });

    // Verify the value was updated
    expect(quantityInputs[0]).toHaveValue(400);
  });

  test('handles approval validation', async () => {
    render(<MaterialRequestApproval />);

    // Wait for request to load
    await waitFor(() => {
      expect(screen.getByText('Material Request Approval')).toBeInTheDocument();
    });

    // Find quantity inputs
    const quantityInputs = screen.getAllByRole('spinbutton');
    
    // Try to approve more than available
    fireEvent.change(quantityInputs[0], {
      target: { value: '3000' }, // More than available (2000)
    });

    // Click approve button
    fireEvent.click(screen.getByText('Approve Request'));

    // API should not be called - validation error
    expect(supplierService.approveRequest).not.toHaveBeenCalled();
  });

  test('handles API error', async () => {
    // Mock API error for request approval
    supplierService.approveRequest.mockRejectedValue(
      new Error('Failed to approve request')
    );

    render(<MaterialRequestApproval />);

    // Wait for request to load
    await waitFor(() => {
      expect(screen.getByText('Material Request Approval')).toBeInTheDocument();
    });

    // Click approve button
    fireEvent.click(screen.getByText('Approve Request'));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to approve request')).toBeInTheDocument();
    });

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('navigates back when Cancel is clicked', async () => {
    render(<MaterialRequestApproval />);

    // Wait for request to load
    await waitFor(() => {
      expect(screen.getByText('Material Request Approval')).toBeInTheDocument();
    });

    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Check if navigated back to requests page
    expect(mockNavigate).toHaveBeenCalledWith('/supplier/requests');
  });

  test('handles request not found', async () => {
    // Mock empty response (request not found)
    supplierService.getPendingRequests.mockResolvedValue({
      data: [],
    });

    render(<MaterialRequestApproval />);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Request not found')).toBeInTheDocument();
    });

    // Should have back button
    expect(screen.getByText('Back to Requests')).toBeInTheDocument();
  });

  test('handles already processed request', async () => {
    // Mock already processed request
    supplierService.getPendingRequests.mockResolvedValue({
      data: [
        {
          ...mockPendingRequests[0],
          status: 'Approved', // Not 'Requested'
        },
      ],
    });

    render(<MaterialRequestApproval />);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('This request has already been processed')).toBeInTheDocument();
    });
  });
});