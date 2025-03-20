import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplyChainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SupplyChainsList = () => {
  const { currentUser } = useAuth();
  const [supplyChains, setSupplyChains] = useState([]);
  const [filteredChains, setFilteredChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chainToDelete, setChainToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newChainData, setNewChainData] = useState({
    name: '',
    description: '',
    createdBy: currentUser?.id,
  });
  const [hiddenChains, setHiddenChains] = useState(() => {
    const saved = localStorage.getItem('hiddenSupplyChains');
    return saved ? JSON.parse(saved) : [];
  });
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchSupplyChains();
  }, [currentUser]);

  useEffect(() => {
    if (supplyChains.length > 0) {
      let result = supplyChains;

      if (filterStatus === 'finalized') {
        result = result.filter(chain => chain.blockchainStatus === 'FINALIZED');
      } else if (filterStatus === 'not-finalized') {
        result = result.filter(chain => chain.blockchainStatus !== 'FINALIZED');
      }

      result = result.filter(chain => !hiddenChains.includes(chain.id));

      setFilteredChains(result);
    }
  }, [supplyChains, filterStatus, hiddenChains]);


  useEffect(() => {
    localStorage.setItem('hiddenSupplyChains', JSON.stringify(hiddenChains));
  }, [hiddenChains]);

  const fetchSupplyChains = async () => {
    setLoading(true);
    try {
      let response;
      if (currentUser.role === 'ADMIN') {
        response = await supplyChainService.getSupplyChains();
      } else {
        response = await supplyChainService.getSupplyChainsByUser(
          currentUser.id
        );
      }
      setSupplyChains(response.data);
    } catch (err) {
      console.error('Error fetching supply chains:', err);
      setError('Failed to load supply chains. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewChainData({
      ...newChainData,
      [name]: value,
    });
  };

  const handleCreateSupplyChain = async e => {
    e.preventDefault();
    try {
      const payload = {
        ...newChainData,
        createdBy: currentUser.id,
      };

      await supplyChainService.createSupplyChain(payload);

      setNewChainData({
        name: '',
        description: '',
        createdBy: currentUser?.id,
      });
      setShowCreateModal(false);

      fetchSupplyChains();
    } catch (err) {
      console.error('Error creating supply chain:', err);
      setError('Failed to create supply chain. Please try again.');
    }
  };

  const openDeleteModal = chain => {
    setChainToDelete(chain);
    setShowDeleteModal(true);
  };

  const handleDeleteSupplyChain = async () => {
    if (!chainToDelete) return;

    setIsDeleting(true);
    try {
      await supplyChainService.deleteSupplyChain(chainToDelete.id);

      setShowDeleteModal(false);
      setChainToDelete(null);
      fetchSupplyChains();
    } catch (err) {
      console.error('Error deleting supply chain:', err);
      const errorMessage =
        err.response?.data?.error ||
        'Failed to delete supply chain. Please try again.';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHideChain = chainId => {
    setHiddenChains(prev => [...prev, chainId]);
  };

  const handleShowAllHidden = () => {
    setHiddenChains([]);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'FINALIZED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const canDeleteChain = chain => {
    return (
      currentUser.role === 'ADMIN' &&
      (chain.blockchainStatus === 'PENDING' ||
        chain.blockchainStatus === 'FAILED')
    );
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
        <div className="flex space-x-4">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              <span className="mr-2">🔍</span>
              Filter
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setShowFilterMenu(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === 'all' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                  >
                    All Supply Chains
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('finalized');
                      setShowFilterMenu(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === 'finalized' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                  >
                    Finalized Only
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('not-finalized');
                      setShowFilterMenu(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === 'not-finalized' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                  >
                    Not Finalized
                  </button>
                  {hiddenChains.length > 0 && (
                    <button
                      onClick={() => {
                        handleShowAllHidden();
                        setShowFilterMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                    >
                      Show Hidden ({hiddenChains.length})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create New Supply Chain
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
          <div>{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {filteredChains.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 mb-4">
            {supplyChains.length === 0
              ? 'No supply chains found.'
              : 'No supply chains match your current filters.'}
          </p>
          {hiddenChains.length > 0 && (
            <button
              onClick={handleShowAllHidden}
              className="px-4 py-2 mb-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Show Hidden Supply Chains ({hiddenChains.length})
            </button>
          )}
          {currentUser.role === 'ADMIN' && supplyChains.length === 0 && (
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
          {filteredChains.map(chain => (
            <div
              key={chain.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{chain.name}</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleHideChain(chain.id)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Hide supply chain"
                    >
                      <span aria-hidden="true">👁️‍🗨️</span>
                      <span className="sr-only">Hide</span>
                    </button>
                    {canDeleteChain(chain) && (
                      <button
                        onClick={() => openDeleteModal(chain)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete supply chain"
                      >
                        <span aria-hidden="true">🗑️</span>
                        <span className="sr-only">Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {chain.description}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">
                    Created by: {chain.createdBy?.username || 'Unknown'}
                  </div>
                  <div className="text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chain.blockchainStatus)}`}
                    >
                      {chain.blockchainStatus || 'PENDING'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  <span className="text-sm text-gray-500">
                    Nodes: {chain.nodes?.length || 0} | Edges:{' '}
                    {chain.edges?.length || 0}
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
            <h3 className="text-lg font-semibold mb-4">
              Create New Supply Chain
            </h3>

            <form onSubmit={handleCreateSupplyChain}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
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
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="description"
                >
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && chainToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Supply Chain</h3>
            <p className="text-red-600 mb-4">
              Warning: This action cannot be undone.
            </p>

            <div className="mb-6">
              <p className="mb-4">
                Are you sure you want to delete the supply chain "
                {chainToDelete.name}"?
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm">
                <p className="font-semibold mb-2">Note:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Only supply chains with "PENDING" or "FAILED" blockchain
                    status can be deleted
                  </li>
                  <li>
                    Finalized or confirmed supply chains cannot be deleted
                  </li>
                  <li>
                    This will delete all nodes and edges in the supply chain
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setChainToDelete(null);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSupplyChain}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Supply Chain'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChainsList;
