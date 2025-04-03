// Mock external dependencies before imports
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })),
  defaults: {
    headers: {
      common: {}
    }
  },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SupplyChainsList from './SupplyChainsList';
import { supplyChainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Mock the API services
jest.mock('../../services/api', () => ({
  supplyChainService: {
    getSupplyChains: jest.fn(),
    getSupplyChainsByUser: jest.fn(),
    createSupplyChain: jest.fn(),
    deleteSupplyChain: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('SupplyChainsList Component', () => {
  // Mock data
  const mockAdminUser = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN'
  };
  
  const mockRegularUser = {
    id: 2,
    username: 'user',
    email: 'user@example.com',
    role: 'USER'
  };
  
  const mockSupplyChains = [
    {
      id: 1,
      name: 'Supply Chain 1',
      description: 'Description for Supply Chain 1',
      blockchainStatus: 'FINALIZED',
      createdBy: { id: 1, username: 'admin' },
      nodes: Array(5).fill({}),
      edges: Array(4).fill({})
    },
    {
      id: 2,
      name: 'Supply Chain 2',
      description: 'Description for Supply Chain 2',
      blockchainStatus: 'PENDING',
      createdBy: { id: 2, username: 'user' },
      nodes: Array(3).fill({}),
      edges: Array(2).fill({})
    },
    {
      id: 3,
      name: 'Supply Chain 3',
      description: 'Description for Supply Chain 3',
      blockchainStatus: 'FAILED',
      createdBy: { id: 1, username: 'admin' },
      nodes: Array(2).fill({}),
      edges: Array(1).fill({})
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    
    // Set default mock responses
    supplyChainService.getSupplyChains.mockResolvedValue({ data: mockSupplyChains });
    supplyChainService.getSupplyChainsByUser.mockResolvedValue({ data: mockSupplyChains.filter(chain => chain.createdBy.id === mockRegularUser.id) });
    supplyChainService.createSupplyChain.mockResolvedValue({ data: { id: 4, ...mockSupplyChains[0], name: 'New Supply Chain' } });
    supplyChainService.deleteSupplyChain.mockResolvedValue({ success: true });
    
    // Default to admin user
    useAuth.mockReturnValue({ currentUser: mockAdminUser });
  });
  
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SupplyChainsList />
      </BrowserRouter>
    );
  };
  
  test('fetches and displays supply chains for admin user', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(supplyChainService.getSupplyChains).toHaveBeenCalled();
    });
    
    // Should show all supply chains
    expect(screen.getByText('Supply Chain 1')).toBeInTheDocument();
    expect(screen.getByText('Supply Chain 2')).toBeInTheDocument();
    expect(screen.getByText('Supply Chain 3')).toBeInTheDocument();
    
    // Check status badges
    const finalized = screen.getByText('FINALIZED');
    const pending = screen.getByText('PENDING');
    const failed = screen.getByText('FAILED');
    
    expect(finalized).toHaveClass('bg-blue-100');
    expect(pending).toHaveClass('bg-yellow-100');
    expect(failed).toHaveClass('bg-red-100');
  });
  
  test('fetches and displays supply chains for regular user', async () => {
    // Mock as regular user
    useAuth.mockReturnValue({ currentUser: mockRegularUser });
    
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(supplyChainService.getSupplyChainsByUser).toHaveBeenCalledWith(mockRegularUser.id);
    });
    
    // Should only show supply chains created by this user
    expect(screen.getByText('Supply Chain 2')).toBeInTheDocument();
    expect(screen.queryByText('Supply Chain 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Supply Chain 3')).not.toBeInTheDocument();
  });
  
  test('opens and submits create supply chain modal', async () => {
    await act(async () => {
      renderComponent();
    });
    
    // Click on create button
    const createButton = screen.getByText('Create New Supply Chain');
    await act(async () => {
      fireEvent.click(createButton);
    });
    
    // Fill in the form
    const nameInput = screen.getByLabelText('Name');
    const descriptionInput = screen.getByLabelText('Description');
    
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Test Supply Chain' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test description' } });
    });
    
    // Submit the form
    const submitButton = screen.getByText('Create Supply Chain');
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Verify API call
    expect(supplyChainService.createSupplyChain).toHaveBeenCalledWith({
      name: 'New Test Supply Chain',
      description: 'This is a test description',
      createdBy: mockAdminUser.id
    });
    
    // Modal should close and fetch should be called again
    await waitFor(() => {
      expect(screen.queryByText('Create New Supply Chain')).toBeInTheDocument();
      expect(supplyChainService.getSupplyChains).toHaveBeenCalledTimes(2);
    });
  });
  
  test('handles API error when fetching supply chains', async () => {
    // Mock API error
    supplyChainService.getSupplyChains.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    await act(async () => {
      renderComponent();
    });
    
    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load supply chains. Please try again later.')).toBeInTheDocument();
    });
  });
  
  test('handles API error when creating supply chain', async () => {
    // Mock API error
    supplyChainService.createSupplyChain.mockRejectedValueOnce(new Error('Failed to create'));
    
    await act(async () => {
      renderComponent();
    });
    
    // Open create modal
    const createButton = screen.getByText('Create New Supply Chain');
    await act(async () => {
      fireEvent.click(createButton);
    });
    
    // Submit form with minimal data
    const nameInput = screen.getByLabelText('Name');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test' } });
    });
    
    const submitButton = screen.getByText('Create Supply Chain');
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to create supply chain. Please try again.')).toBeInTheDocument();
    });
  });
  
  test('filters supply chains based on status', async () => {
    await act(async () => {
      renderComponent();
    });
    
    // Open filter menu
    const filterButton = screen.getByText('Filter');
    await act(async () => {
      fireEvent.click(filterButton);
    });
    
    // Select 'Finalized Only'
    const finalizedFilter = screen.getByText('Finalized Only');
    await act(async () => {
      fireEvent.click(finalizedFilter);
    });
    
    // Should only show finalized chains
    expect(screen.getByText('Supply Chain 1')).toBeInTheDocument();
    expect(screen.queryByText('Supply Chain 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Supply Chain 3')).not.toBeInTheDocument();
    
    // Open filter menu again
    await act(async () => {
      fireEvent.click(filterButton);
    });
    
    // Select 'Not Finalized'
    const notFinalizedFilter = screen.getByText('Not Finalized');
    await act(async () => {
      fireEvent.click(notFinalizedFilter);
    });
    
    // Should only show non-finalized chains
    await waitFor(() => {
      expect(screen.queryByText('Supply Chain 1')).not.toBeInTheDocument();
      expect(screen.getByText('Supply Chain 2')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain 3')).toBeInTheDocument();
    });
  });
  
  test('handles hiding and showing supply chains', async () => {
    await act(async () => {
      renderComponent();
    });
    
    // Find the hide button for a chain
    const firstChain = screen.getByText('Supply Chain 1').closest('.bg-white');
    const hideButton = within(firstChain).getByTitle('Hide supply chain');
    
    // Click the hide button
    await act(async () => {
      fireEvent.click(hideButton);
    });
    
    // The chain should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Supply Chain 1')).not.toBeInTheDocument();
      expect(screen.getByText('Supply Chain 2')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain 3')).toBeInTheDocument();
    });
    
    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('hiddenSupplyChains', JSON.stringify([1]));
    
    // Open filter menu to show hidden chains
    const filterButton = screen.getByText('Filter');
    await act(async () => {
      fireEvent.click(filterButton);
    });
    
    // Click "Show Hidden" button
    const showHiddenButton = screen.getByText(/Show Hidden/);
    await act(async () => {
      fireEvent.click(showHiddenButton);
    });
    
    // All chains should be visible again
    await waitFor(() => {
      expect(screen.getByText('Supply Chain 1')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain 2')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain 3')).toBeInTheDocument();
    });
  });
  
  test('displays empty state when no supply chains match filters', async () => {
    // Mock empty supply chains response
    supplyChainService.getSupplyChains.mockResolvedValueOnce({ data: [] });
    
    await act(async () => {
      renderComponent();
    });
    
    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText('No supply chains found.')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Supply Chain')).toBeInTheDocument();
    });
  });
  
  test('restores hidden supply chains from localStorage', async () => {
    // Set up localStorage with hidden chains
    localStorage.getItem.mockReturnValue(JSON.stringify([1, 3]));
    
    await act(async () => {
      renderComponent();
    });
    
    // Only non-hidden chains should be visible
    await waitFor(() => {
      expect(screen.queryByText('Supply Chain 1')).not.toBeInTheDocument();
      expect(screen.getByText('Supply Chain 2')).toBeInTheDocument();
      expect(screen.queryByText('Supply Chain 3')).not.toBeInTheDocument();
    });
  });
});