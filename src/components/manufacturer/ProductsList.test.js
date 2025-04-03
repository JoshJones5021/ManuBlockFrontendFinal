import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ProductsList from './ProductsList';
import { manufacturerService, supplierService, supplyChainService } from '../../services/api';

// ✅ Mock services
jest.mock('../../services/api', () => ({
  manufacturerService: {
    getProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deactivateProduct: jest.fn(),
  },
  supplierService: {
    getMaterials: jest.fn(),
  },
  supplyChainService: {
    getSupplyChainsByUser: jest.fn(),
    getSupplyChainById: jest.fn(),
  },
}));

// ✅ Mock useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1 },
  }),
}));

// ✅ Mock modals
jest.mock('./CreateProductModal', () => (props) => (
  <div data-testid="create-product-modal">
    <button onClick={() => props.onSubmit({ preventDefault: () => {} }, props.initialFormData)}>
      Submit
    </button>
    <button onClick={props.onCancel}>Cancel</button>
  </div>
));

jest.mock('./EditProductModal', () => (props) => (
  <div data-testid="edit-product-modal">
    <button onClick={() => props.onSubmit({ preventDefault: () => {} }, props.initialFormData)}>
      Submit
    </button>
    <button onClick={props.onCancel}>Cancel</button>
  </div>
));

describe('ProductsList Component', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'Test Product 1',
      description: 'Test Description 1',
      specifications: 'Test Specs 1',
      sku: 'TP001',
      price: 99.99,
      active: true,
      materials: [
        { materialId: 101, materialName: 'Material 1', quantity: 5, unit: 'kg' },
      ],
    },
    {
      id: 2,
      name: 'Test Product 2',
      description: 'Test Description 2',
      specifications: 'Test Specs 2',
      sku: 'TP002',
      price: 149.99,
      active: true,
      materials: [],
    },
  ];

  const mockSupplyChains = [
    {
      id: 1,
      name: 'Test Supply Chain',
      blockchainStatus: 'FINALIZED',
      nodes: [
        { id: 'node1', role: 'SUPPLIER', assignedUserId: 101 },
      ],
    },
  ];

  const mockMaterials = [
    {
      id: 101,
      name: 'Test Material',
      unit: 'kg',
      active: true,
      supplier: { id: 101, username: 'Test Supplier' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    manufacturerService.getProducts.mockResolvedValue({ data: mockProducts });
    supplyChainService.getSupplyChainsByUser.mockResolvedValue(mockSupplyChains);
    supplierService.getMaterials.mockResolvedValue({ data: mockMaterials });
    supplyChainService.getSupplyChainById.mockResolvedValue({
      data: mockSupplyChains[0],
    });
  });

  test('renders product list after loading', async () => {
    await act(async () => {
      render(<ProductsList />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });
  });

  test('shows empty state when no products are available', async () => {
    manufacturerService.getProducts.mockResolvedValueOnce({ data: [] });

    await act(async () => {
      render(<ProductsList />);
    });

    await waitFor(() => {
      expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    });
  });

  test('opens create product modal when create button is clicked', async () => {
    await act(async () => {
      render(<ProductsList />);
    });

    await screen.findByText('Create New Product');
    const createBtn = screen.getByText('Create New Product');
    fireEvent.click(createBtn);

    expect(screen.getByTestId('create-product-modal')).toBeInTheDocument();
  });

  test('opens edit product modal when edit button is clicked', async () => {
    await act(async () => {
      render(<ProductsList />);
    });

    await screen.findAllByText('Edit');
    const editBtn = screen.getAllByText('Edit')[0];
    fireEvent.click(editBtn);

    expect(screen.getByTestId('edit-product-modal')).toBeInTheDocument();
  });

  test('handles product deactivation', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    manufacturerService.deactivateProduct.mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      render(<ProductsList />);
    });

    await screen.findAllByText('Deactivate');
    const deactivateBtn = screen.getAllByText('Deactivate')[0];
    fireEvent.click(deactivateBtn);

    await waitFor(() => {
      expect(manufacturerService.deactivateProduct).toHaveBeenCalledWith(1);
    });
  });

  test('handles errors during data loading', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    manufacturerService.getProducts.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(<ProductsList />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load products/i)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});
