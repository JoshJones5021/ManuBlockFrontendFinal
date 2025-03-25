import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import UserManagement from './UserManagement';

// Mock the admin and auth services
const mockGetAllUsers = jest.fn();
const mockGetAllRoles = jest.fn();
const mockAssignRole = jest.fn();
const mockDeleteUser = jest.fn();

// Mock the context
const mockCurrentUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'ADMIN'
};

jest.mock('../../services/api', () => ({
  adminService: {
    getAllUsers: () => mockGetAllUsers(),
    assignRole: (userId, role) => mockAssignRole(userId, role),
    deleteUser: (userId) => mockDeleteUser(userId)
  }
}));

jest.mock('../../services/auth', () => ({
  __esModule: true,
  default: {
    getAllRoles: () => mockGetAllRoles()
  }
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser
  })
}));

describe('UserManagement Component', () => {
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      walletAddress: '0x123456789abcdef'
    },
    {
      id: 2,
      username: 'supplier',
      email: 'supplier@example.com',
      role: 'SUPPLIER',
      walletAddress: null
    },
    {
      id: 3,
      username: 'manufacturer',
      email: 'manufacturer@example.com',
      role: 'MANUFACTURER',
      walletAddress: '0x987654321fedcba'
    }
  ];

  const mockRoles = ['ADMIN', 'SUPPLIER', 'MANUFACTURER', 'DISTRIBUTOR', 'CUSTOMER'];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockGetAllUsers.mockResolvedValue({ data: mockUsers });
    mockGetAllRoles.mockResolvedValue({ data: mockRoles });
    mockAssignRole.mockResolvedValue({ status: 200 });
    mockDeleteUser.mockResolvedValue({ status: 200 });
  });

  test('renders user management page with user data', async () => {
    await act(async () => {
      render(<UserManagement />);
    });

    // Check if the component's title is rendered
    expect(screen.getByText('User Management')).toBeInTheDocument();

    // Wait for users to be loaded
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Check if user data is displayed
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('supplier@example.com')).toBeInTheDocument();
    expect(screen.getByText('manufacturer@example.com')).toBeInTheDocument();

    // Check if action buttons are present
    expect(screen.getAllByText('Assign Role').length).toBe(mockUsers.length);
    expect(screen.getAllByText('Delete').length).toBe(mockUsers.length);
  });

  test('shows error message when user fetch fails', async () => {
    const errorMessage = 'Failed to fetch users';
    mockGetAllUsers.mockRejectedValueOnce(new Error(errorMessage));

    await act(async () => {
      render(<UserManagement />);
    });

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load users/i)).toBeInTheDocument();
    });
  });

  test('opens role assignment modal when clicking "Assign Role"', async () => {
    await act(async () => {
      render(<UserManagement />);
    });

    // Wait for users to load
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Find the specific Assign Role button for the supplier user
    const supplierRow = screen.getByText('supplier@example.com').closest('tr');
    const assignRoleButton = within(supplierRow).getByText('Assign Role');

    // Click the Assign Role button
    await act(async () => {
      fireEvent.click(assignRoleButton);
    });

    // Modal should be open with user info
    expect(screen.getByText(/Assign Role to supplier/i)).toBeInTheDocument();
    
    // Check if role selection is available
    const modal = screen.getByText(/Assign Role to supplier/i).closest('div').parentElement;
    
    // Verify each role is present in the modal
    for (const role of mockRoles) {
      expect(within(modal).getByText(role)).toBeInTheDocument();
    }
  });

  test('updates user role when selecting a new role', async () => {
    await act(async () => {
      render(<UserManagement />);
    });

    // Wait for data to load
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
      expect(mockGetAllRoles).toHaveBeenCalled();
    });

    // Find the Assign Role button for supplier user
    const supplierRow = screen.getByText('supplier@example.com').closest('tr');
    const assignRoleButton = within(supplierRow).getByText('Assign Role');
    
    // Open the role assignment modal
    await act(async () => {
      fireEvent.click(assignRoleButton);
    });

    // Find and click the MANUFACTURER role button within the modal
    const modal = screen.getByText(/Assign Role to supplier/i).closest('div').parentElement;
    const manufacturerButton = within(modal).getByText('MANUFACTURER');
    
    await act(async () => {
      fireEvent.click(manufacturerButton);
    });

    // Check if the API was called with correct parameters
    expect(mockAssignRole).toHaveBeenCalledWith(2, 'MANUFACTURER');

    // Modal should be closed after success
    await waitFor(() => {
      expect(screen.queryByText(/Assign Role to supplier/i)).not.toBeInTheDocument();
    });
  });

  test('shows delete confirmation modal when clicking Delete', async () => {
    await act(async () => {
      render(<UserManagement />);
    });

    // Wait for users to load
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Find the Delete button for supplier user
    const supplierRow = screen.getByText('supplier@example.com').closest('tr');
    const deleteButton = within(supplierRow).getByText('Delete');
    
    // Click the Delete button
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Confirmation modal should appear
    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this user?/i)).toBeInTheDocument();
  });

  test('deletes user when confirming deletion', async () => {
    // Set up the mocked users state update 
    mockDeleteUser.mockImplementation(() => {
      // Return status 200 and simulate the user being removed
      return Promise.resolve({ status: 200 });
    });

    await act(async () => {
      render(<UserManagement />);
    });

    // Wait for users to load
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Find the Delete button for the supplier user
    const supplierRow = screen.getByText('supplier@example.com').closest('tr');
    const deleteButton = within(supplierRow).getByText('Delete');
    
    // Click the Delete button
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Confirmation modal should appear
    const deleteConfirmButton = screen.getByRole('button', { name: /Delete User/i });
    
    // Click confirm button
    await act(async () => {
      fireEvent.click(deleteConfirmButton);
    });

    // API should be called with correct user ID
    expect(mockDeleteUser).toHaveBeenCalledWith(2);
  });

  test('prevents self-deletion', async () => {
    await act(async () => {
      render(<UserManagement />);
    });

    // Wait for users to load
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // For self-deletion test, we need to verify the button is disabled
    const adminRow = screen.getByText('admin@example.com').closest('tr');
    const deleteButton = within(adminRow).getByText('Delete');
    
    // The button should be disabled
    expect(deleteButton).toBeDisabled();
  });

  test('handles error when deleting user fails', async () => {
    // Mock a deletion error
    const errorMessage = 'User has active assignments';
    mockDeleteUser.mockRejectedValueOnce({
      response: { data: { error: errorMessage } }
    });

    await act(async () => {
      render(<UserManagement />);
    });

    // Wait for users to load
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Find the Delete button for supplier user
    const supplierRow = screen.getByText('supplier@example.com').closest('tr');
    const deleteButton = within(supplierRow).getByText('Delete');
    
    // Click the Delete button
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Click confirm button in the modal
    const deleteConfirmButton = screen.getByRole('button', { name: /Delete User/i });
    await act(async () => {
      fireEvent.click(deleteConfirmButton);
    });

    // API should be called
    expect(mockDeleteUser).toHaveBeenCalledWith(2);

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('handles cancellation of role assignment', async () => {
    await act(async () => {
      render(<UserManagement />);
    });

    // Wait for users to load
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Find and click Assign Role button for supplier
    const supplierRow = screen.getByText('supplier@example.com').closest('tr');
    const assignRoleButton = within(supplierRow).getByText('Assign Role');
    
    await act(async () => {
      fireEvent.click(assignRoleButton);
    });

    // Click the Cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText(/Assign Role to supplier/i)).not.toBeInTheDocument();
    });
    
    // API should not have been called
    expect(mockAssignRole).not.toHaveBeenCalled();
  });
});