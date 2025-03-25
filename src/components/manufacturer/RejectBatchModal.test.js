import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RejectBatchModal from './RejectBatchModal';

describe('RejectBatchModal Component', () => {
  // Mock props
  const mockProps = {
    onSubmit: jest.fn(e => e.preventDefault()),
    onCancel: jest.fn(),
    selectedBatch: {
      id: 1,
      batchNumber: 'BATCH001',
      product: {
        name: 'Test Product'
      },
      quantity: 10
    },
    rejectionReason: '',
    setRejectionReason: jest.fn(),
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal with batch information correctly', () => {
    render(<RejectBatchModal {...mockProps} />);
    
    // Check title
    expect(screen.getByText('Reject Production Batch')).toBeInTheDocument();
    
    // Check batch information
    expect(screen.getByText(/BATCH001/)).toBeInTheDocument();
    expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    
    // Check form elements
    expect(screen.getByLabelText(/Rejection Reason/)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject Batch/i })).toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<RejectBatchModal {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when close icon is clicked', () => {
    render(<RejectBatchModal {...mockProps} />);
    
    // Find the close button (the X in the corner)
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('updates rejection reason when input changes', () => {
    render(<RejectBatchModal {...mockProps} />);
    
    // Find the rejection reason textarea
    const reasonInput = screen.getByLabelText(/Rejection Reason/);
    
    // Change the input
    fireEvent.change(reasonInput, { target: { value: 'Failed quality control' } });
    
    expect(mockProps.setRejectionReason).toHaveBeenCalledWith('Failed quality control');
  });

  test('disables submit button when rejection reason is empty', () => {
    render(<RejectBatchModal {...mockProps} />);
    
    // Find the submit button
    const submitButton = screen.getByRole('button', { name: /Reject Batch/i });
    
    // Button should be disabled when reason is empty
    expect(submitButton).toBeDisabled();
  });

  test('enables submit button when rejection reason is provided', () => {
    const propsWithReason = {
      ...mockProps,
      rejectionReason: 'Failed quality control'
    };
    
    render(<RejectBatchModal {...propsWithReason} />);
    
    // Find the submit button
    const submitButton = screen.getByRole('button', { name: /Reject Batch/i });
    
    // Button should be enabled when reason is provided
    expect(submitButton).not.toBeDisabled();
  });

  test('displays error message when error prop is provided', () => {
    const propsWithError = {
      ...mockProps,
      error: 'Failed to reject batch'
    };
    
    render(<RejectBatchModal {...propsWithError} />);
    
    expect(screen.getByText(/Failed to reject batch/i)).toBeInTheDocument();
  });

  test('handles missing batch information gracefully', () => {
    const propsWithMinimalBatch = {
      ...mockProps,
      selectedBatch: {
        id: 1,
        batchNumber: 'BATCH001',
        // Missing product and quantity
      }
    };
    
    render(<RejectBatchModal {...propsWithMinimalBatch} />);
    
    // Should still render without crashing
    expect(screen.getByText(/BATCH001/)).toBeInTheDocument();
  });

  test('handles long rejection reasons', () => {
    const longReason = 'This is a very long rejection reason that spans multiple lines. '.repeat(10);
    const propsWithLongReason = {
      ...mockProps,
      rejectionReason: longReason
    };
    
    render(<RejectBatchModal {...propsWithLongReason} />);
    
    // Find the rejection reason textarea
    const reasonInput = screen.getByLabelText(/Rejection Reason/);
    
    // Textarea should contain the long reason
    expect(reasonInput).toHaveValue(longReason);
    
    // Check that there's room for the text (rows attribute)
    expect(reasonInput).toHaveAttribute('rows', '4');
  });

  test('preserves white space in rejection reason', () => {
    const reasonWithWhitespace = '  This has    extra spaces\nand a new line  ';
    const propsWithWhitespaceReason = {
      ...mockProps,
      rejectionReason: reasonWithWhitespace
    };
    
    render(<RejectBatchModal {...propsWithWhitespaceReason} />);
    
    // Find the rejection reason textarea
    const reasonInput = screen.getByLabelText(/Rejection Reason/);
    
    // Textarea should preserve the whitespace
    expect(reasonInput).toHaveValue(reasonWithWhitespace);
  });
});