import React from 'react';
import { render, waitFor } from '@testing-library/react';
import SupplyChainView from './SupplyChainView';
import { MemoryRouter } from 'react-router-dom';

// ✅ Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { id: 1, username: 'testUser' } }),
}));

// ✅ Mock react-router-dom useParams and useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ chainId: '123' }),
  useNavigate: () => jest.fn(),
}));

// ✅ Correctly MOCK reactflow INCLUDING default export (ReactFlow component)
jest.mock('reactflow', () => ({
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  ReactFlowProvider: ({ children }) => <div>{children}</div>,
  Background: () => <div data-testid="background-mock" />,
  Controls: () => <div data-testid="controls-mock" />,
  MarkerType: { ArrowClosed: 'arrowclosed' },
  addEdge: jest.fn(),
  // ✅ THE FIX: Proper mock of the ReactFlow component
  __esModule: true,
  default: () => <div data-testid="reactflow-mock" />,
}));

// ✅ Mock supplyChain service fully
jest.mock('../../services/supplyChain', () => ({
  getSupplyChainById: jest.fn().mockResolvedValue({
    data: {
      blockchainStatus: 'DRAFT',
      name: 'Test Supply Chain',
      description: 'Test Description',
      nodes: [],
      edges: [],
    },
  }),
  deleteNode: jest.fn(),
  deleteEdge: jest.fn(),
  addNode: jest.fn(),
  updateNode: jest.fn(),
  addEdge: jest.fn(),
  finalizeSupplyChain: jest.fn(),
}));

// ✅ Mock adminService
jest.mock('../../services/api', () => ({
  adminService: {
    getAllUsers: jest.fn().mockResolvedValue({ data: [] }),
    getNodeAuthorizationStatus: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('SupplyChainView', () => {
  test('fetches supply chain data and renders without crashing', async () => {
    render(
      <MemoryRouter>
        <SupplyChainView />
      </MemoryRouter>
    );

    await waitFor(() => {
      const { getSupplyChainById } = require('../../services/supplyChain');
      expect(getSupplyChainById).toHaveBeenCalledWith('123');
    });
  });
});
