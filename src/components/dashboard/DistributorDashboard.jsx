// src/components/dashboard/DistributorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DistributorDashboard = () => {
  const { currentUser } = useAuth();
  const [transports, setTransports] = useState([]);
  const [readyMaterials, setReadyMaterials] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTransports: 0,
    inTransit: 0,
    delivered: 0,
    scheduled: 0,
    pendingPickups: 0,
    pendingDeliveries: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [transportsResponse, readyMaterialsResponse, readyOrdersResponse] = await Promise.all([
        distributorService.getTransports(currentUser.id),
        distributorService.getReadyMaterialRequests(),
        distributorService.getReadyOrders()
      ]);
      
      // Extract data or default to empty arrays
      const transportsData = transportsResponse?.data || [];
      const readyMaterialsData = readyMaterialsResponse?.data || [];
      const readyOrdersData = readyOrdersResponse?.data || [];
      
      // Set state with fetched data
      setTransports(transportsData);
      setReadyMaterials(readyMaterialsData);
      setReadyOrders(readyOrdersData);
      
      // Calculate stats
      const inTransitCount = transportsData.filter(transport => 
        transport.status === 'In Transit'
      ).length;
      
      const deliveredCount = transportsData.filter(transport => 
        transport.status === 'Delivered'
      ).length;
      
      const scheduledCount = transportsData.filter(transport => 
        transport.status === 'Scheduled'
      ).length;
      
      setStats({
        totalTransports: transportsData.length,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        scheduled: scheduledCount,
        pendingPickups: readyMaterialsData.length,
        pendingDeliveries: readyOrdersData.length
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Scheduled</span>;
      case 'In Transit':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">In Transit</span>;
      case 'Delivered':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Delivered</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
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
      <h1 className="text-2xl font-semibold mb-6">Distributor Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
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
              <h2 className="text-gray-600 text-sm font-medium">Delivered</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ready for Pickup Materials */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-blue-800">Material Pickups</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {stats.pendingPickups} ready
            </span>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600">
                Schedule pickups for materials that are ready to be transported from suppliers to manufacturers.
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <Link 
                to="/distributor/material-pickups/schedule" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule Material Pickup
              </Link>
              
              <div className="text-sm text-gray-500">
                {stats.pendingPickups > 0 ? (
                  <span className="text-blue-600 font-medium">{stats.pendingPickups} pending</span>
                ) : (
                  <span>No pending pickups</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Ready for Delivery Products */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-green-800">Product Deliveries</h2>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              {stats.pendingDeliveries} ready
            </span>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600">
                Schedule deliveries for products that are ready to be transported from manufacturers to customers.
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <Link 
                to="/distributor/product-deliveries/schedule" 
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule Product Delivery
              </Link>
              
              <div className="text-sm text-gray-500">
                {stats.pendingDeliveries > 0 ? (
                  <span className="text-green-600 font-medium">{stats.pendingDeliveries} pending</span>
                ) : (
                  <span>No pending deliveries</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Transports */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Transports</h2>
          <Link to="/distributor/transports" className="text-blue-600 hover:text-blue-800 text-sm">
            View All Transports
          </Link>
        </div>
        
        {transports.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No transports found. Start by scheduling a pickup or delivery.</p>
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
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transports.slice(0, 5).map((transport) => (
                  <tr key={transport.id} className="hover:bg-gray-50">
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
                        <p><span className="font-medium">From:</span> {transport.source?.username || 'Unknown'}</p>
                        <p><span className="font-medium">To:</span> {transport.destination?.username || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transport.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {transport.status === 'Scheduled' ? (
                          <p>Scheduled for {formatDate(transport.scheduledPickupDate)}</p>
                        ) : transport.status === 'In Transit' ? (
                          <p>Picked up on {formatDate(transport.actualPickupDate)}</p>
                        ) : (
                          <p>Delivered on {formatDate(transport.actualDeliveryDate)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to="/distributor/transports" className="text-indigo-600 hover:text-indigo-900">
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
      
      {/* Dashboard Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Distributor Workflow Guide</h2>
        <div className="flex flex-wrap -mx-2">
          <div className="px-2 w-full md:w-1/3 mb-4">
            <div className="border border-blue-200 rounded-lg p-4 h-full">
              <div className="flex items-center mb-2">
                <div className="bg-blue-100 rounded-full p-2 mr-2">
                  <span className="text-blue-800 font-bold">1</span>
                </div>
                <h3 className="font-medium text-blue-800">Schedule</h3>
              </div>
              <p className="text-sm text-gray-600">
                Schedule material pickups from suppliers and product deliveries to customers based on requests.
              </p>
            </div>
          </div>
          <div className="px-2 w-full md:w-1/3 mb-4">
            <div className="border border-purple-200 rounded-lg p-4 h-full">
              <div className="flex items-center mb-2">
                <div className="bg-purple-100 rounded-full p-2 mr-2">
                  <span className="text-purple-800 font-bold">2</span>
                </div>
                <h3 className="font-medium text-purple-800">Transport</h3>
              </div>
              <p className="text-sm text-gray-600">
                Record pickups and manage in-transit shipments with real-time status updates.
              </p>
            </div>
          </div>
          <div className="px-2 w-full md:w-1/3 mb-4">
            <div className="border border-green-200 rounded-lg p-4 h-full">
              <div className="flex items-center mb-2">
                <div className="bg-green-100 rounded-full p-2 mr-2">
                  <span className="text-green-800 font-bold">3</span>
                </div>
                <h3 className="font-medium text-green-800">Deliver</h3>
              </div>
              <p className="text-sm text-gray-600">
                Record successful deliveries and maintain a complete history of all transports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;