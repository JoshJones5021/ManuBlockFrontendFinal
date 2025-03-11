// src/services/nodeDependencyChecker.js
// Service to check node dependencies before deletion

import api from '../utils/axios';

/**
 * This service extends the supply chain service with functionality
 * to check if a node has dependencies before deletion
 */
const nodeDependencyChecker = {
  /**
   * Check if a node has dependencies
   * @param {string} chainId - The ID of the supply chain
   * @param {string} nodeId - The ID of the node to check
   * @returns {Promise<Object>} - Object with canDelete flag and message if can't delete
   */
  checkNodeDependencies: async (chainId, nodeId) => {
    try {
      const response = await api.get(`/supply-chains/${chainId}/nodes/${nodeId}/dependencies`);
      return response.data;
    } catch (error) {
      console.error('Error checking node dependencies:', error);
      
      // If the API endpoint doesn't exist yet, provide a fallback implementation
      // This is temporary until the backend is updated with the endpoint
      if (error.response?.status === 404) {
        return provideFallbackDependencyCheck(chainId, nodeId);
      }
      
      return {
        canDelete: false,
        message: 'Error checking dependencies. Please try again later.'
      };
    }
  }
};

/**
 * Fallback implementation to check node dependencies
 * This is a temporary solution until the backend API is implemented
 */
async function provideFallbackDependencyCheck(chainId, nodeId) {
  try {
    // Check for products
    const productsResponse = await api.get(`/tracing/items/${chainId}`);
    const products = productsResponse.data;
    
    // Check for orders
    const ordersPromise = api.get(`/customer/orders/node/${nodeId}`).catch(() => ({ data: [] }));
    
    // Check for materials
    const materialsPromise = api.get(`/supplier/materials/node/${nodeId}`).catch(() => ({ data: [] }));
    
    // Check for transports
    const transportsPromise = api.get(`/distributor/transports/node/${nodeId}`).catch(() => ({ data: [] }));
    
    // Wait for all checks to complete
    const [ordersResponse, materialsResponse, transportsResponse] = await Promise.all([
      ordersPromise, materialsPromise, transportsPromise
    ]);
    
    const orders = ordersResponse.data || [];
    const materials = materialsResponse.data || [];
    const transports = transportsResponse.data || [];
    
    // Check if there are any dependencies
    const hasProducts = products?.some(p => p.nodeId?.toString() === nodeId);
    const hasOrders = orders.length > 0;
    const hasMaterials = materials.length > 0;
    const hasTransports = transports.length > 0;
    
    if (hasProducts || hasOrders || hasMaterials || hasTransports) {
      let message = 'This node has associated ';
      
      if (hasProducts) message += 'products, ';
      if (hasOrders) message += 'orders, ';
      if (hasMaterials) message += 'materials, ';
      if (hasTransports) message += 'transports, ';
      
      // Remove trailing comma and space
      message = message.slice(0, -2);
      message += ' and cannot be deleted. Deleting this node may cause data inconsistency.';
      
      return {
        canDelete: false,
        message
      };
    }
    
    // Check if node has edges in the supply chain
    const edgesResponse = await api.get(`/supply-chains/${chainId}/edges`);
    const edges = edgesResponse.data;
    
    const hasEdges = edges?.some(
      edge => edge.source?.id?.toString() === nodeId || edge.target?.id?.toString() === nodeId
    );
    
    if (hasEdges) {
      return {
        canDelete: true,
        warning: 'This node has connections that will also be deleted.'
      };
    }
    
    // No dependencies found
    return {
      canDelete: true
    };
  } catch (error) {
    console.error('Error in fallback dependency check:', error);
    return {
      canDelete: false,
      message: 'Could not determine if node has dependencies. Delete with caution.'
    };
  }
}

export default nodeDependencyChecker;