import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateProductModal from './CreateProductModal';

describe('CreateProductModal Component', () => {
  // Mock props
  const mockInitialFormData = {
    name: '',
    description: '',
    specifications: '',
    sku: '',
    price: '',
    supplyChainId: '1',
    requiredMaterials: []
  };
  
  const mockProps = {
    initialFormData: mockInitialFormData,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    supplyChains: [
      { id: 1, name: 'Test Supply Chain', blockchainStatus: 'FINALIZED' }
    ],
    filteredMaterials: [
      { 
        id: 101, 
        name: 'Test Material', 
        unit: 'kg', 
        supplier: { id: 201, username: 'Test Supplier' } 
      },
      { 
        id: 102, 
        name: 'Another Material', 
        unit: 'pcs', 
        supplier: { id: 202, username: 'Another Supplier' } 
      }
    ],
    onSupplyChainChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal with form fields correctly', () => {
    render(<CreateProductModal {...mockProps} />);
    
    // Check title
    expect(screen.getByText('Create New Product')).toBeInTheDocument();
    
    // Check form fields
    expect(screen.getByLabelText(/Supply Chain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Specifications/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SKU/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByText(/Required Materials/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Product/i })).toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<CreateProductModal {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when close icon is clicked', () => {
    render(<CreateProductModal {...mockProps} />);
    
    // Find the close button (the X in the corner)
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('updates form data when inputs change', () => {
    render(<CreateProductModal {...mockProps} />);
    
    // Test changing supply chain
    const supplyChainSelect = screen.getByLabelText(/Supply Chain/i);
    fireEvent.change(supplyChainSelect, { target: { value: '1' } });
    
    // Check if onSupplyChainChange was called
    expect(mockProps.onSupplyChainChange).toHaveBeenCalledWith('1');
    
    // Test changing product name
    const nameInput = screen.getByLabelText(/Product Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Product' } });
    
    // Test changing description
    const descriptionInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    
    // Test changing specifications
    const specificationsInput = screen.getByLabelText(/Specifications/i);
    fireEvent.change(specificationsInput, { target: { value: 'Test Specifications' } });
    
    // Test changing SKU
    const skuInput = screen.getByLabelText(/SKU/i);
    fireEvent.change(skuInput, { target: { value: 'TST001' } });
    
    // Test changing price
    const priceInput = screen.getByLabelText(/Price/i);
    fireEvent.change(priceInput, { target: { value: '99.99' } });
  });

  test('handles material selection and quantity changes', () => {
    render(<CreateProductModal {...mockProps} />);
    
    // Find material checkboxes
    const materialCheckboxes = screen.getAllByRole('checkbox');
    expect(materialCheckboxes.length).toBe(mockProps.filteredMaterials.length);
    
    // Check a material
    fireEvent.click(materialCheckboxes[0]);
    
    // Now there should be a quantity input field
    const quantityInputs = screen.getAllByRole('spinbutton');
    expect(quantityInputs.length).toBeGreaterThan(0);
    
    // Change the quantity
    fireEvent.change(quantityInputs[0], { target: { value: '5' } });
  });

  test('disables Create Product button when supply chain is not selected', () => {
    const propsNoSupplyChain = {
      ...mockProps,
      initialFormData: {
        ...mockInitialFormData,
        supplyChainId: '',
      }
    };
    
    render(<CreateProductModal {...propsNoSupplyChain} />);
    const submitButton = screen.getByRole('button', { name: /Create Product/i });
    expect(submitButton).toBeDisabled();
  });

  test('enables Create Product button when supply chain is selected', () => {
    render(<CreateProductModal {...mockProps} />);
    const submitButton = screen.getByRole('button', { name: /Create Product/i });
    expect(submitButton).toBeEnabled();
  });

  test('shows warning when no materials are available', () => {
    const propsNoMaterials = {
      ...mockProps,
      filteredMaterials: []
    };
    
    render(<CreateProductModal {...propsNoMaterials} />);
    
    expect(screen.getByText(/No materials available in this supply chain/i)).toBeInTheDocument();
  });

  test('shows supply chain warning when no supply chains are available', () => {
    const propsNoSupplyChains = {
      ...mockProps,
      supplyChains: []
    };
    
    render(<CreateProductModal {...propsNoSupplyChains} />);
    
    expect(screen.getByText(/No finalized supply chains available/i)).toBeInTheDocument();
  });
});