// src/services/api.js - Updated version with proper implementations
// Consolidated API services for different user roles

import api from '../utils/axios';

// Admin Services
const adminService = {
  getAllUsers: () => {
    return api.get('/users');
  },
  deleteUser: (userId) => {
    return api.delete(`/users/${userId}`);
  },
  assignRole: (userId, role) => {
    return api.post(`/users/${userId}/assign-role?role=${role}`);
  }
};

// Customer Services
const customerService = {
  getAvailableProducts: () => {
    return api.get('/customer/products/available');
  },
  getProductsBySupplyChain: (supplyChainId) => {
    return api.get(`/customer/products/supply-chain/${supplyChainId}`);
  },
  getOrders: (customerId) => {
    return api.get(`/customer/orders/${customerId}`);
  },
  createOrder: (orderData) => {
    return api.post('/customer/orders', orderData);
  },
  cancelOrder: (orderId) => {
    return api.post(`/customer/orders/${orderId}/cancel`);
  },
  confirmDelivery: (orderId) => {
    return api.post(`/customer/orders/${orderId}/confirm`);
  },
  trackOrder: (orderNumber) => {
    return api.get(`/customer/orders/number/${orderNumber}`);
  },
  getOrderHistory: (orderId) => {
    return api.get(`/customer/orders/${orderId}/history`);
  },
  getChurnedProducts: (customerId) => {
    return api.get(`/recycle/customer/products/churned/${customerId}`);
  },
  markProductForRecycling: (itemId, data) => {
    // Make sure timestamps are converted correctly
    const payload = {
      ...data,
      // If there are date fields, format them as timestamps
      churnDate: data.churnDate ? new Date(data.churnDate).getTime() : undefined
    };
    return api.post(`/recycle/customer/products/${itemId}/churn`, payload);
  },
  getRecyclingTransports: (customerId) => {
    return api.get(`/recycle/customer/transports/${customerId}`);
  }
};

// Supplier Services
const supplierService = {
    getAllSuppliers: () => {
        return api.get('/users', { params: { role: 'SUPPLIER' } });
      },
    getMaterials: (supplierId) => {
    if (!supplierId) {
        console.warn('Attempted to fetch materials without a valid supplierId');
        return Promise.resolve({ data: [] });
    }
    return api.get(`/supplier/materials/${supplierId}`);
    },
    createMaterial: (materialData) => {
      return api.post('/supplier/materials', materialData);
    },
    getPendingRequests: (supplierId) => {
      return api.get(`/supplier/requests/pending/${supplierId}`);
    },
    getRequestsByStatus: (supplierId, status) => {
      return api.get(`/supplier/requests/${supplierId}/${status}`);
    },
    approveRequest: (requestId, approvals) => {
      return api.post(`/supplier/requests/${requestId}/approve`, approvals);
    },
    allocateMaterials: (requestId) => {
      return api.post(`/supplier/requests/${requestId}/allocate`);
    }
  };

// Manufacturer Services
const manufacturerService = {
  getProducts: (manufacturerId) => {
    return api.get(`/manufacturer/products/${manufacturerId}`);
  },
  createProduct: (productData) => {
    // Ensure supplyChainId is included in the request
    if (!productData.supplyChainId) {
      console.warn('Creating product without supply chain association');
    }
    return api.post('/manufacturer/products', productData);
  },
  updateProduct: (productId, productData) => {
    // Preserve supply chain association during updates
    return api.put(`/manufacturer/products/${productId}`, productData);
  },
  deactivateProduct: (productId) => {
    return api.delete(`/manufacturer/products/${productId}`);
  },
  requestMaterials: (requestData) => {
    // Ensure all IDs are numbers, not strings
    const sanitizedData = {
      ...requestData,
      manufacturerId: Number(requestData.manufacturerId),
      supplierId: Number(requestData.supplierId),
      supplyChainId: Number(requestData.supplyChainId),
      orderId: requestData.orderId ? Number(requestData.orderId) : null,
      items: requestData.items.map(item => ({
        materialId: Number(item.materialId),
        quantity: Number(item.quantity)
      }))
    };
    
    console.log('Sending sanitized request data:', sanitizedData);
    return api.post('/manufacturer/materials/request', sanitizedData);
  },
  getMaterialRequests: (manufacturerId) => {
    return api.get(`/manufacturer/materials/requests/${manufacturerId}`);
  },
  getMaterialRequestById: (requestId) => {
    return api.get(`/manufacturer/materials/request/${requestId}`);
  },
  getProductionBatches: (manufacturerId) => {
    return api.get(`/manufacturer/production/batches/${manufacturerId}`);
  },
  createProductionBatch: (batchData) => {
    return api.post('/manufacturer/production/batch', batchData);
  },
  completeProductionBatch: (batchId, quality) => {
    return api.post(`/manufacturer/production/batch/${batchId}/complete`, { quality });
  },
  rejectProductionBatch: (batchId, reason) => {
    return api.post(`/manufacturer/production/batch/${batchId}/reject`, { reason });
  },
  getOrders: (manufacturerId) => {
    return api.get(`/manufacturer/orders/${manufacturerId}`);
  },
  getAvailableMaterials: (manufacturerId) => {
    return api.get(`/manufacturer/materials/available/${manufacturerId}`);
  },
  startOrderProduction: (orderId) => {
    return api.post(`/manufacturer/orders/${orderId}/start-production`);
  },
  getAvailableMaterialsWithBlockchainIds: (manufacturerId) => {
    return api.get(`/manufacturer/materials/available-blockchain/${manufacturerId}`);
  },
  fulfillOrderFromStock: (orderId, data) => {
    return api.post(`/manufacturer/orders/${orderId}/fulfill-from-stock`, data);
  },
  getProductsBySupplyChain: (manufacturerId, supplyChainId) => {
    return api.get(`/manufacturer/products/${manufacturerId}/supply-chain/${supplyChainId}`);
  },
  getMaterialRequestById: (requestId) => {
    return api.get(`/manufacturer/materials/request/${requestId}`);
  },
  getPendingRecycledItems: (manufacturerId) => {
    return api.get(`/recycle/manufacturer/pending-items/${manufacturerId}`);
  },
  processToMaterials: (itemId, data) => {
    return api.post('/recycle/manufacturer/process-to-materials', {
      itemId,
      ...data
    });
  },
  refurbishProduct: (itemId, data) => {
    return api.post('/recycle/manufacturer/refurbish', {
      itemId,
      ...data
    });
  },
  getRecycledMaterials: (manufacturerId) => {
    return api.get(`/recycle/manufacturer/materials/${manufacturerId}`);
  },
  getRefurbishedProducts: (manufacturerId) => {
    return api.get(`/recycle/manufacturer/products/${manufacturerId}`);
  },
  getAllManufacturers: () => {
    return api.get('/users', { params: { role: 'MANUFACTURER' } });
  },
  getProductMaterials: (productId) => {
    return api.get(`/manufacturer/product/${productId}/materials`);
  }
};

// Distributor Services
const distributorService = {
    getTransports: (distributorId) => {
      return api.get(`/distributor/transports/${distributorId}`);
    },
    createMaterialTransport: (transportData) => {
      return api.post('/distributor/transport/material', transportData);
    },
    createProductTransport: (transportData) => {
      return api.post('/distributor/transport/product', transportData);
    },
    recordPickup: (transportId) => {
      return api.post(`/distributor/transport/${transportId}/pickup`);
    },
    recordDelivery: (transportId) => {
      return api.post(`/distributor/transport/${transportId}/delivery`);
    },
    getReadyMaterialRequests: () => {
      return api.get('/distributor/materials/ready');
    },
    getReadyOrders: () => {
      return api.get('/distributor/orders/ready');
    },
  
    // --- Enhanced and new methods ---
    // Get a specific transport by ID
    getTransportById: (transportId) => {
      return api.get(`/distributor/transport/${transportId}`);
    },
    
    // Get transports by status
    getTransportsByStatus: (distributorId, status) => {
      return api.get(`/distributor/transports/${distributorId}/status/${status}`);
    },
  
    // Get transports by type
    getTransportsByType: (distributorId, type) => {
      return api.get(`/distributor/transports/${distributorId}/type/${type}`);
    },
  
    // Get transports by source
    getTransportsBySource: (sourceId) => {
      return api.get(`/distributor/transports/source/${sourceId}`);
    },
  
    // Get transports timeline/history for analytics
    getTransportsTimeline: (distributorId, startDate, endDate) => {
      return api.get(`/distributor/transports/${distributorId}/timeline`, {
        params: { startDate, endDate }
      });
    },
  
    // Get delivery performance metrics
    getDeliveryPerformance: (distributorId) => {
      return api.get(`/distributor/performance/${distributorId}`);
    },
  
    // Update transport status (more general method)
    updateTransportStatus: (transportId, status) => {
      return api.put(`/distributor/transport/${transportId}/status`, { status });
    },
  
    // Cancel a scheduled transport that hasn't been picked up yet
    cancelTransport: (transportId, reason) => {
      return api.post(`/distributor/transport/${transportId}/cancel`, { reason });
    },
  
    // Add tracking information or notes to a transport
    addTransportNotes: (transportId, notes) => {
      return api.post(`/distributor/transport/${transportId}/notes`, { notes });
    },
  
    // Get pending pickup transports 
    getPendingPickups: (distributorId) => {
      return api.get(`/distributor/transports/${distributorId}/pending-pickup`);
    },
  
    // Get a count of transports by status (dashboard widget)
    getTransportCounts: (distributorId) => {
      return api.get(`/distributor/transports/${distributorId}/counts`);
    },
  
    // Utility methods for working with blockchain tracking
    syncTransportWithBlockchain: (transportId, blockchainItemId) => {
      return api.post(`/distributor/transport/${transportId}/blockchain-sync`, { blockchainItemId });
    },
  
    // Get supply chain partners for a distributor
    getSupplyChainPartners: (distributorId) => {
      return api.get(`/distributor/partners/${distributorId}`);
    },
    getAvailableChurnedItems: () => {
        return api.get('/recycle/distributor/available-items');
      },
      createRecyclingTransport: (transportData) => {
        return api.post('/recycle/distributor/transport/create', transportData);
      },
      recordRecyclePickup: (transportId) => {
        // This can likely use the existing method if it already exists
        return api.post(`/recycle/distributor/transport/${transportId}/pickup`);
      },
      recordRecycleDelivery: (transportId) => {
        // This can likely use the existing method if it already exists
        return api.post(`/recycle/distributor/transport/${transportId}/delivery`);
      }
  };

// Supply Chain Services
const supplyChainService = {
  getSupplyChains: () => {
    return api.get('/supply-chains');
  },
  getSupplyChainsByUser: (userId) => {
    return api.get(`/supply-chains/user/${userId}`)
      .then(response => {
        console.log('Supply chain response:', response);
        return response.data || [];
      })
      .catch(error => {
        console.error('Error fetching supply chains:', error);
        return [];
      });
  },
  createSupplyChain: (data) => {
    return api.post('/supply-chains/create', data);
  },
  getSupplyChainById: (id) => {
    return api.get(`/supply-chains/${id}`);
  },
  updateSupplyChain: (id, data) => {
    return api.put(`/supply-chains/${id}`, data);
  },
  deleteSupplyChain: (id) => {
    return api.delete(`/supply-chains/${id}`);
  },
  isSupplyChainFinalized: (id) => {
    return api.get(`/supply-chains/${id}/is-finalized`);
  },
  getAssignedUsers: (id) => {
    return api.get(`/supply-chains/${id}/assigned-users`);
  },
  getProductsBySupplyChain: (supplyChainId) => {
    return api.get(`/supply-chains/${supplyChainId}/products`);
  }
};

// Blockchain and Item Tracing Services
const blockchainService = {
    // Tracing items
    getItemsBySupplyChain: (supplyChainId) => {
      return api.get(`/tracing/items/${supplyChainId}`);
    },
    getAllBlockchainTransactions: () => {
        return api.get('/blockchain/transactions/all');
    },
    getItemsByOwner: (ownerId) => {
      return api.get(`/tracing/items/owner/${ownerId}`);
    },
    getBlockchainItemDetails: (itemId) => {
      return api.get(`/tracing/blockchain/item/${itemId}`);
    },
    getItemParents: (itemId) => {
      return api.get(`/tracing/blockchain/item/${itemId}/parents`);
    },
    getItemChildren: (itemId) => {
      return api.get(`/tracing/blockchain/item/${itemId}/children`);
    },
    traceItemHistory: (itemId) => {
      return api.get(`/tracing/item/${itemId}/trace`);
    },
    
    // New methods for enhanced blockchain traceability
    getTransactionsBySupplyChain: (supplyChainId) => {
      return api.get(`/blockchain/transactions/supply-chain/${supplyChainId}`);
    },
    getItemTransactionTimeline: (itemId) => {
      return api.get(`/blockchain/transactions/item-timeline/${itemId}`);
    },
    getBlockchainTransactionDetails: (txHash) => {
      // For individual transaction details
      return api.get(`/tracing/blockchain/transaction/${txHash}`);
    },
    getAllTransactions: () => {
      // For debugging or admin purposes - get all transactions
      return api.get(`/blockchain/transactions`);
    },
    
    // Node status management
    updateNodeStatus: (nodeId, status) => {
      return api.put(`/node-status/${nodeId}`, { status });
    },
    associateNodeWithItem: (nodeId, blockchainItemId) => {
      return api.post(`/node-status/${nodeId}/associate/${blockchainItemId}`);
    },
    removeNodeAssociation: (nodeId) => {
      return api.delete(`/node-status/${nodeId}/associate`);
    },
    syncAllNodeStatuses: () => {
      return api.post('/node-status/sync');
    },
    getNodeAssociations: () => {
      return api.get('/node-status/associations');
    }
  }

export { 
  adminService,
  customerService,
  supplierService,
  manufacturerService,
  distributorService,
  blockchainService,
  supplyChainService
};