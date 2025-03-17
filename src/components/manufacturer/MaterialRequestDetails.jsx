// src/components/manufacturer/MaterialRequestDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { manufacturerService, blockchainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaterialRequestDetails = () => {
  const { requestId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [materialRequest, setMaterialRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockchainStatus, setBlockchainStatus] = useState({
    loading: false,
    data: null,
    error: null
  });

  useEffect(() => {
    fetchMaterialRequest();
  }, [requestId]);

  const fetchMaterialRequest = async () => {
    try {
      setLoading(true);
      
      // Fetch material request details
      const response = await manufacturerService.getMaterialRequestById(requestId);
      setMaterialRequest(response.data);
      
      // If there's a blockchain transaction hash, check its status
      if (response.data.blockchainTxHash) {
        fetchBlockchainInfo(response.data.blockchainTxHash);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching material request:', err);
      setError('Failed to load material request details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockchainInfo = async (txHash) => {
    try {
      setBlockchainStatus({
        ...blockchainStatus,
        loading: true
      });
      
      // Fetch blockchain transaction details
      const response = await blockchainService.getBlockchainTransactionDetails(txHash);
      
      setBlockchainStatus({
        loading: false,
        data: response.data,
        error: null
      });
    } catch (err) {
      console.error('Error fetching blockchain data:', err);
      setBlockchainStatus({
        loading: false,
        data: null,
        error: 'Failed to fetch blockchain information.'
      });
    }
  };

  // Function to get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Requested':
        return 'bg-blue-100 text-blue-800';
      case 'Approved':
        return 'bg-purple-100 text-purple-800';
      case 'Allocated':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ready for Pickup':
        return 'bg-orange-100 text-orange-800';
      case 'In Transit':
        return 'bg-indigo-100 text-indigo-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

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
          onClick={() => navigate('/manufacturer/material-requests')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Material Requests
        </button>
      </div>
    );
  }

  if (!materialRequest) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          Material request not found.
        </div>
        <button
          onClick={() => navigate('/manufacturer/material-requests')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Material Requests
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Material Request Details</h1>
        <button
          onClick={() => navigate('/manufacturer/material-requests')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Requests
        </button>
      </div>

      {/* Request Overview Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Request #{materialRequest.requestNumber}</h2>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(materialRequest.status)}`}>
              {materialRequest.status}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Supplier</h3>
              <p className="text-base">{materialRequest.supplier?.username || 'Unknown Supplier'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Request Date</h3>
              <p className="text-base">{formatDate(materialRequest.createdAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Requested Delivery</h3>
              <p className="text-base">{materialRequest.requestedDeliveryDate ? formatDate(materialRequest.requestedDeliveryDate) : 'No date specified'}</p>
            </div>
            
            {materialRequest.actualDeliveryDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Actual Delivery</h3>
                <p className="text-base text-green-600">{formatDate(materialRequest.actualDeliveryDate)}</p>
              </div>
            )}
            
            {materialRequest.relatedOrder && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Related Order</h3>
                <p className="text-base">
                  <Link to={`/manufacturer/orders/${materialRequest.relatedOrder.id}`} className="text-blue-600 hover:text-blue-800">
                    #{materialRequest.relatedOrder.orderNumber}
                  </Link>
                </p>
              </div>
            )}
            
            {materialRequest.blockchainTxHash && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Blockchain Transaction</h3>
                <p className="text-base font-mono text-xs break-all">
                  {materialRequest.blockchainTxHash}
                </p>
              </div>
            )}
          </div>
          
          {materialRequest.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
              <p className="text-base bg-gray-50 p-3 rounded">{materialRequest.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Requested Materials */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Requested Materials</h2>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Qty
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved Qty
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated Qty
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockchain ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialRequest.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.material.name}</div>
                      <div className="text-xs text-gray-500">{item.material.specifications?.substring(0, 50)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.requestedQuantity} {item.material.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.approvedQuantity ? (
                        <div className="text-sm text-gray-900">{item.approvedQuantity} {item.material.unit}</div>
                      ) : (
                        <span className="text-xs text-gray-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.allocatedQuantity ? (
                        <div className="text-sm text-gray-900">{item.allocatedQuantity} {item.material.unit}</div>
                      ) : (
                        <span className="text-xs text-gray-500">Not allocated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.blockchainItemId ? (
                        <div className="text-sm font-mono">{item.blockchainItemId}</div>
                      ) : (
                        <span className="text-xs text-gray-500">Not assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Blockchain Information */}
      {materialRequest.blockchainTxHash && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold">Blockchain Information</h2>
          </div>
          
          <div className="p-6">
            {blockchainStatus.loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : blockchainStatus.error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {blockchainStatus.error}
              </div>
            ) : blockchainStatus.data ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction Status</h3>
                  <p className="text-base font-medium text-green-600">Confirmed</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Block Number</h3>
                  <p className="text-base">{blockchainStatus.data.blockNumber}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Timestamp</h3>
                  <p className="text-base">{new Date(blockchainStatus.data.timestamp * 1000).toLocaleString()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Gas Used</h3>
                  <p className="text-base">{blockchainStatus.data.gasUsed}</p>
                </div>
                
                <div className="pt-4 border-t">
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${materialRequest.blockchainTxHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    View on Etherscan
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No blockchain information available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialRequestDetails;