import React, { useState, useEffect } from 'react';

const CreateProductModal = ({
  initialFormData,
  onSubmit,
  onCancel,
  supplyChains,
  filteredMaterials,
  onSupplyChainChange,
}) => {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'supplyChainId' && value) {
      onSupplyChainChange(value);
    }
  };

  const handleMaterialChange = (material, checked) => {
    let newSelectedMaterials;

    if (checked) {
      newSelectedMaterials = [
        ...formData.requiredMaterials,
        {
          id: material.id,
          name: material.name,
          quantity: 1,
          unit: material.unit,
        },
      ];
    } else {
      newSelectedMaterials = formData.requiredMaterials.filter(
        m => m.id !== material.id
      );
    }

    setFormData({
      ...formData,
      requiredMaterials: newSelectedMaterials,
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
      requiredMaterials: newSelectedMaterials,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(e, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Create New Product</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Supply Chain */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="supplyChainId"
            >
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
              {supplyChains.map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name} ({chain.blockchainStatus})
                </option>
              ))}
            </select>
            {supplyChains.length === 0 && (
              <p className="text-red-500 text-xs italic mt-1">
                No finalized supply chains available. Please contact an
                administrator.
              </p>
            )}
          </div>

          {/* Product Name */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="name"
            >
              Product Name <span className="text-red-500">*</span>
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

          {/* Description */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="description"
            >
              Description <span className="text-red-500">*</span>
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

          {/* Specifications */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="specifications"
            >
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

          {/* SKU and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="sku"
              >
                SKU <span className="text-red-500">*</span>
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
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="price"
              >
                Price <span className="text-red-500">*</span>
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

          {/* Required Materials */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Required Materials
            </label>
            {filteredMaterials.length > 0 ? (
              <div className="max-h-60 overflow-y-auto p-2 border rounded">
                {filteredMaterials.map(material => {
                  const selectedMaterial = formData.requiredMaterials.find(
                    m => m.id === material.id
                  );
                  return (
                    <div
                      key={material.id}
                      className="flex items-center mb-2 space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`material-${material.id}`}
                        checked={!!selectedMaterial}
                        onChange={e =>
                          handleMaterialChange(material, e.target.checked)
                        }
                        className="mr-2"
                      />
                      <label
                        htmlFor={`material-${material.id}`}
                        className="text-sm flex-grow"
                      >
                        {material.name} ({material.unit}) -{' '}
                        {material.supplier.username}
                      </label>
                      {selectedMaterial && (
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={selectedMaterial.quantity}
                            onChange={e =>
                              handleMaterialQuantityChange(
                                material.id,
                                e.target.value
                              )
                            }
                            min="0"
                            step="0.01"
                            className="w-20 px-2 py-1 border rounded text-sm text-right"
                          />
                          <span className="ml-1 text-xs text-gray-500">
                            {material.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {supplyChains.length > 0
                  ? 'No materials available in this supply chain. Suppliers need to add materials first.'
                  : 'No supply chains available. Please join a supply chain first.'}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={!formData.supplyChainId}
            >
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
