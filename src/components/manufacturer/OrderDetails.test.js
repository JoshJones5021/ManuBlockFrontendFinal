import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import OrderDetails from '../../components/manufacturer/OrderDetails';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as manufacturerApi from '../../services/api';
import * as supplyChainApi from '../../services/api';

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  manufacturerService: {
    getOrders: jest.fn(),
    getProducts: jest.fn(),
    fulfillOrderFromStock: jest.fn(),
  },
  supplyChainService: {
    getAssignedUsers: jest.fn(),
  },
}));

describe('OrderDetails Component', () => {
  const mockNavigate = jest.fn();
  const mockOrderId = '123';
  const mockUser = { id: 1, username: 'TestManufacturer' };

  const mockOrder = {
    id: 123,
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    shippingAddress: '123 Main St',
    status: 'Requested',
    createdAt: '2024-03-24T00:00:00Z',
    requestedDeliveryDate: '2024-04-01T00:00:00Z',
    supplyChainName: 'Test Supply Chain',
    blockchainTxHash: '0xabcdef1234567890',
    items: [
      { id: 1, productId: 1, productName: 'Product A', quantity: 5, price: 10 },
    ],
    supplyChainId: 99,
  };

  const mockProducts = [
    { id: 1, name: 'Product A', availableQuantity: 10 },
  ];

  const mockDistributors = [
    { id: 100, username: 'DistributorOne', role: 'DISTRIBUTOR' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ orderId: mockOrderId });
    useAuth.mockReturnValue({ currentUser: mockUser });
    useNavigate.mockReturnValue(mockNavigate);
  });

  test('renders order details after data loads', async () => {
    manufacturerApi.manufacturerService.getOrders.mockResolvedValueOnce({ data: [mockOrder] });
    manufacturerApi.manufacturerService.getProducts.mockResolvedValueOnce({ data: mockProducts });
    supplyChainApi.supplyChainService.getAssignedUsers.mockResolvedValueOnce({ data: mockDistributors });

    render(<OrderDetails />);

    await screen.findByText(/Order #ORD-001/i);
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    expect(screen.getByText(/Product A/)).toBeInTheDocument();
    expect(screen.getByText(/Create Production Batch/)).toBeInTheDocument();
  });

  test('displays error when order not found', async () => {
    manufacturerApi.manufacturerService.getOrders.mockResolvedValueOnce({ data: [] });

    render(<OrderDetails />);

    await screen.findByText(/Order not found/i);
  });

  test('displays fetch error message on API failure', async () => {
    manufacturerApi.manufacturerService.getOrders.mockRejectedValueOnce(new Error('API Error'));

    render(<OrderDetails />);

    await screen.findByText(/Failed to load order details/i);
  });

  test('navigates back to orders when clicking Back button', async () => {
    manufacturerApi.manufacturerService.getOrders.mockResolvedValueOnce({ data: [mockOrder] });
    manufacturerApi.manufacturerService.getProducts.mockResolvedValueOnce({ data: mockProducts });
    supplyChainApi.supplyChainService.getAssignedUsers.mockResolvedValueOnce({ data: mockDistributors });

    render(<OrderDetails />);

    await screen.findByText(/Order #ORD-001/i);

    fireEvent.click(screen.getByRole('button', { name: /Back to Orders/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/manufacturer/orders');
  });

  test('shows inventory warning when insufficient stock', async () => {
    const insufficientProducts = [{ id: 1, name: 'Product A', availableQuantity: 1 }];

    manufacturerApi.manufacturerService.getOrders.mockResolvedValueOnce({ data: [mockOrder] });
    manufacturerApi.manufacturerService.getProducts.mockResolvedValueOnce({ data: insufficientProducts });
    supplyChainApi.supplyChainService.getAssignedUsers.mockResolvedValueOnce({ data: mockDistributors });

    render(<OrderDetails />);

    await screen.findByText(/Insufficient inventory/i);
  });
});
