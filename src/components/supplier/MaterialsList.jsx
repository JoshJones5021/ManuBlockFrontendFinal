import React, { useState, useEffect } from 'react';
import {
  supplierService,
  supplyChainService,
  adminService,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MaterialCreationForm from './MaterialCreationForm';

const MaterialsList = () => {
  const { currentUser } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [supplyChains, setSupplyChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    specifications: '',
    unit: '',
  });
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    fetchMaterials();
    fetchSupplyChains();
    fetchAdminUser();
  }, [currentUser.id]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getMaterials(currentUser.id);
      setMaterials(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load materials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplyChains = async () => {
    try {
      const chains = await supplyChainService.getSupplyChainsByUser(
        currentUser.id
      );

      setSupplyChains(Array.isArray(chains) ? chains : []);

      console.log('Supply chains fetched:', chains);
    } catch (err) {
      console.error('Error fetching supply chains:', err);
      setSupplyChains([]);
    }
  };

  const fetchAdminUser = async () => {
    try {
      if (currentUser.role !== 'ADMIN') {
        const response = await adminService.getAllUsers();
        const admins = response.data.filter(
          user => user.role === 'ADMIN' && user.walletAddress
        );
        if (admins.length > 0) {
          setAdminUser(admins[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching admin user:', err);
    }
  };

  const handleMaterialCreated = newMaterial => {
    setMaterials([...materials, newMaterial]);
    setShowCreateForm(false);
  };

  const handleEditClick = material => {
    setSelectedMaterial(material);
    setEditFormData({
      name: material.name,
      description: material.description,
      specifications: material.specifications,
      unit: material.unit,
    });
    setShowEditModal(true);
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateMaterial = async e => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await supplierService.updateMaterial(
        selectedMaterial.id,
        editFormData
      );

      setMaterials(
        materials.map(material =>
          material.id === selectedMaterial.id ? response.data : material
        )
      );

      setShowEditModal(false);
      setSelectedMaterial(null);
    } catch (err) {
      console.error('Error updating material:', err);
      setError('Failed to update material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async materialId => {
    if (!window.confirm('Are you sure you want to deactivate this material?')) {
      return;
    }

    try {
      setLoading(true);
      await supplierService.deactivateMaterial(materialId);

      setMaterials(
        materials.map(material =>
          material.id === materialId ? { ...material, active: false } : material
        )
      );
    } catch (err) {
      console.error('Error deactivating material:', err);
      setError('Failed to deactivate material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isBlockchainEnabled =
    currentUser.role === 'ADMIN' ||
    (adminUser && adminUser.walletAddress) ||
    currentUser.walletAddress;

  if (loading && materials.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Materials Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Add New Material'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Blockchain Status Info */}
      <div
        className={`mb-6 p-4 rounded ${isBlockchainEnabled ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}`}
      >
        <div className="flex items-start">
          <div
            className={`mr-3 flex-shrink-0 h-5 w-5 rounded-full ${isBlockchainEnabled ? 'bg-blue-400' : 'bg-yellow-400'}`}
          ></div>
          <div>
            <h3
              className={`text-sm font-medium ${isBlockchainEnabled ? 'text-blue-800' : 'text-yellow-800'}`}
            >
              Blockchain Tracking Status
            </h3>
            <p className="mt-1 text-sm">
              {isBlockchainEnabled ? (
                <>
                  Materials will be tracked on the blockchain using admin
                  wallet.
                </>
              ) : (
                <>
                  Blockchain tracking is currently unavailable. Please contact
                  an admin to connect their wallet.
                </>
              )}
            </p>
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

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 mb-4">
            You haven't added any materials yet.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Your First Material
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockchain Status
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
                {materials.map(material => (
                  <tr
                    key={material.id}
                    className={!material.active ? 'bg-gray-50' : ''}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {material.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {material.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.quantity} {material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {material.blockchainItemId ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Tracked (Admin Wallet)
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {isBlockchainEnabled ? 'Pending' : 'Unavailable'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {material.active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {material.active && (
                        <button
                          onClick={() => handleDeactivate(material.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {showEditModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Material</h2>

            <form onSubmit={handleUpdateMaterial}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Material Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Unit
                </label>
                <select
                  name="unit"
                  value={editFormData.unit}
                  onChange={handleEditChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="l">Liter (l)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="m">Meter (m)</option>
                  <option value="m2">Square Meter (m²)</option>
                  <option value="m3">Cubic Meter (m³)</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Specifications
                </label>
                <textarea
                  name="specifications"
                  value={editFormData.specifications}
                  onChange={handleEditChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsList;
