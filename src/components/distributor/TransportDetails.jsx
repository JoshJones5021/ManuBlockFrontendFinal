// src/components/distributor/TransportDetails.jsx - Final fix
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { distributorService, blockchainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RecordTransportAction from './RecordTransportAction';

const TransportDetails = () => {
  const { transportId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [transport, setTransport] = useState(null);
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBlockchain, setLoadingBlockchain] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add debugging log
    console.log("Transport ID from params:", transportId);
    
    if (!transportId) {
      setError('Invalid transport ID. Please return to the transports list and try again.');
      setLoading(false);
      return;
    }
    
    fetchTransportDetails();
  }, [transportId, currentUser]);

  const fetchTransportDetails = async () => {
    try {
      setLoading(true);
      
      console.log("Fetching details for transport ID:", transportId);
      
      // Instead of trying to fetch a single transport, get all transports and filter
      const response = await distributorService.getTransports(currentUser.id);
      console.log("All transports response:", response);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format');
      }
      
      // Find the transport with the matching ID
      const foundTransport = response.data.find(t => t.id === parseInt(transportId));
      console.log("Found transport:", foundTransport);
      
      if (!foundTransport) {
        throw new Error(`Transport with ID ${transportId} not found`);
      }
      
      setTransport(foundTransport);
      
      // If there's blockchain data available, fetch it
      if (foundTransport.blockchainItemId) {
        fetchBlockchainDetails(foundTransport.blockchainItemId);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching transport details:', err);
      setError('Failed to load transport details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockchainDetails = async (blockchainItemId) => {
    try {
      setLoadingBlockchain(true);
      const response = await blockchainService.getBlockchainItemDetails(blockchainItemId);
      setBlockchainInfo(response.data);
    } catch (err) {
      console.error('Error fetching blockchain details:', err);
      // Don't set an error state here, just fail silently for blockchain data
    } finally {
      setLoadingBlockchain(false);
    }
  };

  const handleActionComplete = () => {
    fetchTransportDetails();
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
      case 'Confirmed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Confirmed</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button
          onClick={() => navigate('/distributor/transports')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Transports
        </button>
      </div>
    );
  }

  if (!transport) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6">
          Transport not found. It may have been deleted or you don't have permission to view it.
        </div>
        <button
          onClick={() => navigate('/distributor/transports')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Transports
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Transport Details</h1>
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
      
      {/* Transport Overview Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Transport #{transport.trackingNumber}</h2>
            <div className="flex items-center">
              <span className="mr-2">Status:</span>
              {getStatusBadge(transport.status)}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Transport Type</h3>
              <p className="text-base">{transport.type}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">From</h3>
              <p className="text-base">{transport.source?.username || 'Unknown Source'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">To</h3>
              <p className="text-base">{transport.destination?.username || 'Unknown Destination'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pickup Date</h3>
              <div>
                <p className="text-base">Scheduled: {formatDate(transport.scheduledPickupDate)}</p>
                {transport.actualPickupDate && (
                  <p className="text-sm text-green-600">Actual: {formatDate(transport.actualPickupDate)}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Delivery Date</h3>
              <div>
                <p className="text-base">Scheduled: {formatDate(transport.scheduledDeliveryDate)}</p>
                {transport.actualDeliveryDate && (
                  <p className="text-sm text-green-600">Actual: {formatDate(transport.actualDeliveryDate)}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Blockchain Status</h3>
              {transport.blockchainItemId ? (
                <p className="text-base text-green-600">Tracked on Blockchain</p>
              ) : (
                <p className="text-base text-yellow-600">Not Tracked</p>
              )}
            </div>
          </div>
          
          {/* Available Actions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Available Actions</h3>
            <div className="flex space-x-4">
              {transport.status === 'Scheduled' && (
                <RecordTransportAction 
                  transport={transport} 
                  actionType="pickup" 
                  onComplete={handleActionComplete} 
                />
              )}
              
              {transport.status === 'In Transit' && (
                <RecordTransportAction 
                  transport={transport} 
                  actionType="delivery" 
                  onComplete={handleActionComplete} 
                />
              )}
              
              {(transport.status === 'Delivered' || transport.status === 'Confirmed') && (
                <span className="text-gray-500">No actions available - Transport completed</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Blockchain Information */}
      {transport.blockchainItemId && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold">Blockchain Information</h2>
          </div>
          
          <div className="p-6">
            {loadingBlockchain ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : blockchainInfo ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Blockchain Item ID</h3>
                    <p className="text-base font-mono">{blockchainInfo.id}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Owner Address</h3>
                    <p className="text-base font-mono break-all">{blockchainInfo.owner}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Item Type</h3>
                    <p className="text-base">{blockchainInfo.itemType}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Quantity</h3>
                    <p className="text-base">{blockchainInfo.quantity}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Supply Chain ID</h3>
                    <p className="text-base">{blockchainInfo.supplyChainId}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <p className="text-base">
                      {blockchainInfo.status === 0 ? 'Created' :
                       blockchainInfo.status === 1 ? 'In Transit' :
                       blockchainInfo.status === 2 ? 'Processing' :
                       blockchainInfo.status === 3 ? 'Completed' :
                       blockchainInfo.status === 4 ? 'Rejected' : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                {/* Blockchain Explorer Link */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a 
                    href={`https://explorer.example.com/item/${blockchainInfo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View in Blockchain Explorer
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                Blockchain information is not available at this time.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportDetails;