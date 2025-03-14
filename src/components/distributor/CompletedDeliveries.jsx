// src/components/distributor/CompletedDeliveries.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DistributorNavTabs from './DistributorNavTabs';

const CompletedDeliveries = () => {
  const { currentUser } = useAuth();
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompletedTransports();
  }, [currentUser.id]);

  const fetchCompletedTransports = async () => {
    try {
      setLoading(true);
      const response = await distributorService.getTransportsByStatus(currentUser.id, 'Delivered');
      setTransports(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching completed transports:', err);
      setError('Failed to load completed transports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransports = () => {
    return transports.filter(transport => {
      // Apply type filter
      const typeMatch = filterType === 'all' || 
                       (filterType === 'material' && transport.type === 'Material Transport') ||
                       (filterType === 'product' && transport.type === 'Product Delivery');
      
      // Apply search filter
      const searchMatch = 
        transport.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transport.source.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transport.destination.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      return typeMatch && searchMatch;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate delivery stats
  const calculateDeliveryStats = () => {
    if (transports.length === 0) return { onTime: 0, delayed: 0, onTimePercent: 0 };
    
    let onTime = 0;
    let delayed = 0;
    
    transports.forEach(transport => {
      const scheduledDate = new Date(transport.scheduledDeliveryDate);
      const actualDate = new Date(transport.actualDeliveryDate);
      
      // Count as on time if delivered on or before scheduled date
      if (actualDate <= scheduledDate) {
        onTime++;
      } else {
        delayed++;
      }
    });
    
    const onTimePercent = Math.round((onTime / transports.length) * 100);
    
    return { onTime, delayed, onTimePercent };
  };

  const deliveryStats = calculateDeliveryStats();

  if (loading) {
    return (
      <div className="p-6">
        <DistributorNavTabs />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DistributorNavTabs />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Completed Deliveries</h1>
        <button 
          onClick={fetchCompletedTransports}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Total Completed</h2>
              <p className="text-2xl font-semibold text-gray-800">{transports.length}</p>
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
              <h2 className="text-gray-600 text-sm font-medium">On-Time Delivery</h2>
              <p className="text-2xl font-semibold text-green-600">{deliveryStats.onTimePercent}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-500 rounded-full p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Delayed Deliveries</h2>
              <p className="text-2xl font-semibold text-red-600">{deliveryStats.delayed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
              Search Deliveries
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by tracking number, source or destination..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="filterType">
              Filter by Type
            </label>
            <select
              id="filterType"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="material">Material Transports</option>
              <option value="product">Product Deliveries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Completed Deliveries List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredTransports().length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No completed deliveries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {transports.length > 0 
                ? 'Try adjusting your search or filter criteria' 
                : 'Complete your first delivery to see it here'}
            </p>
            <div className="mt-6">
              <Link
                to="/distributor/transports"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                View All Transports
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
                    Scheduled Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransports().map((transport) => {
                  // Calculate if delivery was on time
                  const scheduledDate = new Date(transport.scheduledDeliveryDate);
                  const actualDate = new Date(transport.actualDeliveryDate);
                  const isOnTime = actualDate <= scheduledDate;
                  
                  return (
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
                        <div className="text-sm">
                          <p><span className="font-semibold">From:</span> {transport.source.username}</p>
                          <p><span className="font-semibold">To:</span> {transport.destination.username}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {formatDate(transport.scheduledDeliveryDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${isOnTime ? 'text-green-600' : 'text-red-600'}`}>
                          {formatDate(transport.actualDeliveryDate)}
                          {isOnTime ? (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">On Time</span>
                          ) : (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Delayed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {transport.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          to={`/distributor/transports/${transport.id}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedDeliveries;