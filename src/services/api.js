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
    return api.post('/manufacturer/products', productData);
  },
  updateProduct: (productId, productData) => {
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
    
    // Mock implementation for demonstration purposes - to be replaced with actual API call
    // This would simulate fetching a specific transport
    getMockTransportById: (transportId) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              id: parseInt(transportId),
              trackingNumber: `TRK-${100000 + parseInt(transportId)}`,
              type: Math.random() > 0.5 ? 'Material Transport' : 'Product Delivery',
              source: { id: 1, username: 'Acme Supplier' },
              destination: { id: 2, username: 'XYZ Manufacturer' },
              status: 'In Transit',
              scheduledPickupDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              actualPickupDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              scheduledDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              actualDeliveryDate: null,
              blockchainItemId: Math.random() > 0.3 ? Math.floor(Math.random() * 1000000) : null,
              materialRequest: {
                requestNumber: `REQ-${5000 + parseInt(transportId)}`,
                items: Array(Math.floor(Math.random() * 5) + 1).fill(0).map((_, i) => ({
                  material: { name: `Material ${i+1}` },
                  quantity: Math.floor(Math.random() * 50) + 10
                }))
              },
              order: {
                orderNumber: `ORD-${8000 + parseInt(transportId)}`,
                items: Array(Math.floor(Math.random() * 3) + 1).fill(0).map((_, i) => ({
                  product: { name: `Product ${i+1}` },
                  quantity: Math.floor(Math.random() * 10) + 1
                }))
              }
            }
          });
        }, 300);
      });
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
  }
};

// Blockchain and Item Tracing Services
const blockchainService = {
  // Tracing items
  getItemsBySupplyChain: (supplyChainId) => {
    return api.get(`/tracing/items/${supplyChainId}`);
  },
  getItemsByOwner: (ownerId) => {
    return api.get(`/tracing/items/owner/${ownerId}`);
  },
  getBlockchainItemDetails: (itemId) => {
    return api.get(`/tracing/blockchain/item/${itemId}`);
  },
  getBlockchainTransactionDetails: (txHash) => {
    return api.get(`/tracing/blockchain/transaction/${txHash}`);
  },
  traceItemHistory: (itemId) => {
    return api.get(`/tracing/item/${itemId}/trace`);
  },
  
  // Node status management
  updateNodeStatus: (nodeId, status) => {
    return api.put(`/node-status/${nodeId}`, { status });
  },
  associateNodeWithItem: (nodeId, blockchainItemId) => {
    return api.post(`/node-status/${nodeId}/associate/${blockchainItemId}`);
  },
  syncAllNodeStatuses: () => {
    return api.post('/node-status/sync');
  }
};

export { 
  adminService,
  customerService,
  supplierService,
  manufacturerService,
  distributorService,
  blockchainService,
  supplyChainService
};