import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProcessMaterialsModal from './ProcessMaterialsModal';

describe('ProcessMaterialsModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn((e) => e.preventDefault());
  const mockOnMaterialQuantityChange = jest.fn();

  const sampleSelectedItem = {
    productName: 'Recycled Laptop',
    productType: 'Electronics',
    originalCustomerName: 'John Doe',
    receivedDate: '2024-03-01',
    maxRecoverableQuantity: 5,
  };

  const sampleMaterials = [
    { materialId: 'mat-1', materialName: 'Aluminum', unit: 'kg', quantity: 1 },
    { materialId: 'mat-2', materialName: 'Plastic', unit: 'kg', quantity: 2 },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('calls onClose when Cancel button is clicked', () => {
    render(
      <ProcessMaterialsModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onMaterialQuantityChange={mockOnMaterialQuantityChange}
        selectedItem={sampleSelectedItem}
        materialsFormData={sampleMaterials}
        error={null}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onMaterialQuantityChange when input is changed', () => {
    render(
      <ProcessMaterialsModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onMaterialQuantityChange={mockOnMaterialQuantityChange}
        selectedItem={sampleSelectedItem}
        materialsFormData={sampleMaterials}
        error={null}
      />
    );

    const input = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(input, { target: { value: '3' } });
    expect(mockOnMaterialQuantityChange).toHaveBeenCalledTimes(1);
  });

  test('displays error message if error is provided', () => {
    render(
      <ProcessMaterialsModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onMaterialQuantityChange={mockOnMaterialQuantityChange}
        selectedItem={sampleSelectedItem}
        materialsFormData={sampleMaterials}
        error="Test error message"
      />
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });
});
