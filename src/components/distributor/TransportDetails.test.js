// src/components/distributor/TransportDetails.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ✅ Mock the API services
jest.mock('../../services/api', () => ({
  distributorService: {
    getTransports: jest.fn(),
  },
  blockchainService: {
    getBlockchainItemDetails: jest.fn(),
  },
}));

// ✅ Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, username: 'Distributor' },
  }),
}));

import TransportDetails from './TransportDetails';
import { distributorService, blockchainService } from '../../services/api';

const renderWithRouter = (transportId = '123') => {
  return render(
    <MemoryRouter initialEntries={[`/distributor/transports/${transportId}`]}>
      <Routes>
        <Route path="/distributor/transports/:transportId" element={<TransportDetails />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('TransportDetails Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading spinner initially', async () => {
    distributorService.getTransports.mockResolvedValueOnce({ data: [] });

    renderWithRouter();

    // ✅ Check spinner exists
    expect(
      screen.getByText((_, el) => el?.className.includes('animate-spin'))
    ).toBeInTheDocument();
  });
});
