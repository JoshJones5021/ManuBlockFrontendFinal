import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DistributorDashboard = () => {
  const { currentUser } = useAuth();
  const [transports, setTransports] = useState([]);
  const [materialPickups, setMaterialPickups] = useState([]);
  const [productDeliveries, setProductDeliveries] = useState([]);
  const [readyForPickup, setReadyForPickup] = useState({
    materials: 0,
    products: 0
  });
  const [stats, setStats] = useState({
    totalTransports: 0,
    inTransit: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch distributor transports
        const transportsResponse = await distributorService.getTransports(currentUser.id);
        const transportsData = transportsResponse.data;
        setTransports(transportsData);
        
        // Split transports into material pickups and product deliveries
        const materialTransports = transportsData.filter(transport => transport.type === 'Material Transport');
        const productTransports = transportsData.filter(transport => transport.type === 'Product Delivery');
        
        setMaterialPickups(materialTransports);
        setProductDeliveries(productTransports);
        
        // Fetch ready for pickup items
        const materialsResponse = await distributorService.getReadyMaterialRequests();
        const ordersResponse = await distributorService.getReadyOrders();
        
        setReadyForPickup({
          materials: materialsResponse.data.length,
          products: ordersResponse.data.length
        });
        
        // Calculate stats
        const inTransitCount = transportsData.filter(transport => transport.status === 'In Transit').length;
        const completedCount = transportsData.filter(transport => 
          transport.status === 'Delivered' || transport.status === 'Confirmed'
        ).length;
        
        setStats({
          totalTransports: transportsData.length,
          inTransit: inTransitCount,
          completed: completedCount
        });
        
      } catch (err) {
        console.error('Error fetching distributor dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser.id]);

  // Function to get appropriate status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'In Transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Distributor Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Total Transports</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalTransports}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-full p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">In Transit</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.inTransit}</p>
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
              <h2 className="text-gray-600 text-sm font-medium">Completed</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ready for Pickup */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Ready for Pickup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-800">Material Requests</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{readyForPickup.materials}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/distributor/material-pickups" className="text-blue-600 hover:text-blue-800 font-medium">
                View Ready Materials →
              </Link>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-green-800">Product Orders</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{readyForPickup.products}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/distributor/product-deliveries" className="text-green-600 hover:text-green-800 font-medium">
                View Ready Products →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Transports */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Transports</h2>
          <Link to="/distributor/transports" className="text-blue-500 hover:underline">View All Transports</Link>
        </div>
        
        {transports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You don't have any active transports.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link to="/distributor/material-pickups" className="text-blue-500 hover:underline">
                Schedule Material Pickup
              </Link>
              <Link to="/distributor/product-deliveries" className="text-blue-500 hover:underline">
                Schedule Product Delivery
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From / To
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
                {transports.slice(0, 5).map((transport) => (
                  <tr key={transport.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transport.trackingNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transport.type === 'Material Transport' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {transport.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">From:</span> {transport.source.username}
                      </div>
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">To:</span> {transport.destination.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transport.status)}`}>
                        {transport.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/distributor/transports/${transport.id}`} className="text-indigo-600 hover:text-indigo-900">
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
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-200 text-center">
            <svg className="h-10 w-10 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <Link to="/distributor/material-pickups/schedule" className="text-blue-600 font-medium">
              Schedule Pickup
            </Link>
          </div>
          
          <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
            <svg className="h-10 w-10 text-green-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <Link to="/distributor/product-deliveries/schedule" className="text-green-600 font-medium">
              Schedule Delivery
            </Link>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-center">
            <svg className="h-10 w-10 text-yellow-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <Link to="/distributor/transports/record-pickup" className="text-yellow-600 font-medium">
              Record Pickup
            </Link>
          </div>
          
          <div className="bg-purple-50 p-4 rounded border border-purple-200 text-center">
            <svg className="h-10 w-10 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <Link to="/distributor/transports/record-delivery" className="text-purple-600 font-medium">
              Record Delivery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;