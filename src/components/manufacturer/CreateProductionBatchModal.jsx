import React from 'react';

const CreateProductionBatchModal = ({
  onSubmit,
  onCancel,
  formData,
  onChange,
  handleMaterialChange,
  supplyChains,
  filteredProducts,
  materialInventory,
  materials,
  currentUser,
  error,
}) => {
  const calculateTotalMaterialNeeded = (materialQuantity, productQuantity) => {
    const qty = parseInt(productQuantity) || 0;
    return materialQuantity * qty;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Create Production Batch</h2>
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

        <form onSubmit={onSubmit}>
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

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="productId"
            >
              Product <span className="text-red-500">*</span>
            </label>
            <select
              id="productId"
              name="productId"
              value={formData.productId}
              onChange={onChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={filteredProducts.length === 0}
            >
              <option value="">Select a product</option>
              {filteredProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku})
                </option>
              ))}
            </select>
            {filteredProducts.length === 0 && (
              <p className="text-red-500 text-xs italic mt-1">
                No products available. Please create products first.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="quantity"
            >
              Quantity to Produce <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={onChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min="1"
              required
              disabled={!formData.productId}
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 text-sm font-bold">
                Required Materials <span className="text-red-500">*</span>
              </label>
            </div>

            {formData.materials && formData.materials.length > 0 ? (
              <div className="space-y-4 border rounded p-4">
                {formData.materials.map((material, index) => {
                  const materialInfo = materials.find(
                    m => m.materialId === parseInt(material.materialId)
                  );
                  const materialQuantity = materialInfo?.quantity || 0;
                  const totalRequired = calculateTotalMaterialNeeded(
                    materialQuantity,
                    formData.quantity
                  );

                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium mb-2">
                        {materialInfo?.materialName || 'Material'}
                        <span className="ml-2 text-sm text-gray-600">
                          (Required: {materialQuantity}{' '}
                          {materialInfo?.unit || 'units'} per product)
                        </span>
                      </div>

                      <div className="text-sm text-blue-600 mb-3">
                        Total needed: {totalRequired}{' '}
                        {materialInfo?.unit || 'units'} for{' '}
                        {formData.quantity || 0} product(s)
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-2">
                        <div>
                          <label className="block text-gray-700 text-xs mb-1">
                            Select Material Batch{' '}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={material.blockchainItemId || ''}
                            onChange={e => {
                              const newBlockchainItemId = e.target.value;
                              handleMaterialChange(
                                index,
                                'blockchainItemId',
                                newBlockchainItemId
                              );

                              handleMaterialChange(
                                index,
                                'quantity',
                                totalRequired.toString()
                              );
                            }}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                          >
                            <option value="">Select a material batch</option>
                            {materialInventory
                              .filter(invMaterial => {
                                const baseMaterialName =
                                  materialInfo?.materialName || '';
                                const invBaseName = invMaterial.name.replace(
                                  ' (Recycled)',
                                  ''
                                );

                                return (
                                  invMaterial.id === material.materialId ||
                                  invBaseName === baseMaterialName
                                );
                              })
                              .map(invMaterial => (
                                <option
                                  key={invMaterial.blockchainItemId}
                                  value={invMaterial.blockchainItemId}
                                  disabled={
                                    invMaterial.quantity < totalRequired
                                  }
                                >
                                  {invMaterial.name} - Batch ID:{' '}
                                  {invMaterial.blockchainItemId} - Available:{' '}
                                  {invMaterial.quantity} {invMaterial.unit}
                                  {invMaterial.quantity < totalRequired
                                    ? ' (Insufficient quantity)'
                                    : ''}
                                </option>
                              ))}
                            {!materialInventory.some(
                              m =>
                                m.id === material.materialId &&
                                (m.itemType === 'allocated-material' ||
                                  m.itemType === 'recycled-material')
                            ) && (
                              <option disabled>
                                No material batches available
                              </option>
                            )}
                          </select>
                          {/* Show a warning if no material batches have enough quantity */}
                          {materialInventory.some(
                            m => m.id === material.materialId
                          ) &&
                            !materialInventory.some(
                              m =>
                                m.id === material.materialId &&
                                (m.itemType === 'allocated-material' ||
                                  m.itemType === 'recycled-material') &&
                                m.quantity >= totalRequired
                            ) && (
                              <p className="text-red-500 text-xs italic mt-1">
                                Warning: None of your material batches have
                                sufficient quantity. Request more materials from
                                suppliers.
                              </p>
                            )}
                        </div>

                        {/* Hidden input for quantity - we'll set this automatically */}
                        <input
                          type="hidden"
                          value={totalRequired}
                          name={`materials[${index}].quantity`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No materials required for this product.
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
                !formData.productId ||
                !formData.quantity ||
                formData.quantity <= 0 ||
                formData.materials.length === 0 ||
                formData.materials.some(m => !m.blockchainItemId) ||
                formData.materials.some(m => {
                  const materialInfo = materials.find(
                    info => info.materialId === parseInt(m.materialId)
                  );
                  const totalRequired = calculateTotalMaterialNeeded(
                    materialInfo?.quantity || 0,
                    formData.quantity
                  );
                  const selectedBatch = materialInventory.find(
                    inv =>
                      inv.blockchainItemId === m.blockchainItemId &&
                      inv.ownerId === currentUser.id
                  );
                  return (
                    selectedBatch && selectedBatch.quantity < totalRequired
                  );
                })
              }
            >
              Create Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductionBatchModal;
