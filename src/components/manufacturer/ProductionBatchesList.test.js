import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProductionBatchesList from './ProductionBatchesList';
import { manufacturerService, supplyChainService } from '../../services/api';

jest.mock('../../services/api', () => ({
  manufacturerService: {
    getProductionBatches: jest.fn(),
    getProducts: jest.fn(),
    getOrders: jest.fn(),
    getAvailableMaterialsWithBlockchainIds: jest.fn(),
    createProductionBatch: jest.fn(),
    completeProductionBatch: jest.fn(),
    rejectProductionBatch: jest.fn(),
  },
  supplyChainService: {
    getSupplyChainsByUser: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1 },
  }),
}));

jest.mock('./CreateProductionBatchModal', () => (props) => (
  <div data-testid="create-batch-modal">
    <button data-testid="modal-submit" onClick={() => props.onSubmit({ preventDefault: () => {} })}>Submit</button>
    <button data-testid="modal-cancel" onClick={props.onCancel}>Cancel</button>
  </div>
));

jest.mock('./CompleteBatchModal', () => (props) => (
  <div data-testid="complete-batch-modal">
    <button data-testid="complete-submit" onClick={() => props.onSubmit({ preventDefault: () => {} })}>Submit</button>
    <button data-testid="complete-cancel" onClick={props.onCancel}>Cancel</button>
  </div>
));

jest.mock('./RejectBatchModal', () => (props) => (
  <div data-testid="reject-batch-modal">
    <button data-testid="reject-submit" onClick={() => props.onSubmit({ preventDefault: () => {} })}>Submit</button>
    <button data-testid="reject-cancel" onClick={props.onCancel}>Cancel</button>
  </div>
));

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe('ProductionBatchesList Component', () => {
  const mockBatches = [
    {
      id: 1,
      batchNumber: 'BATCH001',
      status: 'In Production',
      quantity: 10,
      startDate: '2024-03-10T00:00:00Z',
      blockchainItemId: 'blockchain123',
      product: { id: 101, name: 'Test Product' },
      supplyChainId: 1,
      supplyChainName: 'Test Supply Chain',
    },
  ];

  const mockProducts = [
    { id: 101, name: 'Test Product', active: true, materials: [{ materialId: 201, quantity: 2 }] },
  ];

  const mockSupplyChains = [
    { id: 1, name: 'Test Supply Chain', blockchainStatus: 'FINALIZED' },
  ];

  const mockOrders = [
    {
      id: 201,
      orderNumber: 'ORD123',
      status: 'Requested',
      items: [{ productId: 101, quantity: 5 }],
      supplyChainId: 1,
    },
  ];

  const mockMaterialInventory = [
    {
      id: 201,
      blockchainItemId: 'material123',
      name: 'Test Material',
      itemType: 'allocated-material',
      quantity: 100,
      unit: 'kg',
      ownerId: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    manufacturerService.getProductionBatches.mockResolvedValue({ data: mockBatches });
    manufacturerService.getProducts.mockResolvedValue({ data: mockProducts });
    manufacturerService.getOrders.mockResolvedValue({ data: mockOrders });
    supplyChainService.getSupplyChainsByUser.mockResolvedValue(mockSupplyChains);
    manufacturerService.getAvailableMaterialsWithBlockchainIds.mockResolvedValue({ data: mockMaterialInventory });
    manufacturerService.createProductionBatch.mockResolvedValue({ data: { id: 3 } });
    manufacturerService.completeProductionBatch.mockResolvedValue({ data: { success: true } });
    manufacturerService.rejectProductionBatch.mockResolvedValue({ data: { success: true } });
  });

  test('renders production batches after loading', async () => {
    render(<ProductionBatchesList />);
    await screen.findByText(/BATCH001/);
  });

  test('handles error during data loading', async () => {
    manufacturerService.getProductionBatches.mockRejectedValueOnce(new Error('Network Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<ProductionBatchesList />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});