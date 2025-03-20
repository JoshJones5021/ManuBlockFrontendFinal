// src/components/distributor/ScheduleMaterialPickup.jsx
import React, { useState } from 'react';
import { distributorService } from '../../services/api';

const ScheduleMaterialPickup = ({ materialRequest, currentUser, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Calculate default dates for scheduling
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  // Format dates as YYYY-MM-DD for input fields
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState({
    pickupDate: formatDateForInput(tomorrow),
    deliveryDate: formatDateForInput(dayAfter),
    notes: `Scheduled pickup for material request ${materialRequest?.requestNumber}`
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSchedule = async () => {
    if (!materialRequest) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate dates
      const pickupDate = new Date(formData.pickupDate);
      const deliveryDate = new Date(formData.deliveryDate);
      
      if (pickupDate < today) {
        setError("Pickup date cannot be in the past");
        setLoading(false);
        return;
      }
      
      if (deliveryDate <= pickupDate) {
        setError("Delivery date must be after pickup date");
        setLoading(false);
        return;
      }
      
      // Create transport data for the material pickup
      const transportData = {
        distributorId: currentUser.id,
        supplierId: materialRequest.supplierId,
        manufacturerId: materialRequest.manufacturer.id,
        materialRequestId: materialRequest.id,
        supplyChainId: materialRequest.supplyChainId,
        scheduledPickupDate: pickupDate.getTime(), // Convert to timestamp
        scheduledDeliveryDate: deliveryDate.getTime(), // Convert to timestamp
        notes: formData.notes
      };
      
      // Call the API to create the material transport
      await distributorService.createMaterialTransport(transportData);
      
      if (onComplete) {
        onComplete(`Material pickup scheduled successfully for ${materialRequest.requestNumber}`);
      }
    } catch (err) {
      console.error('Error scheduling material pickup:', err);
      setError(err.message || 'Failed to schedule pickup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  if (!materialRequest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Schedule Material Pickup</h2>
        
        <p className="mb-4 text-gray-700 break-words">
          Schedule a pickup for material request {materialRequest.requestNumber}
        </p>
        
        <div className="mb-4 bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="mb-2 flex flex-wrap">
            <span className="font-medium text-gray-700 mr-1">Material Request:</span> 
            <span className="break-all">{materialRequest.requestNumber}</span>
          </div>
          <div className="mb-2">
            <span className="font-medium text-gray-700 mr-1">Manufacturer:</span> 
            <span className="break-words">{materialRequest.manufacturer?.username || 'Unknown'}</span>
          </div>
          <div className="mb-2">
            <span className="font-medium text-gray-700 mr-1">Requested Date:</span> 
            <span>{formatDate(materialRequest.requestedDeliveryDate)}</span>
          </div>
        </div>

        {/* Date Selection Form */}
        <div className="mb-4">
          <div className="mb-3">
            <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Date *
            </label>
            <input
              type="date"
              id="pickupDate"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleInputChange}
              min={formatDateForInput(today)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Date *
            </label>
            <input
              type="date"
              id="deliveryDate"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleInputChange}
              min={formData.pickupDate}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => onComplete(null)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Scheduling...' : 'Schedule Pickup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMaterialPickup;