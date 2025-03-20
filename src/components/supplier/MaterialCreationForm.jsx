import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supplierService } from '../../services/api';

const MaterialCreationForm = ({ onSuccess, supplyChains = [] }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit: 'kg',
    specifications: '',
    supplierId: currentUser?.id,
    supplyChainId: '',
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.supplyChainId) {
      setError('Please select a supply chain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await supplierService.createMaterial(formData);

      setFormData({
        name: '',
        description: '',
        quantity: 0,
        unit: 'kg',
        specifications: '',
        supplierId: currentUser?.id,
        supplyChainId: formData.supplyChainId,
      });

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Error creating material:', err);
      setError(err.message || 'Failed to create material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Material</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Material Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Supply Chain
            </label>
            <select
              name="supplyChainId"
              value={formData.supplyChainId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Supply Chain</option>
              {Array.isArray(supplyChains) &&
                supplyChains.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            required
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Unit
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
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

          <div className="md:col-span-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Blockchain Tracking
            </label>
            <div className="py-2 px-3 bg-blue-50 border border-blue-200 rounded text-blue-700">
              Enabled (Using Admin Wallet)
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Specifications
          </label>
          <textarea
            name="specifications"
            value={formData.specifications}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            placeholder="Enter technical specifications, quality standards, etc."
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating...' : 'Create Material'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialCreationForm;
