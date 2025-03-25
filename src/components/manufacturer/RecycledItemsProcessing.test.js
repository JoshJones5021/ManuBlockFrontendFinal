// src/components/manufacturer/RecycledItemsProcessing.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecycledItemsProcessing from './RecycledItemsProcessing';

// ✅ Full mock of AuthContext module to prevent loading api.js or axios
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, name: 'Mock Manufacturer' }
  })
}));

// ✅ Full mock of manufacturerService to avoid any axios calls
jest.mock('../../services/api', () => ({
  manufacturerService: {
    getPendingRecycledItems: jest.fn(),
    getRecycledMaterials: jest.fn(),
    getAvailableMaterials: jest.fn(),
    processToMaterials: jest.fn(),
  }
}));

// ✅ Mock the Modal to avoid extra logic
jest.mock('./ProcessMaterialsModal', () => (props) => (
  <div data-testid="process-materials-modal">
    <button onClick={props.onSubmit}>Submit Materials</button>
  </div>
));

describe('RecycledItemsProcessing Component - FULL MOCK', () => {
  const pendingItemsMock = [
    {
      id: 'item1',
      productName: 'Mock Laptop',
      productType: 'Electronics',
      customerName: 'Alice',
      receivedDate: '2024-03-20T00:00:00Z',
      status: 'RECYCLING_RECEIVED',
      originalSupplyChainId: 99,
    },
  ];

  const recycledMaterialsMock = [
    {
      id: 'mat1',
      name: 'Recycled Aluminum',
      quantity: 50,
      unit: 'kg',
      blockchainItemId: '0xMOCKCHAIN',
    },
  ];

  beforeEach(() => {
    const { manufacturerService } = require('../../services/api');
    manufacturerService.getPendingRecycledItems.mockResolvedValue({ data: pendingItemsMock });
    manufacturerService.getRecycledMaterials.mockResolvedValue({ data: recycledMaterialsMock });
    manufacturerService.getAvailableMaterials.mockResolvedValue({ data: [] });
    manufacturerService.processToMaterials.mockResolvedValue({});
  });

  afterEach(() => jest.clearAllMocks());

  test('renders pending items and recycled materials', async () => {
    render(<RecycledItemsProcessing />);
    expect(screen.getByText(/Recycled Items Management/i)).toBeInTheDocument();

    expect(await screen.findByText('Mock Laptop')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Recycled Aluminum')).toBeInTheDocument();
    expect(screen.getByText('50 kg')).toBeInTheDocument();
  });

  test('displays empty state when no pending items', async () => {
    const { manufacturerService } = require('../../services/api');
    manufacturerService.getPendingRecycledItems.mockResolvedValue({ data: [] });
    render(<RecycledItemsProcessing />);
    expect(await screen.findByText(/No items are waiting to be processed/i)).toBeInTheDocument();
  });

  test('displays empty state when no recycled materials', async () => {
    const { manufacturerService } = require('../../services/api');
    manufacturerService.getRecycledMaterials.mockResolvedValue({ data: [] });
    render(<RecycledItemsProcessing />);
    expect(await screen.findByText(/No recycled materials available/i)).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    const { manufacturerService } = require('../../services/api');
    manufacturerService.getPendingRecycledItems.mockRejectedValue(new Error('Failed'));
    render(<RecycledItemsProcessing />);
    expect(await screen.findByText(/Failed to load recycling data/i)).toBeInTheDocument();
  });

  test('renders status badge correctly', async () => {
    render(<RecycledItemsProcessing />);
    expect(await screen.findByText('Received')).toBeInTheDocument();
  });
});
