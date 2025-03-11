// src/services/supplyChain.js - Modified with error handling
import api from '../utils/axios';

const supplyChainService = {
  // Get all supply chains
  getSupplyChains: () => {
    return api.get('/supply-chains');
  },
  
  // Get supply chains for a specific user
  getSupplyChainsByUser: (userId) => {
    return api.get(`/supply-chains/user/${userId}`);
  },
  
  // Create a new supply chain
  createSupplyChain: (chainData) => {
    return api.post('/supply-chains/create', chainData);
  },
  
  // Get a specific supply chain by ID
  getSupplyChainById: (chainId) => {
    return api.get(`/supply-chains/${chainId}`);
  },
  
  // Add node to supply chain
  addNode: (chainId, nodeData) => {
    return api.post(`/supply-chains/${chainId}/nodes`, nodeData);
  },
  
  // Get nodes for a supply chain
  getNodes: (chainId) => {
    return api.get(`/supply-chains/${chainId}/nodes`);
  },
  
  // Update a node
  updateNode: (chainId, nodeId, nodeData) => {
    return api.put(`/supply-chains/${chainId}/nodes/${nodeId}`, nodeData);
  },
  
  // Delete a node - now with better error handling
  deleteNode: async (chainId, nodeId) => {
    try {
      return await api.delete(`/supply-chains/${chainId}/nodes/${nodeId}`);
    } catch (error) {
      console.error('Error in deleteNode:', error);
      // Check for specific error conditions
      if (error.response) {
        // The server responded with a status other than 2xx
        if (error.response.status === 500) {
          // Improve the error message from 500 errors
          error.message = "Server error during node deletion. The node may have dependencies.";
        }
      }
      throw error; // Re-throw the error with improved message
    }
  },
  
  // Add edge between nodes
  addEdge: (chainId, edgeData) => {
    return api.post(`/supply-chains/${chainId}/edges`, edgeData);
  },
  
  // Get edges for a supply chain
  getEdges: (chainId) => {
    return api.get(`/supply-chains/${chainId}/edges`);
  },
  
  // Update an edge
  updateEdge: (chainId, edgeId, edgeData) => {
    return api.put(`/supply-chains/${chainId}/edges/${edgeId}`, edgeData);
  },
  
  // Delete an edge - with improved error handling
  deleteEdge: async (chainId, edgeId) => {
    try {
      return await api.delete(`/supply-chains/${chainId}/edges/${edgeId}`);
    } catch (error) {
      console.error('Error in deleteEdge:', error);
      // Add a more useful error message
      if (error.response && error.response.status === 500) {
        error.message = "Server error while deleting connection. Please try again.";
      }
      throw error;
    }
  },

  // Get blockchain status for a supply chain
  getBlockchainStatus: (chainId) => {
    return api.get(`/supply-chains/${chainId}/blockchain-status`);
  },
  
  // Finalize a supply chain
  finalizeSupplyChain: async (chainId) => {
    try {
      // If the endpoint doesn't exist yet, use a PUT to update the supply chain status
      return await api.post(`/supply-chains/${chainId}/finalize`);
    } catch (error) {
      // If the finalize endpoint isn't implemented, fall back to updating the chain
      if (error.response && error.response.status === 404) {
        console.warn('Finalize endpoint not found, falling back to chain update');
        return api.put(`/supply-chains/${chainId}`, { status: 'FINALIZED' });
      }
      throw error;
    }
  }
};

export default supplyChainService;