import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateMaterialRequestModal from './CreateMaterialRequestModal';

describe('CreateMaterialRequestModal Component', () => {
  const mockProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    formData: {
      supplierId: '1',
      supplyChainId: '1',
      notes: '',
      requestedDeliveryDate: '',
      items: [],
    },
    onChange: jest.fn(),
    tempMaterial: {
      materialId: '',
      quantity: '',
    },
    onTempMaterialChange: jest.fn(),
    addMaterialToRequest: jest.fn(),
    removeMaterialFromRequest: jest.fn(),
    supplyChains: [{ id: 1, name: 'Test Supply Chain', blockchainStatus: 'FINALIZED' }],
    filteredSuppliers: [{ id: 1, username: 'Test Supplier' }],
    materials: [{ id: 101, name: 'Test Material', unit: 'kg' }],
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<CreateMaterialRequestModal {...mockProps} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Cancel/i })[0]);
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls addMaterialToRequest when Add Material button is clicked', () => {
    const propsWithTempMaterial = { ...mockProps, tempMaterial: { materialId: '101', quantity: '10' } };
    render(<CreateMaterialRequestModal {...propsWithTempMaterial} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Add Material/i })[0]);
    expect(propsWithTempMaterial.addMaterialToRequest).toHaveBeenCalledTimes(1);
  });

  test('calls removeMaterialFromRequest when Remove button is clicked', () => {
    const propsWithItems = { ...mockProps, formData: { ...mockProps.formData, items: [{ materialId: 101, quantity: 10 }] } };
    render(<CreateMaterialRequestModal {...propsWithItems} />);
    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    expect(propsWithItems.removeMaterialFromRequest).toHaveBeenCalledWith(0);
  });

  test('disables Add Material button when material or quantity is not selected', () => {
    render(<CreateMaterialRequestModal {...mockProps} />);
    const addButtons = screen.getAllByRole('button', { name: /Add Material/i });
    addButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  test('enables Add Material button when both material and quantity are selected', () => {
    const propsWithTempMaterial = { ...mockProps, tempMaterial: { materialId: '101', quantity: '10' } };
    render(<CreateMaterialRequestModal {...propsWithTempMaterial} />);
    expect(screen.getAllByRole('button', { name: /Add Material/i })[0]).not.toBeDisabled();
  });

  test('disables Create Request button when required fields are missing', () => {
    const propsWithoutSupplier = { ...mockProps, formData: { ...mockProps.formData, supplierId: '' } };
    render(<CreateMaterialRequestModal {...propsWithoutSupplier} />);
    expect(screen.getAllByRole('button', { name: /Create Request/i })[0]).toBeDisabled();
  });

  test('enables Create Request button when all required fields are provided', () => {
    const propsWithAllRequired = { ...mockProps, formData: { ...mockProps.formData, items: [{ materialId: 101, quantity: 10 }] } };
    render(<CreateMaterialRequestModal {...propsWithAllRequired} />);
    expect(screen.getAllByRole('button', { name: /Create Request/i })[0]).not.toBeDisabled();
  });

  test('displays error message when error prop is provided', () => {
    render(<CreateMaterialRequestModal {...mockProps} error="Test Error" />);
    expect(screen.getByText('Test Error')).toBeInTheDocument();
  });

  test('shows no suppliers message when filteredSuppliers is empty', () => {
    const propsNoSuppliers = { ...mockProps, filteredSuppliers: [] };
    render(<CreateMaterialRequestModal {...propsNoSuppliers} />);
    expect(screen.getByText(/No suppliers available/i)).toBeInTheDocument();
  });

  test('shows no materials message when materials list is empty', () => {
    const propsNoMaterials = { ...mockProps, materials: [] };
    render(<CreateMaterialRequestModal {...propsNoMaterials} />);
    expect(screen.getByText(/No materials added yet/i)).toBeInTheDocument();
  });
});
