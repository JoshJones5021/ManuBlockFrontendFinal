import React, { useState, useEffect } from 'react';
import { manufacturerService, blockchainService, supplyChainService } from '../../services/api';
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
    orderId: null,
    supplyChainId: ''
  });
  const [materialBatches, setMaterialBatches] = useState({});
  const [qualityData, setQualityData] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeOrders, setActiveOrders] = useState([]);
  const [supplyChains, setSupplyChains] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [materialInventory, setMaterialInventory] = useState([]);

  useEffect(() => {
    fetchData();
    fetchMaterialsWithBlockchainIds(currentUser.id);
  }, [currentUser.id]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [
        batchesResponse, 
        productsResponse, 
        ordersResponse, 
        supplyChainResponse,
      ] = await Promise.all([
        manufacturerService.getProductionBatches(currentUser.id),
        manufacturerService.getProducts(currentUser.id),
        manufacturerService.getOrders(currentUser.id),
        supplyChainService.getSupplyChainsByUser(currentUser.id)
      ]);
      
      // Add defensive coding
      const batchesData = Array.isArray(batchesResponse.data) ? batchesResponse.data : [];
      const productsData = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      const ordersData = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      const supplyChainData = Array.isArray(supplyChainResponse) ? supplyChainResponse : [];
      
      // Filter only finalized supply chains
      const finalizedChains = supplyChainData.filter(chain => 
        chain.blockchainStatus === "FINALIZED" || chain.blockchainStatus === "CONFIRMED"
      );
      
      setProductionBatches(batchesData);
      setProducts(productsData);
      setSupplyChains(finalizedChains);
      setActiveOrders(ordersData);
      
      // Filter only active products
      const activeProductsData = productsData.filter(product => product.active);
      
      // Initialize supply chain selection if possible
      if (finalizedChains.length > 0) {
        // Update form with first available supply chain
        setFormData(prev => ({
          ...prev,
          supplyChainId: finalizedChains[0].id,
        }));
        
        // Filter products based on first supply chain
        filterProductsByChain(activeProductsData, finalizedChains[0].id);
        
        // Filter orders based on first supply chain
        filterOrdersByChain(ordersData, finalizedChains[0].id);
      } else {
        setFilteredProducts([]);
        setFilteredOrders([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialsWithBlockchainIds = async (manufacturerId) => {
    try {
      // Use the existing endpoint for available materials
      const response = await manufacturerService.getAvailableMaterials(manufacturerId);
      
      if (response && response.data) {
        // Filter for materials that have blockchain IDs assigned
        const materialsWithIds = response.data.filter(material => 
          material.blockchainItemId !== null && material.blockchainItemId !== undefined
        );
        
        setMaterialInventory(materialsWithIds);
      }
    } catch (err) {
      console.error('Error fetching materials with blockchain IDs:', err);
      setMaterialInventory([]);
    }
  };
  
  const fetchMaterialBatches = async (materialId) => {
    try {
      // This would be an API call to get material batches with blockchain IDs
      const response = await manufacturerService.getMaterialBatchesWithBlockchainIds(materialId);
      
      if (response && response.data) {
        setMaterialBatches(prev => ({
          ...prev,
          [materialId]: response.data
        }));
      }
    } catch (err) {
      console.error('Error fetching material batches:', err);
      // If API doesn't exist yet, we can mock some data for demonstration
      // This is just for development/testing - remove in production
      setMaterialBatches(prev => ({
        ...prev,
        [materialId]: [
          { id: 1, blockchainItemId: `batch-${materialId}-001`, batchNumber: 'B001' },
          { id: 2, blockchainItemId: `batch-${materialId}-002`, batchNumber: 'B002' }
        ]
      }));
    }
  };
  
  const filterProductsByChain = (allProducts, chainId) => {
    // Find products that belong to this supply chain
    // In a real application, you'd have a direct way to filter products by supply chain
    // For now, we'll assume all products are available in all supply chains
    // and just filter for active products
    const chainProducts = allProducts.filter(product => product.active);
    
    setFilteredProducts(chainProducts);
    
    // Update productId in formData if current selection is invalid
    if (chainProducts.length > 0) {
      // If current productId is not in filtered list, select the first valid product
      const currentIsValid = chainProducts.some(p => p.id === parseInt(formData.productId));
      
      if (!currentIsValid) {
        setFormData(prev => ({
          ...prev,
          productId: chainProducts[0].id
        }));
      }
    } else {
      // Clear product selection if none available
      setFormData(prev => ({
        ...prev,
        productId: ''
      }));
    }
  };
  
  const filterOrdersByChain = (allOrders, chainId) => {
    // Find orders that belong to this supply chain and are in appropriate status
    const chainOrders = allOrders.filter(
      order => order.supplyChainId === parseInt(chainId) && 
      (order.status === 'Requested' || order.status === 'In Production')
    );
    
    setFilteredOrders(chainOrders);
    
    // Clear orderId if current selection is invalid
    const currentIsValid = chainOrders.some(o => o.id === parseInt(formData.orderId));
    if (!currentIsValid) {
      setFormData(prev => ({
        ...prev,
        orderId: null
      }));
    }
  };

  // Add this function after filterOrdersByChain
  const filterOrdersByProduct = (productId) => {
    if (!productId) {
      setFilteredOrders([]);
      return;
    }
    
    // Filter orders that contain this product and are in appropriate statuses
    const relevantOrders = activeOrders.filter(order => 
      order.items && order.items.some(item => 
        item.productId === parseInt(productId) && 
        ['Requested', 'In Production'].includes(order.status)
      )
    );
    
    setFilteredOrders(relevantOrders);
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
  
  const handleCreateBatch = () => {
    // Reset form with default supply chain if available
    const initialSupplyChainId = supplyChains.length > 0 ? supplyChains[0].id : '';
    const initialProductId = filteredProducts.length > 0 ? filteredProducts[0].id : '';
    
    setFormData({
      productId: initialProductId,
      quantity: '',
      materials: [],
      orderId: null,
      supplyChainId: initialSupplyChainId
    });
    
    // Initial filter of products and orders
    if (initialSupplyChainId) {
      filterProductsByChain(products, initialSupplyChainId);
      filterOrdersByChain(activeOrders, initialSupplyChainId);
    }
    
    // Make sure we have the latest material inventory before showing the modal
    fetchMaterialsWithBlockchainIds(currentUser.id);
    
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
    
    // If supply chain changes, filter products and orders
    if (name === 'supplyChainId' && value) {
      filterProductsByChain(products, value);
      filterOrdersByChain(activeOrders, value);
    }
    
    // If product changes, reload required materials with their blockchain IDs
    if (name === 'productId') {
      const selectedProduct = filteredProducts.find(p => p.id === parseInt(value));
      if (selectedProduct && selectedProduct.requiredMaterials) {
        // Initialize materials for batch creation
        const initialMaterials = selectedProduct.requiredMaterials.map(material => ({
          materialId: material.id,
          blockchainItemId: material.blockchainItemId, // Use the blockchain ID from the material directly
          quantity: 0 // Default quantity
        }));
        
        setFormData(prevState => ({
          ...prevState,
          materials: initialMaterials
        }));
        
        setMaterials(selectedProduct.requiredMaterials);
        
        // Filter orders for this specific product
        filterOrdersByProduct(value);
      }
    }
  };
  
  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...formData.materials];
    
    if (field === 'materialId') {
      // If material ID changes, fetch available batches for this material
      fetchMaterialBatches(value);
      
      updatedMaterials[index] = {
        materialId: parseInt(value),
        blockchainItemId: '',
        quantity: 0
      };
    } else {
      updatedMaterials[index][field] = field === 'quantity' ? parseInt(value) : value;
    }
    
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
      
      if (!formData.supplyChainId) {
        setError('Please select a supply chain.');
        return;
      }
      
      // Validate materials - check both blockchain ID and quantity
      const invalidMaterials = formData.materials.some(m => 
        !m.quantity || m.quantity <= 0 || !m.blockchainItemId
      );
      
      if (invalidMaterials) {
        setError('Please provide valid blockchain ID and quantity for all materials.');
        return;
      }
      
      // Process materials to ensure proper data types
      const processedMaterials = formData.materials.map(material => ({
        materialId: parseInt(material.materialId),
        blockchainItemId: parseInt(material.blockchainItemId), 
        quantity: parseInt(material.quantity)
      }));
      
      const batchData = {
        manufacturerId: currentUser.id,
        productId: parseInt(formData.productId),
        supplyChainId: parseInt(formData.supplyChainId),
        orderId: formData.orderId ? parseInt(formData.orderId) : null,
        quantity: parseInt(formData.quantity),
        materials: processedMaterials
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
      setError('Failed to create production batch. Please try again: ' + err.message);
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
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productId">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              id="productId"
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={filteredProducts.length === 0}
            >
              <option value="">Select a product</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku})
                </option>
              ))}
            </select>
            {filteredProducts.length === 0 && (
              <p className="text-red-500 text-xs italic mt-1">
                No products available. Please create products first.
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
              Quantity to Produce <span className="text-red-500">*</span>
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
              disabled={!formData.productId}
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
              <option value="">No related order</option>
              {filteredOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  Order #{order.orderNumber} - {order.customerName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 text-sm font-bold">
                Required Materials <span className="text-red-500">*</span>
              </label>
            </div>
            
            {formData.materials.length > 0 ? (
              <div className="space-y-4 border rounded p-4">
                {formData.materials.map((material, index) => {
                  const materialInfo = materials.find(m => m.id === parseInt(material.materialId));
                  
                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium mb-2">{materialInfo?.name || 'Material'}</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label className="block text-gray-700 text-xs mb-1">
                            Material Blockchain ID <span className="text-red-500">*</span>
                            </label>
                            <select
                            value={material.blockchainItemId || ''}
                            onChange={(e) => handleMaterialChange(index, 'blockchainItemId', e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                            >
                            <option value="">Select a material batch</option>
                            {materialInventory
                                .filter(invMaterial => invMaterial.id === material.materialId)
                                .map((invMaterial) => (
                                <option key={invMaterial.blockchainItemId} value={invMaterial.blockchainItemId}>
                                    {invMaterial.name} - Batch ID: {invMaterial.blockchainItemId} - Available: {invMaterial.quantity} {invMaterial.unit}
                                </option>
                                ))}
                            {!materialInventory.some(m => m.id === material.materialId) && (
                                <option disabled>No batches available for this material</option>
                            )}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 text-xs mb-1">
                            Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                            type="number"
                            value={material.quantity || ''}
                            onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            min="1"
                            max={materialInventory.find(m => m.id === material.materialId && m.blockchainItemId === material.blockchainItemId)?.quantity || 9999}
                            required
                            />
                        </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No materials required for this product.</p>
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
              disabled={!formData.supplyChainId || !formData.productId || !formData.quantity || formData.materials.length === 0}
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
              Quality Assessment <span className="text-red-500">*</span>
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
              disabled={!qualityData}
            >
              Complete Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );

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
              Rejection Reason <span className="text-red-500">*</span>
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
              disabled={!rejectionReason}
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
          disabled={supplyChains.length === 0}
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create New Batch
        </button>
      </div>

      {/* Supply Chain Warning */}
      {supplyChains.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Notice:</strong>
          <span className="block sm:inline"> You need to be part of a finalized supply chain to create production batches. Please contact an administrator.</span>
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
      ) : productionBatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <p className="text-gray-500 mb-4">No production batches found. Create your first batch to get started.</p>
          <button
            onClick={handleCreateBatch}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={supplyChains.length === 0}
          >
            Create Batch
          </button>
          {supplyChains.length === 0 && (
            <p className="text-gray-500 mt-4 text-sm italic">
              You need to be part of a finalized supply chain to create batches.
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
                    Batch #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supply Chain
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
                {productionBatches.map((batch) => {
                  const supplyChain = supplyChains.find(sc => sc.id === batch.supplyChain?.id);
                  
                  return (
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
                        <div className="text-sm font-medium text-gray-900">
                          {supplyChain ? supplyChain.name : 'Unknown Chain'}
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
                  );
                })}
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
};

export default ProductionBatchesList;