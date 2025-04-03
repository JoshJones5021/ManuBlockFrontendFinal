import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import OrdersList from './OrdersList';
import { useAuth } from '../../context/AuthContext';
import { manufacturerService } from '../../services/api';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock useAuth
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock manufacturerService
jest.mock('../../services/api', () => ({
  manufacturerService: {
    getOrders: jest.fn(),
    getProducts: jest.fn(),
  },
}));

// Mock Link to avoid react-router-dom dependency
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe('OrdersList', () => {
  const mockUser = { id: 'manufacturer-123' };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: mockUser });
  });

  test('renders empty state when no orders are returned', async () => {
    manufacturerService.getOrders.mockResolvedValue({ data: [] });
    manufacturerService.getProducts.mockResolvedValue({ data: [] });

    render(
      <Router>
        <OrdersList />
      </Router>
    );

    await screen.findByText('No orders found for manufacturing.');
  });

  test('renders error message when fetching orders fails', async () => {
    manufacturerService.getOrders.mockRejectedValue(new Error('API Error'));
    manufacturerService.getProducts.mockResolvedValue({ data: [] });

    render(
      <Router>
        <OrdersList />
      </Router>
    );

    await screen.findByText('Failed to load orders. Please try again later.');
  });

  test('renders fetched orders with status badges and actions', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        customerName: 'Customer A',
        createdAt: '2024-03-24T10:00:00Z',
        status: 'Requested',
        items: [
          { productId: 'prod-1', quantity: 5 },
          { productId: 'prod-2', quantity: 3 },
        ],
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-002',
        customerName: 'Customer B',
        createdAt: '2024-03-22T12:00:00Z',
        status: 'Delivered',
        items: [{ productId: 'prod-3', quantity: 2 }],
      },
    ];

    const mockProducts = [
      { id: 'prod-1', availableQuantity: 10 },
      { id: 'prod-2', availableQuantity: 5 },
      { id: 'prod-3', availableQuantity: 0 },
    ];

    manufacturerService.getOrders.mockResolvedValue({ data: mockOrders });
    manufacturerService.getProducts.mockResolvedValue({ data: mockProducts });

    render(
      <Router>
        <OrdersList />
      </Router>
    );

    // Verify orders render
    await screen.findByText('ORD-001');
    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();

    // Check status badge
    expect(screen.getByText('Requested')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();

    // Check Inventory status shows "In Stock" for order-1
    expect(screen.getByText('In Stock')).toBeInTheDocument();

    // Check "View Details" link exists
    expect(screen.getAllByText('View Details').length).toBeGreaterThan(0);

    // Ensure Fulfill Order button shows for order-1
    expect(screen.getByText('Fulfill Order')).toBeInTheDocument();
  });

  test('renders "Insufficient" inventory when stock is low', async () => {
    const mockOrders = [
      {
        id: 'order-3',
        orderNumber: 'ORD-003',
        customerName: 'Customer C',
        createdAt: '2024-03-23T10:00:00Z',
        status: 'Requested',
        items: [{ productId: 'prod-low', quantity: 10 }],
      },
    ];

    const mockProducts = [{ id: 'prod-low', availableQuantity: 5 }];

    manufacturerService.getOrders.mockResolvedValue({ data: mockOrders });
    manufacturerService.getProducts.mockResolvedValue({ data: mockProducts });

    render(
      <Router>
        <OrdersList />
      </Router>
    );

    await screen.findByText('ORD-003');

    expect(screen.getByText('Insufficient')).toBeInTheDocument();
    expect(screen.getByText('Create Production')).toBeInTheDocument();
  });
});
