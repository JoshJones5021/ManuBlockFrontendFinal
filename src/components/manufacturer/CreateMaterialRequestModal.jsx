import React from 'react';

const CreateMaterialRequestModal = ({
  onSubmit,
  onCancel,
  formData,
  onChange,
  tempMaterial,
  onTempMaterialChange,
  addMaterialToRequest,
  removeMaterialFromRequest,
  supplyChains,
  filteredSuppliers,
  materials,
  error,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Create Material Request</h2>
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
            onChange={onChange}
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

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="supplierId"
            >
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              id="supplierId"
              name="supplierId"
              value={formData.supplierId}
              onChange={onChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={filteredSuppliers.length === 0}
            >
              <option value="">Select a supplier</option>
              {filteredSuppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.username}
                </option>
              ))}
            </select>
            {filteredSuppliers.length === 0 && (
              <p className="text-red-500 text-xs italic mt-1">
                No suppliers available in the selected supply chain.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="requestedDeliveryDate"
            >
              Requested Delivery Date (Optional)
            </label>
            <input
              type="date"
              id="requestedDeliveryDate"
              name="requestedDeliveryDate"
              value={formData.requestedDeliveryDate}
              onChange={onChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min={new Date().toISOString().split('T')[0]} // Set min to today
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="notes"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={onChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Add any special requirements or notes for the supplier"
            ></textarea>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 text-sm font-bold">
                Materials <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="mb-4 p-4 border rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="col-span-2">
                  <label
                    className="block text-gray-700 text-xs mb-1"
                    htmlFor="materialId"
                  >
                    Material
                  </label>
                  <select
                    id="materialId"
                    name="materialId"
                    value={tempMaterial.materialId}
                    onChange={onTempMaterialChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    disabled={!formData.supplierId || materials.length === 0}
                  >
                    <option value="">Select a material</option>
                    {materials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-gray-700 text-xs mb-1"
                    htmlFor="quantity"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={tempMaterial.quantity}
                    onChange={onTempMaterialChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="1"
                    disabled={!tempMaterial.materialId}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addMaterialToRequest}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                disabled={!tempMaterial.materialId || !tempMaterial.quantity}
              >
                Add Material
              </button>
            </div>

            {formData.items.length > 0 ? (
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Materials in this request:</h4>
                <ul className="divide-y">
                  {formData.items.map((item, index) => {
                    const materialInfo = materials.find(
                      m => m.id === parseInt(item.materialId)
                    );

                    return (
                      <li
                        key={index}
                        className="py-2 flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">
                            {materialInfo?.name || 'Unknown Material'}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            Qty: {item.quantity} {materialInfo?.unit || 'units'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMaterialFromRequest(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No materials added yet.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

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
              disabled={
                !formData.supplyChainId ||
                !formData.supplierId ||
                formData.items.length === 0
              }
            >
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMaterialRequestModal;
