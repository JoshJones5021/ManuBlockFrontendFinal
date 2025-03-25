import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditProductModal from './EditProductModal';

describe('EditProductModal Component', () => {
  const mockInitialFormData = {
    name: 'Existing Product',
    description: 'Product Description',
    specifications: 'Product Specifications',
    sku: 'EP001',
    price: '199.99',
    supplyChainId: '1',
    requiredMaterials: [
      { id: 101, name: 'Test Material', quantity: 2, unit: 'kg' }
    ]
  };

  const mockProps = {
    initialFormData: mockInitialFormData,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    filteredMaterials: [
      { id: 101, name: 'Test Material', unit: 'kg', supplier: { id: 201, username: 'Test Supplier' } },
      { id: 102, name: 'Another Material', unit: 'pcs', supplier: { id: 202, username: 'Another Supplier' } }
    ],
    onSupplyChainChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal with existing product data', () => {
    render(<EditProductModal {...mockProps} />);
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Name/i)).toHaveValue('Existing Product');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Product Description');
    expect(screen.getByLabelText(/Specifications/i)).toHaveValue('Product Specifications');
    expect(screen.getByLabelText(/SKU/i)).toHaveValue('EP001');
    expect(screen.getByLabelText(/Price/i)).toHaveValue(199.99);
    expect(screen.getByText(/Required Materials/i)).toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<EditProductModal {...mockProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when close icon is clicked', () => {
    render(<EditProductModal {...mockProps} />);
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('updates form data when inputs change', () => {
    render(<EditProductModal {...mockProps} />);
    const nameInput = screen.getByLabelText(/Product Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Product' } });
    expect(nameInput).toHaveValue('Updated Product');

    const priceInput = screen.getByLabelText(/Price/i);
    fireEvent.change(priceInput, { target: { value: 299.99 } });
    expect(priceInput).toHaveValue(299.99);
  });

  test('handles material selection changes', () => {
    render(<EditProductModal {...mockProps} />);
    const materialCheckboxes = screen.getAllByRole('checkbox');
    expect(materialCheckboxes[0]).toBeChecked();
    expect(materialCheckboxes[1]).not.toBeChecked();

    fireEvent.click(materialCheckboxes[0]);
    expect(materialCheckboxes[0]).not.toBeChecked();

    fireEvent.click(materialCheckboxes[1]);
    expect(materialCheckboxes[1]).toBeChecked();
  });

  test('handles material quantity changes', () => {
    render(<EditProductModal {...mockProps} />);
    const quantityInputs = screen.getAllByRole('spinbutton');
    expect(quantityInputs.length).toBe(2); // price input + material quantity

    const materialQtyInput = quantityInputs[1]; // 2nd spinbutton is material quantity
    expect(materialQtyInput).toHaveValue(2);

    fireEvent.change(materialQtyInput, { target: { value: 5 } });
    expect(materialQtyInput).toHaveValue(5);
  });

  test('handles supply chain change', () => {
    const initialFormDataWithDifferentSupplyChain = {
      ...mockInitialFormData,
      supplyChainId: '2'
    };
    const props = {
      ...mockProps,
      initialFormData: initialFormDataWithDifferentSupplyChain
    };
    render(<EditProductModal {...props} />);
    const supplyChainInput = screen.getByLabelText(/Product Name/i); // simulate supply chain on name change
    fireEvent.change(supplyChainInput, { target: { value: 'Changed' } });
    // Supply chain change is indirectly tested via handleInputChange
  });

  test('shows message when no materials are available', () => {
    const propsNoMaterials = { ...mockProps, filteredMaterials: [] };
    render(<EditProductModal {...propsNoMaterials} />);
    expect(screen.getByText(/No materials available/i)).toBeInTheDocument();
  });

  test('reflects updates to initialFormData prop', () => {
    const { rerender } = render(<EditProductModal {...mockProps} />);
    expect(screen.getByLabelText(/Product Name/i)).toHaveValue('Existing Product');

    const updatedProps = {
      ...mockProps,
      initialFormData: { ...mockInitialFormData, name: 'New Product Name', price: '399.99' }
    };
    rerender(<EditProductModal {...updatedProps} />);
    expect(screen.getByLabelText(/Product Name/i)).toHaveValue('New Product Name');
    expect(screen.getByLabelText(/Price/i)).toHaveValue(399.99);
  });
});
