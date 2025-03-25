// ScheduleMaterialPickup.test.js ✅ FINAL
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ✅ Mock the API service to prevent real calls
jest.mock('../../services/api', () => ({
  distributorService: {
    createMaterialTransport: jest.fn(),
  },
}));

import ScheduleMaterialPickup from './ScheduleMaterialPickup';
import { distributorService } from '../../services/api';

const mockMaterialRequest = {
  id: 101,
  requestNumber: 'MR-001',
  supplierId: 201,
  manufacturer: { id: 301, username: 'Manufacturer A' },
  supplyChainId: 401,
  requestedDeliveryDate: new Date().toISOString(),
};

const mockUser = {
  id: 1,
  username: 'distributor',
};

describe('ScheduleMaterialPickup Component', () => {
  const renderComponent = (onComplete = jest.fn()) =>
    render(
      <ScheduleMaterialPickup
        materialRequest={mockMaterialRequest}
        currentUser={mockUser}
        onComplete={onComplete}
      />
    );

  beforeEach(() => {
    distributorService.createMaterialTransport.mockReset();
  });

  test('renders material request details correctly', () => {
    renderComponent();
    expect(screen.getByText('Schedule Material Pickup')).toBeInTheDocument();
    expect(screen.getByText('Material Request:')).toBeInTheDocument();
    expect(screen.getByText('MR-001')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer:')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer A')).toBeInTheDocument();
  });

  test('schedules material pickup successfully', async () => {
    const mockOnComplete = jest.fn();
    distributorService.createMaterialTransport.mockResolvedValue({ status: 200 });

    renderComponent(mockOnComplete);

    // Submit the form
    fireEvent.click(screen.getByText('Schedule Pickup'));

    await waitFor(() => {
      expect(distributorService.createMaterialTransport).toHaveBeenCalledTimes(1);
      expect(mockOnComplete).toHaveBeenCalledWith(
        'Material pickup scheduled successfully for MR-001'
      );
    });
  });

  test('shows error if pickup date is in the past', async () => {
    renderComponent();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];

    // Set the pickup date to a past date
    fireEvent.change(screen.getByLabelText('Pickup Date *'), {
      target: { value: pastDate },
    });

    // Try scheduling
    fireEvent.click(screen.getByText('Schedule Pickup'));

    await waitFor(() => {
      expect(screen.getByText('Pickup date cannot be in the past')).toBeInTheDocument();
      expect(distributorService.createMaterialTransport).not.toHaveBeenCalled();
    });
  });

  test('calls onComplete(null) when cancel is clicked', () => {
    const mockOnComplete = jest.fn();
    renderComponent(mockOnComplete);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnComplete).toHaveBeenCalledWith(null);
  });
});
