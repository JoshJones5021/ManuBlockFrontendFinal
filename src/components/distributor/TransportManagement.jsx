// src/components/distributor/TransportManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TransportManagement = () => {
  const { currentUser } = useAuth();
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showDetails, setShowDetails] = useState(null);

  useEffect(() => {
    fetchTransports();
  }, [currentUser.id]);

  const fetchTransports = async () => {
    try {
      setLoading(true);
      const response = await distributorService.getTransports(currentUser.id);
      setTransports(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching transports:', err);
      setError('Failed to load transports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransports = () => {
    if (activeTab === 'all') return transports;
    if (activeTab === 'material') return transports.filter(t => t.type === 'Material Transport');
    if (activeTab === 'product') return transports.filter(t => t.type === 'Product Delivery');
    if (activeTab === 'scheduled') return transports.filter(t => t.status === 'Scheduled');
    if (activeTab === 'in-transit') return transports.filter(t => t.status === 'In Transit');
    if (activeTab === 'delivered') return transports.filter(t => t.status === 'Delivered');
    return transports;
  };

  const handleRecordPickup = async (transportId) => {
    try {
      setLoading(true);
      await distributorService.recordPickup(transportId);
      // Refresh data
      fetchTransports();
    } catch (err) {
      console.error('Error recording pickup:', err);
      setError('Failed to record pickup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDelivery = async (transportId) => {
    try {
      setLoading(true);
      await distributorService.recordDelivery(transportId);
      // Refresh data
      fetchTransports();
    } catch (err) {
      console.error('Error recording delivery:', err);
      setError('Failed to record delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Scheduled</span>;
      case 'In Transit':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">In Transit</span>;
      case 'Delivered':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Delivered</span>;
      case 'Confirmed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Confirmed</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && transports.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Transport Management</h1>
        <div className="flex space-x-2">
          <Link 
            to="/distributor/material-pickups/schedule"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Schedule Material Pickup
          </Link>
          <Link 
            to="/distributor/product-deliveries/schedule"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Schedule Product Delivery
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Transports
            </button>
            <button
              onClick={() => setActiveTab('material')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'material'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Material Transports
            </button>
            <button
              onClick={() => setActiveTab('product')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'product'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Product Deliveries
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scheduled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setActiveTab('in-transit')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'in-transit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In Transit
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'delivered'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivered
            </button>
          </nav>
        </div>
      </div>

      {/* Transports Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredTransports().length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No transports found for the selected filter.</p>
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
                    Pickup Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransports().map((transport) => (
                  <tr key={transport.id} className={showDetails === transport.id ? 'bg-blue-50' : ''}>
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
                        <p><span className="font-medium">From:</span> {transport.source.username}</p>
                        <p><span className="font-medium">To:</span> {transport.destination.username}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transport.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p><span className="font-medium">Scheduled:</span> {formatDate(transport.scheduledPickupDate)}</p>
                        {transport.actualPickupDate && (
                          <p><span className="font-medium">Actual:</span> {formatDate(transport.actualPickupDate)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p><span className="font-medium">Scheduled:</span> {formatDate(transport.scheduledDeliveryDate)}</p>
                        {transport.actualDeliveryDate && (
                          <p><span className="font-medium">Actual:</span> {formatDate(transport.actualDeliveryDate)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                        <button
                          onClick={() => setShowDetails(showDetails === transport.id ? null : transport.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {showDetails === transport.id ? 'Hide Details' : 'View Details'}
                        </button>
                        
                        {transport.status === 'Scheduled' && (
                          <button
                            onClick={() => handleRecordPickup(transport.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Record Pickup
                          </button>
                        )}
                        
                        {transport.status === 'In Transit' && (
                          <button
                            onClick={() => handleRecordDelivery(transport.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Record Delivery
                          </button>
                        )}
                      </div>
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

export default TransportManagement;