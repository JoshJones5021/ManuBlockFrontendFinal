import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { manufacturerService, supplierService, supplyChainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaterialRequestsList = () => {
  const { currentUser } = useAuth();
  const [materialRequests, setMaterialRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    items: [],
    requestedDeliveryDate: '',
    notes: '',
    supplyChainId: '',
    orderId: null
  });
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tempMaterial, setTempMaterial] = useState({
    materialId: '',
    quantity: ''
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [supplyChains, setSupplyChains] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      let requestsResponse, supplierResponse, ordersResponse, supplyChains;
      
      try {
        [requestsResponse, supplierResponse, ordersResponse] = await Promise.all([
          manufacturerService.getMaterialRequests(currentUser.id),
          supplierService.getAllSuppliers(),
          manufacturerService.getOrders(currentUser.id)
        ]);
        
        // Fetch supply chains separately to handle errors
        supplyChains = await supplyChainService.getSupplyChainsByUser(currentUser.id);
        console.log('Supply chains fetched:', supplyChains);
      } catch (err) {
        console.error('Error in data fetching:', err);
        supplyChains = [];
      }
      
      // Add defensive coding for safety
      const requestsData = Array.isArray(requestsResponse?.data) ? requestsResponse.data : [];
      const suppliersData = Array.isArray(supplierResponse?.data) ? supplierResponse.data : [];
      const ordersData = Array.isArray(ordersResponse?.data) ? ordersResponse.data : [];
      
      // Filter only finalized supply chains
      const finalizedChains = Array.isArray(supplyChains) ? supplyChains.filter(chain => 
        chain.blockchainStatus === "FINALIZED" || 
        chain.blockchainStatus === "CONFIRMED"
      ) : [];
      
      console.log('Filtered finalized chains:', finalizedChains);
      
      setMaterialRequests(requestsData);
      setSuppliers(suppliersData);
      setSupplyChains(finalizedChains);
      
      // Initialize supply chain selection if possible
      if (finalizedChains.length > 0) {
        // Update form with first available supply chain
        setFormData(prev => ({
          ...prev,
          supplyChainId: finalizedChains[0].id
        }));
        
        // Filter suppliers based on first supply chain
        filterSuppliersByChain(suppliersData, finalizedChains[0].id);
      } else {
        setFilteredSuppliers([]);
      }
      
      // Filter orders
      const activeOrdersData = ordersData.filter(
        order => order && order.status && 
        (order.status === 'Requested' || order.status === 'In Production')
      );
      setActiveOrders(activeOrdersData);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const filterSuppliersByChain = (allSuppliers, chainId) => {
    // Find the selected chain
    const selectedChain = supplyChains.find(chain => chain.id === parseInt(chainId));
    
    if (!selectedChain) {
      setFilteredSuppliers([]);
      return;
    }
    
    // Extract supplier nodes from the chain
    const supplierNodes = selectedChain.nodes.filter(
      node => node.role && node.role.toLowerCase() === 'supplier' && node.assignedUserId
    );
    
    // Get the assigned user IDs from supplier nodes
    const supplierUserIds = supplierNodes.map(node => node.assignedUserId);
    
    // Filter suppliers that are assigned to this chain
    const chainSuppliers = allSuppliers.filter(
      supplier => supplierUserIds.includes(supplier.id)
    );
    
    setFilteredSuppliers(chainSuppliers);
    
    // Update supplierId in formData if current selection is invalid
    if (chainSuppliers.length > 0) {
      // If current supplierId is not in filtered list, select the first valid supplier
      const currentIsValid = chainSuppliers.some(s => s.id === parseInt(formData.supplierId));
      
      if (!currentIsValid) {
        setFormData(prev => ({
          ...prev,
          supplierId: chainSuppliers[0].id
        }));
        
        // Fetch materials for this supplier
        fetchSupplierMaterials(chainSuppliers[0].id);
      }
    } else {
      // Clear supplier selection if none available
      setFormData(prev => ({
        ...prev,
        supplierId: ''
      }));
      setMaterials([]);
    }
  };
  
  const handleCreateRequest = () => {
    // Reset form with default supply chain if available
    const initialSupplyChainId = supplyChains.length > 0 ? supplyChains[0].id : '';
    
    setFormData({
      supplierId: filteredSuppliers.length > 0 ? filteredSuppliers[0].id : '',
      items: [],
      requestedDeliveryDate: '',
      notes: '',
      supplyChainId: initialSupplyChainId,
      orderId: null
    });
    
    setTempMaterial({
      materialId: '',
      quantity: ''
    });
    
    setShowCreateModal(true);
    
    // Initial filter of suppliers
    if (initialSupplyChainId) {
      filterSuppliersByChain(suppliers, initialSupplyChainId);
    }
    
    // If a supplier is selected, load their materials
    if (filteredSuppliers.length > 0) {
      fetchSupplierMaterials(filteredSuppliers[0].id);
    }
  };
  
  const fetchSupplierMaterials = async (supplierId) => {
    // Safety check - don't try to fetch materials without a valid ID
    if (!supplierId) {
      console.warn('Attempted to fetch materials without valid supplier ID');
      setMaterials([]);
      return;
    }
    
    try {
      const response = await supplierService.getMaterials(supplierId);
      
      // Ensure we have a valid response with data
      if (!response || !response.data) {
        setMaterials([]);
        return;
      }
      
      // Ensure data is an array
      const materialsData = Array.isArray(response.data) ? response.data : [];
      
      // Filter to only get active materials
      const activeMaterials = materialsData.filter(material => 
        material && typeof material.active === 'boolean' && material.active
      );
      
      setMaterials(activeMaterials);
    } catch (err) {
      console.error('Error fetching supplier materials:', err);
      setMaterials([]);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If supply chain changes, filter suppliers
    if (name === 'supplyChainId' && value) {
      filterSuppliersByChain(suppliers, value);
    }
    
    // If supplier changes, fetch their materials
    if (name === 'supplierId' && value) {
      fetchSupplierMaterials(value);
    }
  };
  
  const handleTempMaterialChange = (e) => {
    const { name, value } = e.target;
    setTempMaterial({
      ...tempMaterial,
      [name]: value
    });
  };
  
  const addMaterialToRequest = () => {
    if (!tempMaterial.materialId || !tempMaterial.quantity || parseInt(tempMaterial.quantity) <= 0) {
      setError('Please select a material and provide a valid quantity.');
      return;
    }
    
    // Parse materialId as integer to ensure it's a number, not a string
    const materialId = parseInt(tempMaterial.materialId);
    const quantity = parseInt(tempMaterial.quantity);
    
    // Check if material is already in the list
    const existingItemIndex = formData.items.findIndex(
      item => item.materialId === materialId
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if already in list
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity = quantity;
      
      setFormData({
        ...formData,
        items: updatedItems
      });
    } else {
      // Add as new item with parsed integer values
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            materialId: materialId,
            quantity: quantity
          }
        ]
      });
    }
    
    // Reset temp material
    setTempMaterial({
      materialId: '',
      quantity: ''
    });
    
    // Clear any error
    setError(null);
  };
  
  const removeMaterialFromRequest = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // Fix to ensure all IDs are numbers and not strings
