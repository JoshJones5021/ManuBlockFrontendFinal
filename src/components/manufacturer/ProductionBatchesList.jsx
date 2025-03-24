import React, { useState, useEffect } from 'react';
import { manufacturerService, supplyChainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import CreateProductionBatchModal from './CreateProductionBatchModal';
import CompleteBatchModal from './CompleteBatchModal';
import RejectBatchModal from './RejectBatchModal';

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
    supplyChainId: '',
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

      const [
        batchesResponse,
        productsResponse,
        ordersResponse,
        supplyChainResponse,
      ] = await Promise.all([
        manufacturerService.getProductionBatches(currentUser.id),
        manufacturerService.getProducts(currentUser.id),
        manufacturerService.getOrders(currentUser.id),
        supplyChainService.getSupplyChainsByUser(currentUser.id),
      ]);

      console.log('Products response:', productsResponse.data);

      const batchesData = Array.isArray(batchesResponse.data)
        ? batchesResponse.data
        : [];
      const productsData = Array.isArray(productsResponse.data)
        ? productsResponse.data
        : [];
      const ordersData = Array.isArray(ordersResponse.data)
        ? ordersResponse.data
        : [];
      const supplyChainData = Array.isArray(supplyChainResponse)
        ? supplyChainResponse
        : [];

      const finalizedChains = supplyChainData.filter(
        chain =>
          chain.blockchainStatus === 'FINALIZED' ||
          chain.blockchainStatus === 'CONFIRMED'
      );

      setProductionBatches(batchesData);
      setProducts(productsData);
      setSupplyChains(finalizedChains);
      setActiveOrders(ordersData);

      const activeProductsData = productsData.filter(product => product.active);

      if (finalizedChains.length > 0) {
        setFormData(prev => ({
          ...prev,
          supplyChainId: finalizedChains[0].id,
        }));

        filterProductsByChain(activeProductsData, finalizedChains[0].id);
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

  const fetchMaterialsWithBlockchainIds = async manufacturerId => {
    try {
      const response =
        await manufacturerService.getAvailableMaterialsWithBlockchainIds(
          manufacturerId
        );

      if (response && response.data) {
        setMaterialInventory(response.data);
        console.log('Available materials:', response.data);
      }
    } catch (err) {
      console.error('Error fetching materials with blockchain IDs:', err);
      setMaterialInventory([]);
    }
  };

  const fetchMaterialBatches = async materialId => {
    try {
      const response =
        await manufacturerService.getMaterialBatchesWithBlockchainIds(
          materialId
        );

      if (response && response.data) {
        setMaterialBatches(prev => ({
          ...prev,
          [materialId]: response.data,
        }));
      }
    } catch (err) {
      console.error('Error fetching material batches:', err);
      setMaterialBatches(prev => ({
        ...prev,
        [materialId]: [
          {
            id: 1,
            blockchainItemId: `batch-${materialId}-001`,
            batchNumber: 'B001',
          },
          {
            id: 2,
            blockchainItemId: `batch-${materialId}-002`,
            batchNumber: 'B002',
          },
        ],
      }));
    }
  };

  const filterProductsByChain = (allProducts, chainId) => {
    const chainProducts = allProducts.filter(product => product.active);

    console.log('Filtered products:', chainProducts);

    setFilteredProducts(chainProducts);

    if (chainProducts.length > 0) {
      const currentIsValid = chainProducts.some(
        p => p.id === parseInt(formData.productId)
      );

      if (!currentIsValid) {
        setFormData(prev => ({
          ...prev,
          productId: chainProducts[0].id,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        productId: '',
      }));
    }
  };

  const filterOrdersByChain = (allOrders, chainId) => {
    const chainOrders = allOrders.filter(
      order =>
        order.supplyChainId === parseInt(chainId) &&
        (order.status === 'Requested' || order.status === 'In Production')
    );

    setFilteredOrders(chainOrders);

    const currentIsValid = chainOrders.some(
      o => o.id === parseInt(formData.orderId)
    );
    if (!currentIsValid) {
      setFormData(prev => ({
        ...prev,
        orderId: null,
      }));
    }
  };

  const filterOrdersByProduct = productId => {
    if (!productId) {
      setFilteredOrders([]);
      return;
    }

    const relevantOrders = activeOrders.filter(
      order =>
        order.items &&
        order.items.some(
          item =>
            item.productId === parseInt(productId) &&
            ['Requested', 'In Production'].includes(order.status)
        )
    );

    setFilteredOrders(relevantOrders);
  };

  const getStatusBadgeClass = status => {
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
    const initialSupplyChainId =
      supplyChains.length > 0 ? supplyChains[0].id : '';
    const initialProductId =
      filteredProducts.length > 0 ? filteredProducts[0].id : '';

    setFormData({
      productId: initialProductId,
      quantity: '',
      materials: [],
      supplyChainId: initialSupplyChainId,
    });

    if (initialSupplyChainId) {
      filterProductsByChain(products, initialSupplyChainId);
      filterOrdersByChain(activeOrders, initialSupplyChainId);
    }

    fetchMaterialsWithBlockchainIds(currentUser.id).then(() => {
      if (initialProductId) {
        const selectedProduct = products.find(
          p => p.id === parseInt(initialProductId)
        );
        console.log('Initial product selection:', selectedProduct);

        if (
          selectedProduct &&
          selectedProduct.materials &&
          selectedProduct.materials.length > 0
        ) {
          console.log('Initial product materials:', selectedProduct.materials);

          const initialMaterials = selectedProduct.materials.map(material => ({
            materialId: material.materialId,
            blockchainItemId: null,
            quantity: material.quantity,
          }));

          setFormData(prevState => ({
            ...prevState,
            materials: initialMaterials,
          }));

          setMaterials(selectedProduct.materials);
        }
      }

      setShowCreateModal(true);
    });
  };

  const handleCompleteBatch = batch => {
    setSelectedBatch(batch);
    setQualityData('');
    setShowCompleteModal(true);
  };

  const handleRejectBatch = batch => {
    setSelectedBatch(batch);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'supplyChainId' && value) {
      filterProductsByChain(products, value);
      filterOrdersByChain(activeOrders, value);
    }

    if (name === 'productId') {
      console.log('Product changed to:', value);
      const selectedProduct = filteredProducts.find(
        p => p.id === parseInt(value)
      );
      console.log('Selected product:', selectedProduct);

      if (
        selectedProduct &&
        selectedProduct.materials &&
        selectedProduct.materials.length > 0
      ) {
        console.log('Product materials:', selectedProduct.materials);

        const initialMaterials = selectedProduct.materials.map(material => ({
          materialId: material.materialId,
          blockchainItemId: null, 
          quantity: material.quantity, 
        }));

        console.log('Setting initial materials:', initialMaterials);

        setFormData(prevState => ({
          ...prevState,
          materials: initialMaterials,
        }));

        setMaterials(selectedProduct.materials);

        filterOrdersByProduct(value);
      } else {
        console.log('No materials found for this product');
        setFormData(prevState => ({
          ...prevState,
          materials: [],
        }));
        setMaterials([]);
      }
    }
  };

  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...formData.materials];

    if (field === 'materialId') {
      fetchMaterialBatches(value);

      updatedMaterials[index] = {
        materialId: parseInt(value),
        blockchainItemId: '',
        quantity: 0,
      };
    } else if (field === 'blockchainItemId') {
      updatedMaterials[index][field] = value === '' ? '' : parseInt(value);
    } else if (field === 'quantity') {
      updatedMaterials[index][field] = value === '' ? 0 : parseInt(value);
    } else {
      updatedMaterials[index][field] = value;
    }

    console.log(
      `Updated material at index ${index}, field ${field} to:`,
      updatedMaterials[index]
    );

    setFormData({
      ...formData,
      materials: updatedMaterials,
    });
  };

  const handleCreateSubmit = async e => {
    e.preventDefault();

    try {
      if (!formData.productId || !formData.quantity || formData.quantity <= 0) {
        setError('Please provide valid product and quantity information.');
        return;
      }

      if (!formData.supplyChainId) {
        setError('Please select a supply chain.');
        return;
      }

      const invalidMaterials = formData.materials.some(
        m => !m.quantity || m.quantity <= 0 || !m.blockchainItemId
      );

      if (invalidMaterials) {
        setError(
          'Please provide valid blockchain ID and quantity for all materials.'
        );
        return;
      }

      const processedMaterials = formData.materials.map(material => ({
        materialId: parseInt(material.materialId),
        blockchainItemId: parseInt(material.blockchainItemId),
        quantity: parseInt(material.quantity),
      }));

      const batchData = {
        manufacturerId: currentUser.id,
        productId: parseInt(formData.productId),
        supplyChainId: parseInt(formData.supplyChainId),
        quantity: parseInt(formData.quantity),
        materials: processedMaterials,
      };

      await manufacturerService.createProductionBatch(batchData);
      setShowCreateModal(false);
      setSuccessMessage('Production batch created successfully!');
      setShowSuccessAlert(true);
      fetchData(); 

      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating production batch:', err);
      setError(
        'Failed to create production batch. Please try again: ' + err.message
      );
    }
  };

  const handleCompleteSubmit = async e => {
    e.preventDefault();

    try {
      if (!qualityData) {
        setError('Please provide quality information.');
        return;
      }

      await manufacturerService.completeProductionBatch(
        selectedBatch.id,
        qualityData
      );
      setShowCompleteModal(false);
      setSuccessMessage('Production batch completed successfully!');
      setShowSuccessAlert(true);
      fetchData();

      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error completing production batch:', err);
      setError('Failed to complete production batch. Please try again.');
    }
  };

  const handleRejectSubmit = async e => {
    e.preventDefault();
  
    try {
      if (!rejectionReason) {
        setError('Please provide rejection reason.');
        return;
      }
  
      // Pass the rejectionReason directly as a string, not as an object
      await manufacturerService.rejectProductionBatch(selectedBatch.id, rejectionReason);
      
      setShowRejectModal(false);
      setSuccessMessage('Production batch rejected.');
      setShowSuccessAlert(true);
      fetchData(); 
  
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error rejecting production batch:', err);
      setError('Failed to reject production batch. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Production Batches</h1>
        <button
          onClick={handleCreateBatch}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          disabled={supplyChains.length === 0}
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Create New Batch
        </button>
      </div>

      {/* Supply Chain Warning */}
      {supplyChains.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Notice:</strong>
          <span className="block sm:inline">
            {' '}
            You need to be part of a finalized supply chain to create production
            batches. Please contact an administrator.
          </span>
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
          <svg
            className="h-16 w-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            ></path>
          </svg>
          <p className="text-gray-500 mb-4">
            No production batches found. Create your first batch to get started.
          </p>
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
                {productionBatches.map(batch => {
                  const supplyChain = supplyChains.find(
                    sc => parseInt(sc.id) === parseInt(batch.supplyChainId)
                  );

                  return (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {batch.batchNumber}
                        </div>
                        {batch.blockchainItemId && (
                          <div className="text-xs text-gray-500">
                            Blockchain ID: {batch.blockchainItemId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {batch.product.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplyChain
                            ? supplyChain.name
                            : batch.supplyChainName || 'Unknown Chain'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {batch.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(batch.status)}`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {batch.startDate
                            ? new Date(batch.startDate).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {batch.relatedOrder ? (
                          <div className="text-sm text-blue-600">
                            <Link
                              to={`/manufacturer/orders/${batch.relatedOrder.id}`}
                            >
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
                          {(batch.status === 'Planned' ||
                            batch.status === 'In QC') && (
                            <span className="text-gray-500">
                              Awaiting processing
                            </span>
                          )}
                          {(batch.status === 'Completed' ||
                            batch.status === 'Rejected') && (
                            <span className="text-gray-500">
                              No actions available
                            </span>
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
      {showCreateModal && (
        <CreateProductionBatchModal
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateModal(false)}
          formData={formData}
          onChange={handleInputChange}
          handleMaterialChange={handleMaterialChange}
          supplyChains={supplyChains}
          filteredProducts={filteredProducts}
          materialInventory={materialInventory}
          materials={materials}
          currentUser={currentUser}
          error={error}
        />
      )}
      {showCompleteModal && selectedBatch && (
        <CompleteBatchModal
          onSubmit={handleCompleteSubmit}
          onCancel={() => setShowCompleteModal(false)}
          selectedBatch={selectedBatch}
          qualityData={qualityData}
          setQualityData={setQualityData}
          error={error}
        />
      )}
      {showRejectModal && selectedBatch && (
        <RejectBatchModal
          onSubmit={handleRejectSubmit}
          onCancel={() => setShowRejectModal(false)}
          selectedBatch={selectedBatch}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          error={error}
        />
      )}
    </div>
  );
};

export default ProductionBatchesList;
