import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import SupplierDashboard from './SupplierDashboard';
import ManufacturerDashboard from './ManufacturerDashboard';
import DistributorDashboard from './DistributorDashboard';

/**
 * Dashboard component that renders the appropriate dashboard based on user role
 */
const Dashboard = () => {
  const { currentUser } = useAuth();
  
  // If no user, show generic dashboard (should not happen due to auth check in layout)
  if (!currentUser) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Welcome to ManuBlock</h1>
        <p>Please log in to access your dashboard.</p>
      </div>
    );
  }
  
  // Render the appropriate dashboard based on user role
  switch (currentUser.role) {
    case 'ADMIN':
      return <AdminDashboard />;
      
    case 'CUSTOMER':
      return <CustomerDashboard />;
      
    case 'SUPPLIER':
      return <SupplierDashboard />;
      
    case 'MANUFACTURER':
      return <ManufacturerDashboard />;
      
    case 'DISTRIBUTOR':
      return <DistributorDashboard />;
      
    default:
      // Fallback for unknown roles
      return (
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Welcome, {currentUser.username}</h1>
          <p>Your role ({currentUser.role}) does not have a configured dashboard.</p>
          <p>Please contact an administrator for assistance.</p>
        </div>
      );
  }
};

export default Dashboard;