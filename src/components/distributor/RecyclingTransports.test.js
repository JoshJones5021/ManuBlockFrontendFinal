import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ✅ MOCK useAuth BEFORE importing
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, username: 'distributor' },
    loading: false,
    error: null,
  }),
}));

// ✅ MOCK API services
jest.mock('../../services/api', () => ({
  distributorService: {
    getTransports: jest.fn(),
    getAvailableChurnedItems: jest.fn(),
    createRecyclingTransport: jest.fn(),
  },
  manufacturerService: {
    getAllManufacturers: jest.fn(),
  },
}));

import RecyclingTransports from './RecyclingTransports';
import { distributorService, manufacturerService } from '../../services/api';

const mockTransports = [
  {
    id: 101,
    trackingNumber: 'RT-001',
    productName: 'Recycled Plastic',
    sourceName: 'Customer A',
    destinationName: 'Manufacturer X',
    status: 'Scheduled',
    scheduledPickupDate: Date.now(),
    scheduledDeliveryDate: Date.now() + 86400000,
    type: 'Recycling Pickup',
  },
];

const mockAvailableItems = [
  {
    id: 201,
    name: 'Old Bottle',
    customerName: 'Customer A',
    pickupAddress: '123 Street',
    updated_at: Date.now(),
    manufacturerId: 301,
    customerId: 101,
    supplyChainId: 401,
  },
];

const mockManufacturers = [
  { id: 301, name: 'Manufacturer X', role: 'MANUFACTURER' },
];

describe('RecyclingTransports Component', () => {
  beforeEach(() => {
    distributorService.getTransports.mockResolvedValue({ data: mockTransports });
    distributorService.getAvailableChurnedItems.mockResolvedValue({ data: mockAvailableItems });
    manufacturerService.getAllManufacturers.mockResolvedValue({ data: mockManufacturers });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <RecyclingTransports />
      </MemoryRouter>
    );

  test('renders recycling transports and available items', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Recycling Management')).toBeInTheDocument();
      expect(screen.getByText('Old Bottle')).toBeInTheDocument();
      expect(screen.getByText('RT-001')).toBeInTheDocument();
    });
  });
});