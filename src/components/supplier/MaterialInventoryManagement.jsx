// src/components/supplier/MaterialInventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { supplierService, blockchainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MaterialCreationForm from './MaterialCreationForm';

const MaterialInventoryManagement = () => {
  const { currentUser } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [supplyChains, setSupplyChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [stockUpdateAmount, setStockUpdateAmount] = useState(0);
  const [blockchainStatus, setBlockchainStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch data on component mount
  useEffect(() => {
    fetchMaterials();
    fetchSupplyChains();
  }, [currentUser.id]);

  // Filter materials when search term or filter changes
  useEffect(() => {
    if (materials.length > 0) {
      const filtered = materials.filter(material => {
        const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             material.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || 
                             (filterStatus === 'active' && material.active) ||
                             (filterStatus === 'inactive' && !material.active) ||
                             (filterStatus === 'tracked' && material.blockchainItemId) ||
                             (filterStatus === 'untracked' && !material.blockchainItemId);
        
        return matchesSearch && matchesFilter;
      });
      
      setFilteredMaterials(filtered);
    }
  }, [materials, searchTerm, filterStatus]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getMaterials(currentUser.id);
      const materialsData = response.data;
      setMaterials(materialsData);
      setFilteredMaterials(materialsData);
      
      // Fetch blockchain status for materials that have a blockchain ID
      const blockchainMaterials = materialsData.filter(m => m.blockchainItemId);
      fetchBlockchainStatuses(blockchainMaterials);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load materials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockchainStatuses = async (blockchainMaterials) => {
    const statuses = {};
    
    try {
      // For each material with a blockchain ID, fetch its status
      for (const material of blockchainMaterials) {
        if (material.blockchainItemId) {
          try {
            const response = await blockchainService.getBlockchainItemDetails(material.blockchainItemId);
            statuses[material.blockchainItemId] = {
              status: response.data.status,
              isActive: response.data.isActive
            };
          } catch (error) {
            console.error(`Failed to fetch blockchain status for item ${material.blockchainItemId}:`, error);
            statuses[material.blockchainItemId] = {
              status: 'error',
              isActive: false,
              error: error.message
            };
          }
        }
      }
      
      setBlockchainStatus(statuses);
    } catch (err) {
      console.error('Error fetching blockchain statuses:', err);
    }
  };

  const fetchSupplyChains = async () => {
    try {
      // This would be replaced with an actual API call to get assigned supply chains
      const response = await fetch('/api/supply-chains/user/' + currentUser.id);
      if (response.ok) {
        const data = await response.json();
        setSupplyChains(data);
      }
    } catch (err) {
      console.error('Error fetching supply chains:', err);
      // Use mock data as fallback for demo purposes
      setSupplyChains([
        { id: 1, name: 'Automotive Supply Chain' },
        { id: 2, name: 'Electronics Supply Chain' }
      ]);
    }
  };

  const handleMaterialCreated = (newMaterial) => {
    setMaterials([...materials, newMaterial]);
    setShowCreateForm(false);
  };

  const handleUpdateStock = (material) => {
    setSelectedMaterial(material);
    setStockUpdateAmount(0);
    setShowUpdateStockModal(true);
  };

  const handleStockUpdateSubmit = async () => {
    if (!selectedMaterial || stockUpdateAmount === 0) return;
    
    try {
      setLoading(true);
      
      // Mock implementation - in a real app, you'd have a specific API endpoint
      // Update the material's quantity based on the stockUpdateAmount
      const updatedMaterial = {
        ...selectedMaterial,
        quantity: selectedMaterial.quantity + parseInt(stockUpdateAmount)
      };
      
      const response = await supplierService.updateMaterial(
        selectedMaterial.id,
        updatedMaterial
      );
      
      // Update the material in the list
      setMaterials(materials.map(material => 
        material.id === selectedMaterial.id ? response.data : material
      ));
      
      setShowUpdateStockModal(false);
      setSelectedMaterial(null);
      setStockUpdateAmount(0);
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (materialId) => {
    if (!window.confirm('Are you sure you want to deactivate this material?')) {
      return;
    }
    
    try {
      setLoading(true);
      await supplierService.deactivateMaterial(materialId);
      
      // Update the materials list
      setMaterials(materials.map(material => 
        material.id === materialId ? { ...material, active: false } : material
      ));
    } catch (err) {
      console.error('Error deactivating material:', err);
      setError('Failed to deactivate material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBlockchainStatusBadge = (material) => {
    if (!material.blockchainItemId) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          Not Tracked
        </span>
      );
    }

    const status = blockchainStatus[material.blockchainItemId];
    
    if (!status) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Loading...
        </span>
      );
    }
    
    if (status.status === 'error') {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          Error
        </span>
      );
    }
    
    if (!status.isActive) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
    
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        Active on Blockchain
      </span>
    );
  };

  if (loading && materials.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-semibold">Material Inventory Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full md:w-auto"
        >
          {showCreateForm ? 'Cancel' : 'Add New Material'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Search Materials
            </label>
            <input
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Filter by Status
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Materials</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="tracked">Blockchain Tracked</option>
              <option value="untracked">Not Tracked</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="bg-blue-50 rounded-lg p-2 text-sm text-blue-600 w-full">
              <div className="font-medium">Current Inventory:</div>
              <div>{filteredMaterials.length} of {materials.length} materials</div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Creation Form */}
      {showCreateForm && (
        <div className="mb-6">
          <MaterialCreationForm 
            onSuccess={handleMaterialCreated}
            supplyChains={supplyChains}
          />
        </div>
      )}

      {/* Materials Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredMaterials.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">No materials found matching your criteria.</p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Your First Material
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockchain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className={!material.active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{material.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{material.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.quantity} {material.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {material.blockchainItemId ? 'Trackable' : 'Not Trackable'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {material.active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getBlockchainStatusBadge(material)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleUpdateStock(material)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={!material.active}
                        >
                          Update Stock
                        </button>
                        {material.active && (
                          <button
                            onClick={() => handleDeactivate(material.id)}
                            className="text-red-600 hover:text-red-900 ml-2"
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
        )}
      </div>

      {/* Update Stock Modal */}
      {showUpdateStockModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Update Stock Level</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Material
              </label>
              <div className="py-2 px-3 bg-gray-100 rounded border border-gray-200">
                {selectedMaterial.name}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Current Stock
              </label>
              <div className="py-2 px-3 bg-gray-100 rounded border border-gray-200">
                {selectedMaterial.quantity} {selectedMaterial.unit}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Stock Change (+ for increase, - for decrease)
              </label>
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={stockUpdateAmount}
                onChange={(e) => setStockUpdateAmount(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                New stock level: {selectedMaterial.quantity + parseInt(stockUpdateAmount || 0)} {selectedMaterial.unit}
              </p>
              {selectedMaterial.quantity + parseInt(stockUpdateAmount || 0) < 0 && (
                <p className="text-sm text-red-500 mt-1">
                  Stock level cannot go below zero
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowUpdateStockModal(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleStockUpdateSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={loading || selectedMaterial.quantity + parseInt(stockUpdateAmount || 0) < 0}
              >
                {loading ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialInventoryManagement;