import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MaterialRequestsList from './MaterialRequestsList';
import { manufacturerService, supplierService, supplyChainService } from '../../services/api';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1 }
  }),
}));

// Mock the CreateMaterialRequestModal component
jest.mock('./CreateMaterialRequestModal', () => (props) => (
  <div data-testid="create-material-request-modal">
    <form data-testid="material-request-form" onSubmit={props.onSubmit}>
      <button type="submit" data-testid="submit-button">Create</button>
      <button type="button" data-testid="cancel-button" onClick={props.onCancel}>Cancel</button>
    </form>
  </div>
));

// Mock services
jest.mock('../../services/api', () => ({
  manufacturerService: {
    getMaterialRequests: jest.fn(),
    getOrders: jest.fn(),
    requestMaterials: jest.fn(),
  },
  supplierService: {
    getAllSuppliers: jest.fn(),
    getMaterials: jest.fn(),
  },
  supplyChainService: {
    getSupplyChainsByUser: jest.fn(),
  },
}));

describe('MaterialRequestsList Component', () => {
  const mockMaterialRequests = [
    {
      id: 1,
      requestNumber: 'REQ001',
      supplierId: 101,
      supplyChainId: 201,
      status: 'Requested',
      createdAt: '2024-03-15T10:00:00Z',
      requestedDeliveryDate: '2024-03-25T10:00:00Z',
      actualDeliveryDate: null,
      items: [{ materialId: 401, quantity: 10 }],
      blockchainTxHash: '0xabc123'
    },
  ];

  const mockSuppliers = [
    { id: 101, username: 'Supplier A' }
  ];

  const mockSupplyChains = [
    {
      id: 201,
      name: 'Chain A',
      blockchainStatus: 'FINALIZED',
      nodes: [{ role: 'SUPPLIER', assignedUserId: 101 }]
    }
  ];

  const mockMaterials = [
    { id: 401, name: 'Material A', unit: 'kg', active: true, supplier: { id: 101 } }
  ];

  const mockOrders = [
    { id: 501, orderNumber: 'ORD001', status: 'Requested' }
  ];

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <MaterialRequestsList />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();

    manufacturerService.getMaterialRequests.mockResolvedValue({ data: mockMaterialRequests });
    manufacturerService.getOrders.mockResolvedValue({ data: mockOrders });
    supplierService.getAllSuppliers.mockResolvedValue({ data: mockSuppliers });
    supplierService.getMaterials.mockResolvedValue({ data: mockMaterials });
    supplyChainService.getSupplyChainsByUser.mockResolvedValue(mockSupplyChains);
    manufacturerService.requestMaterials.mockResolvedValue({ data: { id: 2, requestNumber: 'REQ002' } });
  });

  test('renders fetched material requests', async () => {
    renderComponent();
    await screen.findByText('REQ001');
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('Chain A')).toBeInTheDocument();
    expect(screen.getByText('Requested')).toBeInTheDocument();
  });

  test('renders empty state if no requests', async () => {
    manufacturerService.getMaterialRequests.mockResolvedValueOnce({ data: [] });
    renderComponent();
    await screen.findByText(/No material requests found/i);
  });

  test('opens and closes the create modal', async () => {
    renderComponent();
    await screen.findByText('REQ001');
    fireEvent.click(screen.getByRole('button', { name: /Create New Request/i }));
    expect(screen.getByTestId('create-material-request-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cancel-button'));
    await waitFor(() => expect(screen.queryByTestId('create-material-request-modal')).not.toBeInTheDocument());
  });

  test('disables create button if no supply chain', async () => {
    supplyChainService.getSupplyChainsByUser.mockResolvedValueOnce([]);
    renderComponent();
    await screen.findByText(/You need to be part of a finalized supply chain/i);
    const createBtn = screen.getByRole('button', { name: /Create New Request/i });
    expect(createBtn).toBeDisabled();
  });

  test('renders view details link', async () => {
    renderComponent();
    await screen.findByText('REQ001');
    const viewLink = screen.getByText('View Details');
    expect(viewLink).toBeInTheDocument();
    expect(viewLink.closest('a')).toHaveAttribute('href', '/manufacturer/material-requests/1');
  });

  test('handles missing or empty data fields', async () => {
    const modifiedRequests = [{
      ...mockMaterialRequests[0],
      requestedDeliveryDate: null,
      items: [],
    }];
    manufacturerService.getMaterialRequests.mockResolvedValueOnce({ data: modifiedRequests });
    renderComponent();
    await screen.findByText('REQ001');
    expect(screen.getByText(/No date specified/i)).toBeInTheDocument();
  });
});
