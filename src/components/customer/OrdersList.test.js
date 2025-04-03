const renderComponent = () => {
    return render(
      <BrowserRouter>
        <OrdersList />
      </BrowserRouter>
    );
  };import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OrdersList from './OrdersList';
import { customerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Mock the modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }) => <a href={to} data-testid={`link-${to}`}>{children}</a>
}));

jest.mock('../../services/api', () => ({
  customerService: {
    getOrders: jest.fn(),
    confirmDelivery: jest.fn(),
    cancelOrder: jest.fn()
  }
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock window.confirm
window.confirm = jest.fn();

describe('OrdersList Component', () => {
  // Mock data
  const mockCurrentUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockOrders = [
    {
      id: 1,
      orderNumber: 'ORD-001',
      status: 'Delivered',
      createdAt: '2023-01-15T10:30:00Z',
      requestedDeliveryDate: '2023-01-20T00:00:00Z',
      shippingAddress: '123 Test St, Test City, TC 12345',
      deliveryNotes: 'Please leave at front door',
      items: [
        {
          id: 101,
          productName: 'Test Product 1',
          quantity: 2,
          price: 25.99
        }
      ]
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      status: 'In Production',
      createdAt: '2023-02-10T14:00:00Z',
      requestedDeliveryDate: '2023-02-25T00:00:00Z',
      shippingAddress: '456 Sample Ave, Sample City, SC 67890',
      items: [
        {
          id: 201,
          productName: 'Test Product 2',
          quantity: 1,
          price: 49.99
        },
        {
          id: 202,
          productName: 'Test Product 3',
          quantity: 3,
          price: 12.50
        }
      ]
    },
    {
      id: 3,
      orderNumber: 'ORD-003',
      status: 'Completed',
      createdAt: '2023-01-05T09:15:00Z',
      requestedDeliveryDate: '2023-01-10T00:00:00Z',
      shippingAddress: '789 Demo Blvd, Demo City, DC 54321',
      items: [
        {
          id: 301,
          productName: 'Test Product 4',
          quantity: 5,
          price: 9.99
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: mockCurrentUser });
    customerService.getOrders.mockResolvedValue({ data: mockOrders });
    window.confirm.mockImplementation(() => true);
  });

  // Helper function to wrap renders and state updates in act
  const renderWithAct = async () => {
    let result;
    await act(async () => {
      result = renderComponent();
    });
    return result;
  };

  test('renders loading spinner initially', async () => {
    // Create a promise that resolves after the component renders
    let resolveLoading;
    const loadingPromise = new Promise(resolve => {
      resolveLoading = resolve;
    });
    
    // Mock API to delay resolution so we can check loading state
    customerService.getOrders.mockImplementationOnce(() => {
      return loadingPromise.then(() => ({ data: mockOrders }));
    });
    
    renderComponent();
    
    // The spinner should be visible
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Let the API call resolve
    resolveLoading();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  test('fetches and displays orders after loading', async () => {
    // Use the act utility to properly wrap async updates
    await act(async () => {
      renderComponent();
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(customerService.getOrders).toHaveBeenCalledWith(mockCurrentUser.id);
      expect(screen.queryByText(/loading/i) || document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
    
    // Check if orders are displayed
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('ORD-003')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    customerService.getOrders.mockRejectedValueOnce(new Error('API error'));
    
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('Failed to load orders. Please try again later.');
  });

  test('sorts orders by date (newest first)', async () => {
    const unsortedOrders = [
      { ...mockOrders[2] }, // oldest
      { ...mockOrders[0] }, // middle
      { ...mockOrders[1] }  // newest
    ];
    
    customerService.getOrders.mockResolvedValueOnce({ data: unsortedOrders });
    
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('ORD-002');
    
    // Check order of elements in the DOM
    const orderNumbers = screen.getAllByText(/ORD-00\d/);
    expect(orderNumbers[0]).toHaveTextContent('ORD-002');
    expect(orderNumbers[1]).toHaveTextContent('ORD-001');
    expect(orderNumbers[2]).toHaveTextContent('ORD-003');
  });

  test('filters orders based on selected filter', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('ORD-001');
    
    // Click on "Active" filter
    await act(async () => {
      fireEvent.click(screen.getByText('Active'));
    });
    
    // Should show In Production order but not Completed
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.queryByText('ORD-003')).not.toBeInTheDocument();
    
    // Click on "Completed" filter
    await act(async () => {
      fireEvent.click(screen.getByText('Completed'));
    });
    
    // Should show only Completed order
    expect(screen.queryByText('ORD-001')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
    expect(screen.getByText('ORD-003')).toBeInTheDocument();
  });

  test('shows "no orders" message when filtered list is empty', async () => {
    customerService.getOrders.mockResolvedValueOnce({ data: [] });
    
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('No orders found.');
    
    expect(screen.getByText('Browse Products')).toBeInTheDocument();
  });

  test('shows order details when clicking "View Details"', async () => {
    renderComponent();
    
    await screen.findByText('ORD-001');
    
    // Click "View Details" for the first order with status "Delivered"
    const viewButtons = screen.getAllByText('View Details');
    const firstOrderRow = screen.getByText('ORD-001').closest('tr');
    const viewDetailsButton = within(firstOrderRow).getByText('View Details');
    fireEvent.click(viewDetailsButton);
    
    // Check if modal is displayed
    expect(screen.getByText('Order Details')).toBeInTheDocument();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Please leave at front door')).toBeInTheDocument();
  });

  test('confirms delivery when "Confirm Receipt" button is clicked', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('ORD-001');
    
    // Click "Confirm Receipt" for the first order (which has "Delivered" status)
    const firstOrderRow = screen.getByText('ORD-001').closest('tr');
    const confirmButton = within(firstOrderRow).getByText('Confirm Receipt');
    
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Should show confirmation dialog
    expect(window.confirm).toHaveBeenCalledWith(
      'Confirm that you have received this order?'
    );
    
    // API should be called
    expect(customerService.confirmDelivery).toHaveBeenCalledWith(1);
    
    // Order status should be updated
    await waitFor(() => {
      const orders = screen.getAllByRole('row');
      const orderRow = orders.find(row => row.textContent.includes('ORD-001'));
      expect(orderRow).toHaveTextContent('Completed');
    });
  });

  test('cancels order when "Cancel" button is clicked', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('ORD-002');
    
    // Click "Cancel" for the second order (which has "In Production" status)
    const secondOrderRow = screen.getByText('ORD-002').closest('tr');
    const cancelButton = within(secondOrderRow).getByText('Cancel');
    
    await act(async () => {
      fireEvent.click(cancelButton);
    });
    
    // Should show confirmation dialog
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to cancel this order?'
    );
    
    // API should be called
    expect(customerService.cancelOrder).toHaveBeenCalledWith(2);
    
    // Order status should be updated
    await waitFor(() => {
      const orders = screen.getAllByRole('row');
      const orderRow = orders.find(row => row.textContent.includes('ORD-002'));
      expect(orderRow).toHaveTextContent('Cancelled');
    });
  });

  test('closes modal when clicking the close button', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('ORD-001');
    
    // Open modal
    const firstOrderRow = screen.getByText('ORD-001').closest('tr');
    const viewDetailsButton = within(firstOrderRow).getByText('View Details');
    
    await act(async () => {
      fireEvent.click(viewDetailsButton);
    });
    
    // Modal should be open
    expect(screen.getByText('Order Details')).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByText('Close');
    
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Order Details')).not.toBeInTheDocument();
    });
  });

  test('calculates and displays order total correctly', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('ORD-001');
    
    // Check total for first order (2 * $25.99 = $51.98)
    const orderRows = screen.getAllByRole('row');
    const firstOrderRow = orderRows.find(row => row.textContent.includes('ORD-001'));
    expect(firstOrderRow).toHaveTextContent('$51.98');
    
    // Open modal for second order (ORD-002) which has multiple items
    const secondOrderRow = screen.getByText('ORD-002').closest('tr');
    const viewDetailsButton = within(secondOrderRow).getByText('View Details');
    
    await act(async () => {
      fireEvent.click(viewDetailsButton);
    });
    
    // Instead of matching exact string, use more flexible approach
    // Check if there are prices displayed correctly
    await waitFor(() => {
      const priceElements = screen.getAllByText(/\$\d+\.\d+/);
      const priceTexts = priceElements.map(el => el.textContent);
      
      // Check for individual prices
      expect(priceTexts.some(text => text.includes('49.99'))).toBeTruthy();
      expect(priceTexts.some(text => text.includes('12.5'))).toBeTruthy();
      
      // Check for total price
      const totalElement = screen.getByText(/order total/i).nextElementSibling;
      expect(totalElement).toHaveTextContent('87.49');
    });
  });

  test('displays correct status badges with appropriate colors', async () => {
    renderComponent();
    
    await screen.findByText('ORD-001');
    
    // Find status badges by their specific role and class attributes instead of by text
    const statusCells = screen.getAllByRole('cell').filter(
      cell => cell.querySelector('.rounded-full')
    );
    
    // Find each badge element
    const deliveredBadge = screen.getAllByText('Delivered').find(
      el => el.classList.contains('rounded-full')
    );
    
    const inProductionBadge = screen.getAllByText('In Production').find(
      el => el.classList.contains('rounded-full')
    );
    
    const completedBadge = screen.getAllByText('Completed').find(
      el => el.classList.contains('rounded-full')
    );
    
    // Check they have the right colors (via classes)
    expect(deliveredBadge.className).toContain('bg-green-100');
    expect(inProductionBadge.className).toContain('bg-yellow-100');
    expect(completedBadge.className).toContain('bg-green-100');
  });

  test('handles orders with no items gracefully', async () => {
    const ordersWithNoItems = [
      {
        id: 4,
        orderNumber: 'ORD-004',
        status: 'Requested',
        createdAt: '2023-03-01T12:00:00Z',
        requestedDeliveryDate: '2023-03-10T00:00:00Z',
        shippingAddress: '101 Test Rd, Test Town, TT 98765',
        items: [] // Empty items array
      }
    ];
    
    customerService.getOrders.mockResolvedValueOnce({ data: ordersWithNoItems });
    
    await act(async () => {
      renderComponent();
    });
    
    await screen.findByText('ORD-004');
    
    // Should show 0 items
    expect(screen.getByText('0 items')).toBeInTheDocument();
    
    // Order total should be $0.00
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    
    // Open modal
    await act(async () => {
      fireEvent.click(screen.getByText('View Details'));
    });
    
    // Should show "No items found" message
    expect(screen.getByText('No items found for this order.')).toBeInTheDocument();
  });
});