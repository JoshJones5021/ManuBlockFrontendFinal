const ProcessMaterialsModal = ({ 
  selectedItem, 
  materialsFormData, 
  onClose, 
  onMaterialQuantityChange, 
  onSubmit,
  error 
}) => {
  // Format date helper function
  const formatDate = dateString => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Process into Materials</h2>
          <button
            onClick={onClose}
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
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Product:</span>{' '}
              {selectedItem?.productName || 'Recycled Item'}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Original Owner:</span>{' '}
              {selectedItem?.customerName || 'Unknown Customer'}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Received Date:</span>{' '}
              {formatDate(selectedItem?.receivedDate)}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Recovered Materials <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Specify the quantity of each material recovered from this item:
            </p>
            {selectedItem?.maxRecoverableQuantity && (
              <p className="text-xs bg-yellow-50 border border-yellow-100 text-yellow-800 p-2 mb-2 rounded">
                Maximum recoverable material: <span className="font-bold">{selectedItem.maxRecoverableQuantity} kg</span> 
                (based on original materials used in production)
              </p>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto p-2 border rounded">
              {materialsFormData.map((material, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700">
                      {material.name}
                    </label>
                  </div>
                  <div className="w-1/2 flex">
                    <input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => onMaterialQuantityChange(index, e.target.value)}
                      min="0"
                      step="0.01"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    <span className="ml-2 flex items-center text-gray-700">
                      {material.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Process Materials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessMaterialsModal;