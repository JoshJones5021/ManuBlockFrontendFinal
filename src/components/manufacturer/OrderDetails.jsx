import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { manufacturerService, distributorService, supplyChainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OrderDetails = () => {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    scheduledDeliveryDate: '',
    notes: ''
  });
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  
  // Use a ref to track if inventory has been fetched to prevent infinite loops
  const inventoryFetchedRef = useRef(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Separate effect for inventory fetching
  useEffect(() => {
    if (order && order.items && !inventoryFetchedRef.current) {
      fetchProductInventory();
      inventoryFetchedRef.current = true; // Mark as fetched
    }
  }, [order]);

  // Fetch distributors when the order is loaded
  useEffect(() => {
    // Replace the fetchDistributors function
const fetchDistributors = async () => {
    try {
      // Get distributors associated with this supply chain
      const response = await supplyChainService.getAssignedUsers(order.supplyChainId);
      
      if (response?.data && Array.isArray(response.data)) {
        // Filter to only get users with distributor role
        const chainDistributors = response.data.filter(user => 
          user.role === 'DISTRIBUTOR'
        );
        
        setDistributors(chainDistributors);
        
        // Set default distributor if available
        if (chainDistributors.length > 0) {
          setSelectedDistributorId(chainDistributors[0].id);
        }
      } else {
        console.error('No distributors returned for this supply chain');
        setDistributors([]);
      }
    } catch (error) {
      console.error('Error fetching distributors:', error);
      setDistributors([]);
    }
  };
    
    if (order && order.supplyChainId) {
      fetchDistributors();
    }
  }, [order]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Reset inventory fetched flag when loading a new order
      inventoryFetchedRef.current = false;
      
      const response = await manufacturerService.getOrders(currentUser.id);
      
      if (response?.data && Array.isArray(response.data)) {
        const foundOrder = response.data.find(o => o.id === parseInt(orderId));
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found');
        }
      } else {
        setError('Failed to load order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductInventory = async () => {
    try {
      setInventoryLoading(true);
      
      // Get all products for this manufacturer
      const response = await manufacturerService.getProducts(currentUser.id);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log('All products:', response.data);
        
        // Filter only the products we need for this order
        const productIds = order.items.map(item => item.productId);
        const relevantProducts = response.data.filter(product => 
          productIds.includes(product.id)
        );
        
        console.log('Relevant products for this order:', relevantProducts);
        setProducts(relevantProducts);
      } else {
        console.warn('No products returned from API');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching product inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleFulfillOrder = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      
      // Validate distributor selection
      if (!selectedDistributorId) {
        setError('Please select a distributor');
        setActionLoading(false);
        return;
      }
      
      // Convert date string to Date object if needed
      const scheduledDate = deliveryInfo.scheduledDeliveryDate 
        ? new Date(deliveryInfo.scheduledDeliveryDate).toISOString()
        : null;
      
      // Prepare the request data
      const fulfillmentData = {
        manufacturerId: currentUser.id,
        customerId: order.customerId,
        distributorId: parseInt(selectedDistributorId), // Convert to number
        supplyChainId: order.supplyChainId,
        scheduledDeliveryDate: scheduledDate,
        notes: deliveryInfo.notes
      };
      
      console.log("Sending fulfillment data:", fulfillmentData);
      
      // Call the new endpoint
      const response = await manufacturerService.fulfillOrderFromStock(order.id, fulfillmentData);
      
      console.log("Fulfillment response:", response);
      
      // Update order with the response data
      if (response.data && response.data.order) {
        setOrder(response.data.order);
        
        // Show success message from response if available
        if (response.data.message) {
          setSuccess(response.data.message);
        } else {
          setSuccess('Order fulfilled from stock and ready for shipment!');
        }
      } else {
        // Fallback if response format is unexpected
        setOrder({
          ...order,
          status: 'Ready for Shipment'
        });
        setSuccess('Order fulfilled from stock and ready for shipment!');
      }
      
      setShowFulfillModal(false);
    } catch (err) {
      console.error('Error fulfilling order:', err);
      
      // Show error from response if available
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to fulfill order. Please try again.');
      }
    } finally {
      setActionLoading(false);
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

  const calculateOrderTotal = (order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    
    return order.items.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  // Get product stock information for a specific item
  const getProductStock = (item) => {
    if (!item || !products.length) return { inStock: false, available: 0 };
    
    const product = products.find(p => p.id === item.productId);
    console.log(`Stock check for product ${item.productId}:`, product);
    
    const available = product ? product.availableQuantity || 0 : 0;
    const inStock = available >= item.quantity;
    
    return { inStock, available };
  };

  // Check if we can fulfill the order from existing inventory
  const canFulfillFromInventory = () => {
    if (!order || !order.items || !products.length) return false;
    
    // Check if all items have sufficient inventory
    return order.items.every(item => {
      const { inStock } = getProductStock(item);
      return inStock;
    });
  };

  // Fulfill Order Modal
  const FulfillOrderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Fulfill Order from Inventory</h2>
          <button onClick={() => setShowFulfillModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleFulfillOrder}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Order:</span> #{order.orderNumber}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Customer:</span> {order.customerName}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Shipping Address:</span> {order.shippingAddress}
            </p>
          </div>
          
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">Inventory Check</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => {
                  const { inStock, available } = getProductStock(item);
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{available}</td>
                      <td className="px-4 py-2">
                        {inStock ? 
                          <span className="text-green-600">✓ Available</span> : 
                          <span className="text-red-600">✗ Insufficient</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="distributorId">
              Distributor <span className="text-red-500">*</span>
            </label>
            <select
              id="distributorId"
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a distributor</option>
              {distributors.map((distributor) => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.username}
                </option>
              ))}
            </select>
            {distributors.length === 0 && (
              <p className="text-red-500 text-xs italic mt-1">
                No distributors available for this supply chain.
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledDeliveryDate">
              Scheduled Delivery Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="scheduledDeliveryDate"
              value={deliveryInfo.scheduledDeliveryDate}
              onChange={(e) => setDeliveryInfo({...deliveryInfo, scheduledDeliveryDate: e.target.value})}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              Delivery Notes
            </label>
            <textarea
              id="notes"
              value={deliveryInfo.notes}
              onChange={(e) => setDeliveryInfo({...deliveryInfo, notes: e.target.value})}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              placeholder="Add any notes for the distributor or customer"
            ></textarea>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowFulfillModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              disabled={actionLoading || !canFulfillFromInventory() || !selectedDistributorId}
            >
              {actionLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Fulfill Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/manufacturer/orders')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          Order not found.
        </div>
        <button
          onClick={() => navigate('/manufacturer/orders')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Order Details</h1>
        <button
          onClick={() => navigate('/manufacturer/orders')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Orders
        </button>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {/* Order Overview Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Order #{order.orderNumber}</h2>
            {getStatusBadge(order.status)}
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
              <p className="text-base">{order.customerName || 'Unknown'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Order Date</h3>
              <p className="text-base">{formatDate(order.createdAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Requested Delivery</h3>
              <p className="text-base">{order.requestedDeliveryDate ? formatDate(order.requestedDeliveryDate) : 'No date specified'}</p>
            </div>
            
            {order.supplyChainName && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Supply Chain</h3>
                <p className="text-base">{order.supplyChainName}</p>
              </div>
            )}
            
            {order.blockchainTxHash && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Blockchain Transaction</h3>
                <p className="text-base font-mono text-xs break-all">
                  {order.blockchainTxHash}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h3>
            <p className="text-base bg-gray-50 p-3 rounded">{order.shippingAddress || 'Not provided'}</p>
          </div>
          
          {order.deliveryNotes && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Delivery Notes</h3>
              <p className="text-base bg-gray-50 p-3 rounded">{order.deliveryNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Order Items</h2>
            {inventoryLoading && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking Inventory...
              </span>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Stock
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items && order.items.map((item) => {
                  const { inStock, available } = getProductStock(item);
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-500">ID: {item.productId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${item.price ? item.price.toFixed(2) : '0.00'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                          {available} available
                          {inStock ? 
                            <span className="ml-2">✓</span> : 
                            <span className="ml-2">✗</span>
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right font-medium">Order Total:</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${calculateOrderTotal(order).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Actions</h2>
        </div>
        
        <div className="p-6">
          {order.status === 'Requested' && (
            <div className="space-y-6">
              {canFulfillFromInventory() ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-800 mb-2">Good news! All items in stock.</h3>
                  <p className="text-green-700 mb-4">You have sufficient inventory to fulfill this order immediately.</p>
                  <button
                    onClick={() => setShowFulfillModal(true)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Fulfill Order from Inventory
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">Insufficient inventory</h3>
                  <p className="text-yellow-700 mb-4">You don't have enough stock to fulfill this order. You'll need to manufacture more products.</p>
                  <button
                    onClick={() => navigate('/manufacturer/production', { state: { orderDetails: order } })}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Create Production Batch
                  </button>
                </div>
              )}
            </div>
          )}

          {order.status === 'In Production' && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Order is in production</h3>
              <p className="text-yellow-700 mb-4">You need to complete all production batches for this order before it can be shipped.</p>
              <button
                onClick={() => navigate('/manufacturer/production')}
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
              >
                View Production Batches
              </button>
            </div>
          )}

          {order.status === 'Ready for Shipment' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-2">Order is ready for shipment</h3>
              <p className="text-green-700">The products have been reserved from inventory and the distributor has been notified.</p>
            </div>
          )}

          {(order.status === 'In Transit' || order.status === 'Delivered' || order.status === 'Completed') && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Order is {order.status.toLowerCase()}</h3>
              <p className="text-blue-700">
                {order.status === 'In Transit' ? 'The distributor is delivering this order to the customer.' : 
                 order.status === 'Delivered' ? 'This order has been delivered to the customer.' :
                 'This order has been completed.'}
              </p>
            </div>
          )}

          {order.status === 'Cancelled' && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-red-800 mb-2">Order has been cancelled</h3>
              <p className="text-red-700">This order was cancelled and requires no further action.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {showFulfillModal && <FulfillOrderModal />}
    </div>
  );
};

export default OrderDetails;