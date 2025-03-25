import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MaterialCreationForm from './MaterialCreationForm';

// ✅ Mock the actual api service used in the component
jest.mock('../../services/api', () => ({
  supplierService: {
    createMaterial: jest.fn(),
  },
}));

// ✅ Mock AuthContext inline
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, name: 'Test User' },
  }),
}));

// ✅ Import the mock so we can control it
const mockCreateMaterial = require('../../services/api').supplierService.createMaterial;

// ✅ Example mock supply chain data if required by your form
const mockSupplyChains = [{ id: '1', name: 'Supply Chain A' }];

const renderForm = () =>
  render(<MaterialCreationForm supplyChains={mockSupplyChains} />);

describe('MaterialCreationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form fields correctly', () => {
    const { container } = renderForm();

    expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="supplyChainId"]')).toBeInTheDocument();
    expect(container.querySelector('textarea[name="description"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="quantity"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="unit"]')).toBeInTheDocument();
    expect(container.querySelector('textarea[name="specifications"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Material/i })).toBeInTheDocument();
  });
});
