// src/components/supply-chain/CustomNode.jsx - Updated with authorization status
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, selected }) => {
  // Get status color for the node
  const getStatusColor = () => {
    // Blockchain authorization status takes precedence if we have an assigned user
    if (data.assignedUserId) {
      if (data.isAuthorized === true) {
        return 'border-green-500 bg-green-50';
      } else if (data.isAuthorized === false) {
        return 'border-yellow-500 bg-yellow-50';
      }
    }
    
    // Fall back to regular status colors
    switch (data.status) {
      case 'active':
      case 'authorized':
        return 'border-green-500 bg-green-50';
      case 'pending':
      case 'pending_authorization':
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
  
  // Get status display text
  const getStatusText = () => {
    // Show blockchain authorization status if user is assigned
    if (data.assignedUserId) {
      if (data.isAuthorized === true) {
        return 'blockchain authorized';
      } else if (data.isAuthorized === false) {
        return 'pending authorization';
      }
    }
    
    // Otherwise show the normal status
    return data.status;
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
          data.isAuthorized === true ? 'bg-green-100 text-green-800' :
          data.isAuthorized === false ? 'bg-yellow-100 text-yellow-800' :
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
          {getStatusText()}
        </span>
      </div>
      
      {/* Add blockchain icon for assigned users */}
      {data.assignedUserId && (
        <div className="mt-2 text-xs flex items-center justify-center">
          {data.isAuthorized === true ? (
            <span className="text-green-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Blockchain verified
            </span>
          ) : (
            <span className="text-yellow-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Awaiting verification
            </span>
          )}
        </div>
      )}
      
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