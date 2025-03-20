// src/components/distributor/RecordTransportAction.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { distributorService } from '../../services/api';

const RecordTransportAction = ({ transport, actionType, onComplete }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleAction = async () => {
    if (!transport) return;
    
    try {
      setLoading(true);
      setError(null);
  
      // 🔥 Conditional logic for Recycling Pickup vs Normal
      if (actionType === 'pickup') {
        if (transport.type === 'Recycling Pickup') {
          await distributorService.recordRecyclePickup(transport.id);  // ♻️ Recycling endpoint
        } else {
          await distributorService.recordPickup(transport.id);         // 📦 Normal endpoint
        }
      } else if (actionType === 'delivery') {
        if (transport.type === 'Recycling Pickup') {
          await distributorService.recordRecycleDelivery(transport.id);  // ♻️ Recycling endpoint
        } else {
          await distributorService.recordDelivery(transport.id);         // 📦 Normal endpoint
        }
      }
  
      setShowConfirmation(false);
  
      if (onComplete) {
        onComplete();
      } else {
        navigate('/distributor/transports');
      }
    } catch (err) {
      console.error(`Error recording ${actionType}:`, err);
      setError(err.message || `Failed to record ${actionType}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  if (!transport) return null;

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        className={`text-sm font-medium ${
          actionType === 'pickup'
            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded'
            : 'bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded'
        }`}
      >
        {actionType === 'pickup' ? 'Record Pickup' : 'Record Delivery'}
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {actionType === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
            </h2>
            
            <p className="mb-4">
              {actionType === 'pickup'
                ? `Are you sure you want to record pickup for transport ${transport.trackingNumber}?`
                : `Are you sure you want to record delivery for transport ${transport.trackingNumber}?`
              }
            </p>
            
            <div className="mb-4 bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Transport Type:</span> {transport.type}</p>
              <p>
                <span className="font-medium">
                  {actionType === 'pickup' ? 'Pickup From:' : 'Delivery To:'}
                </span>{' '}
                {actionType === 'pickup' 
                  ? transport.source?.username || 'Unknown'
                  : transport.destination?.username || 'Unknown'
                }
              </p>
              <p>
                <span className="font-medium">Scheduled Date:</span>{' '}
                {actionType === 'pickup'
                  ? formatDate(transport.scheduledPickupDate)
                  : formatDate(transport.scheduledDeliveryDate)
                }
              </p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`text-white font-bold py-2 px-4 rounded ${
                  actionType === 'pickup'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecordTransportAction;