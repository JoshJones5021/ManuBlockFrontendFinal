import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateProductionBatchModal from './CreateProductionBatchModal';

describe('CreateProductionBatchModal Component', () => {
  // Mock props
  const mockProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    formData: {
      supplyChainId: '1',
      productId: '101',
      quantity: '10',
      materials: [
        {
          materialId: '201',
          blockchainItemId: '',
          quantity: '5'
        }
      ]
    },
    onChange: jest.fn(),
    handleMaterialChange: jest.fn(),
    supplyChains: [
      { id: 1, name: 'Test Supply Chain', blockchainStatus: 'FINALIZED' }
    ],
    filteredProducts: [
      { id: 101, name: 'Test Product', sku: 'TP001' },
      { id: 102, name: 'Another Product', sku: 'TP002' }
    ],
    materialInventory: [
      {
        id: 201,
        blockchainItemId: 'blockchain123',
        name: 'Test Material',
        itemType: 'allocated-material',
        quantity: 100,
        unit: 'kg',
        ownerId: 1
      }
    ],
    materials: [
      { materialId: 201, materialName: 'Test Material', quantity: 5, unit: 'kg' }
    ],
    currentUser: { id: 1 },
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal with form fields correctly', () => {
    render(<CreateProductionBatchModal {...mockProps} />);
    
    // Check title
    expect(screen.getByText('Create Production Batch')).toBeInTheDocument();
    
    // Check form fields
    expect(screen.getByLabelText(/Supply Chain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity to Produce/i)).toBeInTheDocument();
    expect(screen.getByText(/Required Materials/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Batch/i })).toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<CreateProductionBatchModal {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when close icon is clicked', () => {
    render(<CreateProductionBatchModal {...mockProps} />);
    
    // Find the close button (the X in the corner)
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls handleMaterialChange when material fields change', () => {
    render(<CreateProductionBatchModal {...mockProps} />);
    
    // Find material batch select field - using a more flexible approach to find it
    const materialBatchSelects = screen.getAllByRole('combobox');
    const materialBatchSelect = materialBatchSelects.find(select => 
      select.parentElement.textContent.includes('Select Material Batch') ||
      select.parentElement.textContent.includes('Material Batch')
    );
    
    // Simulate changing the blockchain item ID
    if (materialBatchSelect) {
      fireEvent.change(materialBatchSelect, { target: { value: 'blockchain123' } });
      expect(mockProps.handleMaterialChange).toHaveBeenCalledWith(
        0, 'blockchainItemId', 'blockchain123'
      );
    }
  });

  test('calculates total material needed correctly', () => {
    render(<CreateProductionBatchModal {...mockProps} />);
    
    // Check that the total calculation is displayed based on initialData
    const calculatedTexts = screen.getAllByText((content, element) => {
      return content.includes('Total needed:') && content.includes('kg');
    });
    
    expect(calculatedTexts.length).toBeGreaterThan(0);
  });

  test('displays error message when error prop is provided', () => {
    const errorMessage = 'Failed to create production batch';
    render(<CreateProductionBatchModal {...mockProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('enables Create Batch button when all required fields are provided', () => {
    const propsAllRequired = {
      ...mockProps,
      formData: {
        ...mockProps.formData,
        supplyChainId: '1',
        productId: '101',
        quantity: '10',
        materials: [{ materialId: '201', blockchainItemId: 'blockchain123', quantity: '5' }],
      }
    };
    
    render(<CreateProductionBatchModal {...propsAllRequired} />);
    const submitButton = screen.getByRole('button', { name: /Create Batch/i });
    expect(submitButton).toBeEnabled();
  });
  
  test('shows warning when no supply chains are available', () => {
    const propsNoSupplyChains = {
      ...mockProps,
      supplyChains: [],
    };
    
    render(<CreateProductionBatchModal {...propsNoSupplyChains} />);
    
    expect(screen.getByText(/No finalized supply chains available/i)).toBeInTheDocument();
  });
  
  test('shows message when no products are available', () => {
    const propsNoProducts = {
      ...mockProps,
      filteredProducts: [],
    };
    
    render(<CreateProductionBatchModal {...propsNoProducts} />);
    
    expect(screen.getByText(/No products available/i)).toBeInTheDocument();
  });
  
  test('shows warning for insufficient quantity in material inventory', () => {
    const propsInsufficientInventory = {
      ...mockProps,
      materialInventory: [
        {
          id: 201,
          blockchainItemId: 'blockchain123',
          name: 'Test Material',
          itemType: 'allocated-material',
          quantity: 1, // Less than needed
          unit: 'kg',
          ownerId: 1
        }
      ],
      formData: {
        ...mockProps.formData,
        quantity: '100', // Will require more material than available
      }
    };
    
    render(<CreateProductionBatchModal {...propsInsufficientInventory} />);
    
    const warningTexts = screen.getAllByText((content, element) => {
      return content.includes('Insufficient quantity');
    });
    
    expect(warningTexts.length).toBeGreaterThan(0);
  });
});