import React, { useState, useEffect } from 'react';
import { manufacturerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RecycledItemsProcessing = () => {
  const { currentUser } = useAuth();
  const [pendingItems, setPendingItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [refurbishedProducts, setRefurbishedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showRefurbishModal, setShowRefurbishModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [materialsFormData, setMaterialsFormData] = useState([]);
  const [refurbishFormData, setRefurbishFormData] = useState({
    quality: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [pendingResponse, materialsResponse, productsResponse] = await Promise.all([
        manufacturerService.getPendingRecycledItems(currentUser.id),
        manufacturerService.getRecycledMaterials(currentUser.id),
        manufacturerService.getRefurbishedProducts(currentUser.id)
      ]);
      
      setPendingItems(pendingResponse?.data || []);
      setMaterials(materialsResponse?.data || []);
      setRefurbishedProducts(productsResponse?.data || []);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching recycling data:', err);
      setError('Failed to load recycling data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessMaterials = (item) => {
    setSelectedItem(item);
    
    // Initialize with sample materials - this would come from a materials database in reality
    setMaterialsFormData([
      { name: 'Aluminum', quantity: 0, unit: 'kg' },
      { name: 'Plastic', quantity: 0, unit: 'kg' },
      { name: 'Glass', quantity: 0, unit: 'kg' },
      { name: 'Circuit Board', quantity: 0, unit: 'kg' },
      { name: 'Copper Wire', quantity: 0, unit: 'kg' }
    ]);
    
    setShowMaterialsModal(true);
  };

  const handleRefurbish = (item) => {
    setSelectedItem(item);
    setRefurbishFormData({
      quality: 'Good',
      notes: ''
    });
    setShowRefurbishModal(true);
  };

  const handleMaterialQuantityChange = (index, quantity) => {
    const updatedMaterials = [...materialsFormData];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      quantity: parseFloat(quantity) || 0
    };
    setMaterialsFormData(updatedMaterials);
  };

  const handleRefurbishInputChange = (e) => {
    const { name, value } = e.target;
    setRefurbishFormData({
      ...refurbishFormData,
      [name]: value
    });
  };

  const submitMaterialsProcess = async (e) => {
    e.preventDefault();
    
    try {
      // Filter out materials with zero quantity
      const materials = materialsFormData.filter(material => material.quantity > 0);
      
      if (materials.length === 0) {
        setError('Please specify at least one material with a quantity greater than zero.');
        return;
      }
      
      await manufacturerService.processToMaterials(selectedItem.id, {
        manufacturerId: currentUser.id,
        supplyChainId: selectedItem.supplyChainId,
        materials: materials
      });
      
      setShowMaterialsModal(false);
      setSuccess('Item successfully processed into recycled materials.');
      fetchData(); // Refresh data
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error processing recycled item into materials:', err);
      setError('Failed to process item into materials. Please try again.');
    }
  };

  const submitRefurbish = async (e) => {
    e.preventDefault();
    
    try {
      if (!refurbishFormData.quality) {
        setError('Please select a quality level.');
        return;
      }
      
      await manufacturerService.refurbishProduct(selectedItem.id, {
        manufacturerId: currentUser.id,
        quality: refurbishFormData.quality,
        notes: refurbishFormData.notes
      });
      
      setShowRefurbishModal(false);
      setSuccess('Item successfully refurbished.');
      fetchData(); // Refresh data
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error refurbishing product:', err);
      setError('Failed to refurbish product. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RECYCLING_RECEIVED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Received</span>;
      case 'RECYCLED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Recycled</span>;
      case 'REFURBISHED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Refurbished</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Modal for Processing into Materials
  const MaterialsProcessingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Process into Materials</h2>
          <button onClick={() => setShowMaterialsModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={submitMaterialsProcess}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Product:</span> {selectedItem?.productName || 'Recycled Item'}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Original Owner:</span> {selectedItem?.customerName || 'Unknown Customer'}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Received Date:</span> {formatDate(selectedItem?.receivedDate)}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Recovered Materials <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Specify the quantity of each material recovered from this item:
            </p>
            
            <div className="space-y-3 max-h-64 overflow-y-auto p-2 border rounded">
              {materialsFormData.map((material, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700">
                      {material.name}
                    </label>
                  </div>
                  <div className="w-1/2 flex">
                    <input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => handleMaterialQuantityChange(index, e.target.value)}
                      min="0"
                      step="0.01"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    <span className="ml-2 flex items-center text-gray-700">
                      {material.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowMaterialsModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Process Materials
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Modal for Refurbishing
  const RefurbishModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Refurbish Product</h2>
          <button onClick={() => setShowRefurbishModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={submitRefurbish}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Product:</span> {selectedItem?.productName || 'Recycled Item'}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Original Owner:</span> {selectedItem?.customerName || 'Unknown Customer'}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Received Date:</span> {formatDate(selectedItem?.receivedDate)}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quality">
              Quality Level <span className="text-red-500">*</span>
            </label>
            <select
              id="quality"
              name="quality"
              value={refurbishFormData.quality}
              onChange={handleRefurbishInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select quality level</option>
              <option value="Excellent">Excellent - Like New</option>
              <option value="Good">Good - Minor Wear</option>
              <option value="Fair">Fair - Visible Wear, Fully Functional</option>
              <option value="Poor">Poor - Cosmetic Issues, Functional</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="refurbishNotes">
              Refurbishment Notes
            </label>
            <textarea
              id="refurbishNotes"
              name="notes"
              value={refurbishFormData.notes}
              onChange={handleRefurbishInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              placeholder="Describe the refurbishment process, parts replaced, etc."
            ></textarea>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowRefurbishModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              Refurbish Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Recycled Items Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          {success}
        </div>
      )}
      
      {/* Information Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Circular Manufacturing</h2>
        <p className="text-blue-700 mb-4">
          Process returned products into recyclable materials or refurbish them for resale in our circular economy initiative.
        </p>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
            <div className="bg-white rounded-lg p-4 h-full shadow-sm">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recycled Materials
              </h3>
              <p className="text-sm text-gray-600">
                Break down returned products into raw materials that can be used to create new products, reducing waste and resource consumption.
              </p>
            </div>
          </div>
          <div className="w-full md:w-1/2 px-2">
            <div className="bg-white rounded-lg p-4 h-full shadow-sm">
              <h3 className="font-medium text-purple-800 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Refurbished Products
              </h3>
              <p className="text-sm text-gray-600">
                Restore returned products to working condition for resale at a reduced price, extending product lifespan and reducing environmental impact.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pending Items */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Items Pending Processing</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">No items are waiting to be processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.productName || 'Recycled Item'}</div>
                        <div className="text-sm text-gray-500">{item.productType || 'Unknown Type'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.customerName || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(item.receivedDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status || 'RECYCLING_RECEIVED')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleProcessMaterials(item)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-1 px-3 rounded text-xs"
                          >
                            Process to Materials
                          </button>
                          <button
                            onClick={() => handleRefurbish(item)}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold py-1 px-3 rounded text-xs"
                          >
                            Refurbish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Recycled Materials */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800">Recycled Materials</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p className="text-gray-500">No recycled materials available.</p>
              <p className="text-gray-500 mt-2">Process returned items to extract materials.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blockchain ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{material.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{material.quantity} {material.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{material.sourceProductName || 'Unknown Product'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(material.processDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{material.blockchainItemId || 'N/A'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Refurbished Products */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
          <h2 className="text-xl font-semibold text-purple-800">Refurbished Products</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : refurbishedProducts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No refurbished products available.</p>
              <p className="text-gray-500 mt-2">Refurbish returned items to make them available for resale.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refurbish Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blockchain ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {refurbishedProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description && product.description.substring(0, 60)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.quality || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.originalOwner || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(product.refurbishDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{product.blockchainItemId || 'N/A'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {showMaterialsModal && selectedItem && <MaterialsProcessingModal />}
      {showRefurbishModal && selectedItem && <RefurbishModal />}
    </div>
  );
};

export default RecycledItemsProcessing;