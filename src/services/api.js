import api from '../utils/axios';

// Admin Services
const adminService = {
  getAllUsers: () => {
    return api.get('/users');
  },
  deleteUser: userId => {
    return api.delete(`/users/${userId}`);
  },
  assignRole: (userId, role) => {
    return api.post(`/users/${userId}/assign-role?role=${role}`);
  },
  getNodeAuthorizationStatus: async chainId => {
    return api.get(`/node-authorization/supply-chain/${chainId}`);
  },
  updateUser: (userId, userData) => {
    return api.put(`/users/${userId}`, userData);
  },
};

// Customer Services
const customerService = {
  getAvailableProducts: () => {
    return api.get('/customer/products/available');
  },
  getOrders: customerId => {
    return api.get(`/customer/orders/${customerId}`);
  },
  createOrder: orderData => {
    return api.post('/customer/orders', orderData)
      .then(response => {
        console.log('Order creation successful:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Order creation failed:', error.response?.data || error.message);
        throw error;
      });
  },
  cancelOrder: orderId => {
    return api.post(`/customer/orders/${orderId}/cancel`);
  },
  confirmDelivery: orderId => {
    return api.post(`/customer/orders/${orderId}/confirm`);
  },
  trackOrder: orderNumber => {
    return api.get(`/customer/orders/number/${orderNumber}`);
  },
  getChurnedProducts: customerId => {
    return api.get(`/recycle/customer/products/churned/${customerId}`);
  },
  markProductForRecycling: (itemId, data) => {
    const payload = {
      ...data,
      churnDate: data.churnDate
        ? new Date(data.churnDate).getTime()
        : undefined,
    };
    return api.post(`/recycle/customer/products/${itemId}/churn`, payload);
  },
  getRecyclingTransports: customerId => {
    return api.get(`/recycle/customer/transports/${customerId}`);
  },
};

// Supplier Services
const supplierService = {
  getAllSuppliers: () => {
    return api.get('/users', { params: { role: 'SUPPLIER' } });
  },
  getMaterials: supplierId => {
    if (!supplierId) {
      console.warn('Attempted to fetch materials without a valid supplierId');
      return Promise.resolve({ data: [] });
    }
    return api.get(`/supplier/materials/${supplierId}`);
  },
  createMaterial: materialData => {
    return api.post('/supplier/materials', materialData);
  },
  getPendingRequests: supplierId => {
    return api.get(`/supplier/requests/pending/${supplierId}`);
  },
  getRequestsByStatus: (supplierId, status) => {
    return api.get(`/supplier/requests/${supplierId}/${status}`);
  },
  approveRequest: (requestId, approvals) => {
    return api.post(`/supplier/requests/${requestId}/approve`, approvals);
  },
  allocateMaterials: requestId => {
    return api.post(`/supplier/requests/${requestId}/allocate`);
  },
};

// Manufacturer Services
const manufacturerService = {
  getProducts: manufacturerId => {
    return api.get(`/manufacturer/products/${manufacturerId}`);
  },
  createProduct: productData => {
    if (!productData.supplyChainId) {
      console.warn('Creating product without supply chain association');
    }
    return api.post('/manufacturer/products', productData);
  },
  updateProduct: (productId, productData) => {
    return api.put(`/manufacturer/products/${productId}`, productData);
  },
  deactivateProduct: productId => {
    return api.delete(`/manufacturer/products/${productId}`);
  },
  requestMaterials: requestData => {
    const sanitizedData = {
      ...requestData,
      manufacturerId: Number(requestData.manufacturerId),
      supplierId: Number(requestData.supplierId),
      supplyChainId: Number(requestData.supplyChainId),
      orderId: requestData.orderId ? Number(requestData.orderId) : null,
      items: requestData.items.map(item => ({
        materialId: Number(item.materialId),
        quantity: Number(item.quantity),
      })),
    };

    console.log('Sending sanitized request data:', sanitizedData);
    return api.post('/manufacturer/materials/request', sanitizedData);
  },
  getMaterialRequests: manufacturerId => {
    return api.get(`/manufacturer/materials/requests/${manufacturerId}`);
  },
  getMaterialRequestById: requestId => {
    return api.get(`/manufacturer/materials/request/${requestId}`);
  },
  getProductionBatches: manufacturerId => {
    return api.get(`/manufacturer/production/batches/${manufacturerId}`);
  },
  createProductionBatch: batchData => {
    return api.post('/manufacturer/production/batch', batchData);
  },
  completeProductionBatch: (batchId, quality) => {
    return api.post(`/manufacturer/production/batch/${batchId}/complete`, {
      quality,
    });
  },
  rejectProductionBatch: (batchId, reason) => {
    return api.post(`/manufacturer/production/batch/${batchId}/reject`, {
      reason,
    });
  },
  getOrders: manufacturerId => {
    return api.get(`/manufacturer/orders/${manufacturerId}`);
  },
  getAvailableMaterials: manufacturerId => {
    return api.get(`/manufacturer/materials/available/${manufacturerId}`);
  },
  getAvailableMaterialsWithBlockchainIds: manufacturerId => {
    return api.get(
      `/manufacturer/materials/available-blockchain/${manufacturerId}`
    );
  },
  fulfillOrderFromStock: (orderId, data) => {
    return api.post(`/manufacturer/orders/${orderId}/fulfill-from-stock`, data);
  },
  getPendingRecycledItems: manufacturerId => {
    return api.get(`/recycle/manufacturer/pending-items/${manufacturerId}`);
  },
  processToMaterials: (itemId, data) => {
    return api.post('/recycle/manufacturer/process-to-materials', {
      itemId,
      ...data,
    });
  },
  getRecycledMaterials: manufacturerId => {
    return api.get(`/recycle/manufacturer/materials/${manufacturerId}`);
  },
  getAllManufacturers: () => {
    return api.get('/users', { params: { role: 'MANUFACTURER' } });
  },
  getProductMaterials: productId => {
    return api.get(`/manufacturer/product/${productId}/materials`);
  },
};

