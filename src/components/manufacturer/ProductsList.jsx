import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { manufacturerService, supplierService, supplyChainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CreateProductModal from './CreateProductModal';
import EditProductModal from './EditProductModal';

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
    supplyChainId: '',
    requiredMaterials: []
  });
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [supplyChains, setSupplyChains] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const fetchData = async () => {
  try {
    setLoading(true);
    
    // Fetch all required data in parallel
    const [
      productsResponse, 
      supplyChainResponse
    ] = await Promise.all([
      manufacturerService.getProducts(currentUser.id),
      supplyChainService.getSupplyChainsByUser(currentUser.id)
    ]);
    
    // Add defensive coding
    const productsData = Array.isArray(productsResponse.data) ? productsResponse.data : [];
    const supplyChainData = Array.isArray(supplyChainResponse) ? supplyChainResponse : [];
    
    // Filter only finalized supply chains
    const finalizedChains = supplyChainData.filter(chain => 
      chain.blockchainStatus === "FINALIZED" || chain.blockchainStatus === "CONFIRMED"
    );
    
    setProducts(productsData);
    setSupplyChains(finalizedChains);
    
    // Initialize supply chain selection if possible
    if (finalizedChains.length > 0) {
      // Update form with first available supply chain
      const initialSupplyChainId = finalizedChains[0].id;
      setFormData(prev => ({
        ...prev,
        supplyChainId: initialSupplyChainId
      }));
      
      // Fetch materials for the first supply chain
      await fetchMaterialsBySupplyChain(initialSupplyChainId);
    } else {
      setFilteredMaterials([]);
    }
    
    setError(null);
  } catch (err) {
    console.error('Error fetching products:', err);
    setError('Failed to load products. Please try again later.');
  } finally {
    setLoading(false);
  }
};

const fetchMaterialsBySupplyChain = async (supplyChainId) => {
  try {
    const supplyChainResponse = await supplyChainService.getSupplyChainById(supplyChainId);
    const supplyChainData = supplyChainResponse.data;
    
    const supplierNodes = supplyChainData.nodes.filter(
      node => node.role.toLowerCase() === 'supplier' && node.assignedUserId
    );
    
    const supplierUserIds = supplierNodes.map(node => node.assignedUserId);
    
    const materialsPromises = supplierUserIds.map(supplierId => 
      supplierService.getMaterials(supplierId)
    );
    
    const materialsResponses = await Promise.all(materialsPromises);
    const materialsData = materialsResponses.flatMap(response => response.data);
    
    setAvailableMaterials(materialsData);
    filterMaterialsByChain(materialsData, supplyChainId);
  } catch (err) {
    console.error('Error fetching materials:', err);
    setAvailableMaterials([]);
    setFilteredMaterials([]);
  }
};
  
