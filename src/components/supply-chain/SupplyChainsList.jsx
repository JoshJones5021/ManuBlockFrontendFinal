import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplyChainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SupplyChainsList = () => {
  const { currentUser } = useAuth();
  const [supplyChains, setSupplyChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChainData, setNewChainData] = useState({
    name: '',
    description: '',
    createdBy: currentUser?.id
  });

  useEffect(() => {
    fetchSupplyChains();
  }, [currentUser]);

  const fetchSupplyChains = async () => {
    setLoading(true);
    try {
      let response;
      if (currentUser.role === 'ADMIN') {
        // Admins can see all supply chains
        response = await supplyChainService.getSupplyChains();
      } else {
        // Other users only see chains they're part of
        response = await supplyChainService.getSupplyChainsByUser(currentUser.id);
      }
      setSupplyChains(response.data);
    } catch (err) {
      console.error('Error fetching supply chains:', err);
      setError('Failed to load supply chains. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewChainData({
      ...newChainData,
      [name]: value
    });
  };

  const handleCreateSupplyChain = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newChainData,
        createdBy: currentUser.id
      };
      
      await supplyChainService.createSupplyChain(payload);
      
      // Reset form and close modal
      setNewChainData({
        name: '',
        description: '',
        createdBy: currentUser?.id
      });
      setShowCreateModal(false);
      
      // Refresh the list
      fetchSupplyChains();
    } catch (err) {
      console.error('Error creating supply chain:', err);
      setError('Failed to create supply chain. Please try again.');
    }
  };

  // Function to get appropriate blockchain status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Supply Chains</h1>
        {(currentUser.role === 'ADMIN') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Supply Chain
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {supplyChains.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 mb-4">No supply chains found.</p>
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Supply Chain
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplyChains.map((chain) => (
            <div key={chain.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{chain.name}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{chain.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">
                    Created by: {chain.createdBy?.username || 'Unknown'}
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chain.blockchainStatus)}`}>
                      {chain.blockchainStatus || 'PENDING'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between">
                  <span className="text-sm text-gray-500">
                    Nodes: {chain.nodes?.length || 0} | Edges: {chain.edges?.length || 0}
                  </span>
                  <Link
                    to={`/supply-chains/${chain.id}`}
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Supply Chain Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New Supply Chain</h3>
            
            <form onSubmit={handleCreateSupplyChain}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newChainData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newChainData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="4"
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Supply Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChainsList;