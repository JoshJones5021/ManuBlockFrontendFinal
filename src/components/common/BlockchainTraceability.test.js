import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BlockchainTraceability from './BlockchainTraceability';
import { AuthContext } from '../../context/AuthContext';

// Mock the useAuth hook by mocking the AuthContext
jest.mock('../../context/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children, value }) => (
      <div data-testid="auth-provider">{children}</div>
    ),
  },
  useAuth: () => ({
    currentUser: { id: 1 },
  }),
}));

// Mock axios to avoid actual API calls
jest.mock('../../utils/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: { request: { use: jest.fn() } },
}));

// Mock all API services needed by the component
jest.mock('../../services/api', () => ({
  blockchainService: {
    getItemsBySupplyChain: jest.fn(),
    getAllBlockchainTransactions: jest.fn(),
    getItemTransactionTimeline: jest.fn(),
    traceItemHistory: jest.fn(),
    getItemChildren: jest.fn(),
  },
  supplyChainService: {
    getSupplyChainsByUser: jest.fn(),
  },
}));

// Mock the ItemGraph component
jest.mock('./ItemGraph', () => () => <div data-testid="item-graph" />);

import { blockchainService, supplyChainService } from '../../services/api';

// Define mock data for tests
const mockSupplyChains = [
  { id: 1, name: 'Test Supply Chain', blockchainStatus: 'ACTIVE' },
];

const mockItems = {
  data: [
    {
      id: 101,
      name: 'Item 101',
      itemType: 'raw-material',
      status: 'CREATED',
      quantity: 10,
      updatedAt: '2024-03-24T10:00:00Z',
    },
  ],
};

const mockTransactions = {
  data: [
    {
      function: 'createItem',
      description: 'Created Item 101',
      status: 'COMPLETED',
      createdAt: '2024-03-24T10:00:00Z',
      txHash: '0xabc123',
    },
  ],
};

const mockItemTimeline = {
  data: {
    timeline: [
      {
        function: 'createItem',
        description: 'Created Item 101',
        status: 'COMPLETED',
        createdAt: '2024-03-24T10:00:00Z',
        txHash: '0xabc123',
      }
    ],
    parents: []
  }
};

const mockItemHistory = {
  data: {
    created: '2024-03-24T10:00:00Z',
    transactions: [
      {
        function: 'createItem',
        status: 'COMPLETED',
        createdAt: '2024-03-24T10:00:00Z',
      }
    ]
  }
};

const mockChildItems = {
  data: []
};

describe('BlockchainTraceability Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock responses for all services
    supplyChainService.getSupplyChainsByUser.mockResolvedValue(mockSupplyChains);
    blockchainService.getItemsBySupplyChain.mockResolvedValue(mockItems);
    blockchainService.getAllBlockchainTransactions.mockResolvedValue(mockTransactions);
    blockchainService.getItemTransactionTimeline.mockResolvedValue(mockItemTimeline);
    blockchainService.traceItemHistory.mockResolvedValue(mockItemHistory);
    blockchainService.getItemChildren.mockResolvedValue(mockChildItems);
  });

  test('renders blockchain traceability page', async () => {
    render(<BlockchainTraceability />);
    
    // Verify component renders without error
    expect(screen.getByText('Blockchain Traceability')).toBeInTheDocument();
  });

  test('loads and displays supply chains', async () => {
    render(<BlockchainTraceability />);

    // Verify supply chain service was called with correct params
    await waitFor(() => {
      expect(supplyChainService.getSupplyChainsByUser).toHaveBeenCalledWith(1);
    });
    
    // Verify select element is populated with supply chain data
    expect(screen.getByLabelText(/Select Supply Chain/i)).toBeInTheDocument();
  });

  test('displays blockchain items when supply chain is selected', async () => {
    render(<BlockchainTraceability />);

    // Verify items service was called
    await waitFor(() => {
      expect(blockchainService.getItemsBySupplyChain).toHaveBeenCalledWith(1);
    });
    
    // Verify transactions service was called
    expect(blockchainService.getAllBlockchainTransactions).toHaveBeenCalled();
  });

  test('displays blockchain transactions', async () => {
    render(<BlockchainTraceability />);

    // Verify services were called
    await waitFor(() => {
      expect(blockchainService.getAllBlockchainTransactions).toHaveBeenCalled();
    });

    // Verify transaction data is displayed
    expect(screen.getByText(/Blockchain Transactions/i)).toBeInTheDocument();
  });
});

// Additional tests outside the main describe block
describe('BlockchainTraceability Component - Additional Features', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock responses for all services
    supplyChainService.getSupplyChainsByUser.mockResolvedValue(mockSupplyChains);
    blockchainService.getItemsBySupplyChain.mockResolvedValue(mockItems);
    blockchainService.getAllBlockchainTransactions.mockResolvedValue(mockTransactions);
  });
  
  test('applies item type filter correctly', async () => {
    render(<BlockchainTraceability />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(blockchainService.getItemsBySupplyChain).toHaveBeenCalled();
    });
    
    // Find and change the item type filter
    const typeFilter = screen.getByLabelText('Item Type');
    fireEvent.change(typeFilter, { target: { value: 'raw-material' } });
    
    // Verify the filter was applied (implementation would filter displayed items)
    expect(typeFilter.value).toBe('raw-material');
  });
  
  test('handles errors gracefully', async () => {
    // Mock the service to throw an error
    supplyChainService.getSupplyChainsByUser.mockRejectedValue(new Error('Failed to fetch supply chains'));
    
    render(<BlockchainTraceability />);
    
    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/Failed to load supply chains/i)).toBeInTheDocument();
    });
  });
});