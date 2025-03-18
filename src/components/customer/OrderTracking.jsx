// src/components/customer/OrderTracking.jsx
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OrderTracking = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [currentUser.id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await customerService.getOrders(currentUser.id);
      
      if (response?.data && Array.isArray(response.data)) {
        // Sort orders by creation date (newest first)
        const sortedOrders = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
      } else {
        console.warn('API did not return an array for orders', response);
        setOrders([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    try {
      setLoading(true);
      // You'll need to add this API endpoint to your customerService
      const response = await customerService.trackOrder(trackingId);
      setTrackingResult(response.data);
      setError(null);
    } catch (err) {
      console.error('Error tracking order:', err);
      setError('Unable to find order with this tracking number. Please check and try again.');
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Track Your Orders</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}
      
      {/* Order Tracking Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleTrackOrder} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="trackingId" className="block text-sm font-medium text-gray-700 mb-1">
              Order Number or Tracking Number
            </label>
            <input
              type="text"
              id="trackingId"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter order number or tracking number"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Tracking...
                </span>
              ) : (
                'Track Order'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Tracking Results */}
      {trackingResult && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Order #{trackingResult.orderNumber}</h2>
            <div className="mt-2 flex items-center">
              <span className="text-gray-600 mr-2">Status:</span>
              {getStatusBadge(trackingResult.status)}
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Shipping Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="whitespace-pre-line">{trackingResult.shippingAddress}</p>
                </div>
                {trackingResult.requestedDeliveryDate && (
                  <div>
                    <p className="text-sm text-gray-500">Requested Delivery Date</p>
                    <p>{formatDate(trackingResult.requestedDeliveryDate)}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Order Timeline</h3>
                <div className="relative">
                    <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
                    <div className="space-y-6">
                    {trackingResult.statusHistory && trackingResult.statusHistory.length > 0 ? (
                        trackingResult.statusHistory.map((event, index) => (
                        <div key={index} className="relative pl-10">
                            <div className="absolute left-0 top-1 rounded-full h-8 w-8 bg-blue-500 flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            </div>
                            <div>
                            <h4 className="font-medium">{event.status}</h4>
                            <p className="text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                            {event.notes && <p className="text-xs text-gray-600 mt-1">{event.notes}</p>}
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="relative pl-10">
                        <div className="absolute left-0 top-1 rounded-full h-8 w-8 bg-blue-500 flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-medium">Order Placed</h4>
                            <p className="text-sm text-gray-500">{new Date(trackingResult.createdAt).toLocaleString()}</p>
                        </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>
            
            {trackingResult.items && trackingResult.items.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trackingResult.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(item.status || trackingResult.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {trackingResult.blockchainTxHash && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Blockchain Verification</h3>
                <p className="text-xs text-gray-500 break-all">Transaction ID: {trackingResult.blockchainTxHash}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Recent Orders for Quick Tracking */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Your Recent Orders</h2>
          <p className="text-sm text-gray-600">Click on any order to track it</p>
        </div>
        
        {loading && !trackingResult ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">You don't have any orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.slice(0, 5).map((order) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setTrackingId(order.orderNumber);
                          handleTrackOrder({ preventDefault: () => {} });
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Track
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
};

export default OrderTracking;