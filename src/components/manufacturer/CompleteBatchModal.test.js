import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompleteBatchModal from './CompleteBatchModal';

describe('CompleteBatchModal Component', () => {
  // Mock props
  const mockProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    selectedBatch: {
      id: 1,
      batchNumber: 'BATCH001',
      product: {
        name: 'Test Product'
      },
      quantity: 10
    },
    qualityData: '',
    setQualityData: jest.fn(),
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal with batch information correctly', () => {
    render(<CompleteBatchModal {...mockProps} />);
    
    // Check title and batch information
    expect(screen.getByText('Complete Production Batch')).toBeInTheDocument();
    expect(screen.getByText(/BATCH001/)).toBeInTheDocument();
    expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    
    // Check form elements
    expect(screen.getByLabelText(/Quality Assessment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Batch/i })).toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<CompleteBatchModal {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when close icon is clicked', () => {
    render(<CompleteBatchModal {...mockProps} />);
    
    // Find the close button (the X in the corner)
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('updates quality data when input changes', () => {
    render(<CompleteBatchModal {...mockProps} />);
    
    const qualityInput = screen.getByLabelText(/Quality Assessment/i);
    fireEvent.change(qualityInput, { target: { value: 'Test quality data' } });
    
    expect(mockProps.setQualityData).toHaveBeenCalledWith('Test quality data');
  });

  test('disables submit button when quality data is empty', () => {
    render(<CompleteBatchModal {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /Complete Batch/i });
    
    expect(submitButton).toBeDisabled();
  });

  test('enables submit button when quality data is filled', () => {
    render(<CompleteBatchModal {...mockProps} qualityData="Good quality" />);
    
    const submitButton = screen.getByRole('button', { name: /Complete Batch/i });
    
    expect(submitButton).not.toBeDisabled();
  });

  test('displays error message when error prop is provided', () => {
    const errorMessage = 'Error completing batch';
    render(<CompleteBatchModal {...mockProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('does not display error message when error prop is null', () => {
    render(<CompleteBatchModal {...mockProps} error={null} />);
    
    const errorElements = screen.queryByRole('alert');
    expect(errorElements).not.toBeInTheDocument();
  });
});