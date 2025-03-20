import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data in parallel
      const [ordersResponse, productsResponse] = await Promise.all([
        customerService.getOrders(currentUser.id),
        customerService.getAvailableProducts()
      ]);
      
      // Extract data or default to empty arrays
      const ordersData = Array.isArray(ordersResponse?.data) ? ordersResponse.data : [];
      const productsData = Array.isArray(productsResponse?.data) ? productsResponse.data : [];
      
      // Get only the most recent orders (last 5)
      const sortedOrders = ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setRecentOrders(sortedOrders.slice(0, 5));
      setAvailableProducts(productsData.slice(0, 6)); // Show only 6 products
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Requested':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Requested</span>;
      case 'In Production':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">In Production</span>;
      case 'Ready for Shipment':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Ready for Shipment</span>;
      case 'In Transit':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">In Transit</span>;
      case 'Delivered':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Delivered</span>;
      case 'Completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'Cancelled':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Customer Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {/* Welcome Card */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <h2 className="text-xl font-semibold mb-2">Welcome back, {currentUser.username}!</h2>
        <p className="text-gray-600">Browse our products and place orders with ease.</p>
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Total Orders</h2>
              <p className="text-2xl font-semibold text-gray-800">{recentOrders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-full p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Completed Orders</h2>
              <p className="text-2xl font-semibold text-gray-800">
                {recentOrders.filter(order => order.status === 'Completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-full p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Pending Orders</h2>
              <p className="text-2xl font-semibold text-gray-800">
                {recentOrders.filter(order => order.status !== 'Completed' && order.status !== 'Cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
          <Link to="/customer/orders" className="text-blue-600 hover:text-blue-800 text-sm">
            View All Orders
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No orders found. Start by exploring our product catalog.</p>
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{order.items?.length || 0} items</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/customer/orders`} className="text-indigo-600 hover:text-indigo-900">
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
      
      {/* Featured Products */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Featured Products</h2>
          <Link to="/customer/products" className="text-blue-600 hover:text-blue-800 text-sm">
            View All Products
          </Link>
        </div>
        
        {availableProducts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No products available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {availableProducts.map((product) => (
              <div key={product.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                  <svg className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{product.description.substring(0, 100)}...</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    <Link 
                      to={`/customer/products/${product.id}`} 
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recycling */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Recycling</h2>
                <Link to="/customer/recycling" className="text-blue-600 hover:text-blue-800 text-sm">
                View All Recycling
                </Link>
            </div>
            
            <div className="p-6 text-center">
                <p className="text-gray-500">Return and recycle your used products for sustainability.</p>
                <Link to="/customer/recycling" className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                Start Recycling
                </Link>
            </div>
        </div>
    </div>
  );
};

export default CustomerDashboard;