// src/components/manufacturer/ProductsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { manufacturerService, supplierService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProductsList = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specifications: '',
    sku: '',
    price: '',
    requiredMaterialIds: []
  });
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchAvailableMaterials();
  }, [currentUser.id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await manufacturerService.getProducts(currentUser.id);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMaterials = async () => {
    try {
      const response = await supplierService.getMaterials();
      // Filter to only get active materials
      const activeMaterials = response.data.filter(material => material.active);
      setAvailableMaterials(activeMaterials);
    } catch (err) {
      console.error('Error fetching available materials:', err);
      // Don't set error - this is not critical
    }
  };

  const handleCreateProduct = () => {
    setFormData({
      name: '',
      description: '',
      specifications: '',
      sku: '',
      price: '',
      requiredMaterialIds: []
    });
    setShowCreateModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      specifications: product.specifications,
      sku: product.sku,
      price: product.price.toString(),
      requiredMaterialIds: product.requiredMaterials.map(material => material.id)
    });
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleMaterialChange = (e) => {
    const materialId = parseInt(e.target.value);
    let newSelectedMaterials;
    
    if (e.target.checked) {
      // Add material ID to the list
      newSelectedMaterials = [...formData.requiredMaterialIds, materialId];
    } else {
      // Remove material ID from the list
      newSelectedMaterials = formData.requiredMaterialIds.filter(id => id !== materialId);
    }
    
    setFormData({
      ...formData,
      requiredMaterialIds: newSelectedMaterials
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        specifications: formData.specifications,
        sku: formData.sku,
        price: parseFloat(formData.price),
        manufacturerId: currentUser.id,
        // For now, use the first supply chain the user has access to
        // In a real app, you would let them select a supply chain
        supplyChainId: 1, // Replace with actual selection
        requiredMaterialIds: formData.requiredMaterialIds
      };
      
      await manufacturerService.createProduct(productData);
      setShowCreateModal(false);
      setSuccessMessage('Product created successfully!');
      setShowSuccessAlert(true);
      fetchProducts(); // Refresh the product list
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        specifications: formData.specifications,
        sku: formData.sku,
        price: parseFloat(formData.price),
        requiredMaterialIds: formData.requiredMaterialIds
      };
      
      await manufacturerService.updateProduct(selectedProduct.id, productData);
      setShowEditModal(false);
      setSuccessMessage('Product updated successfully!');
      setShowSuccessAlert(true);
      fetchProducts(); // Refresh the product list
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product. Please try again.');
    }
  };

  const handleDeactivateProduct = async (productId) => {
    if (window.confirm('Are you sure you want to deactivate this product?')) {
      try {
        await manufacturerService.deactivateProduct(productId);
        setSuccessMessage('Product deactivated successfully!');
        setShowSuccessAlert(true);
        fetchProducts(); // Refresh the product list
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessAlert(false);
        }, 3000);
      } catch (err) {
        console.error('Error deactivating product:', err);
        setError('Failed to deactivate product. Please try again.');
      }
    }
  };

  // Create Modal Component
  const CreateProductModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Create New Product</h2>
          <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleCreateSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="specifications">
              Specifications
            </label>
            <textarea
              id="specifications"
              name="specifications"
              value={formData.specifications}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sku">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Required Materials
            </label>
            {availableMaterials.length > 0 ? (
              <div className="max-h-60 overflow-y-auto p-2 border rounded">
                {availableMaterials.map((material) => (
                  <div key={material.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`material-${material.id}`}
                      value={material.id}
                      checked={formData.requiredMaterialIds.includes(material.id)}
                      onChange={handleMaterialChange}
                      className="mr-2"
                    />
                    <label htmlFor={`material-${material.id}`} className="text-sm">
                      {material.name} ({material.unit})
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No materials available. Please add materials first.</p>
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
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Edit Modal Component
  const EditProductModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Edit Product</h2>
          <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleEditSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-name">
              Product Name
            </label>
            <input
              type="text"
              id="edit-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-description">
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-specifications">
              Specifications
            </label>
            <textarea
              id="edit-specifications"
              name="specifications"
              value={formData.specifications}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-sku">
                SKU
              </label>
              <input
                type="text"
                id="edit-sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-price">
                Price
              </label>
              <input
                type="number"
                id="edit-price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Required Materials
            </label>
            {availableMaterials.length > 0 ? (
              <div className="max-h-60 overflow-y-auto p-2 border rounded">
                {availableMaterials.map((material) => (
                  <div key={material.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`edit-material-${material.id}`}
                      value={material.id}
                      checked={formData.requiredMaterialIds.includes(material.id)}
                      onChange={handleMaterialChange}
                      className="mr-2"
                    />
                    <label htmlFor={`edit-material-${material.id}`} className="text-sm">
                      {material.name} ({material.unit})
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No materials available. Please add materials first.</p>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products Management</h1>
        <button
          onClick={handleCreateProduct}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create New Product
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
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <p className="text-gray-500 mb-4">No products found. Create your first product to get started.</p>
          <button
            onClick={handleCreateProduct}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU / Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Materials
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockchain Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description.substring(0, 60)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.sku}</div>
                      <div className="text-sm text-gray-500">${product.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.requiredMaterials && product.requiredMaterials.length > 0 ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.requiredMaterials.length} materials
                          </span>
                        ) : (
                          <span className="text-gray-500">No materials</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.blockchainItemId ? (
                        <div>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Tracked
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {product.blockchainItemId}
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Tracked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        {product.active && (
                          <button 
                            onClick={() => handleDeactivateProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Deactivate
                          </button>
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
      {showCreateModal && <CreateProductModal />}
      {showEditModal && <EditProductModal />}
    </div>
  );
};

export default ProductsList;