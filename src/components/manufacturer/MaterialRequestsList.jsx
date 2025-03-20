import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  manufacturerService,
  supplierService,
  supplyChainService,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CreateMaterialRequestModal from './CreateMaterialRequestModal';

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
  });
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tempMaterial, setTempMaterial] = useState({
    materialId: '',
    quantity: '',
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

      let requestsResponse, supplierResponse, ordersResponse, supplyChains;

      try {
        [requestsResponse, supplierResponse, ordersResponse] =
          await Promise.all([
            manufacturerService.getMaterialRequests(currentUser.id),
            supplierService.getAllSuppliers(),
            manufacturerService.getOrders(currentUser.id),
          ]);

        supplyChains = await supplyChainService.getSupplyChainsByUser(
          currentUser.id
        );
        console.log('Supply chains fetched:', supplyChains);
      } catch (err) {
        console.error('Error in data fetching:', err);
        supplyChains = [];
      }

      const requestsData = Array.isArray(requestsResponse?.data)
        ? requestsResponse.data
        : [];
      const suppliersData = Array.isArray(supplierResponse?.data)
        ? supplierResponse.data
        : [];
      const ordersData = Array.isArray(ordersResponse?.data)
        ? ordersResponse.data
        : [];

      const finalizedChains = Array.isArray(supplyChains)
        ? supplyChains.filter(
            chain =>
              chain.blockchainStatus === 'FINALIZED' ||
              chain.blockchainStatus === 'CONFIRMED'
          )
        : [];

      console.log('Filtered finalized chains:', finalizedChains);

      setMaterialRequests(requestsData);
      setSuppliers(suppliersData);
      setSupplyChains(finalizedChains);

      if (finalizedChains.length > 0) {
        setFormData(prev => ({
          ...prev,
          supplyChainId: finalizedChains[0].id,
        }));

        filterSuppliersByChain(suppliersData, finalizedChains[0].id);
      } else {
        setFilteredSuppliers([]);
      }

      const activeOrdersData = ordersData.filter(
        order =>
          order &&
          order.status &&
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
    const selectedChain = supplyChains.find(
      chain => chain.id === parseInt(chainId)
    );

    if (!selectedChain) {
      setFilteredSuppliers([]);
      return;
    }

    const supplierNodes = selectedChain.nodes.filter(
      node =>
        node.role &&
        node.role.toLowerCase() === 'supplier' &&
        node.assignedUserId
    );

    const supplierUserIds = supplierNodes.map(node => node.assignedUserId);

    const chainSuppliers = allSuppliers.filter(supplier =>
      supplierUserIds.includes(supplier.id)
    );

    setFilteredSuppliers(chainSuppliers);

    if (chainSuppliers.length > 0) {
      const currentIsValid = chainSuppliers.some(
        s => s.id === parseInt(formData.supplierId)
      );

      if (!currentIsValid) {
        setFormData(prev => ({
          ...prev,
          supplierId: chainSuppliers[0].id,
        }));

        fetchSupplierMaterials(chainSuppliers[0].id);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        supplierId: '',
      }));
      setMaterials([]);
    }
  };

  const handleCreateRequest = () => {
    const initialSupplyChainId =
      supplyChains.length > 0 ? supplyChains[0].id : '';

    setFormData({
      supplierId: filteredSuppliers.length > 0 ? filteredSuppliers[0].id : '',
      items: [],
      requestedDeliveryDate: '',
      notes: '',
      supplyChainId: initialSupplyChainId,
      orderId: null,
    });

    setTempMaterial({
      materialId: '',
      quantity: '',
    });

    setShowCreateModal(true);

    if (initialSupplyChainId) {
      filterSuppliersByChain(suppliers, initialSupplyChainId);
    }

    if (filteredSuppliers.length > 0) {
      fetchSupplierMaterials(filteredSuppliers[0].id);
    }
  };

  const fetchSupplierMaterials = async supplierId => {
    if (!supplierId) {
      console.warn('Attempted to fetch materials without valid supplier ID');
      setMaterials([]);
      return;
    }

    try {
      const response = await supplierService.getMaterials(supplierId);

      if (!response || !response.data) {
        setMaterials([]);
        return;
      }

      const materialsData = Array.isArray(response.data) ? response.data : [];

      const activeMaterials = materialsData.filter(
        material =>
          material && typeof material.active === 'boolean' && material.active
      );

      setMaterials(activeMaterials);
    } catch (err) {
      console.error('Error fetching supplier materials:', err);
      setMaterials([]);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'supplyChainId' && value) {
      filterSuppliersByChain(suppliers, value);
    }

    if (name === 'supplierId' && value) {
      fetchSupplierMaterials(value);
    }
  };

  const handleTempMaterialChange = e => {
    const { name, value } = e.target;
    setTempMaterial({
      ...tempMaterial,
      [name]: value,
    });
  };

  const addMaterialToRequest = () => {
    if (
      !tempMaterial.materialId ||
      !tempMaterial.quantity ||
      parseInt(tempMaterial.quantity) <= 0
    ) {
      setError('Please select a material and provide a valid quantity.');
      return;
    }

    const materialId = parseInt(tempMaterial.materialId);
    const quantity = parseInt(tempMaterial.quantity);

    const existingItemIndex = formData.items.findIndex(
      item => item.materialId === materialId
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity = quantity;

      setFormData({
        ...formData,
        items: updatedItems,
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            materialId: materialId,
            quantity: quantity,
          },
        ],
      });
    }

    setTempMaterial({
      materialId: '',
      quantity: '',
    });

    setError(null);
  };

  const removeMaterialFromRequest = index => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const handleCreateSubmit = async e => {
    e.preventDefault();

    try {
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

      const requestData = {
        manufacturerId: parseInt(currentUser.id),
        supplierId: parseInt(formData.supplierId),
        supplyChainId: parseInt(formData.supplyChainId),
        items: formData.items.map(item => ({
          materialId: parseInt(item.materialId),
          quantity: parseInt(item.quantity),
        })),
        requestedDeliveryDate: formData.requestedDeliveryDate
          ? new Date(formData.requestedDeliveryDate).getTime()
          : null,
        notes: formData.notes,
        status: 'Requested',
      };

      console.log('Sending request data:', requestData);

      await manufacturerService.requestMaterials(requestData);
      setShowCreateModal(false);
      setSuccessMessage('Material request created successfully!');
      setShowSuccessAlert(true);
      fetchData(); 

      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating material request:', err);
      setError('Failed to create material request. Please try again.');
    }
  };

  const getStatusBadgeClass = status => {
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

  const formatDate = dateString => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Material Requests</h1>
        <button
          onClick={handleCreateRequest}
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
          Create New Request
        </button>
      </div>

      {/* Supply Chain Warning */}
      {supplyChains.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Notice:</strong>
          <span className="block sm:inline">
            {' '}
            You need to be part of a finalized supply chain to create material
            requests. Please contact an administrator.
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
      ) : materialRequests.length === 0 ? (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            ></path>
          </svg>
          <p className="text-gray-500 mb-4">
            No material requests found. Create your first request to get
            started.
          </p>
          <button
            onClick={handleCreateRequest}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={supplyChains.length === 0}
          >
            Create Request
          </button>
          {supplyChains.length === 0 && (
            <p className="text-gray-500 mt-4 text-sm italic">
              You need to be part of a finalized supply chain to create
              requests.
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
                {materialRequests.map(request => {
                  const supplier = suppliers.find(
                    s => s.id === request.supplierId
                  );
                  const supplyChain = supplyChains.find(
                    sc => sc.id === request.supplyChainId
                  );

                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.requestNumber}
                        </div>
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
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}
                        >
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
                              <div>
                                Requested:{' '}
                                {formatDate(request.requestedDeliveryDate)}
                              </div>
                              {request.actualDeliveryDate && (
                                <div className="text-green-600">
                                  Delivered:{' '}
                                  {formatDate(request.actualDeliveryDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">
                              No date specified
                            </span>
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

      {/* Modal */}
      {showCreateModal && (
        <CreateMaterialRequestModal
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateModal(false)}
          formData={formData}
          onChange={handleInputChange}
          tempMaterial={tempMaterial}
          onTempMaterialChange={handleTempMaterialChange}
          addMaterialToRequest={addMaterialToRequest}
          removeMaterialFromRequest={removeMaterialFromRequest}
          supplyChains={supplyChains}
          filteredSuppliers={filteredSuppliers}
          materials={materials}
          error={error}
        />
      )}
    </div>
  );
};

export default MaterialRequestsList;
