// src/components/common/Footer.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer Component', () => {
  test('renders footer with current year', () => {
    render(<Footer />);
    
    // Check for the copyright text with current year
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} ManuBlock`, 'i'))).toBeInTheDocument();
    
    // Check for the subtitle text
    expect(screen.getByText(/Supply Chain Management with Blockchain/i)).toBeInTheDocument();
  });
});