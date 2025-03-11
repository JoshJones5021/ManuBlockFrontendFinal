// src/components/supplier/MaterialCreationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supplierService } from '../../services/api';

const MaterialCreationForm = ({ onSuccess, supplyChains, isStandalone = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit: 'kg', // Default unit
    specifications: '',
    supplierId: currentUser?.id,
    supplyChainId: ''
  });
  const [availableSupplyChains, setAvailableSupplyChains] = useState([]);
  const [blockchainEnabled, setBlockchainEnabled] = useState(true);
  const [walletConnected, setWalletConnected] = useState(Boolean(currentUser?.walletAddress));
  const [showWalletWarning, setShowWalletWarning] = useState(false);

  // Fetch supply chains if not provided as prop
  useEffect(() => {
    if (!supplyChains) {
      fetchSupplyChains();
    } else {
      setAvailableSupplyChains(supplyChains);
    }
    
    // Check wallet status
    if (!currentUser?.walletAddress) {
      setWalletConnected(false);
      setShowWalletWarning(true);
    } else {
      setWalletConnected(true);
      setShowWalletWarning(false);
    }
  }, [currentUser, supplyChains]);

  const fetchSupplyChains = async () => {
    try {
      const response = await fetch('/api/supply-chains/user/' + currentUser.id);
      if (response.ok) {
        const data = await response.json();
        setAvailableSupplyChains(data);
      }
    } catch (err) {
      console.error('Error fetching supply chains:', err);
      // Use mock data as fallback for demo purposes
      setAvailableSupplyChains([
        { id: 1, name: 'Automotive Supply Chain' },
        { id: 2, name: 'Electronics Supply Chain' }
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) : value
    }));
  };

  const handleToggleBlockchain = () => {
    if (!walletConnected && !blockchainEnabled) {
      setShowWalletWarning(true);
    } else {
      setBlockchainEnabled(!blockchainEnabled);
      setShowWalletWarning(false);
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.name.trim()) {
      setError('Material name is required');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than zero');
      return false;
    }
    
    if (!formData.supplyChainId) {
      setError('Please select a supply chain');
      return false;
    }
    
    // If blockchain is enabled, wallet must be connected
    if (blockchainEnabled && !walletConnected) {
      setError('Wallet must be connected to enable blockchain tracking');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const materialData = {
        ...formData,
        blockchainEnabled
      };
      
      const response = await supplierService.createMaterial(materialData);
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        quantity: 0,
        unit: 'kg',
        specifications: '',
        supplierId: currentUser?.id,
        supplyChainId: formData.supplyChainId // Keep the selected supply chain
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // If standalone form, navigate back to materials list after success
      if (isStandalone) {
        setTimeout(() => {
          navigate('/supplier/materials');
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating material:', err);
      setError(err.message || 'Failed to create material. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {isStandalone && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Create New Material</h1>
          <button
            onClick={() => navigate('/supplier/materials')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      )}
      
      {!isStandalone && (
        <h2 className="text-xl font-semibold mb-4">Create New Material</h2>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Material created successfully!
          {isStandalone && " Redirecting to materials list..."}
        </div>
      )}
      
      {showWalletWarning && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p className="font-medium">Wallet not connected!</p>
          <p className="text-sm mt-1">Connect your wallet in your profile to enable blockchain tracking for full supply chain traceability.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Material Name <span className="text-red-500">*</span>
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
              Supply Chain <span className="text-red-500">*</span>
            </label>
            <select
              name="supplyChainId"
              value={formData.supplyChainId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Supply Chain</option>
              {availableSupplyChains.map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description <span className="text-red-500">*</span>
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
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Unit <span className="text-red-500">*</span>
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
            <div className="relative inline-block w-full h-10">
              <div 
                className={`cursor-pointer rounded-full w-12 h-6 ${blockchainEnabled ? 'bg-blue-600' : 'bg-gray-300'} 
                          transition-colors duration-200 ease-in-out flex items-center`}
                onClick={handleToggleBlockchain}
              >
                <div 
                  className={`rounded-full w-5 h-5 bg-white shadow transform transition-transform duration-200 ease-in-out 
                            ${blockchainEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {blockchainEnabled ? 'Enabled' : 'Disabled'}
              </div>
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