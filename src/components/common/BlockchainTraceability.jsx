import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { blockchainService, supplyChainService } from '../../services/api';
import ItemGraph from './ItemGraph';

const BlockchainTraceability = () => {
  const { currentUser } = useAuth();
  const [supplyChains, setSupplyChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemHistory, setItemHistory] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [itemTimeline, setItemTimeline] = useState([]);
  const [parentItems, setParentItems] = useState([]);
  const [childItems, setChildItems] = useState([]);
  const [itemTypeFilter, setItemTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [functionFilter, setFunctionFilter] = useState('');

  useEffect(() => {
    fetchSupplyChains();
  }, [currentUser]);

  const fetchSupplyChains = async () => {
    try {
      setLoading(true);
      const response = await supplyChainService.getSupplyChainsByUser(
        currentUser.id
      );
      setSupplyChains(response);

      if (response && response.length > 0) {
        setSelectedChain(response[0]);
        fetchBlockchainItems(response[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching supply chains:', err);
      setError('Failed to load supply chains. Please try again later.');
      setLoading(false);
    }
  };

  const fetchBlockchainItems = async chainId => {
    try {
      setLoading(true);
      const response = await blockchainService.getItemsBySupplyChain(chainId);
      setItems(response.data || []);

      fetchTransactions();
    } catch (err) {
      console.error('Error fetching blockchain items:', err);
      setError('Failed to load blockchain items. Please try again later.');
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await blockchainService.getAllBlockchainTransactions();

      const sortedTransactions = (response.data || []).sort((a, b) => {
        if (!a.createdAt) return -1;
        if (!b.createdAt) return 1;

        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

      setTransactions(sortedTransactions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching blockchain transactions:', err);
      setError(
        'Failed to load blockchain transactions. Please try again later.'
      );
      setLoading(false);
    }
  };

  const handleChainChange = e => {
    const chainId = e.target.value;
    const chain = supplyChains.find(sc => sc.id === parseInt(chainId));
    setSelectedChain(chain);
    fetchBlockchainItems(chainId);
  };

  const viewItemDetails = async item => {
    try {
      setLoading(true);
      setSelectedItem(item);
      setViewMode('item');

      const timelineResponse =
        await blockchainService.getItemTransactionTimeline(item.id);

      if (timelineResponse.data) {
        setItemTimeline(timelineResponse.data.timeline || []);
        setParentItems(timelineResponse.data.parents || []);
      }

      const traceResponse = await blockchainService.traceItemHistory(item.id);
      setItemHistory(traceResponse.data || {});

      try {
        const childrenResponse = await blockchainService.getItemChildren(
          item.id
        );

        const validChildren = Array.isArray(childrenResponse.data)
          ? childrenResponse.data.filter(child => child && child.id)
          : [];
        setChildItems(validChildren);
      } catch (err) {
        console.warn('No children found for item:', err);
        setChildItems([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching item details:', err);
      setError('Failed to load item details. Please try again later.');
      setLoading(false);
    }
  };

  const viewTransactionDetails = async txHash => {
    try {
      setLoading(true);

      const response = await blockchainService.getTransactionDetails(txHash);
      setSelectedTransaction(response.data || null);

      setViewMode('transaction');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setError('Failed to load transaction details. Please try again later.');
      setLoading(false);
    }
  };

  const getStatusBadge = status => {
    if (!status) return null;

    const statusText = status.toString().toUpperCase();

    switch (statusText) {
      case 'CREATED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Created
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            In Transit
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Processing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Completed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case 'CHURNED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
            Churned
          </span>
        );
      case 'RECYCLED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
            Recycled
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Failed
          </span>
        );
      case '0':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Created
          </span>
        );
      case '1':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            In Transit
          </span>
        );
      case '2':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Processing
          </span>
        );
      case '3':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Completed
          </span>
        );
      case '4':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {statusText}
          </span>
        );
    }
  };

  const getItemTypeBadge = type => {
    if (!type) return null;

    switch (type.toLowerCase()) {
      case 'raw-material':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Raw Material
          </span>
        );
      case 'allocated-material':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
            Allocated Material
          </span>
        );
      case 'recycled-material':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
            Recycled Material
          </span>
        );
      case 'manufactured-product':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Product
          </span>
        );
      case 'order':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Order
          </span>
        );
      case 'material-request':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Material Request
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {type}
          </span>
        );
    }
  };

  const getFunctionBadge = functionName => {
    if (!functionName) return null;

    switch (functionName) {
      case 'createSupplyChain':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Create Supply Chain
          </span>
        );
      case 'authorizeParticipant':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Authorize Participant
          </span>
        );
      case 'createItem':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Create Item
          </span>
        );
      case 'transferItem':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
            Transfer Item
          </span>
        );
      case 'processItem':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
            Process Item
          </span>
        );
      case 'updateItemStatus':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-100 text-sky-800">
            Update Status
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {functionName}
          </span>
        );
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const truncateHash = hash => {
    if (!hash) return 'N/A';
    return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (viewMode === 'item' && selectedItem) {
      return renderItemDetails();
    }

    if (viewMode === 'transaction' && selectedTransaction) {
      return renderTransactionDetails();
    }

    return renderListView();
  };

  const renderItemDetails = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Item History: {selectedItem.name}
          </h3>
          <button
            onClick={() => setViewMode('list')}
            className="text-gray-500 hover:text-gray-700"
          >
            Back to List
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium mb-2">Item Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500">ID:</span>
                <p className="text-sm font-medium">{selectedItem.id}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Type:</span>
                <p className="text-sm font-medium">
                  {getItemTypeBadge(selectedItem.itemType)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="text-sm font-medium">
                  {getStatusBadge(selectedItem.status)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Quantity:</span>
                <p className="text-sm font-medium">{selectedItem.quantity}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created:</span>
                <p className="text-sm font-medium">
                  {formatDate(selectedItem.createdAt)}
                </p>
              </div>
              <div className="md:col-span-3">
                <span className="text-sm text-gray-500">Transaction Hash:</span>
                <p className="text-sm font-mono break-all">
                  {selectedItem.blockchainTxHash || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Parent Items Section */}
          {parentItems.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Derived From</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parentItems.map((parent, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border p-3 hover:shadow-md transition"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {parent.name || 'Item #' + parent.id}
                      </span>
                      {getItemTypeBadge(parent.type)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      ID: {parent.id}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Status: {getStatusBadge(parent.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Child Items Section */}
          {childItems.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Used To Create</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childItems.map((child, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border p-3 hover:shadow-md transition"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {child.name || 'Item #' + child.id}
                      </span>
                      {getItemTypeBadge(child.type)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      ID: {child.id}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Status: {getStatusBadge(child.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h4 className="text-md font-medium mb-4">Transaction Timeline</h4>

          {itemTimeline.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              No transaction history available for this item.
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Timeline events */}
              <div className="space-y-6 relative">
                {itemTimeline.map((event, index) => (
                  <div key={index} className="ml-10 relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-14 mt-1.5 w-7 h-7 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </div>

                    {/* Event content */}
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <div className="flex justify-between mb-2">
                        <h5 className="font-medium text-gray-900">
                          {getFunctionBadge(event.function)}
                        </h5>
                        <time className="text-sm text-gray-500">
                          {formatDate(event.createdAt)}
                        </time>
                      </div>

                      {event.description && (
                        <div className="mb-3 text-sm text-gray-700">
                          {event.description}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                          <span className="text-xs text-gray-500">
                            Transaction Hash:
                          </span>
                          <p className="text-sm font-mono">{event.txHash}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Status:</span>
                          <p className="text-sm">
                            {getStatusBadge(event.status)}
                          </p>
                        </div>
                      </div>

                      {event.relatedEntities && (
                        <div className="mt-2 text-sm">
                          <div className="text-xs text-gray-500 mb-1">
                            Related Entities:
                          </div>
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(event.relatedEntities, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add the ItemGraph component to visualize relationships */}
          {(parentItems.length > 0 || childItems.length > 0) && (
            <ItemGraph
              item={selectedItem}
              parentItems={parentItems}
              childItems={childItems}
            />
          )}
        </div>
      </div>
    );
  };

  const renderTransactionDetails = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Transaction Details</h3>
          <button
            onClick={() =>
              viewMode === 'item' ? setViewMode('item') : setViewMode('list')
            }
            className="text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium mb-4">
              Transaction Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Function:</span>
                <p className="text-sm font-medium">
                  {getFunctionBadge(selectedTransaction.function)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="text-sm font-medium">
                  {getStatusBadge(selectedTransaction.status)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created At:</span>
                <p className="text-sm font-medium">
                  {formatDate(selectedTransaction.createdAt)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Confirmed At:</span>
                <p className="text-sm font-medium">
                  {formatDate(selectedTransaction.confirmedAt)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-500">Transaction Hash:</span>
                <p className="text-sm font-mono break-all">
                  {selectedTransaction.txHash || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {selectedTransaction.description && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Description</h4>
              <div className="bg-white border p-4 rounded-lg">
                <p className="text-sm">{selectedTransaction.description}</p>
              </div>
            </div>
          )}

          {selectedTransaction.relatedEntities && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Related Entities</h4>
              <div className="bg-white border p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(selectedTransaction.relatedEntities, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {selectedTransaction.rawParameters && (
            <div>
              <h4 className="text-md font-medium mb-2">Raw Parameters</h4>
              <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  {selectedTransaction.rawParameters}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <>
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Blockchain Items</h3>
          </div>
          <div className="overflow-x-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No blockchain items found for this supply chain.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items
                    .filter(item => {
                
                      if (itemTypeFilter && item.itemType !== itemTypeFilter) {
                        return false;
                      }

                      if (statusFilter && item.status !== statusFilter) {
                        return false;
                      }

                      if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        const name = (item.name || '').toLowerCase();
                        const id = String(item.id).toLowerCase();
                        const ownerName = (
                          item.owner?.username || ''
                        ).toLowerCase();
                        const type = (item.itemType || '').toLowerCase();

                        return (
                          name.includes(query) ||
                          id.includes(query) ||
                          ownerName.includes(query) ||
                          type.includes(query)
                        );
                      }

                      return true;
                    })
                    .map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getItemTypeBadge(item.itemType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(item.updatedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                          <button
                            onClick={() => viewItemDetails(item)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Blockchain Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No blockchain transactions found for this supply chain.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Function
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tx Hash
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions
                    .filter(tx => {
                    
                      if (functionFilter && tx.function !== functionFilter) {
                        return false;
                      }

                      if (statusFilter && tx.status !== statusFilter) {
                        return false;
                      }

                      if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        const description = (
                          tx.description || ''
                        ).toLowerCase();
                        const functionName = (tx.function || '').toLowerCase();
                        const txHash = (tx.txHash || '').toLowerCase();

                        return (
                          description.includes(query) ||
                          functionName.includes(query) ||
                          txHash.includes(query)
                        );
                      }

                      return true;
                    })
                    .map((tx, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getFunctionBadge(tx.function)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {tx.description || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(tx.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(tx.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {tx.txHash}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Blockchain Traceability</h1>
        <p className="text-gray-600">
          Track and verify the complete history of items in your supply chain
        </p>
      </div>

      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          Supply Chain Transparency
        </h2>
        <p className="text-blue-700 mb-4">
          View all blockchain transactions and trace the complete lifecycle of
          products and materials.
        </p>
        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-full md:w-1/2 px-2 mb-4">
            <div className="bg-white rounded-lg p-4 h-full shadow-sm">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <svg
                  className="h-5 w-5 mr-2"
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
                Item Tracking
              </h3>
              <p className="text-sm text-gray-600">
                See the complete journey of materials and products from creation
                to recycling.
              </p>
            </div>
          </div>
          <div className="w-full md:w-1/2 px-2 mb-4">
            <div className="bg-white rounded-lg p-4 h-full shadow-sm">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <svg
                  className="h-5 w-5 mr-2"
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
                Verification & Proof
              </h3>
              <p className="text-sm text-gray-600">
                Verify the authenticity and provenance of all materials
                throughout the manufacturing process.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="supplyChainSelect"
        >
          Select Supply Chain
        </label>
        <div className="flex">
          <select
            id="supplyChainSelect"
            value={selectedChain?.id || ''}
            onChange={handleChainChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a supply chain</option>
            {supplyChains.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.name}{' '}
                {chain.blockchainStatus ? `(${chain.blockchainStatus})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Item Type Filter */}
          <div>
            <label
              className="block text-gray-700 text-sm mb-1"
              htmlFor="typeFilter"
            >
              Item Type
            </label>
            <select
              id="typeFilter"
              value={itemTypeFilter}
              onChange={e => setItemTypeFilter(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Types</option>
              <option value="raw-material">Raw Materials</option>
              <option value="allocated-material">Allocated Materials</option>
              <option value="recycled-material">Recycled Materials</option>
              <option value="manufactured-product">Products</option>
              <option value="material-request">Material Requests</option>
              <option value="order">Orders</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              className="block text-gray-700 text-sm mb-1"
              htmlFor="statusFilter"
            >
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CHURNED">Churned</option>
              <option value="RECYCLED">Recycled</option>
            </select>
          </div>

          {/* Function Filter for Transactions */}
          <div>
            <label
              className="block text-gray-700 text-sm mb-1"
              htmlFor="functionFilter"
            >
              Transaction Type
            </label>
            <select
              id="functionFilter"
              value={functionFilter}
              onChange={e => setFunctionFilter(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Transactions</option>
              <option value="createSupplyChain">Create Supply Chain</option>
              <option value="authorizeParticipant">
                Authorize Participant
              </option>
              <option value="createItem">Create Item</option>
              <option value="transferItem">Transfer Item</option>
              <option value="processItem">Process Item</option>
              <option value="updateItemStatus">Update Status</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label
              className="block text-gray-700 text-sm mb-1"
              htmlFor="searchQuery"
            >
              Search
            </label>
            <input
              id="searchQuery"
              type="text"
              placeholder="Search by name, ID, etc."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default BlockchainTraceability;