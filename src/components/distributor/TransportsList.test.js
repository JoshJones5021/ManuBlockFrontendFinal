import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ✅ Mock API service
jest.mock('../../services/api', () => ({
  distributorService: {
    getTransports: jest.fn(),
    getReadyMaterialRequests: jest.fn(),
    recordPickup: jest.fn(),
    recordDelivery: jest.fn(),
  },
}));

// ✅ Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, username: 'DistributorUser' },
  }),
}));

import TransportsList from './TransportsList';
import { distributorService } from '../../services/api';

describe('TransportsList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTransports = [
    {
      id: 101,
      trackingNumber: 'TR-101',
      status: 'Scheduled',
      type: 'Material Transport',
      source: { username: 'SupplierA' },
      destination: { username: 'ManufacturerB' },
      scheduledPickupDate: '2025-03-25T01:31:13.999Z',
      scheduledDeliveryDate: '2025-03-27T01:31:13.999Z',
    },
  ];

  const mockMaterialRequests = [
    {
      id: 201,
      requestNumber: 'MR-201',
      requestedDeliveryDate: '2025-03-30T01:31:13.999Z',
      manufacturer: { username: 'ManufacturerX' },
    },
  ];

  test('renders transport list successfully with API data', async () => {
    distributorService.getTransports.mockResolvedValueOnce({ data: mockTransports });
    distributorService.getReadyMaterialRequests.mockResolvedValueOnce({ data: mockMaterialRequests });

    render(
      <MemoryRouter>
        <TransportsList />
      </MemoryRouter>
    );

    // ✅ Wait for API call completion
    expect(await screen.findByText('Transport Management')).toBeInTheDocument();

    // ✅ Check transport data renders
    expect(screen.getByText('TR-101')).toBeInTheDocument();
    expect(screen.getByText('Material Transports')).toBeInTheDocument();

    // ✅ Avoid ambiguous "Scheduled" by using getAllByText
    const scheduledTexts = screen.getAllByText('Scheduled');
    expect(scheduledTexts.length).toBeGreaterThan(0);
  });

  test('displays error message on fetch failure', async () => {
    distributorService.getTransports.mockRejectedValueOnce(new Error('API Error'));
    distributorService.getReadyMaterialRequests.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <TransportsList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load transports. Please try again later.')).toBeInTheDocument();
    });
  });

  test('filters transport list by search term', async () => {
    distributorService.getTransports.mockResolvedValueOnce({ data: mockTransports });
    distributorService.getReadyMaterialRequests.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <TransportsList />
      </MemoryRouter>
    );

    // Ensure data is rendered
    await screen.findByText('TR-101');

    // ✅ Test search functionality
    fireEvent.change(screen.getByPlaceholderText('Search by tracking number, source, or destination...'), {
      target: { value: 'SupplierA' },
    });

    expect(screen.getByText('SupplierA')).toBeInTheDocument();
  });

  test('handles pickup action successfully', async () => {
    distributorService.getTransports.mockResolvedValueOnce({ data: mockTransports });
    distributorService.getReadyMaterialRequests.mockResolvedValueOnce({ data: [] });
    distributorService.recordPickup.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <TransportsList />
      </MemoryRouter>
    );

    await screen.findByText('TR-101');

    // Simulate clicking Record Pickup
    const pickupButton = screen.getByText('Record Pickup');
    fireEvent.click(pickupButton);

    // Confirm Modal appears
    expect(await screen.findByText('Confirm Pickup')).toBeInTheDocument();

    // Confirm action
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(distributorService.recordPickup).toHaveBeenCalledWith(101);
    });
  });
});
