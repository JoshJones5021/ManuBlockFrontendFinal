import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import OrderTracking from './OrderTracking';
import { customerService } from '../../services/api';

jest.mock('../../services/api', () => ({
  customerService: {
    getOrders: jest.fn(),
    trackOrder: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, name: 'Test User', email: 'test@example.com' },
  }),
}));

describe('OrderTracking Component', () => {
  const mockOrders = [
    {
      id: 1,
      orderNumber: 'ORD-001',
      status: 'Delivered',
      createdAt: '2023-03-10T10:30:00Z',
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      status: 'In Transit',
      createdAt: '2023-03-12T14:00:00Z',
    },
  ];

  const mockTrackingResult = {
    orderNumber: 'ORD-002',
    status: 'In Transit',
    shippingAddress: '123 Main St, Cityville',
    requestedDeliveryDate: '2023-03-20T00:00:00Z',
    createdAt: '2023-03-12T14:00:00Z',
    statusHistory: [
      { status: 'Order Placed', timestamp: '2023-03-12T14:00:00Z', notes: 'Order received' },
      { status: 'In Transit', timestamp: '2023-03-13T10:00:00Z', notes: 'Left the warehouse' },
    ],
    items: [
      { id: 1, productName: 'Eco-friendly Bottle', quantity: 2, price: 24.99, status: 'In Transit' },
    ],
    blockchainTxHash: '0x123456789abcdef',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state and fetches recent orders', async () => {
    customerService.getOrders.mockResolvedValueOnce({ data: mockOrders });

    await act(async () => render(<OrderTracking />));

    await waitFor(() => {
      expect(customerService.getOrders).toHaveBeenCalledWith(1);
      expect(screen.getByText('Your Recent Orders')).toBeInTheDocument();
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });
  });

  test('handles API error when fetching orders', async () => {
    customerService.getOrders.mockRejectedValueOnce(new Error('API Error'));

    await act(async () => render(<OrderTracking />));

    await waitFor(() => {
      expect(screen.getByText('Failed to load orders. Please try again later.')).toBeInTheDocument();
    });
  });

  test('tracks an order by submitting the tracking form', async () => {
    customerService.getOrders.mockResolvedValueOnce({ data: mockOrders });
    customerService.trackOrder.mockResolvedValueOnce({ data: mockTrackingResult });

    await act(async () => render(<OrderTracking />));
    await waitFor(() => screen.getByText('Track Order'));

    const input = screen.getByPlaceholderText('Enter order number or tracking number');
    const button = screen.getByText('Track Order');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'ORD-002' } });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(customerService.trackOrder).toHaveBeenCalledWith('ORD-002');
      expect(screen.getByText('Order #ORD-002')).toBeInTheDocument();
      expect(screen.getByText('Shipping Information')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Cityville')).toBeInTheDocument();
      expect(screen.getByText('Eco-friendly Bottle')).toBeInTheDocument();
      expect(screen.getByText('Blockchain Verification')).toBeInTheDocument();
      expect(screen.getByText(/0x123456789abcdef/)).toBeInTheDocument(); // Regex for flexibility
    });
  });

  test('shows no orders message when orders array is empty', async () => {
    customerService.getOrders.mockResolvedValueOnce({ data: [] });

    await act(async () => render(<OrderTracking />));

    await waitFor(() => {
      expect(screen.getByText("You don't have any orders yet.")).toBeInTheDocument();
    });
  });

  test('handles error when tracking fails', async () => {
    customerService.getOrders.mockResolvedValueOnce({ data: mockOrders });
    customerService.trackOrder.mockRejectedValueOnce(new Error('Tracking Error'));

    await act(async () => render(<OrderTracking />));
    await waitFor(() => screen.getByText('Track Order'));

    const input = screen.getByPlaceholderText('Enter order number or tracking number');
    const button = screen.getByText('Track Order');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'INVALID-TRACK' } });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Unable to find order with this tracking number. Please check and try again.')).toBeInTheDocument();
    });
  });
});
