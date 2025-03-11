// src/services/supplyChain.js
// Service for handling supply chain operations

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
  
  // Delete a node
  deleteNode: (chainId, nodeId) => {
    return api.delete(`/supply-chains/${chainId}/nodes/${nodeId}`);
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
  
  // Delete an edge
  deleteEdge: (chainId, edgeId) => {
    return api.delete(`/supply-chains/${chainId}/edges/${edgeId}`);
  },

  // Get blockchain status for a supply chain
  getBlockchainStatus: (chainId) => {
    return api.get(`/supply-chains/${chainId}/blockchain-status`);
  }
};

export default supplyChainService;