// Update your handleCreateSubmit function in MaterialRequestsList.jsx
const handleCreateSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // Validate inputs
    if (!formData.supplierId) {
      setError('Please select a supplier.');
      return;
    }
    
    if (!formData.supplyChainId) {
      setError('Please select a supply chain.');
      return;
    }
    
    if (formData.items.length === 0) {
      setError('Please add at least one material to the request.');
      return;
    }
    
    // Ensure all IDs are numbers and add default required fields
    const requestData = {
      manufacturerId: parseInt(currentUser.id),
      supplierId: parseInt(formData.supplierId),
      supplyChainId: parseInt(formData.supplyChainId),
      orderId: formData.orderId ? parseInt(formData.orderId) : null,
      items: formData.items.map(item => ({
        materialId: parseInt(item.materialId),
        quantity: parseInt(item.quantity),
        status: "Requested" // Add status to each item
      })),
      requestedDeliveryDate: formData.requestedDeliveryDate ? new Date(formData.requestedDeliveryDate).getTime() : null,
      notes: formData.notes,
      status: "Requested" // Add status field - this is required
    };
    
    console.log('Sending request data:', requestData);
    
    await manufacturerService.requestMaterials(requestData);
    setShowCreateModal(false);
    setSuccessMessage('Material request created successfully!');
    setShowSuccessAlert(true);
    fetchData(); // Refresh the data
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 3000);
  } catch (err) {
    console.error('Error creating material request:', err);
    // Try to get a more detailed error message
    const errorMsg = err.response?.data || err.message || 'Failed to create material request. Please try again.';
    setError(errorMsg);
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
  
  // Create Request Modal
  const CreateRequestModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Create Material Request</h2>
          <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supplyChainId">
            Supply Chain <span className="text-red-500">*</span>
          </label>
          <select
            id="supplyChainId"
            name="supplyChainId"
            value={formData.supplyChainId}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a supply chain</option>
            {supplyChains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name} ({chain.blockchainStatus})
              </option>
            ))}
          </select>
          {supplyChains.length === 0 && (
            <p className="text-red-500 text-xs italic mt-1">
              No finalized supply chains available. Please contact an administrator.
            </p>
          )}
        </div>
        
        <form onSubmit={handleCreateSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supplierId">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              id="supplierId"
              name="supplierId"
              value={formData.supplierId}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={filteredSuppliers.length === 0}
            >
              <option value="">Select a supplier</option>
              {filteredSuppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.username}
                </option>
              ))}
            </select>
            {filteredSuppliers.length === 0 && (
              <p className="text-red-500 text-xs italic mt-1">
                No suppliers available in the selected supply chain.
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="orderId">
              Related Order (Optional)
            </label>
            <select
              id="orderId"
              name="orderId"
              value={formData.orderId || ''}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">None</option>
              {activeOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  Order #{order.orderNumber} - {order.customer.username}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="requestedDeliveryDate">
              Requested Delivery Date (Optional)
            </label>
            <input
              type="date"
              id="requestedDeliveryDate"
              name="requestedDeliveryDate"
              value={formData.requestedDeliveryDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min={new Date().toISOString().split('T')[0]} // Set min to today
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Add any special requirements or notes for the supplier"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 text-sm font-bold">
                Materials <span className="text-red-500">*</span>
              </label>
            </div>
            
            <div className="mb-4 p-4 border rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="col-span-2">
                  <label className="block text-gray-700 text-xs mb-1" htmlFor="materialId">
                    Material
                  </label>
                  <select
                    id="materialId"
                    name="materialId"
                    value={tempMaterial.materialId}
                    onChange={handleTempMaterialChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    disabled={!formData.supplierId || materials.length === 0}
                  >
                    <option value="">Select a material</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.unit})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-xs mb-1" htmlFor="quantity">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={tempMaterial.quantity}
                    onChange={handleTempMaterialChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="1"
                    disabled={!tempMaterial.materialId}
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={addMaterialToRequest}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                disabled={!tempMaterial.materialId || !tempMaterial.quantity}
              >
                Add Material
              </button>
            </div>
            
            {formData.items.length > 0 ? (
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Materials in this request:</h4>
                <ul className="divide-y">
                  {formData.items.map((item, index) => {
                    const materialInfo = materials.find(m => m.id === parseInt(item.materialId));
                    
                    return (
                      <li key={index} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-medium">{materialInfo?.name || 'Unknown Material'}</span>
                          <span className="text-gray-500 text-sm ml-2">
                            Qty: {item.quantity} {materialInfo?.unit || 'units'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMaterialFromRequest(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No materials added yet.</p>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={!formData.supplyChainId || !formData.supplierId || formData.items.length === 0}
            >
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Material Requests</h1>
        <button
          onClick={handleCreateRequest}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          disabled={supplyChains.length === 0}
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create New Request
        </button>
      </div>

      {/* Supply Chain Warning */}
      {supplyChains.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Notice:</strong>
          <span className="block sm:inline"> You need to be part of a finalized supply chain to create material requests. Please contact an administrator.</span>
        </div>
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : materialRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <p className="text-gray-500 mb-4">No material requests found. Create your first request to get started.</p>
          <button
            onClick={handleCreateRequest}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={supplyChains.length === 0}
          >
            Create Request
          </button>
          {supplyChains.length === 0 && (
            <p className="text-gray-500 mt-4 text-sm italic">
              You need to be part of a finalized supply chain to create requests.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supply Chain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialRequests.map((request) => {
                  const supplier = suppliers.find(s => s.id === request.supplierId);
                  const supplyChain = supplyChains.find(sc => sc.id === request.supplyChainId);
                  
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.requestNumber}</div>
                        {request.blockchainTxHash && (
                          <div className="text-xs text-gray-500">
                            TX: {request.blockchainTxHash.substring(0, 10)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier ? supplier.username : 'Unknown Supplier'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplyChain ? supplyChain.name : 'Unknown Chain'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {request.items.length} items
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(request.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.requestedDeliveryDate ? (
                            <div>
                              <div>Requested: {formatDate(request.requestedDeliveryDate)}</div>
                              {request.actualDeliveryDate && (
                                <div className="text-green-600">
                                  Delivered: {formatDate(request.actualDeliveryDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">No date specified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          to={`/manufacturer/material-requests/${request.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateRequestModal />}
    </div>
  );
};

export default MaterialRequestsList;