// src/components/supply-chain/CustomNode.jsx - Updated with left/right handles
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, selected }) => {
  // Get status color for the node
  const getStatusColor = () => {
    switch (data.status) {
      case 'active':
        return 'border-green-500 bg-green-50';
      case 'pending':
        return 'border-yellow-500 bg-yellow-50';
      case 'completed':
        return 'border-blue-500 bg-blue-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'in_transit':
        return 'border-orange-500 bg-orange-50';
      case 'processing':
        return 'border-purple-500 bg-purple-50';
      case 'created':
        return 'border-teal-500 bg-teal-50';
      case 'rejected':
        return 'border-pink-500 bg-pink-50';
      default:
        return 'border-gray-400 bg-white';
    }
  };

  // Get role color
  const getRoleColor = () => {
    switch (data.role) {
      case 'Supplier':
        return 'bg-blue-100 text-blue-800';
      case 'Manufacturer':
        return 'bg-green-100 text-green-800';
      case 'Distributor':
        return 'bg-purple-100 text-purple-800';
      case 'Customer':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={`rounded-lg shadow-md p-3 border-2 ${getStatusColor()} ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`} 
      style={{ width: 180 }}
    >
      {/* Target handle on the left side */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-gray-700"
        style={{ top: '50%' }}
      />
      
      <div className="font-bold text-gray-800 text-sm mb-2">{data.label}</div>
      
      <div className="mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getRoleColor()}`}>
          {data.role}
        </span>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        {data.assignedUserId ? 
          <span className="bg-gray-100 rounded px-1 py-0.5">User: {data.assignedUserId}</span> : 
          <span className="italic text-gray-400">Unassigned</span>
        }
      </div>
      
      <div className="text-xs">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          data.status === 'active' ? 'bg-green-100 text-green-800' :
          data.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          data.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          data.status === 'error' ? 'bg-red-100 text-red-800' :
          data.status === 'in_transit' ? 'bg-orange-100 text-orange-800' :
          data.status === 'processing' ? 'bg-purple-100 text-purple-800' :
          data.status === 'created' ? 'bg-teal-100 text-teal-800' :
          data.status === 'rejected' ? 'bg-pink-100 text-pink-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {data.status}
        </span>
      </div>
      
      {/* Source handle on the right side */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-gray-700"
        style={{ top: '50%' }}
      />
    </div>
  );
};

export default memo(CustomNode);