// Distributor Services
const distributorService = {
  getTransports: distributorId => {
    return api.get(`/distributor/transports/${distributorId}`);
  },
  createMaterialTransport: transportData => {
    return api.post('/distributor/transport/material', transportData);
  },
  recordPickup: transportId => {
    return api.post(`/distributor/transport/${transportId}/pickup`);
  },
  recordDelivery: transportId => {
    return api.post(`/distributor/transport/${transportId}/delivery`);
  },
  getReadyMaterialRequests: () => {
    return api.get('/distributor/materials/ready');
  },
  getReadyOrders: () => {
    return api.get('/distributor/orders/ready');
  },
  getAvailableChurnedItems: () => {
    return api.get('/recycle/distributor/available-items');
  },
  createRecyclingTransport: transportData => {
    return api.post('/recycle/distributor/transport/create', transportData);
  },
  recordRecyclePickup: transportId => {
    return api.post(`/recycle/distributor/transport/${transportId}/pickup`);
  },
  recordRecycleDelivery: transportId => {
    return api.post(`/recycle/distributor/transport/${transportId}/delivery`);
  },
};

// Supply Chain Services
const supplyChainService = {
  getSupplyChains: () => {
    return api.get('/supply-chains');
  },
  getSupplyChainsByUser: userId => {
    return api
      .get(`/supply-chains/user/${userId}`)
      .then(response => {
        console.log('Supply chain response:', response);
        return response.data || [];
      })
      .catch(error => {
        console.error('Error fetching supply chains:', error);
        return [];
      });
  },
  createSupplyChain: data => {
    return api.post('/supply-chains/create', data);
  },
  getSupplyChainById: id => {
    return api.get(`/supply-chains/${id}`);
  },
  deleteSupplyChain: id => {
    return api.delete(`/supply-chains/${id}`);
  },
  isSupplyChainFinalized: id => {
    return api.get(`/supply-chains/${id}/is-finalized`);
  },
  getAssignedUsers: id => {
    return api.get(`/supply-chains/${id}/assigned-users`);
  },
};

// Blockchain and Item Tracing Services
const blockchainService = {
  getItemsBySupplyChain: supplyChainId => {
    return api.get(`/tracing/items/${supplyChainId}`);
  },
  getAllBlockchainTransactions: () => {
    return api.get('/blockchain/transactions/all');
  },
  getItemsByOwner: ownerId => {
    return api.get(`/tracing/items/owner/${ownerId}`);
  },
  getBlockchainItemDetails: itemId => {
    return api.get(`/tracing/blockchain/item/${itemId}`);
  },
  getItemChildren: itemId => {
    return api.get(`/tracing/blockchain/item/${itemId}/children`);
  },
  traceItemHistory: itemId => {
    return api.get(`/tracing/item/${itemId}/trace`);
  },
  getItemTransactionTimeline: itemId => {
    return api.get(`/blockchain/transactions/item-timeline/${itemId}`);
  },
  getBlockchainTransactionDetails: txHash => {
    return api.get(`/tracing/blockchain/transaction/${txHash}`);
  },
};

export {
  adminService,
  customerService,
  supplierService,
  manufacturerService,
  distributorService,
  blockchainService,
  supplyChainService,
};
