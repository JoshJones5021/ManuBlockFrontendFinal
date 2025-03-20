import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supplierService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaterialRequestApproval = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [request, setRequest] = useState(null);
  const [approvalItems, setApprovalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);

      const response = await supplierService.getPendingRequests(currentUser.id);
      const foundRequest = response.data.find(
        req => req.id === parseInt(requestId)
      );

      if (!foundRequest) {
        throw new Error('Request not found');
      }

      if (foundRequest.status !== 'Requested') {
        throw new Error('This request has already been processed');
      }

      setRequest(foundRequest);

      setApprovalItems(
        foundRequest.items.map(item => ({
          itemId: item.id,
          materialId: item.material.id,
          materialName: item.material.name,
          requestedQuantity: item.requestedQuantity,
          approvedQuantity: item.requestedQuantity, 
          availableQuantity: item.material.quantity,
          unit: item.material.unit,
        }))
      );

      setError(null);
    } catch (err) {
      console.error('Error fetching request details:', err);
      setError(err.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index, value) => {
    const newValue = parseInt(value);
    if (isNaN(newValue) || newValue < 0) return;

    const updatedItems = [...approvalItems];
    updatedItems[index].approvedQuantity = newValue;
    setApprovalItems(updatedItems);
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      setError(null);

      for (const item of approvalItems) {
        if (item.approvedQuantity > item.availableQuantity) {
          throw new Error(
            `Cannot approve more than available quantity for ${item.materialName}`
          );
        }
      }

      const approvals = approvalItems.map(item => ({
        itemId: item.itemId,
        approvedQuantity: item.approvedQuantity,
      }));

      await supplierService.approveRequest(requestId, approvals);

      setSuccess(true);
      setTimeout(() => {
        navigate('/supplier/requests');
      }, 2000);
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const approvals = approvalItems.map(item => ({
        itemId: item.itemId,
        approvedQuantity: 0,
      }));

      await supplierService.approveRequest(requestId, approvals);

      setSuccess(true);
      setTimeout(() => {
        navigate('/supplier/requests');
      }, 2000);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
          onClick={() => navigate('/supplier/requests')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Requests
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-6">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline">
            {' '}
            Request processed successfully. Redirecting...
          </span>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const formatDate = dateString => {
    return (
      new Date(dateString).toLocaleDateString() +
      ' ' +
      new Date(dateString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Material Request Approval</h1>

      {/* Request Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Request Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Request Number:</p>
            <p className="font-medium">{request.requestNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Requested By:</p>
            <p className="font-medium">{request.manufacturer.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Requested Date:</p>
            <p className="font-medium">{formatDate(request.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Requested Delivery:</p>
            <p className="font-medium">
              {request.requestedDeliveryDate
                ? formatDate(request.requestedDeliveryDate)
                : 'Not specified'}
            </p>
          </div>
        </div>

        {request.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Notes:</p>
            <p className="mt-1 p-2 bg-gray-50 rounded">{request.notes}</p>
          </div>
        )}
      </div>

      {/* Material Items for Approval */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Material Items</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved Qty
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvalItems.map((item, index) => (
                <tr key={item.itemId}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.materialName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.requestedQuantity} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${item.availableQuantity < item.requestedQuantity ? 'text-red-600 font-medium' : 'text-gray-900'}`}
                    >
                      {item.availableQuantity} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      className={`shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                        item.approvedQuantity > item.availableQuantity
                          ? 'border-red-500'
                          : ''
                      }`}
                      value={item.approvedQuantity}
                      onChange={e =>
                        handleQuantityChange(index, e.target.value)
                      }
                      min="0"
                      max={item.availableQuantity}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {item.unit}
                    </div>
                    {item.approvedQuantity > item.availableQuantity && (
                      <p className="text-red-500 text-xs mt-1">
                        Cannot exceed available quantity
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => navigate('/supplier/requests')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          onClick={handleReject}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Reject All'}
        </button>
        <button
          onClick={handleApprove}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          disabled={
            submitting ||
            approvalItems.some(
              item => item.approvedQuantity > item.availableQuantity
            )
          }
        >
          {submitting ? 'Processing...' : 'Approve Request'}
        </button>
      </div>
    </div>
  );
};

export default MaterialRequestApproval;
