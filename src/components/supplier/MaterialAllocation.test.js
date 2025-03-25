import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaterialAllocation from '../../../src/components/supplier/MaterialAllocation';
import { useAuth } from '../../../src/context/AuthContext';
import { supplierService, blockchainService } from '../../../src/services/api';

// Mock AuthContext
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock API services
jest.mock('../../../src/services/api', () => ({
  supplierService: {
    getRequestsByStatus: jest.fn(),
  },
  blockchainService: {
    getBlockchainItemDetails: jest.fn(),
  },
}));

describe('MaterialAllocation Component', () => {
  const mockCurrentUser = {
    id: '1',
    username: 'supplier1',
    email: 'supplier@example.com',
    role: 'SUPPLIER',
  };

  const mockBlockchainDetails = {
    id: '0xBlockchain1234abcd',
    itemType: 'Material',
    owner: '0xOwnerWalletAddress',
    quantity: 500,
    supplyChainId: '1',
    status: 0,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: mockCurrentUser });

    supplierService.getRequestsByStatus.mockResolvedValue({
      data: [
        {
          id: 201,
          requestNumber: 'REQ-001',
          manufacturer: { id: '2', username: 'Acme Corp' },
          requestedDeliveryDate: '2023-12-31',
          updatedAt: '2023-11-20',
          items: [
            {
              id: 101,
              status: 'Allocated',
              blockchainItemId: '0xBlockchain1234abcd',
              allocatedQuantity: 500,
              material: { id: 301, name: 'Aluminum', unit: 'kg' },
            },
          ],
        },
      ],
    });

    blockchainService.getBlockchainItemDetails.mockResolvedValue({
      data: mockBlockchainDetails,
    });
  });

  test('renders allocated materials correctly', async () => {
    render(<MaterialAllocation />);

    await waitFor(() => {
      expect(screen.getByText('Allocated Materials')).toBeInTheDocument();
    });

    expect(screen.getByText('Aluminum')).toBeInTheDocument();
    expect(screen.getByText('REQ-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('500 kg')).toBeInTheDocument();

    const formattedDate = new Date('2023-11-20').toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();

    // ✅ Updated blockchain check to avoid errors
    const trackedElements = screen.queryAllByText(/Tracked - ID:/);
    expect(trackedElements.length).toBeGreaterThan(0);

    // Validate the node contains both Tracked and blockchain ID substring
    const matched = trackedElements.some((node) =>
      node.textContent.includes('Tracked - ID:') &&
      node.textContent.includes('0xBlockc')
    );
    expect(matched).toBe(true);
  });

  test('renders error message on API failure', async () => {
    supplierService.getRequestsByStatus.mockRejectedValueOnce(new Error('API Failure'));
    render(<MaterialAllocation />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load allocated materials/i)).toBeInTheDocument();
    });
  });

  test('renders no data message when empty response', async () => {
    supplierService.getRequestsByStatus.mockResolvedValueOnce({ data: [] });
    render(<MaterialAllocation />);

    await waitFor(() => {
      expect(screen.getByText('No allocated materials found.')).toBeInTheDocument();
    });
  });

  test('handles blockchain API error', async () => {
    blockchainService.getBlockchainItemDetails.mockRejectedValueOnce(new Error('Blockchain Error'));

    render(<MaterialAllocation />);

    await waitFor(() => {
      expect(screen.getByText('Aluminum')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Blockchain'));

    await waitFor(() => {
      expect(screen.getByText('Failed to load blockchain details.')).toBeInTheDocument();
    });
  });

  test('closes blockchain modal on Close button click', async () => {
    render(<MaterialAllocation />);

    await waitFor(() => {
      expect(screen.getByText('Aluminum')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Blockchain'));

    await waitFor(() => {
      expect(screen.getByText('Blockchain Item Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.queryByText('Blockchain Item Details')).not.toBeInTheDocument();
    });
  });
});
