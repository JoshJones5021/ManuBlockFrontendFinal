import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
import { act } from 'react-dom/test-utils';

// Mock the navigation function
const mockNavigate = jest.fn();

// Mock the register function
const mockRegister = jest.fn();

// Mock the roles fetching
const mockGetRoles = jest.fn();

// Mock the context and router
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister
  })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock auth service to handle the getRoles function
jest.mock('../../services/auth', () => ({
  __esModule: true,
  default: {
    getRoles: () => mockGetRoles(),
    // Add any other methods from authService that might be used
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    connectWallet: jest.fn(),
    getUserProfile: jest.fn(),
    getAllRoles: jest.fn()
  }
}));

describe('Register Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockNavigate.mockClear();
    mockRegister.mockClear();
    mockGetRoles.mockClear();
    
    // Default mock implementation for getRoles
    mockGetRoles.mockResolvedValue({
      data: ['CUSTOMER', 'SUPPLIER', 'MANUFACTURER', 'DISTRIBUTOR']
    });
  });

  test('renders register form', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );
    });
    
    // Basic form elements should be present
    expect(screen.getByText(/Register for ManuBlock/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
    
    // Wait for roles to load
    await waitFor(() => {
      expect(mockGetRoles).toHaveBeenCalled();
    });
  });

  test('updates form fields on input change', async () => {
    // Wait for component to render and roles to load
    await act(async () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );
    });
    
    // Wait for roles to be loaded
    await waitFor(() => {
      // Make sure we're not showing "Loading roles..."
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    // Get the input fields
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const roleSelect = screen.getByLabelText(/Role/i);
    
    // Simulate user typing
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });
    
    // Check the default value first (should be CUSTOMER)
    expect(roleSelect.value).toBe('CUSTOMER');
    
    // Now change the role
    await act(async () => {
      fireEvent.change(roleSelect, { target: { value: 'SUPPLIER' } });
    });
    
    // Check if values are updated
    expect(usernameInput.value).toBe('testuser');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(roleSelect.value).toBe('SUPPLIER');
  });

  test('submits form and navigates on successful registration', async () => {
    // Mock successful registration
    mockRegister.mockResolvedValueOnce({});
    
    await act(async () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );
    });
    
    // Wait for roles to be loaded
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    // Fill the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Username/i), {
        target: { value: 'testuser' }
      });
      
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'password123' }
      });
      
      fireEvent.change(screen.getByLabelText(/Role/i), {
        target: { value: 'MANUFACTURER' }
      });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    });
    
    // Check if register was called with correct data
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'MANUFACTURER'
      });
    });
    
    // Wait for async operations and check if navigation happened
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { message: 'Registration successful! Please login.' }
      });
    });
  });

  test('displays error message on registration failure', async () => {
    // Mock registration error
    const errorMessage = 'Email is already in use';
    mockRegister.mockRejectedValueOnce({
      response: { data: { error: errorMessage } }
    });
    
    await act(async () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );
    });
    
    // Wait for roles to be loaded
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    // Fill the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Username/i), {
        target: { value: 'existinguser' }
      });
      
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'existing@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'password123' }
      });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    });
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Navigation should not have happened
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles validation errors from backend', async () => {
    // Mock registration with validation errors
    mockRegister.mockRejectedValueOnce({
      response: { 
        data: { 
          username: 'Username too short',
          email: 'Invalid email format'
        } 
      }
    });
    
    await act(async () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );
    });
    
    // Wait for roles to be loaded
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    // Fill the form with invalid data
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Username/i), {
        target: { value: 'a' }
      });
      
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'not-an-email' }
      });
      
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'pass' }
      });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    });
    
    // Should show concatenated validation errors
    await waitFor(() => {
      expect(screen.getByText(/Username too short, Invalid email format/i)).toBeInTheDocument();
    });
  });

  test('disables register button during form submission', async () => {
    // Make register take some time to resolve
    mockRegister.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({}), 100);
    }));
    
    await act(async () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );
    });
    
    // Wait for roles to be loaded
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    // Fill form with valid data
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'new@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    });
    
    // Button should be disabled and show loading text
    expect(screen.getByRole('button', { name: /Registering.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registering.../i })).toBeDisabled();
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  test('falls back to hardcoded roles if API call fails', async () => {
    // Mock a failed roles fetch
    mockGetRoles.mockRejectedValueOnce(new Error('Network error'));
    
    await act(async () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );
    });
    
    // Wait for component to handle the error
    await waitFor(() => {
      expect(mockGetRoles).toHaveBeenCalled();
    });
    
    // Wait for fallback roles to be set
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    // Check if fallback roles are available in the select element
    const roleSelect = screen.getByLabelText(/Role/i);
    
    // We need to get all options from the select element
    const options = Array.from(roleSelect.options).map(option => option.textContent);
    
    // Check if the expected roles are in the options
    expect(options).toContain('Customer');
    expect(options).toContain('Supplier');
    expect(options).toContain('Manufacturer');
    expect(options).toContain('Distributor');
  });
});