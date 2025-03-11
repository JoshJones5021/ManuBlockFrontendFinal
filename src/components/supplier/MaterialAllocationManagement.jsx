// src/components/supplier/MaterialAllocationManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierService, blockchainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaterialAllocationManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchApprovedRequests();
  }, [currentUser.id]);

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      // In a real implementation, fetch approved but not yet allocated requests
      const response = await supplierService.getRequestsByStatus(currentUser.id, 'Approved');
      setApprovedRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching approved requests:', err);
      setError('Failed to load approved requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowConfirmation(true);
  };

  const handleAllocate = async () => {
    if (!selectedRequest) return;
    
    try {
      setAllocating(true);
      setError(null);
      
      // Call the allocation API
      await supplierService.allocateMaterials(selectedRequest.id);
      
      setSuccess(`Materials for request ${selectedRequest.requestNumber} have been allocated successfully.`);
      setShowConfirmation(false);
      
      // Refresh the list
      await fetchApprovedRequests();
    } catch (err) {
      console.error('Error allocating materials:', err);
      setError(`Failed to allocate materials: ${err.message || 'Unknown error'}`);
    } finally {
      setAllocating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && approvedRequests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Material Allocation Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Success:</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}
      
      {/* Approved Requests List */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Approved Requests Pending Allocation</h2>
        
        {approvedRequests.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">No approved requests pending allocation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manufacturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.requestNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.manufacturer.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(request.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(request.requestedDeliveryDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.items.filter(item => item.status === 'Approved').length} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                      >
                        Allocate Materials
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Information Panel */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">What is Material Allocation?</h3>
        <p className="text-blue-700 mb-4">
          Allocation is the process of reserving materials for a specific request and registering them on the blockchain.
          Once allocated, these materials will be trackable throughout the supply chain.
        </p>
        <div className="flex flex-col md:flex-row items-start md:items-center text-blue-700 text-sm">
          <div className="flex items-center mr-6 mb-2 md:mb-0">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
            <span>Allocation creates blockchain records</span>
          </div>
          <div className="flex items-center mr-6 mb-2 md:mb-0">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
            <span>Materials become available for pickup</span>
          </div>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
            <span>Full traceability is enabled</span>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Confirm Material Allocation</h2>
            
            <p className="mb-4">
              You are about to allocate materials for request <strong>{selectedRequest.requestNumber}</strong> from 
              <strong> {selectedRequest.manufacturer.username}</strong>.
            </p>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <h3 className="text-md font-medium text-yellow-800 mb-2">Material Items to Allocate:</h3>
              <ul className="list-disc pl-5 text-yellow-700">
                {selectedRequest.items.filter(item => item.status === 'Approved').map(item => (
                  <li key={item.id}>
                    {item.material.name} - {item.approvedQuantity} {item.material.unit}
                  </li>
                ))}
              </ul>
            </div>
            
            <p className="text-gray-600 mb-6">
              This action will register these materials on the blockchain and make them available for pickup.
              <strong> This action cannot be undone.</strong>
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                disabled={allocating}
              >
                Cancel
              </button>
              <button
                onClick={handleAllocate}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                disabled={allocating}
              >
                {allocating ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    <span>Allocating...</span>
                  </div>
                ) : (
                  'Confirm Allocation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialAllocationManagement;