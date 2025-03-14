// src/components/distributor/TransportsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TransportsList = () => {
  const { currentUser } = useAuth();
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalAction, setModalAction] = useState('');

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleAction = (transport, action) => {
    setSelectedTransport(transport);
    setModalAction(action);
    setShowActionModal(true);
  };

  const handleActionConfirm = async () => {
    try {
      setLoading(true);
      if (modalAction === 'pickup') {
        await distributorService.recordPickup(selectedTransport.id);
        setSuccess(`Pickup recorded successfully for ${selectedTransport.trackingNumber}`);
      } else if (modalAction === 'delivery') {
        await distributorService.recordDelivery(selectedTransport.id);
        setSuccess(`Delivery completed successfully for ${selectedTransport.trackingNumber}`);
      }
      
      // Close modal and refresh data
      setShowActionModal(false);
      fetchTransports();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error(`Error recording ${modalAction}:`, err);
      setError(`Failed to record ${modalAction}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Filter transports based on active tab
  const filteredTransports = transports.filter(transport => {
    if (activeTab === 'all') return true;
    if (activeTab === 'material') return transport.type === 'Material Transport';
    if (activeTab === 'product') return transport.type === 'Product Delivery';
    if (activeTab === 'scheduled') return transport.status === 'Scheduled';
    if (activeTab === 'in-transit') return transport.status === 'In Transit';
    if (activeTab === 'delivered') return transport.status === 'Delivered';
    return true;
  });

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
        <h1 className="text-2xl font-semibold">Transports</h1>
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
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Success:</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}
      
      {/* Filter Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
        <nav className="flex">
          <button
            onClick={() => handleTabChange('all')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'all'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTabChange('material')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'material'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Material Transports
          </button>
          <button
            onClick={() => handleTabChange('product')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'product'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Product Deliveries
          </button>
          <button
            onClick={() => handleTabChange('scheduled')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'scheduled'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => handleTabChange('in-transit')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'in-transit'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            In Transit
          </button>
          <button
            onClick={() => handleTabChange('delivered')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'delivered'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Delivered
          </button>
        </nav>
      </div>

      {/* Transports */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredTransports.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No transports found for your selected filter.</p>
            <p className="text-sm text-gray-500">
              Use the buttons above to schedule new material pickups or product deliveries.
            </p>
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
                    Scheduled Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransports.map((transport) => (
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
                        <p><span className="font-medium">From:</span> {transport.source?.username || 'Unknown'}</p>
                        <p><span className="font-medium">To:</span> {transport.destination?.username || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transport.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p><span className="font-medium">Pickup:</span> {formatDate(transport.scheduledPickupDate)}</p>
                        <p><span className="font-medium">Delivery:</span> {formatDate(transport.scheduledDeliveryDate)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p>
                          <span className="font-medium">Pickup:</span>{' '}
                          {transport.actualPickupDate ? formatDate(transport.actualPickupDate) : 'Pending'}
                        </p>
                        <p>
                          <span className="font-medium">Delivery:</span>{' '}
                          {transport.actualDeliveryDate ? formatDate(transport.actualDeliveryDate) : 'Pending'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {transport.status === 'Scheduled' && (
                          <button
                            onClick={() => handleAction(transport, 'pickup')}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-semibold py-1 px-2 rounded"
                          >
                            Record Pickup
                          </button>
                        )}
                        {transport.status === 'In Transit' && (
                          <button
                            onClick={() => handleAction(transport, 'delivery')}
                            className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-semibold py-1 px-2 rounded"
                          >
                            Record Delivery
                          </button>
                        )}
                        {transport.status === 'Delivered' && (
                          <span className="text-gray-500 text-xs">Completed</span>
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

      {/* Action Confirmation Modal */}
      {showActionModal && selectedTransport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {modalAction === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
            </h2>
            
            <p className="mb-4">
              {modalAction === 'pickup'
                ? `Are you sure you want to record pickup for ${selectedTransport.trackingNumber}?`
                : `Are you sure you want to record delivery for ${selectedTransport.trackingNumber}?`
              }
            </p>
            
            <div className="mb-4 bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Transport Type:</span> {selectedTransport.type}</p>
              <p>
                <span className="font-medium">
                  {modalAction === 'pickup' ? 'Pickup From:' : 'Delivery To:'}
                </span>{' '}
                {modalAction === 'pickup' 
                  ? selectedTransport.source?.username || 'Unknown'
                  : selectedTransport.destination?.username || 'Unknown'
                }
              </p>
              <p>
                <span className="font-medium">Scheduled Date:</span>{' '}
                {modalAction === 'pickup'
                  ? formatDate(selectedTransport.scheduledPickupDate)
                  : formatDate(selectedTransport.scheduledDeliveryDate)
                }
              </p>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {modalAction === 'pickup'
                ? 'This action will mark this transport as "In Transit".'
                : 'This action will mark this transport as "Delivered" and complete the transport process.'
              }
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowActionModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirm}
                className={`text-white font-bold py-2 px-4 rounded ${
                  modalAction === 'pickup'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportsList;