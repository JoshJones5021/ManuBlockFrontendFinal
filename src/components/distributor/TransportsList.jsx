// src/components/distributor/TransportsList.jsx - Consolidated from multiple components
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RecordTransportAction from './RecordTransportAction';

const TransportsList = () => {
  const { currentUser } = useAuth();
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [pendingMaterialPickups, setPendingMaterialPickups] = useState([]);
  const [pendingProductDeliveries, setPendingProductDeliveries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    inTransit: 0,
    delivered: 0,
    onTimeDeliveries: 0,
    delayedDeliveries: 0
  });

  useEffect(() => {
    fetchTransports();
  }, [currentUser.id]);

  const fetchTransports = async () => {
    try {
      setLoading(true);
      
      // Fetch transports and pending material pickups in parallel
      const [transportsResponse, pendingMaterialsResponse] = await Promise.all([
        distributorService.getTransports(currentUser.id),
        distributorService.getReadyMaterialRequests()
      ]);
      
      setTransports(transportsResponse.data || []);
      calculateStats(transportsResponse.data || []);
      
      // Check if there are any pending material pickups
      const pendingMaterials = pendingMaterialsResponse.data || [];
      
      // If there are pending pickups, show a notification
      if (pendingMaterials.length > 0) {
        // Can set to state if you want to display this in the UI
        // For example, to show a notification banner
        setSuccess(`There are ${pendingMaterials.length} material requests ready for pickup.`);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching transports:', err);
      setError('Failed to load transports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transportData) => {
    if (!transportData || !Array.isArray(transportData)) return;
    
    const scheduled = transportData.filter(t => t.status === 'Scheduled').length;
    const inTransit = transportData.filter(t => t.status === 'In Transit').length;
    const delivered = transportData.filter(t => t.status === 'Delivered').length;
    
    let onTime = 0;
    let delayed = 0;
    
    const deliveredTransports = transportData.filter(t => t.status === 'Delivered');
    deliveredTransports.forEach(transport => {
      if (transport.scheduledDeliveryDate && transport.actualDeliveryDate) {
        const scheduledDate = new Date(transport.scheduledDeliveryDate);
        const actualDate = new Date(transport.actualDeliveryDate);
        
        if (actualDate <= scheduledDate) {
          onTime++;
        } else {
          delayed++;
        }
      }
    });
    
    setStats({
      total: transportData.length,
      scheduled,
      inTransit,
      delivered,
      onTimeDeliveries: onTime,
      delayedDeliveries: delayed
    });
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

  // Filter transports based on active tab and search term
  const filteredTransports = transports.filter(transport => {
    // Apply tab filter
    const tabFilter = 
      activeTab === 'all' ? true :
      activeTab === 'material' ? transport.type === 'Material Transport' :
      activeTab === 'product' ? transport.type === 'Product Delivery' :
      activeTab === 'scheduled' ? transport.status === 'Scheduled' :
      activeTab === 'in-transit' ? transport.status === 'In Transit' :
      activeTab === 'delivered' ? transport.status === 'Delivered' : true;
    
    // Apply search filter
    const searchFilter = 
      !searchTerm ? true :
      (transport.trackingNumber && transport.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transport.source?.username && transport.source.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transport.destination?.username && transport.destination.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return tabFilter && searchFilter;
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

  const calculateDaysInTransit = (pickupDate) => {
    if (!pickupDate) return 0;
    
    const pickup = new Date(pickupDate);
    const today = new Date();
    const diffTime = Math.abs(today - pickup);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (loading && transports.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
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
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Schedule Pickup
          </Link>
          <Link 
            to="/distributor/product-deliveries/schedule"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Schedule Delivery
          </Link>
          <button 
            onClick={fetchTransports}
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
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Success:</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      {/* Pending Pickups and Deliveries Notifications */}
    {pendingMaterialPickups.length > 0 && (
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-6">
        <strong className="font-bold">Ready for Pickup:</strong>
        <span className="block sm:inline"> {pendingMaterialPickups.length} material {pendingMaterialPickups.length === 1 ? 'request' : 'requests'} ready for pickup. </span>
        <Link to="/distributor/material-pickups/schedule" className="underline font-semibold">
        Schedule now
        </Link>
    </div>
    )}

    {pendingProductDeliveries.length > 0 && (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
        <strong className="font-bold">Ready for Delivery:</strong>
        <span className="block sm:inline"> {pendingProductDeliveries.length} product {pendingProductDeliveries.length === 1 ? 'order' : 'orders'} ready for delivery. </span>
        <Link to="/distributor/product-deliveries/schedule" className="underline font-semibold">
        Schedule now
        </Link>
    </div>
    )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-gray-500 rounded-full p-2">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-gray-600 text-xs font-medium">Total</h2>
              <p className="text-xl font-semibold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-2">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-gray-600 text-xs font-medium">Scheduled</h2>
              <p className="text-xl font-semibold text-blue-600">{stats.scheduled}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-full p-2">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-gray-600 text-xs font-medium">In Transit</h2>
              <p className="text-xl font-semibold text-yellow-600">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-full p-2">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-gray-600 text-xs font-medium">Delivered</h2>
              <p className="text-xl font-semibold text-green-600">{stats.delivered}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-full p-2">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-gray-600 text-xs font-medium">On Time</h2>
              <p className="text-xl font-semibold text-green-600">{stats.onTimeDeliveries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-red-500 rounded-full p-2">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-gray-600 text-xs font-medium">Delayed</h2>
              <p className="text-xl font-semibold text-red-600">{stats.delayedDeliveries}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              placeholder="Search by tracking number, source, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="self-end">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTabChange('all')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleTabChange('scheduled')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'scheduled'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => handleTabChange('in-transit')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'in-transit'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Transit
              </button>
              <button
                onClick={() => handleTabChange('delivered')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'delivered'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => handleTabChange('material')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'material'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Material Transports
              </button>
              <button
                onClick={() => handleTabChange('product')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'product'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Product Deliveries
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transports Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredTransports.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {transports.length > 0 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by scheduling a new material pickup or product delivery'
              }
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <Link
                to="/distributor/material-pickups/schedule"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Schedule Pickup
              </Link>
              <Link
                to="/distributor/product-deliveries/schedule"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Schedule Delivery
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
                    {activeTab === 'in-transit' ? 'Days In Transit' : 'Scheduled Dates'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'in-transit' ? 'Est. Delivery' : 'Actual Dates'}
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
                      <Link 
                        to={`/distributor/transports/${transport.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
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
                        <p><span className="font-semibold">From:</span> {transport.source?.username || 'Unknown'}</p>
                        <p><span className="font-semibold">To:</span> {transport.destination?.username || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transport.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transport.status === 'In Transit' ? (
                        <div className="text-sm font-semibold">
                          {calculateDaysInTransit(transport.actualPickupDate)} days
                          <div className="text-xs text-gray-500">
                            Picked up: {formatDate(transport.actualPickupDate)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p><span className="font-medium">Pickup:</span> {formatDate(transport.scheduledPickupDate)}</p>
                          <p><span className="font-medium">Delivery:</span> {formatDate(transport.scheduledDeliveryDate)}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transport.status === 'In Transit' ? (
                        <div className="text-sm">
                          {formatDate(transport.scheduledDeliveryDate)}
                        </div>
                      ) : (
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
                      )}
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
                        <Link 
                          to={`/distributor/transports/${transport.id}`} 
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-1 px-2 rounded"
                        >
                          View Details
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