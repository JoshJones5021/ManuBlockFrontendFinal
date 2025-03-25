import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaterialRequestItem from '../../components/supplier/MaterialRequestItem';
import { supplierService } from '../../services/api';

// Mock the API services
jest.mock('../../services/api', () => ({
  supplierService: {
    approveRequest: jest.fn(),
  },
}));

describe('MaterialRequestItem Component', () => {
  // Mock data for tests
  const mockRequest = {
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
    supplyChain: {
      name: 'Automotive Supply Chain',
    },
    items: [
      {
        id: 201,
        material: {
          id: 301,
          name: 'Aluminum',
          specifications: 'Grade A, 99.7% purity',
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
          specifications: 'Grade B, structural steel',
          unit: 'kg',
        },
        requestedQuantity: 800,
        status: 'Requested',
      },
    ],
  };

  const mockOnApprove = jest.fn();
  const mockOnReject = jest.fn();

  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock API responses
    supplierService.approveRequest.mockResolvedValue({
      data: { success: true },
    });
  });

  test('renders request header with collapsed state initially', () => {
    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Check header information is visible
    expect(screen.getByText('REQ-2023-001')).toBeInTheDocument();
    expect(screen.getByText(/Acme Manufacturing/)).toBeInTheDocument();
    expect(screen.getByText('Requested')).toBeInTheDocument();

    // Details should not be visible initially
    expect(screen.queryByText('Request Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Requested Materials')).not.toBeInTheDocument();
  });

  test('expands when header is clicked', () => {
    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Click the header to expand
    fireEvent.click(screen.getByText('REQ-2023-001'));

    // Details should now be visible
    expect(screen.getByText('Request Details')).toBeInTheDocument();
    expect(screen.getByText('Requested Materials')).toBeInTheDocument();
    expect(screen.getByText('Aluminum')).toBeInTheDocument();
    expect(screen.getByText('Steel')).toBeInTheDocument();
    expect(screen.getByText('Urgent production requirements')).toBeInTheDocument();
  });

  test('shows requested quantities for materials', () => {
    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Expand the item
    fireEvent.click(screen.getByText('REQ-2023-001'));

    // Check material quantities
    expect(screen.getByText('500 kg')).toBeInTheDocument();
    expect(screen.getByText('800 kg')).toBeInTheDocument();
  });

  test('allows changing approval quantities', () => {
    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Expand the item
    fireEvent.click(screen.getByText('REQ-2023-001'));

    // Get approval quantity inputs
    const quantityInputs = screen.getAllByRole('spinbutton');
    
    // Change quantities
    fireEvent.change(quantityInputs[0], { target: { value: '400' } });
    fireEvent.change(quantityInputs[1], { target: { value: '700' } });

    // Check if values updated
    expect(quantityInputs[0]).toHaveValue(400);
    expect(quantityInputs[1]).toHaveValue(700);
  });

  test('handles approve request', async () => {
    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Expand the item
    fireEvent.click(screen.getByText('REQ-2023-001'));

    // Get approval quantity inputs
    const quantityInputs = screen.getAllByRole('spinbutton');
    
    // Change quantities
    fireEvent.change(quantityInputs[0], { target: { value: '400' } });
    fireEvent.change(quantityInputs[1], { target: { value: '700' } });

    // Click approve button
    fireEvent.click(screen.getByText('Approve Request'));

    // Check if API called with correct data
    await waitFor(() => {
      expect(supplierService.approveRequest).toHaveBeenCalledWith(
        101,
        [
          { itemId: 201, approvedQuantity: 400 },
          { itemId: 202, approvedQuantity: 700 }
        ]
      );
    });

    // Check if onApprove callback called
    await waitFor(() => {
      expect(mockOnApprove).toHaveBeenCalledWith(101);
    });
  });

  test('handles reject request', async () => {
    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Expand the item
    fireEvent.click(screen.getByText('REQ-2023-001'));

    // Click reject button
    fireEvent.click(screen.getByText('Reject Request'));

    // Check if API called with zero quantities
    await waitFor(() => {
      expect(supplierService.approveRequest).toHaveBeenCalledWith(
        101,
        [
          { itemId: 201, approvedQuantity: 0 },
          { itemId: 202, approvedQuantity: 0 }
        ]
      );
    });

    // Check if onReject callback called
    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith(101);
    });
  });

  test('validates approval quantities', async () => {
    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Expand the item
    fireEvent.click(screen.getByText('REQ-2023-001'));

    // Get approval quantity inputs
    const quantityInputs = screen.getAllByRole('spinbutton');
    
    // Set invalid quantity (more than requested)
    fireEvent.change(quantityInputs[0], { target: { value: '600' } });  // > 500 requested

    // Click approve button
    fireEvent.click(screen.getByText('Approve Request'));

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Approved quantity cannot exceed requested quantity')).toBeInTheDocument();
    });

    // API should not be called
    expect(supplierService.approveRequest).not.toHaveBeenCalled();
  });

  test('handles API error', async () => {
    // Mock API error
    supplierService.approveRequest.mockRejectedValue(
      new Error('Failed to approve request')
    );

    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Expand the item
    fireEvent.click(screen.getByText('REQ-2023-001'));

    // Click approve button
    fireEvent.click(screen.getByText('Approve Request'));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to approve request')).toBeInTheDocument();
    });

    // Callbacks should not be called
    expect(mockOnApprove).not.toHaveBeenCalled();
    expect(mockOnReject).not.toHaveBeenCalled();
  });

  test('formats dates correctly', () => {
    render(
      <MaterialRequestItem
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Expand the item
    fireEvent.click(screen.getByText('REQ-2023-001'));

    // Check formatted dates - exact format depends on locale, so check partial content
    const createdDate = new Date('2023-05-15').toLocaleDateString();
    const deliveryDate = new Date('2023-06-15').toLocaleDateString();
    
    expect(screen.getByText(new RegExp(createdDate))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(deliveryDate))).toBeInTheDocument();
  });
});