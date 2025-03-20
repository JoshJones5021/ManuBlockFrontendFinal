import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributorService, manufacturerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RecordTransportAction from './RecordTransportAction';

const RecyclingTransports = () => {
  const { currentUser } = useAuth();
  const [recyclingTransports, setRecyclingTransports] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    scheduledPickupDate: '',
    scheduledDeliveryDate: '',
    notes: ''
  });
  const [manufacturers, setManufacturers] = useState([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch recycling transports and available items for pickup in parallel
      const [transportsResponse, itemsResponse, manufacturersResponse] = await Promise.all([
        distributorService.getTransports(currentUser.id), // We'll filter for recycling type later
        distributorService.getAvailableChurnedItems(),
        manufacturerService.getAllManufacturers()
      ]);
      
      // Filter for recycling transports
      const allTransports = Array.isArray(transportsResponse?.data) ? transportsResponse.data : [];
      const recyclingOnly = allTransports.filter(transport => 
        transport.type === 'Recycling Pickup'
      );
      
      // Get manufacturers from supply chain partners
      const partners = Array.isArray(manufacturersResponse?.data) ? manufacturersResponse.data : [];
      const manufacturerPartners = partners.filter(partner => partner.role === 'MANUFACTURER');
      
      setRecyclingTransports(recyclingOnly);
      setAvailableItems(itemsResponse?.data || []);
      setManufacturers(manufacturerPartners);
      
      // Set default manufacturer if available
      if (manufacturerPartners.length > 0) {
        setSelectedManufacturerId(manufacturerPartners[0].id);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching recycling data:', err);
      setError('Failed to load recycling data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePickup = (item) => {
    // Initialize form with tomorrow's date for pickup and day after for delivery
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    setSelectedItem(item);
    
    // Pre-select the manufacturer if it exists in the item data
    if (item.manufacturerId) {
      setSelectedManufacturerId(item.manufacturerId.toString());
    } else {
      setSelectedManufacturerId(''); // Reset if no manufacturer
    }
    
    setFormData({
      scheduledPickupDate: tomorrow.toISOString().split('T')[0],
      scheduledDeliveryDate: dayAfter.toISOString().split('T')[0],
      notes: ''
    });
    
    setShowScheduleModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    
    try {
      // Validate inputs
      if (!formData.scheduledPickupDate || !formData.scheduledDeliveryDate) {
        setError('Please provide both pickup and delivery dates.');
        return;
      }
      
      if (!selectedManufacturerId) {
        setError('Please select a manufacturer.');
        return;
      }
      
      const pickupDate = new Date(formData.scheduledPickupDate);
      const deliveryDate = new Date(formData.scheduledDeliveryDate);
      
      if (pickupDate >= deliveryDate) {
        setError('Delivery date must be after pickup date.');
        return;
      }
      
      // Convert dates to timestamps (milliseconds since epoch)
      const pickupTimestamp = pickupDate.getTime();
      const deliveryTimestamp = deliveryDate.getTime();
      
      // Create transport for recycling pickup with timestamp dates
      await distributorService.createRecyclingTransport({
        distributorId: currentUser.id,
        customerId: selectedItem.customerId,
        manufacturerId: parseInt(selectedManufacturerId),
        itemId: selectedItem.id,
        supplyChainId: selectedItem.supplyChainId,
        scheduledPickupDate: pickupTimestamp,     // Send as timestamp
        scheduledDeliveryDate: deliveryTimestamp, // Send as timestamp
        notes: formData.notes
      });
      
      setShowScheduleModal(false);
      setSuccess('Recycling pickup scheduled successfully!');
      fetchData(); // Refresh data
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error scheduling recycling pickup:', err);
      setError('Failed to schedule recycling pickup. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

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

  // Items Available for Recycling Pickup
  const ItemsSection = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="px-6 py-4 bg-green-50 border-b border-green-200">
        <h2 className="text-xl font-semibold">Products Available for Recycling Pickup</h2>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : availableItems.length === 0 ? (
          <div className="text-center py-8">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">No products are currently available for recycling pickup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name || 'No name available'}</div>
                    <div className="text-sm text-gray-500">{item.type || 'No product type'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.customerName}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{item.pickupAddress || 'No address'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.updated_at ? formatDate(item.updated_at) : 'Not specified'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleSchedulePickup(item)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-xs"
                      >
                        Schedule Pickup
                      </button>
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
  
  // Existing Recycling Transports
  const TransportsSection = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Recycling Transports</h2>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : recyclingTransports.length === 0 ? (
          <div className="text-center py-8">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7l4-4m0 0l4 4m-4-4v18" />
            </svg>
            <p className="text-gray-500">No recycling transports have been scheduled yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From → To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recyclingTransports.map((transport) => (
                  <tr key={transport.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transport.trackingNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transport.productName || 'Recycled Item'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p><span className="font-semibold">From:</span> {transport.source?.username || 'Unknown Customer'}</p>
                        <p><span className="font-semibold">To:</span> {transport.destination?.username || 'Unknown Manufacturer'}</p>
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
                      <div className="flex space-x-2">
                        {transport.status === 'Scheduled' && (
                          <RecordTransportAction 
                            transport={transport} 
                            actionType="pickup" 
                            onComplete={fetchData} 
                          />
                        )}
                        
                        {transport.status === 'In Transit' && (
                          <RecordTransportAction 
                            transport={transport} 
                            actionType="delivery" 
                            onComplete={fetchData} 
                          />
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
    </div>
  );
  
  const ScheduleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Schedule Recycling Pickup</h2>
          <button onClick={() => setShowScheduleModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmitSchedule}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Product:</span> {selectedItem?.name}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Customer:</span> {selectedItem?.customerName}
            </p>
            {selectedItem?.address && (
              <p className="text-gray-700 mb-2">
                <span className="font-bold">Address:</span> {selectedItem.address}
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="manufacturerId">
              Manufacturer <span className="text-red-500">*</span>
            </label>
            <select
                id="manufacturerId"
                value={selectedManufacturerId}
                onChange={(e) => setSelectedManufacturerId(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                >
                <option value="">Select a manufacturer</option>
                {manufacturers.map((manufacturer) => (
                    <option 
                    key={manufacturer.id} 
                    value={manufacturer.id}
                    className={manufacturer.id === selectedItem?.manufacturerId ? "font-bold" : ""}
                    >
                    {manufacturer.name || manufacturer.username}
                    {manufacturer.id === selectedItem?.manufacturerId ? " (Original Manufacturer)" : ""}
                    </option>
                ))}
            </select>
            {manufacturers.length === 0 && (
              <p className="text-red-500 text-xs italic mt-1">
                No manufacturers available in this supply chain.
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledPickupDate">
              Scheduled Pickup Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="scheduledPickupDate"
              name="scheduledPickupDate"
              value={formData.scheduledPickupDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledDeliveryDate">
              Scheduled Delivery Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="scheduledDeliveryDate"
              name="scheduledDeliveryDate"
              value={formData.scheduledDeliveryDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min={formData.scheduledPickupDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Add any special pickup or delivery instructions"
            ></textarea>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Schedule Pickup
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Recycling Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          {success}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div className="text-gray-700">
          <p className="text-lg">
            Help customers recycle their products by scheduling pickups and delivering to manufacturers.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {/* Items waiting for recycling pickup */}
      <ItemsSection />
      
      {/* Active recycling transports */}
      <TransportsSection />
      
      {/* Modal for scheduling pickup */}
      {showScheduleModal && selectedItem && <ScheduleModal />}
    </div>
  );
};

export default RecyclingTransports;