const filterMaterialsByChain = (allMaterials, chainId) => {
    console.log("All materials:", allMaterials);
    console.log("Chain ID:", chainId);
    
    // Find the selected chain
    const selectedChain = supplyChains.find(chain => chain.id === parseInt(chainId));
    
    if (!selectedChain) {
      setFilteredMaterials([]);
      return;
    }
    
    // Extract supplier nodes from the chain
    const supplierNodes = selectedChain.nodes.filter(
      node => node.role && node.role.toLowerCase() === 'supplier' && node.assignedUserId
    );
    
    // Get the assigned user IDs from supplier nodes
    const supplierUserIds = supplierNodes.map(node => node.assignedUserId);
    
    console.log("Supplier User IDs:", supplierUserIds);
    
    // Filter materials from suppliers in this chain - with more flexible matching
    const chainMaterials = allMaterials.filter(material => {
      // Log each material for debugging
      console.log("Checking material:", material);
      
      // Check if material is active (if this property exists)
      const isActive = material.active !== false; // Consider active if not explicitly false
      
      // Get supplier ID (handle different data structures)
      const supplierId = material.supplier?.id || material.supplierId;
      
      // Try more flexible comparison (convert both to strings for comparison)
      const supplierMatches = supplierUserIds.some(id => 
        String(supplierId) === String(id)
      );
      
      console.log(`Material ${material.name || 'unknown'}: active=${isActive}, supplierId=${supplierId}, supplierMatches=${supplierMatches}`);
      
      return isActive && supplierMatches;
    });
    
    console.log("Filtered materials:", chainMaterials);
    setFilteredMaterials(chainMaterials);
  };

  const handleCreateProduct = () => {
    // Reset form with default supply chain if available
    const initialSupplyChainId = supplyChains.length > 0 ? supplyChains[0].id : '';
    
    setFormData({
      name: '',
      description: '',
      specifications: '',
      sku: '',
      price: '',
      supplyChainId: initialSupplyChainId,
      requiredMaterials: []
    });
    
    // Initial filter of materials
    if (initialSupplyChainId) {
      filterMaterialsByChain(availableMaterials, initialSupplyChainId);
    }
    
    setShowCreateModal(true);
  };

  const handleSupplyChainChange = (supplyChainId) => {
    filterMaterialsByChain(availableMaterials, supplyChainId);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    
    // Determine which supply chain this product belongs to
    const initialSupplyChainId = supplyChains.length > 0 ? supplyChains[0].id : '';
    
    setFormData({
      name: product.name,
      description: product.description,
      specifications: product.specifications,
      sku: product.sku,
      price: product.price.toString(),
      supplyChainId: initialSupplyChainId,
      requiredMaterials: product.requiredMaterials ? product.requiredMaterials.map(material => ({
        id: material.id,
        name: material.name,
        quantity: material.quantity,
        unit: material.unit
      })) : []
    });
    
    // Filter materials for the selected chain
    if (initialSupplyChainId) {
      filterMaterialsByChain(availableMaterials, initialSupplyChainId);
    }
    
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If supply chain changes, filter materials
    if (name === 'supplyChainId' && value) {
      filterMaterialsByChain(availableMaterials, value);
    }
  };

  const handleMaterialChange = (material, checked) => {
    let newSelectedMaterials;
    
    if (checked) {
      // Add material with default quantity of 1
      newSelectedMaterials = [...formData.requiredMaterials, { 
        id: material.id, 
        name: material.name, 
        quantity: 1,
        unit: material.unit 
      }];
    } else {
      // Remove material from the list
      newSelectedMaterials = formData.requiredMaterials.filter(m => m.id !== material.id);
    }
    
    setFormData({
      ...formData,
      requiredMaterials: newSelectedMaterials
    });
  };

  const handleMaterialQuantityChange = (materialId, quantity) => {
    const newSelectedMaterials = formData.requiredMaterials.map(material => 
      material.id === materialId 
        ? { ...material, quantity: Math.max(0, parseFloat(quantity) || 0) }
        : material
    );
    
    setFormData({
      ...formData,
      requiredMaterials: newSelectedMaterials
    });
  };

  const handleCreateSubmit = async (e, updatedFormData) => {
    e.preventDefault();
    
    try {
      // Validate inputs
      if (!updatedFormData.name || !updatedFormData.description || !updatedFormData.sku || !updatedFormData.price) {
        setError('Please fill in all required fields.');
        return;
      }
      
      if (!updatedFormData.supplyChainId) {
        setError('Please select a supply chain.');
        return;
      }
      
      const productData = {
        name: updatedFormData.name,
        description: updatedFormData.description,
        specifications: updatedFormData.specifications,
        sku: updatedFormData.sku,
        price: parseFloat(updatedFormData.price),
        manufacturerId: currentUser.id,
        supplyChainId: parseInt(updatedFormData.supplyChainId),
        requiredMaterials: updatedFormData.requiredMaterials.map(material => ({
          materialId: material.id,
          quantity: material.quantity
        }))
      };
      
      await manufacturerService.createProduct(productData);
      setShowCreateModal(false);
      setSuccessMessage('Product created successfully!');
      setShowSuccessAlert(true);
      fetchData(); // Refresh the product list
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product. Please try again.');
    }
  };

  const handleEditSubmit = async (e, updatedFormData) => {
    e.preventDefault();
    
    try {
      // Validate inputs
      if (!updatedFormData.name || !updatedFormData.description || !updatedFormData.sku || !updatedFormData.price) {
        setError('Please fill in all required fields.');
        return;
      }
      
      const productData = {
        name: updatedFormData.name,
        description: updatedFormData.description,
        specifications: updatedFormData.specifications,
        sku: updatedFormData.sku,
        price: parseFloat(updatedFormData.price),
        requiredMaterials: updatedFormData.requiredMaterials.map(material => ({
          materialId: material.id,
          quantity: material.quantity
        }))
      };
      
      await manufacturerService.updateProduct(selectedProduct.id, productData);
      setShowEditModal(false);
      setSuccessMessage('Product updated successfully!');
      setShowSuccessAlert(true);
      fetchData(); // Refresh the product list
      
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
        fetchData(); // Refresh the product list
        
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products Management</h1>
        <button
          onClick={handleCreateProduct}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          disabled={supplyChains.length === 0}
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create New Product
        </button>
      </div>

      {/* Supply Chain Warning */}
      {supplyChains.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Notice:</strong>
          <span className="block sm:inline"> You need to be part of a finalized supply chain to create products. Please contact an administrator.</span>
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
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <p className="text-gray-500 mb-4">No products found. Create your first product to get started.</p>
          <button
            onClick={handleCreateProduct}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={supplyChains.length === 0}
          >
            Create Product
          </button>
          {supplyChains.length === 0 && (
            <p className="text-gray-500 mt-4 text-sm italic">
              You need to be part of a finalized supply chain to create products.
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
                      <div className="text-sm text-gray-500">
                        {product.price != null ? `$${Number(product.price).toFixed(2)}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                        {product.materials && product.materials.length > 0 ? (
                            <div>
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mr-2">
                                {product.materials.length} materials
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                {product.materials.map(item => (
                                    <div key={item.materialId}>
                                    {item.materialName}: {item.quantity} {item.unit || ''}
                                    </div>
                                ))}
                                </div>
                            </div>
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
      {showCreateModal && (
        <CreateProductModal
            initialFormData={formData}
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateModal(false)}
            supplyChains={supplyChains}
            filteredMaterials={filteredMaterials}
            onSupplyChainChange={handleSupplyChainChange}
        />
      )}
      {showEditModal && (
        <EditProductModal
            initialFormData={formData}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)}
            filteredMaterials={filteredMaterials}
            onSupplyChainChange={handleSupplyChainChange}
        />
      )}
    </div>
  );
};

export default ProductsList;