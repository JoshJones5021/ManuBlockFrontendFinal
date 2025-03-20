// src/utils/nodeStatusUtils.js
// Utility functions for handling node status styles and conversions

/**
 * Map of node status to their display properties
 */
export const NODE_STATUS_MAP = {
  pending: {
    label: 'Pending',
    color: '#ffe8cc',
    border: '#f59e0b',
    textColor: '#92400e',
    badgeClass: 'bg-yellow-100 text-yellow-800',
  },
  active: {
    label: 'Active',
    color: '#dcfce7',
    border: '#22c55e',
    textColor: '#166534',
    badgeClass: 'bg-green-100 text-green-800',
  },
  completed: {
    label: 'Completed',
    color: '#dbeafe',
    border: '#3b82f6',
    textColor: '#1e40af',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  error: {
    label: 'Error',
    color: '#fee2e2',
    border: '#ef4444',
    textColor: '#b91c1c',
    badgeClass: 'bg-red-100 text-red-800',
  },
  in_transit: {
    label: 'In Transit',
    color: '#fef3c7',
    border: '#f59e0b',
    textColor: '#92400e',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  processing: {
    label: 'Processing',
    color: '#f3e8ff',
    border: '#a855f7',
    textColor: '#7e22ce',
    badgeClass: 'bg-purple-100 text-purple-800',
  },
  created: {
    label: 'Created',
    color: '#e0f2fe',
    border: '#0ea5e9',
    textColor: '#0369a1',
    badgeClass: 'bg-sky-100 text-sky-800',
  },
  rejected: {
    label: 'Rejected',
    color: '#fecaca',
    border: '#dc2626',
    textColor: '#991b1b',
    badgeClass: 'bg-rose-100 text-rose-800',
  },
};

/**
 * Map of node roles to their display properties
 */
export const NODE_ROLE_MAP = {
  Supplier: {
    color: '#dbeafe',
    textColor: '#1e40af',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  Manufacturer: {
    color: '#dcfce7',
    textColor: '#166534',
    badgeClass: 'bg-green-100 text-green-800',
  },
  Distributor: {
    color: '#f3e8ff',
    textColor: '#7e22ce',
    badgeClass: 'bg-purple-100 text-purple-800',
  },
  Customer: {
    color: '#ffedd5',
    textColor: '#9a3412',
    badgeClass: 'bg-orange-100 text-orange-800',
  },
  Unassigned: {
    color: '#f3f4f6',
    textColor: '#4b5563',
    badgeClass: 'bg-gray-100 text-gray-800',
  },
};

/**
 * Get CSS classes for a node status badge
 * @param {string} status - The node status
 * @returns {string} - The CSS class string
 */
export const getStatusBadgeClass = status => {
  return NODE_STATUS_MAP[status]?.badgeClass || 'bg-gray-100 text-gray-800';
};

/**
 * Get CSS classes for a node role badge
 * @param {string} role - The node role
 * @returns {string} - The CSS class string
 */
export const getRoleBadgeClass = role => {
  return NODE_ROLE_MAP[role]?.badgeClass || 'bg-gray-100 text-gray-800';
};

/**
 * Get the display label for a status
 * @param {string} status - The status value
 * @returns {string} - The formatted display label
 */
export const getStatusLabel = status => {
  return NODE_STATUS_MAP[status]?.label || status;
};

/**
 * Convert blockchain status to node status
 * @param {number} blockchainStatus - The numeric blockchain status (0-4)
 * @returns {string} - The corresponding node status string
 */
export const blockchainStatusToNodeStatus = blockchainStatus => {
  switch (blockchainStatus) {
    case 0:
      return 'created';
    case 1:
      return 'in_transit';
    case 2:
      return 'processing';
    case 3:
      return 'completed';
    case 4:
      return 'rejected';
    default:
      return 'pending';
  }
};

/**
 * Convert node status to blockchain status
 * @param {string} nodeStatus - The node status string
 * @returns {number} - The corresponding blockchain status number
 */
export const nodeStatusToBlockchainStatus = nodeStatus => {
  switch (nodeStatus) {
    case 'created':
      return 0;
    case 'in_transit':
      return 1;
    case 'processing':
      return 2;
    case 'completed':
      return 3;
    case 'rejected':
      return 4;
    case 'active':
      return 2; // Map active to processing
    case 'pending':
      return 0; // Map pending to created
    case 'error':
      return 4; // Map error to rejected
    default:
      return 0;
  }
};

const nodeStatusUtils = {
  NODE_STATUS_MAP,
  NODE_ROLE_MAP,
  getStatusBadgeClass,
  getRoleBadgeClass,
  getStatusLabel,
  blockchainStatusToNodeStatus,
  nodeStatusToBlockchainStatus,
};

export default nodeStatusUtils;
