// src/components/distributor/MaterialPickupScheduler.jsx - Updated to handle source/destination correctly
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { distributorService, supplierService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaterialPickupScheduler = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [readyMaterials, setReadyMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    scheduledPickupDate: '',
    scheduledDeliveryDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both ready materials and suppliers in parallel
      const [materialsResponse, suppliersResponse] = await Promise.all([
        distributorService.getReadyMaterialRequests(),
        supplierService.getAllSuppliers()
      ]);
      
      // Process ready materials
      if (materialsResponse?.data && Array.isArray(materialsResponse.data)) {
        setReadyMaterials(materialsResponse.data);
      } else {
        console.warn('API did not return an array for readyMaterials', materialsResponse);
        setReadyMaterials([]);
      }
      
      // Process suppliers
      if (suppliersResponse?.data && Array.isArray(suppliersResponse.data)) {
        setSuppliers(suppliersResponse.data);
      } else {
        console.warn('API did not return an array for suppliers', suppliersResponse);
        setSuppliers([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      setReadyMaterials([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.username : 'Unknown Supplier';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    // Set minimum dates for pickup and delivery
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    setFormData({
      scheduledPickupDate: formatDate(today),
      scheduledDeliveryDate: formatDate(tomorrow)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRequest) {
      setError('Please select a material request first.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate dates
      const pickupDate = new Date(formData.scheduledPickupDate);
      const deliveryDate = new Date(formData.scheduledDeliveryDate);
      
      if (deliveryDate <= pickupDate) {
        setError('Delivery date must be after pickup date.');
        setSubmitting(false);
        return;
      }
      
      // Prepare transport data with timestamps instead of ISO strings
      const transportData = {
        distributorId: currentUser.id,
        materialRequestId: selectedRequest.id,
        scheduledPickupDate: pickupDate.getTime(),  // Convert to timestamp (milliseconds)
        scheduledDeliveryDate: deliveryDate.getTime()  // Convert to timestamp (milliseconds)
      };
      
      console.log("Sending transport data:", transportData);
      
      await distributorService.createMaterialTransport(transportData);
      
      setSuccess('Material pickup scheduled successfully!');
      setSelectedRequest(null);
      
      // After 2 seconds, navigate back to transports
      setTimeout(() => {
        navigate('/distributor/transports');
      }, 2000);
    } catch (err) {
      console.error('Error scheduling pickup:', err);
      setError(err.response?.data?.error || 'Failed to schedule pickup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Schedule Material Pickup</h1>
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
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Ready for Pickup Materials</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : readyMaterials.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No materials are ready for pickup at this time.</p>
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
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manufacturer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested Delivery
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {readyMaterials.map((request) => (
                      <tr key={request.id} className={selectedRequest?.id === request.id ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.requestNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getSupplierName(request.supplierId)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.manufacturer?.username || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(request.requestedDeliveryDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSelectRequest(request)}
                            className={`text-sm font-medium ${
                              selectedRequest?.id === request.id
                                ? 'text-blue-600 hover:text-blue-900'
                                : 'text-indigo-600 hover:text-indigo-900'
                            }`}
                          >
                            {selectedRequest?.id === request.id ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Schedule Pickup</h2>
            </div>
            
            <div className="p-6">
              {!selectedRequest ? (
                <div className="text-center">
                  <p className="text-gray-500 mb-4">Please select a material request from the list to schedule pickup.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledPickupDate">
                      Scheduled Pickup Date
                    </label>
                    <input
                      type="date"
                      id="scheduledPickupDate"
                      name="scheduledPickupDate"
                      value={formData.scheduledPickupDate}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledDeliveryDate">
                      Scheduled Delivery Date
                    </label>
                    <input
                      type="date"
                      id="scheduledDeliveryDate"
                      name="scheduledDeliveryDate"
                      value={formData.scheduledDeliveryDate}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">Must be after pickup date</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Selected Request</h3>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p><span className="font-medium">Request #:</span> {selectedRequest.requestNumber}</p>
                      <p><span className="font-medium">From:</span> {getSupplierName(selectedRequest.supplierId)}</p>
                      <p><span className="font-medium">To:</span> {selectedRequest.manufacturer?.username || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={submitting}
                    >
                      {submitting ? 'Scheduling...' : 'Schedule Pickup'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialPickupScheduler;