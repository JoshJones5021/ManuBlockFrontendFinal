import api from '../utils/axios';

const supplyChainService = {
  getSupplyChains: () => {
    return api.get('/supply-chains');
  },
  getSupplyChainsByUser: userId => {
    return api.get(`/supply-chains/user/${userId}`);
  },
  createSupplyChain: chainData => {
    return api.post('/supply-chains/create', chainData);
  },
  getSupplyChainById: chainId => {
    return api.get(`/supply-chains/${chainId}`);
  },
  addNode: (chainId, nodeData) => {
    return api.post(`/supply-chains/${chainId}/nodes`, nodeData);
  },
  getNodes: chainId => {
    return api.get(`/supply-chains/${chainId}/nodes`);
  },
  updateNode: (chainId, nodeId, nodeData) => {
    return api.put(`/supply-chains/${chainId}/nodes/${nodeId}`, nodeData);
  },
  deleteNode: async (chainId, nodeId) => {
    try {
      return await api.delete(`/supply-chains/${chainId}/nodes/${nodeId}`);
    } catch (error) {
      console.error('Error in deleteNode:', error);
      if (error.response) {

        if (error.response.status === 500) {
          error.message =
            'Server error during node deletion. The node may have dependencies.';
        }
      }
      throw error;
    }
  },
  addEdge: (chainId, edgeData) => {
    return api.post(`/supply-chains/${chainId}/edges`, edgeData);
  },
  getEdges: chainId => {
    return api.get(`/supply-chains/${chainId}/edges`);
  },
  deleteEdge: async (chainId, edgeId) => {
    try {
      return await api.delete(`/supply-chains/${chainId}/edges/${edgeId}`);
    } catch (error) {
      console.error('Error in deleteEdge:', error);
      if (error.response && error.response.status === 500) {
        error.message =
          'Server error while deleting connection. Please try again.';
      }
      throw error;
    }
  },
  getBlockchainStatus: chainId => {
    return api.get(`/supply-chains/${chainId}/blockchain-status`);
  },
  finalizeSupplyChain: async chainId => {
    try {
      return await api.post(`/supply-chains/${chainId}/finalize`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(
          'Finalize endpoint not found, falling back to chain update'
        );
        return api.put(`/supply-chains/${chainId}`, { status: 'FINALIZED' });
      }
      throw error;
    }
  },
};

export default supplyChainService;
