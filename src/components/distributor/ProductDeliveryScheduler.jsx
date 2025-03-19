// src/components/distributor/ProductDeliveryScheduler.jsx - Fixed with correct data structure handling
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { distributorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProductDeliveryScheduler = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    scheduledPickupDate: '',
    scheduledDeliveryDate: '',
    pickupLocation: '',
    deliveryLocation: ''
  });

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const fetchReadyOrders = async () => {
    try {
      setLoading(true);
      const response = await distributorService.getReadyOrders();
      
      if (response?.data && Array.isArray(response.data)) {
        setReadyOrders(response.data);
      } else {
        console.warn('API did not return an array for readyOrders', response);
        setReadyOrders([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching ready orders:', err);
      setError('Failed to load orders. Please try again later.');
      setReadyOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const getCustomerName = (order) => {
    return order?.customerName || 'Unknown Customer';
  };

  const getManufacturerName = (order) => {
    // Since manufacturer is not directly in the data, we'll use the supply chain name
    // or derive it from product information if available
    return order?.manufacturerName || 
           (order?.items && order.items[0]?.manufacturerName) || 
           'Unknown Manufacturer';
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    // Set minimum dates for pickup and delivery
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Use supply chain name instead of manufacturer name since it's available
    const manufacturerName = order.supplyChainName || 'Supplier';
    
    setFormData({
      scheduledPickupDate: formatDate(today),
      scheduledDeliveryDate: formatDate(tomorrow),
      pickupLocation: `${manufacturerName}'s Facility`,
      deliveryLocation: order.shippingAddress || 'Not provided'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOrder) {
      setError('Please select an order first.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate dates
      const pickupDate = new Date(formData.scheduledPickupDate);
      const deliveryDate = new Date(formData.scheduledDeliveryDate);
      
      if (deliveryDate <= pickupDate) {
        setError('Delivery date must be after pickup date.');
        setSubmitting(false);
        return;
      }
      
      // Prepare transport data
      const transportData = {
        distributorId: currentUser.id,
        orderId: selectedOrder.id,
        scheduledPickupDate: pickupDate.toISOString(),
        scheduledDeliveryDate: deliveryDate.toISOString(),
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation
      };
      
      await distributorService.createProductTransport(transportData);
      
      setSuccess('Product delivery scheduled successfully!');
      setSelectedOrder(null);
      
      // After 2 seconds, navigate back to transports
      setTimeout(() => {
        navigate('/distributor/transports');
      }, 2000);
    } catch (err) {
      console.error('Error scheduling delivery:', err);
      setError(err.response?.data?.error || 'Failed to schedule delivery. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatItems = (items) => {
    if (!items || items.length === 0) return 'No items';
    
    // Get the first few items
    const displayItems = items.slice(0, 2);
    const remaining = items.length - displayItems.length;
    
    const itemsText = displayItems.map(item => {
      const productName = item.productName || 'Product';
      const quantity = item.quantity || 0;
      return `${productName} (${quantity})`;
    }).join(', ');
    
    if (remaining > 0) {
      return `${itemsText} and ${remaining} more item(s)`;
    }
    
    return itemsText;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Schedule Product Delivery</h1>
        <button
          onClick={() => navigate('/distributor/transports')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Transports
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Ready for Delivery Orders</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : readyOrders.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No orders are ready for delivery at this time.</p>
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
                        Manufacturer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested Delivery
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {readyOrders.map((order) => (
                      <tr key={order.id} className={selectedOrder?.id === order.id ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.orderNumber || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getCustomerName(order)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getManufacturerName(order)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatItems(order.items)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(order.requestedDeliveryDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSelectOrder(order)}
                            className={`text-sm font-medium ${
                              selectedOrder?.id === order.id
                                ? 'text-blue-600 hover:text-blue-900'
                                : 'text-indigo-600 hover:text-indigo-900'
                            }`}
                          >
                            {selectedOrder?.id === order.id ? 'Selected' : 'Select'}
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
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Schedule Delivery</h2>
            </div>
            
            <div className="p-6">
              {!selectedOrder ? (
                <div className="text-center">
                  <p className="text-gray-500 mb-4">Please select an order from the list to schedule delivery.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledPickupDate">
                      Scheduled Pickup Date
                    </label>
                    <input
                      type="date"
                      id="scheduledPickupDate"
                      name="scheduledPickupDate"
                      value={formData.scheduledPickupDate}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pickupLocation">
                      Pickup Location
                    </label>
                    <input
                      type="text"
                      id="pickupLocation"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledDeliveryDate">
                      Scheduled Delivery Date
                    </label>
                    <input
                      type="date"
                      id="scheduledDeliveryDate"
                      name="scheduledDeliveryDate"
                      value={formData.scheduledDeliveryDate}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">Must be after pickup date</p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryLocation">
                      Delivery Location
                    </label>
                    <textarea
                      id="deliveryLocation"
                      name="deliveryLocation"
                      value={formData.deliveryLocation}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows="2"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Selected Order</h3>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p><span className="font-medium">Order #:</span> {selectedOrder.orderNumber || 'N/A'}</p>
                      <p><span className="font-medium">Customer:</span> {getCustomerName(selectedOrder)}</p>
                      <p><span className="font-medium">Items:</span> {formatItems(selectedOrder.items)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={submitting}
                    >
                      {submitting ? 'Scheduling...' : 'Schedule Delivery'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDeliveryScheduler;