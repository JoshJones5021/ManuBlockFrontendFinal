import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
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
import BlockchainTraceability from './components/common/BlockchainTraceability';
import MaterialsList from './components/supplier/MaterialsList';
import MaterialRequestsList from './components/supplier/MaterialRequestsList';
import MaterialAllocationManagement from './components/supplier/MaterialAllocationManagement';
import MaterialRequestApproval from './components/supplier/MaterialRequestApproval';
import ProductsList from './components/manufacturer/ProductsList';
import ProductionBatchesList from './components/manufacturer/ProductionBatchesList';
import ManufacturerMaterialRequestsList from './components/manufacturer/MaterialRequestsList';
import MaterialRequestDetails from './components/manufacturer/MaterialRequestDetails';
import OrdersLists from './components/manufacturer/OrdersList';
import OrderDetails from './components/manufacturer/OrderDetails';
import RecycledItemsProcessing from './components/manufacturer/RecycledItemsProcessing';
import ProductCatalog from './components/customer/ProductCatalog';
import OrdersList from './components/customer/OrdersList';
import OrderTracking from './components/customer/OrderTracking';
import Recycling from './components/customer/Recycling';
import TransportsList from './components/distributor/TransportsList';
import TransportDetails from './components/distributor/TransportDetails';
import RecyclingTransports from './components/distributor/RecyclingTransports';

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
            <Route
              path="/blockchain-traceability"
              element={<BlockchainTraceability />}
            />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />

            {/* Supply Chains */}
            <Route path="supply-chains" element={<SupplyChainsList />} />
            <Route
              path="supply-chains/:chainId"
              element={<SupplyChainView />}
            />
            <Route
              path="supply-chains/:chainId/view"
              element={<SupplyChainView />}
            />

            {/* Admin Routes */}
            <Route path="users" element={<UserManagement />} />

            {/* Supplier Routes */}
            <Route path="supplier">
              <Route path="materials" element={<MaterialsList />} />
              <Route path="requests" element={<MaterialRequestsList />} />
              <Route
                path="requests/:requestId/approve"
                element={<MaterialRequestApproval />}
              />
              <Route
                path="allocations"
                element={<MaterialAllocationManagement />}
              />
            </Route>

            {/* Manufacturer Routes */}
            <Route path="manufacturer">
              <Route path="products" element={<ProductsList />} />
              <Route path="production" element={<ProductionBatchesList />} />
              <Route
                path="material-requests"
                element={<ManufacturerMaterialRequestsList />}
              />
              <Route
                path="material-requests/:requestId"
                element={<MaterialRequestDetails />}
              />
              <Route path="orders" element={<OrdersLists />} />
              <Route path="orders/:orderId" element={<OrderDetails />} />
              <Route path="recycling" element={<RecycledItemsProcessing />} />
            </Route>

            {/* Simplified Distributor Routes */}
            <Route path="distributor">
              <Route path="transports" element={<TransportsList />} />
              <Route
                path="transports/:transportId"
                element={<TransportDetails />}
              />
              <Route path="recycling" element={<RecyclingTransports />} />
            </Route>

            {/* Customer Routes */}
            <Route path="customer">
              <Route path="products" element={<ProductCatalog />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="tracking" element={<OrderTracking />} />
              <Route path="recycling" element={<Recycling />} />
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
