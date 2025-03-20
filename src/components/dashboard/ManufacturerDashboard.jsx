import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { manufacturerService, supplierService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ManufacturerDashboard = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [productionBatches, setProductionBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeBatches: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const safelyFetchData = async (apiCall, defaultValue = []) => {
          try {
            const response = await apiCall;

            if (response && response.data) {
              return Array.isArray(response.data)
                ? response.data
                : [response.data];
            }
            return defaultValue;
          } catch (err) {
            console.warn('Error fetching data:', err);
            return defaultValue;
          }
        };

        const productsData = await safelyFetchData(
          manufacturerService.getProducts(currentUser.id)
        );
        const batchesData = await safelyFetchData(
          manufacturerService.getProductionBatches(currentUser.id)
        );
        const ordersData = await safelyFetchData(
          manufacturerService.getOrders(currentUser.id)
        );
        const requestsData = await safelyFetchData(
          manufacturerService.getMaterialRequests(currentUser.id)
        );
        const suppliersData = await safelyFetchData(
          supplierService.getAllSuppliers()
        );

        setProducts(productsData);
        setProductionBatches(batchesData);
        setOrders(ordersData);
        setMaterialRequests(requestsData);
        setSuppliers(suppliersData);

        const activeBatches = batchesData.filter(
          batch =>
            batch &&
            batch.status &&
            (batch.status === 'Planned' ||
              batch.status === 'In Production' ||
              batch.status === 'In QC')
        ).length;

        const pendingOrders = ordersData.filter(
          order =>
            order &&
            order.status &&
            (order.status === 'Requested' || order.status === 'In Production')
        ).length;

        setStats({
          totalProducts: productsData.length,
          activeBatches,
          pendingOrders,
        });
      } catch (err) {
        console.error('Error fetching manufacturer dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser?.id]);

  const getStatusColor = status => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'In Production':
        return 'bg-blue-100 text-blue-800';
      case 'In QC':
        return 'bg-yellow-100 text-yellow-800';
      case 'Planned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeClass = status => {
    switch (status) {
      case 'Requested':
        return 'bg-blue-100 text-blue-800';
      case 'Approved':
        return 'bg-purple-100 text-purple-800';
      case 'Allocated':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ready for Pickup':
        return 'bg-orange-100 text-orange-800';
      case 'In Transit':
        return 'bg-indigo-100 text-indigo-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Production':
        return 'bg-blue-100 text-blue-800';
      case 'In QC':
        return 'bg-yellow-100 text-yellow-800';
      case 'Planned':
        return 'bg-purple-100 text-purple-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const safelyGetNestedProp = (obj, path, defaultValue = '') => {
    try {
      const value = path
        .split('.')
        .reduce((o, p) => (o && o[p] !== undefined ? o[p] : null), obj);
      return value !== null ? value : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Manufacturer Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">
                Total Products
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {stats.totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-full p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">
                Active Batches
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {stats.activeBatches}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-full p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">
                Pending Orders
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {stats.pendingOrders}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Batches */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Production Batches</h2>
          <Link
            to="/manufacturer/production"
            className="text-blue-500 hover:underline"
          >
            View All Batches
          </Link>
        </div>

        {productionBatches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              You don't have any production batches yet.
            </p>
            <Link
              to="/manufacturer/production/create"
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              Create New Batch
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productionBatches
                  .slice(0, Math.min(5, productionBatches.length))
                  .map(batch => (
                    <tr
                      key={batch.id || Math.random().toString(36).substr(2, 9)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {safelyGetNestedProp(batch, 'batchNumber', 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {safelyGetNestedProp(
                            batch,
                            'product.name',
                            'Unknown Product'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {safelyGetNestedProp(batch, 'quantity', 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(batch.status || 'Unknown')}`}
                        >
                          {batch.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/manufacturer/production/${batch.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link
            to="/manufacturer/orders"
            className="text-blue-500 hover:underline"
          >
            View All Orders
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.slice(0, Math.min(5, orders.length)).map(order => (
                  <tr key={order.id || Math.random().toString(36).substr(2, 9)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {safelyGetNestedProp(order, 'orderNumber', 'N/A')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {safelyGetNestedProp(
                          order,
                          'customerName',
                          'Unknown Customer'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(safelyGetNestedProp(order, 'createdAt'))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status || 'Unknown')}`}
                      >
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/manufacturer/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Material Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Material Requests</h2>
          <Link
            to="/manufacturer/material-requests"
            className="text-blue-500 hover:underline"
          >
            View All Requests
          </Link>
        </div>

        {materialRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              You haven't made any material requests yet.
            </p>
            <Link
              to="/manufacturer/material-requests/create"
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              Request Materials
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialRequests
                  .slice(0, Math.min(5, materialRequests.length))
                  .map(request => (
                    <tr
                      key={
                        request.id || Math.random().toString(36).substr(2, 9)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {safelyGetNestedProp(request, 'requestNumber', 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Display supplier name - added this part */}
                        <div className="text-sm text-gray-900">
                          {
                            suppliers.find(s => s.id === request.supplierId)
                              ?.username ||
                              safelyGetNestedProp(
                                request,
                                'supplier.username',
                                'Unknown Supplier'
                              )
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(
                            safelyGetNestedProp(request, 'createdAt')
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status || 'Unknown')}`}
                        >
                          {request.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/manufacturer/material-requests/${request.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManufacturerDashboard;
