import React, { useState } from 'react';
import { supplierService } from '../../services/api';

const MaterialRequestItem = ({ request, onApprove, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [approvals, setApprovals] = useState(
    request.items.map(item => ({
      itemId: item.id,
      approvedQuantity: item.requestedQuantity,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApprovalChange = (itemId, value) => {
    setApprovals(prev =>
      prev.map(approval =>
        approval.itemId === itemId
          ? { ...approval, approvedQuantity: parseInt(value) || 0 }
          : approval
      )
    );
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);

      const invalidApproval = approvals.find((approval, index) => {
        const requestedItem = request.items[index];
        return approval.approvedQuantity > requestedItem.requestedQuantity;
      });

      if (invalidApproval) {
        setError('Approved quantity cannot exceed requested quantity');
        return;
      }

      await supplierService.approveRequest(request.id, approvals);

      if (onApprove) {
        onApprove(request.id);
      }
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      setError(null);

      const rejections = approvals.map(approval => ({
        ...approval,
        approvedQuantity: 0,
      }));

      await supplierService.approveRequest(request.id, rejections);

      if (onReject) {
        onReject(request.id);
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div
        className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="font-semibold text-lg">{request.requestNumber}</h3>
          <p className="text-sm text-gray-600">
            From: {request.manufacturer.username} • Requested:{' '}
            {formatDate(request.createdAt)}
          </p>
        </div>
        <div className="flex items-center">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">
            {request.status}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <h4 className="font-medium mb-2">Request Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  Requested Delivery Date:
                </p>
                <p className="font-medium">
                  {formatDate(request.requestedDeliveryDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Supply Chain:</p>
                <p className="font-medium">
                  {request.supplyChain?.name || 'N/A'}
                </p>
              </div>
              {request.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Notes:</p>
                  <p className="font-medium">{request.notes}</p>
                </div>
              )}
            </div>
          </div>

          <h4 className="font-medium mb-2">Requested Materials</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {request.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.material.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.material.specifications}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.requestedQuantity} {item.material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max={item.requestedQuantity}
                        value={approvals[index]?.approvedQuantity || 0}
                        onChange={e =>
                          handleApprovalChange(item.id, e.target.value)
                        }
                        className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <span className="ml-2 text-sm text-gray-500">
                        {item.material.unit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Reject Request'}
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Approve Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialRequestItem;
