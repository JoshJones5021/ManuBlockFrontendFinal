import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomNode from '../../components/supply-chain/CustomNode';

// Mock react-flow
jest.mock('reactflow', () => ({
  Handle: jest.fn(({ type, position }) => (
    <div data-testid={`handle-${type}-${position}`} />
  )),
  Position: {
    Left: 'left',
    Right: 'right',
  },
}));

describe('CustomNode Component', () => {
  // Test data for different node states
  const baseNodeData = {
    label: 'Test Node',
    role: 'Supplier',
  };

  test('renders unassigned user correctly', () => {
    const data = {
      ...baseNodeData,
      status: 'pending',
    };

    render(<CustomNode data={data} />);

    // Should show unassigned text
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  test('renders assigned user correctly', () => {
    const data = {
      ...baseNodeData,
      status: 'active',
      assignedUserId: '123',
    };

    render(<CustomNode data={data} />);

    // Should show user ID
    expect(screen.getByText('User: 123')).toBeInTheDocument();
  });

  test('shows blockchain status for authorized users', () => {
    const data = {
      ...baseNodeData,
      status: 'active',
      assignedUserId: '123',
      isAuthorized: true,
    };

    render(<CustomNode data={data} />);

    // Should show blockchain verified text
    expect(screen.getByText('Blockchain verified')).toBeInTheDocument();
  });

  test('shows awaiting verification for unauthorized users', () => {
    const data = {
      ...baseNodeData,
      status: 'active',
      assignedUserId: '123',
      isAuthorized: false,
    };

    render(<CustomNode data={data} />);

    // Should show awaiting verification text
    expect(screen.getByText('Awaiting verification')).toBeInTheDocument();
  });

  test('shows different status text for blockchain authorized nodes', () => {
    const data = {
      ...baseNodeData,
      assignedUserId: '123',
      isAuthorized: true,
    };

    render(<CustomNode data={data} />);

    // Should show blockchain authorized status
    expect(screen.getByText('blockchain authorized')).toBeInTheDocument();
  });

  test('shows different status text for pending authorization nodes', () => {
    const data = {
      ...baseNodeData,
      assignedUserId: '123',
      isAuthorized: false,
    };

    render(<CustomNode data={data} />);

    // Should show pending authorization status
    expect(screen.getByText('pending authorization')).toBeInTheDocument();
  });

  test('applies different role colors', () => {
    // Test supplier role
    const supplierData = {
      ...baseNodeData,
      role: 'Supplier',
      status: 'active',
    };

    const { rerender } = render(<CustomNode data={supplierData} />);
    
    const supplierRole = screen.getByText('Supplier');
    expect(supplierRole).toHaveClass('bg-blue-100');
    expect(supplierRole).toHaveClass('text-blue-800');

    // Test manufacturer role
    const manufacturerData = {
      ...baseNodeData,
      role: 'Manufacturer',
      status: 'active',
    };
    
    rerender(<CustomNode data={manufacturerData} />);
    
    const manufacturerRole = screen.getByText('Manufacturer');
    expect(manufacturerRole).toHaveClass('bg-green-100');
    expect(manufacturerRole).toHaveClass('text-green-800');
  });
});