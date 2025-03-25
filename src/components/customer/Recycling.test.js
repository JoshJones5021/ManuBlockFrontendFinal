import React from 'react';
import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react';
import Recycling from './Recycling';
import { customerService, blockchainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../services/api', () => ({
  customerService: {
    getOrders: jest.fn(),
    getChurnedProducts: jest.fn(),
    getRecyclingTransports: jest.fn(),
    markProductForRecycling: jest.fn(),
  },
  blockchainService: {
    getItemsByOwner: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, name: 'Test User', email: 'test@example.com' },
  }),
}));

describe('Recycling Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles API error gracefully', async () => {
    customerService.getOrders.mockRejectedValue(new Error('API Error'));
    customerService.getChurnedProducts.mockResolvedValue({ data: [] });
    customerService.getRecyclingTransports.mockResolvedValue({ data: [] });
    blockchainService.getItemsByOwner.mockResolvedValue({ data: [] });

    await act(async () => render(<Recycling />));

    await waitFor(() => {
      expect(screen.getByText('Failed to load recycling data. Please try again later.')).toBeInTheDocument();
    });
  });

  test('marks product for recycling successfully', async () => {
    customerService.getOrders.mockResolvedValue({
      data: [
        {
          id: 1,
          orderNumber: 'ORD-001',
          status: 'Completed',
          createdAt: '2023-03-10T10:00:00Z',
          actualDeliveryDate: '2023-03-12T10:00:00Z',
          items: [{ id: 101, productName: 'Bottle', quantity: 1 }],
        },
      ],
    });

    customerService.getChurnedProducts.mockResolvedValue({ data: [] });
    customerService.getRecyclingTransports.mockResolvedValue({ data: [] });
    blockchainService.getItemsByOwner.mockResolvedValue({
      data: [{ id: 201, name: 'Bottle', status: 'DELIVERED' }],
    });

    await act(async () => render(<Recycling />));

    await waitFor(() => {
      expect(screen.getByText('Products Available for Recycling')).toBeInTheDocument();
    });

    // Find the Recycle button by role for robustness
    const recycleButton = screen.getByRole('button', { name: /Recycle This Product/i });
    fireEvent.click(recycleButton);

    // Fill Churn Modal form
    fireEvent.change(screen.getByPlaceholderText('Enter address for pickup'), {
      target: { value: '123 Green St.' },
    });

    fireEvent.change(screen.getByPlaceholderText('Please describe the condition of the product and reason for recycling'), {
      target: { value: 'Used once, good condition.' },
    });

    customerService.markProductForRecycling.mockResolvedValueOnce({});

    const confirmBtn = screen.getByRole('button', { name: /Confirm Recycling/i });
    await act(async () => fireEvent.click(confirmBtn));

    await waitFor(() => {
      expect(customerService.markProductForRecycling).toHaveBeenCalled();
      expect(screen.getByText('Product has been marked for recycling. You will be notified when pickup is arranged.')).toBeInTheDocument();
    });
  });
});
