import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RecordTransportAction from './RecordTransportAction';
import { distributorService } from '../../services/api';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../services/api', () => ({
  distributorService: {
    recordPickup: jest.fn(),
    recordDelivery: jest.fn(),
    recordRecyclePickup: jest.fn(),
    recordRecycleDelivery: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockTransport = {
  id: 123,
  trackingNumber: 'TRK-12345',
  type: 'Standard',
  sourceName: 'Warehouse A',
  destinationName: 'Customer B',
  scheduledPickupDate: '2023-04-01T00:00:00Z',
  scheduledDeliveryDate: '2023-04-05T00:00:00Z',
};

describe('RecordTransportAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders pickup button and handles successful pickup action', async () => {
    distributorService.recordPickup.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <RecordTransportAction transport={mockTransport} actionType="pickup" />
      </MemoryRouter>
    );

    const pickupBtn = screen.getByText('Record Pickup');
    expect(pickupBtn).toBeInTheDocument();

    fireEvent.click(pickupBtn);
    expect(screen.getByText('Confirm Pickup')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Confirm');
    await act(async () => fireEvent.click(confirmBtn));

    await waitFor(() => {
      expect(distributorService.recordPickup).toHaveBeenCalledWith(mockTransport.id);
      expect(mockNavigate).toHaveBeenCalledWith('/distributor/transports');
    });
  });

  test('renders delivery button and handles successful delivery action', async () => {
    distributorService.recordDelivery.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <RecordTransportAction transport={mockTransport} actionType="delivery" />
      </MemoryRouter>
    );

    const deliveryBtn = screen.getByText('Record Delivery');
    expect(deliveryBtn).toBeInTheDocument();

    fireEvent.click(deliveryBtn);
    expect(screen.getByText('Confirm Delivery')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Confirm');
    await act(async () => fireEvent.click(confirmBtn));

    await waitFor(() => {
      expect(distributorService.recordDelivery).toHaveBeenCalledWith(mockTransport.id);
      expect(mockNavigate).toHaveBeenCalledWith('/distributor/transports');
    });
  });

  test('calls recycling API methods when transport is recycling', async () => {
    const recycleTransport = { ...mockTransport, type: 'Recycling Pickup' };
    distributorService.recordRecyclePickup.mockResolvedValueOnce({});
    distributorService.recordRecycleDelivery.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <RecordTransportAction transport={recycleTransport} actionType="pickup" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Record Pickup'));
    await act(async () => fireEvent.click(screen.getByText('Confirm')));
    await waitFor(() => expect(distributorService.recordRecyclePickup).toHaveBeenCalledWith(recycleTransport.id));

    // Test Delivery
    render(
      <MemoryRouter>
        <RecordTransportAction transport={recycleTransport} actionType="delivery" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Record Delivery'));
    await act(async () => fireEvent.click(screen.getByText('Confirm')));
    await waitFor(() => expect(distributorService.recordRecycleDelivery).toHaveBeenCalledWith(recycleTransport.id));
  });
});
