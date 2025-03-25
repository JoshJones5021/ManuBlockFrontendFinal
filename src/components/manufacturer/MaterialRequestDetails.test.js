import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MaterialRequestDetails from './MaterialRequestDetails';

// ✅ Mock AuthContext - correct path
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, name: 'Test User', role: 'MANUFACTURER' },
  }),
}));

// ✅ Mock API
jest.mock('../../services/api', () => ({
  manufacturerService: { getMaterialRequestById: jest.fn() },
  supplierService: { getAllSuppliers: jest.fn() },
  blockchainService: { getBlockchainTransactionDetails: jest.fn() },
}));

import { manufacturerService, supplierService, blockchainService } from '../../services/api';

const renderWithRouter = (ui) =>
  render(
    <MemoryRouter initialEntries={['/manufacturer/material-requests/1']}>
      <Routes>
        <Route path="/manufacturer/material-requests/:requestId" element={ui} />
      </Routes>
    </MemoryRouter>
  );

describe('MaterialRequestDetails - Fixed Tests', () => {
  afterEach(() => jest.clearAllMocks());

  test('renders material request details', async () => {
    manufacturerService.getMaterialRequestById.mockResolvedValueOnce({
      data: { id: 1, description: 'Test Request', supplierId: 101, status: 'PENDING', requestNumber: 'MR-001', items: [] },
    });
    supplierService.getAllSuppliers.mockResolvedValueOnce({
      data: [{ id: 101, username: 'Supplier A' }],
    });

    await act(async () => {
      renderWithRouter(<MaterialRequestDetails />);
    });

    await waitFor(() => {
      expect(screen.getByText('Material Request Details')).toBeInTheDocument();
      expect(screen.getByText('Supplier A')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });
  });

  test('shows error message on API failure', async () => {
    manufacturerService.getMaterialRequestById.mockRejectedValueOnce(new Error('API Error'));
    supplierService.getAllSuppliers.mockResolvedValueOnce({ data: [] });

    await act(async () => {
      renderWithRouter(<MaterialRequestDetails />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load material request details/i)).toBeInTheDocument();
    });
  });

  test('fetches blockchain data if blockchainTxHash exists', async () => {
    manufacturerService.getMaterialRequestById.mockResolvedValueOnce({
      data: {
        id: 1,
        description: 'Blockchain Test',
        blockchainTxHash: '0xabc123',
        supplierId: 101,
        status: 'PENDING',
        requestNumber: 'MR-002',
        items: [],
      },
    });
    supplierService.getAllSuppliers.mockResolvedValueOnce({
      data: [{ id: 101, username: 'Supplier A' }],
    });
    blockchainService.getBlockchainTransactionDetails.mockResolvedValueOnce({
      data: { txHash: '0xabc123', status: 'Confirmed' },
    });

    await act(async () => {
      renderWithRouter(<MaterialRequestDetails />);
    });

    await waitFor(() => {
      expect(screen.getByText('Material Request Details')).toBeInTheDocument();
      expect(screen.getByText('Supplier A')).toBeInTheDocument();
      expect(screen.getByText('0xabc123')).toBeInTheDocument();
    });
  });
});
