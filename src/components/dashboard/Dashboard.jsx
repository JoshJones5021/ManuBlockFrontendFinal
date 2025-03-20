import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import SupplierDashboard from './SupplierDashboard';
import ManufacturerDashboard from './ManufacturerDashboard';
import DistributorDashboard from './DistributorDashboard';

const Dashboard = () => {
  const { currentUser, walletStatus } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const WalletReminder = () => {
    const { connectToMetaMask } = useAuth();

    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Admin Wallet Not Connected
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                As an admin, you need to connect your blockchain wallet to
                enable supply chain traceability features for all users.
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={connectToMetaMask}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Connect Admin Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Welcome to ManuBlock</h1>
        <p className="mb-4">Please log in to access your dashboard.</p>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login
        </a>
      </div>
    );
  }

  const shouldShowWalletReminder =
    currentUser.role === 'ADMIN' &&
    !currentUser.walletAddress &&
    walletStatus !== 'connecting';

  let dashboardComponent;
  switch (currentUser.role) {
    case 'ADMIN':
      dashboardComponent = <AdminDashboard />;
      break;

    case 'CUSTOMER':
      dashboardComponent = <CustomerDashboard />;
      break;

    case 'SUPPLIER':
      dashboardComponent = <SupplierDashboard />;
      break;

    case 'MANUFACTURER':
      dashboardComponent = <ManufacturerDashboard />;
      break;

    case 'DISTRIBUTOR':
      dashboardComponent = <DistributorDashboard />;
      break;

    default:
      dashboardComponent = (
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">
            Welcome, {currentUser.username}
          </h1>
          <p>
            Your role ({currentUser.role}) does not have a configured dashboard.
          </p>
          <p>Please contact an administrator for assistance.</p>
        </div>
      );
  }

  return (
    <div>
      {shouldShowWalletReminder && <WalletReminder />}
      {dashboardComponent}
    </div>
  );
};

export default Dashboard;