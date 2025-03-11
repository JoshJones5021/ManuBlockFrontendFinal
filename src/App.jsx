// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './styles/custom.css';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/profile/profile';
import SupplyChainsList from './components/supply-chain/SupplyChainsList';
import SupplyChainView from './components/supply-chain/SupplyChainView';
import UserManagement from './components/admin/UserManagement';

// Import role-specific dashboards
import AdminDashboard from './components/dashboard/AdminDashboard';
import CustomerDashboard from './components/dashboard/CustomerDashboard';
import SupplierDashboard from './components/dashboard/SupplierDashboard';
import ManufacturerDashboard from './components/dashboard/ManufacturerDashboard';
import DistributorDashboard from './components/dashboard/DistributorDashboard';

// Import role-specific components
import MaterialsList from './components/supplier/MaterialsList';
import MaterialRequestsList from './components/supplier/MaterialRequestsList';
import ProductsList from './components/manufacturer/ProductsList';
import ProductionBatchesList from './components/manufacturer/ProductionBatchesList';
import TransportsList from './components/distributor/TransportsList';
import ProductCatalog from './components/customer/ProductCatalog';
import OrdersList from './components/customer/OrdersList';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<DashboardLayout />}>
            {/* Dashboard */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Profile */}
            <Route path="profile" element={<Profile />} />
            
            {/* Supply Chains */}
            <Route path="supply-chains" element={<SupplyChainsList />} />
            <Route path="supply-chains/:chainId" element={<SupplyChainView />} />
            <Route path="supply-chains/:chainId/view" element={<SupplyChainView />} />
            
            {/* Admin Routes */}
            <Route path="users" element={<UserManagement />} />
            
            {/* Supplier Routes */}
            <Route path="supplier">
              <Route path="materials" element={<MaterialsList />} />
              <Route path="requests" element={<MaterialRequestsList />} />
            </Route>
            
            {/* Manufacturer Routes */}
            <Route path="manufacturer">
              <Route path="products" element={<ProductsList />} />
              <Route path="production" element={<ProductionBatchesList />} />
            </Route>
            
            {/* Distributor Routes */}
            <Route path="distributor">
              <Route path="transports" element={<TransportsList />} />
            </Route>
            
            {/* Customer Routes */}
            <Route path="customer">
              <Route path="products" element={<ProductCatalog />} />
              <Route path="orders" element={<OrdersList />} />
            </Route>
          </Route>
          
          {/* Fallback route for unknown paths */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;