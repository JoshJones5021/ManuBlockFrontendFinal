import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { blockchainService, supplyChainService } from '../../services/api';
import { Link } from 'react-router-dom';

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
  const [viewMode, setViewMode] = useState('list'); // 'list', 'item', 'transaction'
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchSupplyChains();
  }, [currentUser]);

  const fetchSupplyChains = async () => {
    try {
      setLoading(true);
      const response = await supplyChainService.getSupplyChainsByUser(currentUser.id);
      setSupplyChains(response);
      
      // Auto-select the first chain if available
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

  const fetchBlockchainItems = async (chainId) => {
    try {
      setLoading(true);
      const response = await blockchainService.getItemsBySupplyChain(chainId);
      setItems(response.data || []);
      
      // Also fetch recent transactions for this chain
      fetchRecentTransactions(chainId);
    } catch (err) {
      console.error('Error fetching blockchain items:', err);
      setError('Failed to load blockchain items. Please try again later.');
      setLoading(false);
    }
  };

  const fetchRecentTransactions = async (chainId) => {
    try {
      const response = await blockchainService.getTransactionsBySupplyChain(chainId);
      setTransactions(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching blockchain transactions:', err);
      setError('Failed to load blockchain transactions. Please try again later.');
      setLoading(false);
    }
  };

  const handleChainChange = (e) => {
    const chainId = e.target.value;
    const chain = supplyChains.find(sc => sc.id === parseInt(chainId));
    setSelectedChain(chain);
    fetchBlockchainItems(chainId);
  };

  const viewItemDetails = async (item) => {
    try {
      setLoading(true);
      setSelectedItem(item);
      
      // Fetch the item's history
      const response = await blockchainService.traceItemHistory(item.id);
      setItemHistory(response.data || []);
      
      setViewMode('item');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching item history:', err);
      setError('Failed to load item history. Please try again later.');
      setLoading(false);
    }
  };

  const viewTransactionDetails = async (txHash) => {
    try {
      setLoading(true);
      
      // Fetch transaction details
      const response = await blockchainService.getBlockchainTransactionDetails(txHash);
      setSelectedTransaction(response.data || null);
      
      setViewMode('transaction');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setError('Failed to load transaction details. Please try again later.');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'CREATED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Created</span>;
      case 'IN_TRANSIT':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">In Transit</span>;
      case 'PROCESSING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Processing</span>;
      case 'COMPLETED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Completed</span>;
      case 'REJECTED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'CHURNED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Churned</span>;
      case 'RECYCLED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">Recycled</span>;
      case 'CONFIRMED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Confirmed</span>;
      case 'PENDING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'FAILED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  const getItemTypeBadge = (type) => {
    switch (type) {
      case 'material':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Material</span>;
      case 'allocated-material':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Allocated Material</span>;
      case 'recycled-material':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">Recycled Material</span>;
      case 'manufactured-product':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Product</span>;
      case 'ORDER':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Order</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
  };

  // Render different views based on viewMode
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

    // Default list view
    return renderListView();
  };

  const renderItemDetails = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Item History: {selectedItem.name}</h3>
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
                <p className="text-sm font-medium">{getItemTypeBadge(selectedItem.itemType)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="text-sm font-medium">{getStatusBadge(selectedItem.status)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Current Owner:</span>
                <p className="text-sm font-medium">{selectedItem.ownerName || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Quantity:</span>
                <p className="text-sm font-medium">{selectedItem.quantity}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created:</span>
                <p className="text-sm font-medium">{formatDate(selectedItem.createdAt)}</p>
              </div>
            </div>
          </div>
  
          <h4 className="text-md font-medium mb-4">Transaction History</h4>
          
          {itemHistory.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              No transaction history available for this item.
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Timeline events */}
              <div className="space-y-6 relative">
                {itemHistory.map((event, index) => (
                  <div key={index} className="ml-10 relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-14 mt-1.5 w-7 h-7 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                    
                    {/* Event content */}
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <div className="flex justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{event.action || 'Transaction'}</h5>
                        <time className="text-sm text-gray-500">{formatDate(event.timestamp)}</time>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                          <span className="text-xs text-gray-500">Transaction Hash:</span>
                          <p className="text-sm font-mono">{truncateHash(event.txHash)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Status:</span>
                          <p className="text-sm">{getStatusBadge(event.status)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {event.fromUser && (
                          <div>
                            <span className="text-xs text-gray-500">From:</span>
                            <p className="text-sm">{event.fromUser}</p>
                          </div>
                        )}
                        {event.toUser && (
                          <div>
                            <span className="text-xs text-gray-500">To:</span>
                            <p className="text-sm">{event.toUser}</p>
                          </div>
                        )}
                        {event.quantity && (
                          <div>
                            <span className="text-xs text-gray-500">Quantity:</span>
                            <p className="text-sm">{event.quantity}</p>
                          </div>
                        )}
                      </div>
                      
                      {event.description && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Description:</span>
                          <p className="text-sm">{event.description}</p>
                        </div>
                      )}
                      
                      <div className="mt-3 text-right">
                        <button
                          onClick={() => viewTransactionDetails(event.txHash)}
                          className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold"
                        >
                          View Transaction
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            onClick={() => viewMode === 'item' ? setViewMode('item') : setViewMode('list')}
            className="text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium mb-4">Transaction Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Transaction Hash:</span>
                <p className="text-sm font-mono break-all">{selectedTransaction.txHash}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Block Number:</span>
                <p className="text-sm font-medium">{selectedTransaction.blockNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="text-sm font-medium">{getStatusBadge(selectedTransaction.status)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Timestamp:</span>
                <p className="text-sm font-medium">{formatDate(selectedTransaction.timestamp)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">From Address:</span>
                <p className="text-sm font-mono break-all">{selectedTransaction.fromAddress || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">To Address:</span>
                <p className="text-sm font-mono break-all">{selectedTransaction.toAddress || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Gas Used:</span>
                <p className="text-sm font-medium">{selectedTransaction.gasUsed || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Confirmation Blocks:</span>
                <p className="text-sm font-medium">{selectedTransaction.confirmations || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {selectedTransaction.function && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-4">Function Call</h4>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="mb-2">
                  <span className="text-sm text-gray-500">Function:</span>
                  <p className="text-sm font-mono">{selectedTransaction.function}</p>
                </div>
                
                <div className="mb-2">
                  <span className="text-sm text-gray-500">Parameters:</span>
                  <pre className="text-sm font-mono bg-gray-800 text-gray-100 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedTransaction.parameters, null, 2)}
                  </pre>
                </div>
                
                {selectedTransaction.result && (
                  <div>
                    <span className="text-sm text-gray-500">Result:</span>
                    <pre className="text-sm font-mono bg-gray-800 text-gray-100 p-3 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(selectedTransaction.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedTransaction.events && selectedTransaction.events.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-4">Events Emitted</h4>
              <div className="space-y-4">
                {selectedTransaction.events.map((event, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900 mb-2">{event.name}</div>
                    <pre className="text-sm font-mono bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
                      {JSON.stringify(event.values, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedTransaction.items && selectedTransaction.items.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium mb-4">Related Items</h4>
              <div className="bg-white rounded border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTransaction.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getItemTypeBadge(item.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => viewItemDetails(item)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Item
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getItemTypeBadge(item.itemType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.ownerName || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(item.updatedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.txHash} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{truncateHash(tx.txHash)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tx.type || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(tx.timestamp)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewTransactionDetails(tx.txHash)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
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
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Supply Chain Transparency</h2>
        <p className="text-blue-700 mb-4">
          View all blockchain transactions and trace the complete lifecycle of products and materials.
        </p>
        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-full md:w-1/2 px-2 mb-4">
            <div className="bg-white rounded-lg p-4 h-full shadow-sm">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Item Tracking
              </h3>
              <p className="text-sm text-gray-600">
                See the complete journey of materials and products from creation to recycling.
              </p>
            </div>
          </div>
          <div className="w-full md:w-1/2 px-2 mb-4">
            <div className="bg-white rounded-lg p-4 h-full shadow-sm">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verification & Proof
              </h3>
              <p className="text-sm text-gray-600">
                Verify the authenticity and provenance of all materials throughout the manufacturing process.
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
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supplyChainSelect">
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
            {supplyChains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name} {chain.blockchainStatus ? `(${chain.blockchainStatus})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default BlockchainTraceability;