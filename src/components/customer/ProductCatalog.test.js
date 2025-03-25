import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ProductCatalog from './ProductCatalog';
import { customerService, supplyChainService } from '../../services/api';

jest.mock('../../services/api', () => ({
  customerService: {
    getAvailableProducts: jest.fn(),
    createOrder: jest.fn(),
  },
  supplyChainService: {
    getSupplyChainsByUser: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, name: 'Test User', email: 'test@example.com', address: '123 Main St' },
  }),
}));

describe('ProductCatalog Component', () => {
  const mockProducts = [
    { id: 1, name: 'Eco Bottle', description: 'Reusable bottle', price: 19.99, sku: 'ECO-001', supplyChainId: 101 },
    { id: 2, name: 'Bamboo Straw', description: 'Sustainable straw', price: 5.99, sku: 'BAM-002', supplyChainId: 102 },
  ];

  const mockSupplyChains = [
    { id: 101, name: 'Eco Supply Chain', blockchainStatus: 'FINALIZED' },
    { id: 102, name: 'Bamboo Chain', blockchainStatus: 'CONFIRMED' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders product catalog with products', async () => {
    customerService.getAvailableProducts.mockResolvedValueOnce({ data: mockProducts });
    supplyChainService.getSupplyChainsByUser.mockResolvedValueOnce(mockSupplyChains);

    await act(async () => {
      render(<ProductCatalog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Eco Bottle')).toBeInTheDocument();
      expect(screen.getByText('Bamboo Straw')).toBeInTheDocument();
      expect(screen.getByText('Product Catalog')).toBeInTheDocument();
    });
  });

  test('displays error if product fetch fails', async () => {
    customerService.getAvailableProducts.mockRejectedValueOnce(new Error('API Error'));
    supplyChainService.getSupplyChainsByUser.mockResolvedValueOnce(mockSupplyChains);

    await act(async () => {
      render(<ProductCatalog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load products. Please try again later.')).toBeInTheDocument();
    });
  });

  test('filters products by search term', async () => {
    customerService.getAvailableProducts.mockResolvedValueOnce({ data: mockProducts });
    supplyChainService.getSupplyChainsByUser.mockResolvedValueOnce(mockSupplyChains);

    await act(async () => {
      render(<ProductCatalog />);
    });

    await waitFor(() => screen.getByText('Eco Bottle'));

    const searchInput = screen.getByPlaceholderText('Search by name or description...');
    fireEvent.change(searchInput, { target: { value: 'Bamboo' } });

    await waitFor(() => {
      expect(screen.getByText('Bamboo Straw')).toBeInTheDocument();
      expect(screen.queryByText('Eco Bottle')).not.toBeInTheDocument();
    });
  });

  test('filters products by supply chain', async () => {
    customerService.getAvailableProducts.mockResolvedValueOnce({ data: mockProducts });
    supplyChainService.getSupplyChainsByUser.mockResolvedValueOnce(mockSupplyChains);

    await act(async () => {
      render(<ProductCatalog />);
    });

    await waitFor(() => screen.getByText('Eco Bottle'));

    const chainSelect = screen.getByLabelText('Supply Chain');
    fireEvent.change(chainSelect, { target: { value: '101' } });

    await waitFor(() => {
      expect(screen.getByText('Eco Bottle')).toBeInTheDocument();
      expect(screen.queryByText('Bamboo Straw')).not.toBeInTheDocument();
    });
  });
});
