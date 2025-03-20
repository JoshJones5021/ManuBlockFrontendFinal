import React, { useState, useEffect } from 'react';
import { customerService, blockchainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Recycling = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [churnedProducts, setChurnedProducts] = useState([]);
  const [recyclingTransports, setRecyclingTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showChurnModal, setShowChurnModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [notes, setNotes] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        productsResponse,
        churnedResponse,
        transportsResponse,
        itemsResponse,
      ] = await Promise.all([
        customerService.getOrders(currentUser.id),
        customerService.getChurnedProducts(currentUser.id),
        customerService.getRecyclingTransports(currentUser.id),
        blockchainService.getItemsByOwner(currentUser.id),
      ]);

      const ordersData = Array.isArray(productsResponse?.data)
        ? productsResponse.data
        : [];
      const completedOrders = ordersData.filter(
        order => order.status === 'Completed'
      );

      const blockchainItems = itemsResponse?.data || [];
      console.log('Blockchain items:', blockchainItems);

      const churnedItemIds = (churnedResponse?.data || []).map(item => item.id);

      const productToBlockchainMap = new Map();

      blockchainItems.forEach(blockchainItem => {
        completedOrders.forEach(order => {
          order.items.forEach(orderItem => {
            if (
              orderItem.productName === blockchainItem.name &&
              blockchainItem.status !== 'CHURNED'
            ) {
              productToBlockchainMap.set(orderItem.id, blockchainItem);
            }
          });
        });
      });

      const productsFromOrders = completedOrders.flatMap(order =>
        (order.items || []).map(item => {
          const blockchainItem = productToBlockchainMap.get(item.id);

          return {
            ...item,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            deliveryDate: order.actualDeliveryDate || order.completedDate,
            blockchain_item_id: blockchainItem ? blockchainItem.id : null,
            isRecycling: blockchainItem
              ? churnedItemIds.includes(blockchainItem.id)
              : false,
          };
        })
      );

      const availableProducts = productsFromOrders.filter(
        product => !product.isRecycling && product.blockchain_item_id !== null
      );

      setProducts(availableProducts);
      setChurnedProducts(churnedResponse?.data || []);
      setRecyclingTransports(transportsResponse?.data || []);

      setError(null);
    } catch (err) {
      console.error('Error fetching recycling data:', err);
      setError('Failed to load recycling data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChurn = product => {
    setSelectedProduct(product);
    setNotes('');
    setPickupAddress('');
    setShowChurnModal(true);
  };

  const submitChurn = async e => {
    e.preventDefault();

    try {
      if (!selectedProduct.blockchain_item_id) {
        setError(
          'No blockchain item ID found for this product. Cannot proceed with recycling.'
        );
        return;
      }

      await customerService.markProductForRecycling(
        selectedProduct.blockchain_item_id,
        {
          customerId: currentUser.id,
          notes: notes,
          pickupAddress: pickupAddress,
        }
      );

      setShowChurnModal(false);
      setSuccess(
        'Product has been marked for recycling. You will be notified when pickup is arranged.'
      );
      fetchData();

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error(
        'Error marking product for recycling:',
        err.response?.data || err.message
      );
      setError(
        `Failed to mark product for recycling: ${err.response?.data?.error || err.message}`
      );
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = status => {
    switch (status) {
      case 'CHURNED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Ready for Pickup
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            In Transit
          </span>
        );
      case 'RECYCLING_RECEIVED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Received for Recycling
          </span>
        );
      case 'RECYCLED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Recycled
          </span>
        );
      case 'REFURBISHED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
            Refurbished
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

  const ChurnModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            Return Product for Recycling
          </h2>
          <button
            onClick={() => setShowChurnModal(false)}
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

        <form onSubmit={submitChurn}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Product:</span>{' '}
              {selectedProduct?.productName}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Order:</span> #
              {selectedProduct?.orderNumber}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Purchase Date:</span>{' '}
              {formatDate(selectedProduct?.orderDate)}
            </p>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="pickupAddress"
            >
              Pickup Address
            </label>
            <textarea
              id="pickupAddress"
              value={pickupAddress}
              onChange={e => setPickupAddress(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Enter address for pickup"
              required
            ></textarea>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="notes"
            >
              Notes (condition, reason for return, etc.)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              placeholder="Please describe the condition of the product and reason for recycling"
            ></textarea>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowChurnModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Confirm Recycling
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Product Recycling</h1>

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

      {/* Recycling Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          About Our Recycling Program
        </h2>
        <p className="mb-4">
          Our recycling program helps reduce waste and promote sustainability.
          When you return your used products:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 rounded-lg flex flex-col items-center text-center">
            <svg
              className="h-12 w-12 text-green-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <h3 className="font-medium mb-1">Materials Get Recycled</h3>
            <p className="text-sm">
              Products are broken down into raw materials that can be used again
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg flex flex-col items-center text-center">
            <svg
              className="h-12 w-12 text-blue-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h3 className="font-medium mb-1">Protecting Environment</h3>
            <p className="text-sm">
              Reduce landfill waste and conserve natural resources
            </p>
          </div>
        </div>
      </div>

      {/* Pending Recycling */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Your Recycling Status</h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : churnedProducts.length === 0 &&
            recyclingTransports.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-gray-500">
                You don't have any products in the recycling process.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Products Waiting for Pickup
              </h3>
              {churnedProducts.length === 0 ? (
                <p className="text-gray-500 mb-6">
                  No products currently waiting for pickup.
                </p>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="space-y-4">
                    {churnedProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {product.name || 'Unknown Product'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Marked for recycling on{' '}
                            {formatDate(product.updatedAt)}
                          </p>
                        </div>
                        {getStatusBadge(product.status || 'CHURNED')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-lg font-semibold mb-3">
                Recycling in Progress
              </h3>
              {recyclingTransports.length === 0 ? (
                <p className="text-gray-500">
                  No products currently in the recycling process.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tracking
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recyclingTransports.map(transport => (
                        <tr key={transport.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {transport.productName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(transport.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {transport.pickupDate
                                ? formatDate(transport.pickupDate)
                                : 'Scheduled'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-indigo-600">
                              #{transport.trackingNumber}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Products Available for Recycling */}
      <div
        id="products"
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            Products Available for Recycling
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <p className="text-gray-500">
                You don't have any products eligible for recycling.
              </p>
              <p className="text-gray-500 mt-2">
                Products become eligible after they have been delivered and the
                order is complete.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Quantity: {product.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          #{product.orderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(product.orderDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleChurn(product)}
                          className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-1 px-3 rounded text-xs"
                        >
                          Recycle This Product
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

      {/* Churn Modal */}
      {showChurnModal && selectedProduct && <ChurnModal />}
    </div>
  );
};

export default Recycling;
