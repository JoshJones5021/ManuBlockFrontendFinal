import React, { useState, useEffect } from 'react';
import { supplierService, blockchainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaterialAllocation = () => {
  const { currentUser } = useAuth();
  const [allocatedMaterials, setAllocatedMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [blockchainDetails, setBlockchainDetails] = useState(null);
  const [blockchainLoading, setBlockchainLoading] = useState(false);

  useEffect(() => {
    fetchAllocatedMaterials();
  }, []);

  const fetchAllocatedMaterials = async () => {
    try {
      setLoading(true);

      const response = await supplierService.getRequestsByStatus(
        currentUser.id,
        'Allocated'
      );

      const allocated = [];

      response.data.forEach(request => {
        request.items.forEach(item => {
          if (item.status === 'Allocated' && item.blockchainItemId) {
            allocated.push({
              id: item.id,
              requestId: request.id,
              requestNumber: request.requestNumber,
              materialId: item.material.id,
              materialName: item.material.name,
              quantity: item.allocatedQuantity,
              unit: item.material.unit,
              manufacturer: request.manufacturer.username,
              manufacturerId: request.manufacturer.id,
              blockchainItemId: item.blockchainItemId,
              requestedDeliveryDate: request.requestedDeliveryDate,
              status: 'Allocated',
              allocatedDate: request.updatedAt,
            });
          }
        });
      });

      setAllocatedMaterials(allocated);
      setError(null);
    } catch (err) {
      console.error('Error fetching allocated materials:', err);
      setError('Failed to load allocated materials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBlockchain = async material => {
    setSelectedMaterial(material);
    setBlockchainLoading(true);
    setShowBlockchainModal(true);

    try {
      const response = await blockchainService.getBlockchainItemDetails(
        material.blockchainItemId
      );

      setBlockchainDetails(response.data);
    } catch (err) {
      console.error('Error fetching blockchain details:', err);
      setError('Failed to load blockchain details.');
    } finally {
      setBlockchainLoading(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && allocatedMaterials.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Allocated Materials</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Allocated Materials List */}
      {allocatedMaterials.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No allocated materials found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manufacturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated On
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
                {allocatedMaterials.map(material => (
                  <tr key={material.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {material.materialName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.requestNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.manufacturer}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.quantity} {material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(material.allocatedDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Tracked - ID:{' '}
                        {material.blockchainItemId.toString().substring(0, 8)}
                        ...
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewBlockchain(material)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Blockchain
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blockchain Detail Modal */}
      {showBlockchainModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">
              Blockchain Item Details
            </h2>

            {blockchainLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : blockchainDetails ? (
              <div>
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Item ID</p>
                      <p className="text-sm font-medium">
                        {blockchainDetails.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Item Type</p>
                      <p className="text-sm font-medium">
                        {blockchainDetails.itemType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Owner</p>
                      <p className="text-sm font-mono break-all">
                        {blockchainDetails.owner}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                      <p className="text-sm font-medium">
                        {blockchainDetails.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Supply Chain ID
                      </p>
                      <p className="text-sm font-medium">
                        {blockchainDetails.supplyChainId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <p className="text-sm font-medium">
                        {blockchainDetails.status === 0
                          ? 'Created'
                          : blockchainDetails.status === 1
                            ? 'In Transit'
                            : blockchainDetails.status === 2
                              ? 'Processing'
                              : blockchainDetails.status === 3
                                ? 'Completed'
                                : blockchainDetails.status === 4
                                  ? 'Rejected'
                                  : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Active</p>
                      <p className="text-sm font-medium">
                        {blockchainDetails.isActive ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Traceability</p>
                  <p className="text-sm text-gray-600">
                    This material item has been allocated to{' '}
                    {selectedMaterial.manufacturer} and is available for pickup
                    and delivery. Once delivered, the manufacturer will be able
                    to use this material in production batches.
                  </p>
                </div>

                <div className="flex justify-center mb-4">
                  <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-1 w-full bg-gray-200"></div>
                    </div>
                    <div className="relative flex justify-between">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full h-8 w-8 bg-green-500 text-white flex items-center justify-center">
                          ✓
                        </div>
                        <div className="text-xs mt-1">Created</div>
                      </div>
                      <div className="flex flex-col items-center mx-12">
                        <div className="rounded-full h-8 w-8 bg-green-500 text-white flex items-center justify-center">
                          ✓
                        </div>
                        <div className="text-xs mt-1">Allocated</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="rounded-full h-8 w-8 bg-gray-200 text-gray-500 flex items-center justify-center">
                          -
                        </div>
                        <div className="text-xs mt-1">In Transit</div>
                      </div>
                      <div className="flex flex-col items-center mx-12">
                        <div className="rounded-full h-8 w-8 bg-gray-200 text-gray-500 flex items-center justify-center">
                          -
                        </div>
                        <div className="text-xs mt-1">Delivered</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="rounded-full h-8 w-8 bg-gray-200 text-gray-500 flex items-center justify-center">
                          -
                        </div>
                        <div className="text-xs mt-1">Used</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-red-600">
                Failed to load blockchain details. Please try again.
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowBlockchainModal(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialAllocation;
