// src/components/manufacturer/ProductionBatchesList.jsx
import React, { useState, useEffect } from 'react';
import { manufacturerService, blockchainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const ProductionBatchesList = () => {
  const { currentUser } = useAuth();
  const [productionBatches, setProductionBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    materials: [],
    orderId: null
  });
  const [qualityData, setQualityData] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeOrders, setActiveOrders] = useState([]);

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [batchesResponse, productsResponse, ordersResponse] = await Promise.all([
        manufacturerService.getProductionBatches(currentUser.id),
        manufacturerService.getProducts(currentUser.id),
        manufacturerService.getOrders(currentUser.id)
      ]);
      
      setProductionBatches(batchesResponse.data);
      
      // Filter only active products
      const activeProductsData = productsResponse.data.filter(product => product.active);
      setProducts(activeProductsData);
      
      // Filter orders that are in production or requested status
      const activeOrdersData = ordersResponse.data.filter(
        order => order.status === 'Requested' || order.status === 'In Production'
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
  
  // Function to get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Planned':
        return 'bg-blue-100 text-blue-800';
      case 'In Production':
        return 'bg-yellow-100 text-yellow-800';
      case 'In QC':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Create Batch Modal
  const CreateBatchModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Create Production Batch</h2>
          <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleCreateSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productId">
              Product
            </label>
            <select
              id="productId"
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
              Quantity to Produce
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min="1"
              required
            />
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
              <option value="">None (Production for Stock)</option>
              {activeOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  Order #{order.orderNumber} - {order.customer.username}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Required Materials
            </label>
            
            {formData.materials.length > 0 ? (
              <div className="border rounded p-4">
                {formData.materials.map((material, index) => {
                  const materialInfo = materials.find(m => m.id === material.materialId);
                  
                  return (
                    <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
                      <div className="font-medium">{materialInfo?.name || 'Material'}</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-gray-700 text-xs mb-1">
                            Blockchain Item ID
                          </label>
                          <input
                            type="text"
                            value={material.blockchainItemId || ''}
                            onChange={(e) => handleMaterialChange(index, 'blockchainItemId', e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Enter blockchain ID"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 text-xs mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={material.quantity || ''}
                            onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            min="1"
                            placeholder="Enter quantity"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Please select a product to see required materials.</p>
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
            >
              Create Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  // Complete Batch Modal
  const CompleteBatchModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Complete Production Batch</h2>
          <button onClick={() => setShowCompleteModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleCompleteSubmit}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Batch:</span> {selectedBatch?.batchNumber}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Product:</span> {selectedBatch?.product?.name}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Quantity:</span> {selectedBatch?.quantity}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quality">
              Quality Assessment
            </label>
            <textarea
              id="quality"
              value={qualityData}
              onChange={(e) => setQualityData(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              placeholder="Enter quality assessment information (e.g., QC test results, quality metrics, etc.)"
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowCompleteModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Complete Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const handleCreateBatch = () => {
    // Reset form data
    setFormData({
      productId: products.length > 0 ? products[0].id : '',
      quantity: '',
      materials: [],
      orderId: null
    });
    setShowCreateModal(true);
  };

  const handleCompleteBatch = (batch) => {
    setSelectedBatch(batch);
    setQualityData('');
    setShowCompleteModal(true);
  };

  const handleRejectBatch = (batch) => {
    setSelectedBatch(batch);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If product changes, reload available materials
    if (name === 'productId') {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      if (selectedProduct && selectedProduct.requiredMaterials) {
        // Initialize materials for batch creation
        const initialMaterials = selectedProduct.requiredMaterials.map(material => ({
          materialId: material.id,
          blockchainItemId: null, // This will be selected by the user
          quantity: 0 // Default quantity
        }));
        setFormData(prevState => ({
          ...prevState,
          materials: initialMaterials
        }));
        setMaterials(selectedProduct.requiredMaterials);
      }
    }
  };
  
  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials[index][field] = field === 'quantity' ? parseInt(value) : value;
    
    setFormData({
      ...formData,
      materials: updatedMaterials
    });
  };
  
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate inputs
      if (!formData.productId || !formData.quantity || formData.quantity <= 0) {
        setError('Please provide valid product and quantity information.');
        return;
      }
      
      // Check if materials are properly filled out
      const invalidMaterials = formData.materials.some(
        m => !m.blockchainItemId || !m.quantity || m.quantity <= 0
      );
      
      if (invalidMaterials) {
        setError('Please provide valid blockchain ID and quantity for all materials.');
        return;
      }
      
      const batchData = {
        manufacturerId: currentUser.id,
        productId: parseInt(formData.productId),
        supplyChainId: 1, // Replace with actual selection in production
        orderId: formData.orderId ? parseInt(formData.orderId) : null,
        quantity: parseInt(formData.quantity),
        materials: formData.materials
      };
      
      await manufacturerService.createProductionBatch(batchData);
      setShowCreateModal(false);
      setSuccessMessage('Production batch created successfully!');
      setShowSuccessAlert(true);
      fetchData(); // Refresh the data
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating production batch:', err);
      setError('Failed to create production batch. Please try again.');
    }
  };
  
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!qualityData) {
        setError('Please provide quality information.');
        return;
      }
      
      await manufacturerService.completeProductionBatch(selectedBatch.id, { quality: qualityData });
      setShowCompleteModal(false);
      setSuccessMessage('Production batch completed successfully!');
      setShowSuccessAlert(true);
      fetchData(); // Refresh the data
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error completing production batch:', err);
      setError('Failed to complete production batch. Please try again.');
    }
  };
  
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!rejectionReason) {
        setError('Please provide rejection reason.');
        return;
      }
      
      await manufacturerService.rejectProductionBatch(selectedBatch.id, { reason: rejectionReason });
      setShowRejectModal(false);
      setSuccessMessage('Production batch rejected.');
      setShowSuccessAlert(true);
      fetchData(); // Refresh the data
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error rejecting production batch:', err);
      setError('Failed to reject production batch. Please try again.');
    }
  };
  
  // Reject Batch Modal
  const RejectBatchModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Reject Production Batch</h2>
          <button onClick={() => setShowRejectModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleRejectSubmit}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Batch:</span> {selectedBatch?.batchNumber}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Product:</span> {selectedBatch?.product?.name}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Quantity:</span> {selectedBatch?.quantity}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason">
              Rejection Reason
            </label>
            <textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              placeholder="Enter reason for rejecting this batch"
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Reject Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Production Batches</h1>
        <button
          onClick={handleCreateBatch}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create New Batch
        </button>
      </div>

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
      ) : productionBatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <p className="text-gray-500 mb-4">No production batches found. Create your first batch to get started.</p>
          <button
            onClick={handleCreateBatch}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Batch
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Related Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productionBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.batchNumber}</div>
                      {batch.blockchainItemId && (
                        <div className="text-xs text-gray-500">
                          Blockchain ID: {batch.blockchainItemId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{batch.product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {batch.relatedOrder ? (
                        <div className="text-sm text-blue-600">
                          <Link to={`/manufacturer/orders/${batch.relatedOrder.id}`}>
                            Order #{batch.relatedOrder.orderNumber}
                          </Link>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row sm:space-x-2">
                        {batch.status === 'In Production' && (
                          <>
                            <button 
                              onClick={() => handleCompleteBatch(batch)}
                              className="text-green-600 hover:text-green-900 mb-1 sm:mb-0"
                            >
                              Complete
                            </button>
                            <button 
                              onClick={() => handleRejectBatch(batch)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(batch.status === 'Planned' || batch.status === 'In QC') && (
                          <span className="text-gray-500">Awaiting processing</span>
                        )}
                        {(batch.status === 'Completed' || batch.status === 'Rejected') && (
                          <span className="text-gray-500">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateBatchModal />}
      {showCompleteModal && selectedBatch && <CompleteBatchModal />}
      {showRejectModal && selectedBatch && <RejectBatchModal />}
    </div>
  );
}

export default ProductionBatchesList;