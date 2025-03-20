import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OrdersList = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [currentUser.id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await customerService.getOrders(currentUser.id);

      if (response?.data && Array.isArray(response.data)) {
        const sortedOrders = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
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

  const confirmDelivery = async orderId => {
    if (window.confirm('Confirm that you have received this order?')) {
      try {
        await customerService.confirmDelivery(orderId);
        setOrders(
          orders.map(order =>
            order.id === orderId ? { ...order, status: 'Completed' } : order
          )
        );

        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'Completed' });
        }
      } catch (err) {
        console.error('Error confirming delivery:', err);
        setError('Failed to confirm delivery. Please try again.');
      }
    }
  };

  const cancelOrder = async orderId => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await customerService.cancelOrder(orderId);
        setOrders(
          orders.map(order =>
            order.id === orderId ? { ...order, status: 'Cancelled' } : order
          )
        );

        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'Cancelled' });
        }
      } catch (err) {
        console.error('Error cancelling order:', err);
        setError('Failed to cancel order. Please try again.');
      }
    }
  };

  const viewOrderDetails = order => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const formatDate = dateString => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = status => {
    switch (status) {
      case 'Requested':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Requested
          </span>
        );
      case 'In Production':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            In Production
          </span>
        );
      case 'Ready for Shipment':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
            Ready for Shipment
          </span>
        );
      case 'In Transit':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            In Transit
          </span>
        );
      case 'Delivered':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Delivered
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const calculateOrderTotal = order => {
    if (!order.items || !Array.isArray(order.items)) return 0;

    return order.items.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      return total + price * quantity;
    }, 0);
  };

  const filteredOrders =
    filter === 'all'
      ? orders
      : orders.filter(order => {
          if (filter === 'active') {
            return !['Completed', 'Cancelled'].includes(order.status);
          } else if (filter === 'completed') {
            return order.status === 'Completed';
          } else if (filter === 'cancelled') {
            return order.status === 'Cancelled';
          }
          return true;
        });

  const OrderDetailModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Order Details</h2>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Order Number</p>
              <p className="font-medium">{selectedOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Order Date</p>
              <p>{formatDate(selectedOrder.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Requested Delivery</p>
              <p>{formatDate(selectedOrder.requestedDeliveryDate)}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-500 text-sm">Shipping Address</p>
            <p className="whitespace-pre-line">
              {selectedOrder.shippingAddress}
            </p>
          </div>

          {selectedOrder.deliveryNotes && (
            <div className="mb-4">
              <p className="text-gray-500 text-sm">Delivery Notes</p>
              <p className="whitespace-pre-line">
                {selectedOrder.deliveryNotes}
              </p>
            </div>
          )}

          <div className="border-t border-b border-gray-200 py-4 my-4">
            <h3 className="font-medium mb-3">Order Items</h3>
            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              <div className="space-y-4">
                {selectedOrder.items.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center mr-4">
                        <svg
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${item.price} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No items found for this order.</p>
            )}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Order Total</p>
              <p className="text-xl font-bold">
                ${calculateOrderTotal(selectedOrder).toFixed(2)}
              </p>
            </div>

            <div className="space-x-2">
              {selectedOrder.status === 'Delivered' && (
                <button
                  onClick={() => confirmDelivery(selectedOrder.id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  Confirm Receipt
                </button>
              )}

              {['Requested', 'In Production'].includes(
                selectedOrder.status
              ) && (
                <button
                  onClick={() => cancelOrder(selectedOrder.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel Order
                </button>
              )}

              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 font-medium">Filter:</span>
          <div className="flex space-x-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-md ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 text-sm rounded-md ${
                filter === 'active'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 text-sm rounded-md ${
                filter === 'completed'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 text-sm rounded-md ${
                filter === 'cancelled'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg
            className="h-16 w-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500 mb-4">No orders found.</p>
          <Link
            to="/customer/products"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${calculateOrderTotal(order).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>

                      {order.status === 'Delivered' && (
                        <button
                          onClick={() => confirmDelivery(order.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Confirm Receipt
                        </button>
                      )}

                      {['Requested', 'In Production'].includes(
                        order.status
                      ) && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && <OrderDetailModal />}
    </div>
  );
};

export default OrdersList;
