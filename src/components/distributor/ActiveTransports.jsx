// src/components/distributor/ActiveTransports.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DistributorNavTabs from './DistributorNavTabs';
import RecordTransportAction from './RecordTransportAction';

const ActiveTransports = () => {
  const { currentUser } = useAuth();
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveTransports();
  }, [currentUser.id]);

  const fetchActiveTransports = async () => {
    try {
      setLoading(true);
      const response = await distributorService.getTransportsByStatus(currentUser.id, 'In Transit');
      setTransports(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching active transports:', err);
      setError('Failed to load active transports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransportUpdated = () => {
    fetchActiveTransports();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDaysInTransit = (pickupDate) => {
    if (!pickupDate) return 0;
    
    const pickup = new Date(pickupDate);
    const today = new Date();
    const diffTime = Math.abs(today - pickup);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

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
        <h1 className="text-2xl font-semibold">Active Transports In Transit</h1>
        <div className="flex space-x-2">
          <Link 
            to="/distributor/material-pickups/schedule"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Schedule Pickup
          </Link>
          <button 
            onClick={fetchActiveTransports}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Active Transports */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {transports.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active transports in transit</h3>
            <p className="mt-1 text-sm text-gray-500">All transports have been delivered or are still awaiting pickup.</p>
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
                    Days In Transit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transports.map((transport) => (
                  <tr key={transport.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/distributor/transports/${transport.id}`} className="text-blue-600 hover:text-blue-900">
                        {transport.trackingNumber}
                      </Link>
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
                      <div className="text-sm font-semibold">
                        {calculateDaysInTransit(transport.actualPickupDate)} days
                      </div>
                      <div className="text-xs text-gray-500">
                        Picked up: {formatDate(transport.actualPickupDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {formatDate(transport.scheduledDeliveryDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <RecordTransportAction 
                          transport={transport}
                          actionType="delivery"
                          onComplete={handleTransportUpdated}
                        />
                        <Link 
                          to={`/distributor/transports/${transport.id}`} 
                          className="ml-2 text-gray-600 hover:text-gray-900"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Transport Instructions Card */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Delivery Instructions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-800 mb-2">In Transit Guidelines</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              <li>Ensure proper documentation is maintained</li>
              <li>Monitor temperature and conditions if required</li>
              <li>Update status if any delays are encountered</li>
              <li>Communicate with recipients about ETA</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Delivery Process</h3>
            <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
              <li>Confirm recipient details before delivery</li>
              <li>Get signature upon successful delivery</li>
              <li>Inspect items with recipient if required</li>
              <li>Record delivery completion immediately</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Post-Delivery</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Confirm blockchain transactions are updated</li>
              <li>Send delivery confirmation to relevant parties</li>
              <li>Report any issues or exceptional circumstances</li>
              <li>Close transport record in the system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveTransports;