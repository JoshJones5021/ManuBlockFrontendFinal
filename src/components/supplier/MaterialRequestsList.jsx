// src/components/supplier/MaterialRequestsList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supplierService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaterialRequestsList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  useEffect(() => {
    fetchRequests();
  }, [currentUser.id, activeTab]);
  
  const fetchRequests = async () => {
    try {
      setLoading(true);
      let response;
      
      // Fetch different requests based on the active tab
      switch (activeTab) {
        case 'pending':
          response = await supplierService.getPendingRequests(currentUser.id);
          break;
        case 'approved':
          response = await supplierService.getRequestsByStatus(currentUser.id, 'Approved');
          break;
        case 'allocated':
          response = await supplierService.getRequestsByStatus(currentUser.id, 'Allocated');
          break;
        case 'completed':
          response = await supplierService.getRequestsByStatus(currentUser.id, 'Completed');
          break;
        default:
          // Fetch all requests for "all" tab
          response = await supplierService.getRequestsByStatus(currentUser.id, '');
      }
      
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${activeTab} requests:`, err);
      setError(`Failed to load ${activeTab} requests. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Requested':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'Approved':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Approved</span>;
      case 'Allocated':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Allocated</span>;
      case 'Ready for Pickup':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Ready for Pickup</span>;
      case 'In Transit':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">In Transit</span>;
      case 'Delivered':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Delivered</span>;
      case 'Completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'Rejected':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  const getActionButton = (request) => {
    switch (request.status) {
      case 'Requested':
        return (
          <button
            onClick={() => navigate(`/supplier/requests/${request.id}/approve`)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Review & Approve
          </button>
        );
      case 'Approved':
        return (
          <button
            onClick={() => navigate(`/supplier/allocations`)}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Allocate
          </button>
        );
      case 'Allocated':
      case 'Ready for Pickup':
        return (
          <button
            onClick={() => navigate(`/supplier/requests/${request.id}/details`)}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            View Details
          </button>
        );
      default:
        return (
          <button
            onClick={() => navigate(`/supplier/requests/${request.id}/details`)}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            View
          </button>
        );
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };
  
  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Material Requests</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['pending', 'approved', 'allocated', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No {activeTab !== 'all' ? activeTab : ''} material requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manufacturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Materials
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.requestNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.manufacturer.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(request.createdAt)}</div>
                      {request.requestedDeliveryDate && (
                        <div className="text-xs text-gray-500">
                          Requested delivery: {formatDate(request.requestedDeliveryDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.items.slice(0, 2).map(item => (
                          <div key={item.id} className="mb-1">
                            {item.material.name} ({item.requestedQuantity} {item.material.unit})
                          </div>
                        ))}
                        {request.items.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{request.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionButton(request)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Quick Help */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">Request Processing Flow</h3>
        <div className="flex flex-wrap items-center text-sm text-blue-700">
          <div className="flex items-center mr-6 mb-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
            <span>Requested</span>
            <svg className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex items-center mr-6 mb-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
            <span>Approved</span>
            <svg className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex items-center mr-6 mb-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 mr-2"></div>
            <span>Allocated</span>
            <svg className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex items-center mr-6 mb-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></div>
            <span>Ready for Pickup</span>
            <svg className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex items-center mr-6 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <span>Delivered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialRequestsList;