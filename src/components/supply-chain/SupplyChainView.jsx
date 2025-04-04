import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import supplyChainService from '../../services/supplyChain';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomNode from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

const PROJECT_ROLES = [
  { value: 'Unassigned', label: 'Unassigned' },
  { value: 'Supplier', label: 'Supplier' },
  { value: 'Manufacturer', label: 'Manufacturer' },
  { value: 'Distributor', label: 'Distributor' },
  { value: 'Customer', label: 'Customer' },
];

const SupplyChainView = () => {
  const { chainId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [supplyChain, setSupplyChain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [isSupplyChainFinalized, setIsSupplyChainFinalized] = useState(false);
  const [authCheckLoading, setAuthCheckLoading] = useState(false);

  const checkNodeAuthorizationStatus = useCallback(async () => {
    if (!chainId || !isSupplyChainFinalized) return;

    try {
      setAuthCheckLoading(true);

      const response = await adminService.getNodeAuthorizationStatus(chainId);

      if (response.data && Array.isArray(response.data)) {
        setNodes(currentNodes =>
          currentNodes.map(node => {
            const nodeData = response.data.find(
              n => n.id.toString() === node.id
            );
            if (nodeData && node.data.assignedUserId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  isAuthorized: nodeData.authorized,
                },
              };
            }
            return node;
          })
        );
      }
    } catch (err) {
      console.error('Error checking node authorization status:', err);
      setError('Failed to check blockchain authorization status.');
    } finally {
      setAuthCheckLoading(false);
    }
  }, [chainId, isSupplyChainFinalized, setNodes]);

  const deleteNode = useCallback(
    async nodeId => {
      if (isSupplyChainFinalized) {
        setError('Cannot delete nodes in a finalized supply chain.');
        return;
      }

      try {
        await supplyChainService.deleteNode(chainId, nodeId);

        setNodes(nodes => nodes.filter(node => node.id !== nodeId.toString()));

        setEdges(edges =>
          edges.filter(
            edge =>
              edge.source !== nodeId.toString() &&
              edge.target !== nodeId.toString()
          )
        );
      } catch (err) {
        console.error('Error deleting node:', err);
        setError('Failed to delete node. Please try again.');
      }
    },
    [chainId, setNodes, setEdges, isSupplyChainFinalized]
  );

  const handleNodeDelete = useCallback(
    async nodeId => {
      if (isSupplyChainFinalized) {
        setError('Cannot delete nodes in a finalized supply chain.');
        return;
      }

      const hasConnectedEdges = edges.some(
        edge =>
          edge.source === nodeId.toString() || edge.target === nodeId.toString()
      );

      if (hasConnectedEdges) {
        if (
          window.confirm(
            'This node has connections that will also be deleted. Are you sure you want to proceed?'
          )
        ) {
          deleteNode(nodeId);
        }
      } else {
        deleteNode(nodeId);
      }
    },
    [edges, isSupplyChainFinalized, deleteNode]
  );

  const fetchSupplyChain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplyChainService.getSupplyChainById(chainId);
      const supplyChainData = response.data;

      setSupplyChain(supplyChainData);
      const isFinalized = supplyChainData.blockchainStatus === 'FINALIZED';
      setIsSupplyChainFinalized(isFinalized);

      const formattedNodes = supplyChainData.nodes.map(node => ({
        id: node.id.toString(),
        type: 'custom', 
        position: { x: node.x, y: node.y },
        data: {
          label: node.name,
          role: node.role,
          status: node.status,
          assignedUserId: node.assignedUserId,
          isAuthorized: undefined, 
        },
        draggable: supplyChainData.blockchainStatus !== 'FINALIZED',
      }));

      const formattedEdges = supplyChainData.edges.map(edge => ({
        id: edge.id.toString(),
        source: edge.source.id.toString(),
        target: edge.target.id.toString(),
        animated: edge.animated,
        style: {
          stroke: edge.strokeColor || '#666',
          strokeWidth: edge.strokeWidth || 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.strokeColor || '#666',
        },
        interactable: supplyChainData.blockchainStatus !== 'FINALIZED',
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);

      if (isFinalized) {
        setTimeout(() => {
          checkNodeAuthorizationStatus();
        }, 500);
      }
    } catch (err) {
      console.error('Error fetching supply chain:', err);
      setError('Failed to load supply chain details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [chainId, setNodes, setEdges, checkNodeAuthorizationStatus]);

  const fetchUsers = useCallback(async () => {
    try {
      setUserLoading(true);
      const response = await adminService.getAllUsers();
      if (response && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupplyChain();
  }, [fetchSupplyChain]);

  const onNodeDragStop = useCallback(
    async (event, node) => {
      if (isSupplyChainFinalized) return;

      try {
        await supplyChainService.updateNode(chainId, node.id, {
          x: node.position.x,
          y: node.position.y,
        });
      } catch (err) {
        console.error('Error updating node position:', err);
      }
    },
    [chainId, isSupplyChainFinalized]
  );

  useEffect(() => {
    if (isSupplyChainFinalized) {
      checkNodeAuthorizationStatus();

      const intervalId = setInterval(() => {
        checkNodeAuthorizationStatus();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [isSupplyChainFinalized, checkNodeAuthorizationStatus]);

  const onNodeClick = useCallback(
    (event, node) => {
      if (isSupplyChainFinalized) {
        setError('Supply chain is finalized. Nodes cannot be modified.');
        return;
      }

      setSelectedNode(node);
      fetchUsers();
      setShowNodeModal(true);
    },
    [fetchUsers, isSupplyChainFinalized]
  );

  const onEdgeClick = useCallback(
    (event, edge) => {
      if (isSupplyChainFinalized) {
        setError('Supply chain is finalized. Connections cannot be removed.');
        return;
      }

      if (window.confirm('Are you sure you want to delete this connection?')) {
        deleteEdge(edge.id);
      }
    },
    [isSupplyChainFinalized]
  );

  const deleteEdge = useCallback(
    async edgeId => {
      if (isSupplyChainFinalized) {
        setError('Supply chain is finalized. Connections cannot be removed.');
        return;
      }

      try {
        await supplyChainService.deleteEdge(chainId, edgeId);

        setEdges(edges => edges.filter(edge => edge.id !== edgeId));
      } catch (err) {
        console.error('Error deleting edge:', err);
        setError('Failed to delete connection.');
      }
    },
    [chainId, setEdges, isSupplyChainFinalized]
  );

  const onConnect = useCallback(
    async params => {
      if (isSupplyChainFinalized) {
        setError('Supply chain is finalized. No new connections can be added.');
        return;
      }

      if (params.source === params.target) {
        setError('Cannot connect a node to itself.');
        return;
      }

      try {
        const response = await supplyChainService.addEdge(chainId, {
          source: { id: params.source },
          target: { id: params.target },
          animated: false,
          strokeColor: '#666',
          strokeWidth: 1,
        });

        const newEdge = response.data;
        setEdges(eds =>
          addEdge(
            {
              id: newEdge.id.toString(),
              source: params.source,
              target: params.target,
              animated: false,
              style: { stroke: '#666', strokeWidth: 1 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#666',
              },
              interactable: !isSupplyChainFinalized,
            },
            eds
          )
        );
      } catch (err) {
        console.error('Error creating edge:', err);
        setError('Failed to create connection between nodes.');
      }
    },
    [chainId, setEdges, isSupplyChainFinalized]
  );

  const addNode = useCallback(
    async nodeData => {
      if (isSupplyChainFinalized) {
        setError('Supply chain is finalized. No new nodes can be added.');
        return;
      }

      try {
        if (!nodeData.x) nodeData.x = Math.random() * 500;
        if (!nodeData.y) nodeData.y = Math.random() * 500;

        const response = await supplyChainService.addNode(chainId, nodeData);
        const newNode = response.data;

        setNodes(nodes => [
          ...nodes,
          {
            id: newNode.id.toString(),
            type: 'custom',
            position: { x: newNode.x, y: newNode.y },
            data: {
              label: newNode.name,
              role: newNode.role,
              status: newNode.status,
              assignedUserId: newNode.assignedUserId,
            },
            draggable: !isSupplyChainFinalized,
          },
        ]);

        setShowNodeModal(false);
        setSelectedNode(null);
      } catch (err) {
        console.error('Error adding node:', err);
        setError('Failed to add node to the supply chain.');
      }
    },
    [chainId, setNodes, isSupplyChainFinalized]
  );

  const updateNode = useCallback(
    async nodeData => {
      if (isSupplyChainFinalized) {
        setError('Supply chain is finalized. Nodes cannot be modified.');
        return;
      }

      try {
        const response = await supplyChainService.updateNode(
          chainId,
          nodeData.id,
          nodeData
        );
        const updatedNode = response.data;

        setNodes(nodes =>
          nodes.map(node =>
            node.id === updatedNode.id.toString()
              ? {
                  ...node,
                  data: {
                    label: updatedNode.name,
                    role: updatedNode.role,
                    status: updatedNode.status,
                    assignedUserId: updatedNode.assignedUserId,
                  },
                }
              : node
          )
        );

        setShowNodeModal(false);
        setSelectedNode(null);
      } catch (err) {
        console.error('Error updating node:', err);
        setError('Failed to update node.');
      }
    },
    [chainId, setNodes, isSupplyChainFinalized]
  );

  const finalizeSupplyChain = useCallback(async () => {
    try {

      await supplyChainService.finalizeSupplyChain(chainId);
      setIsSupplyChainFinalized(true);
      setError(null);
      setTimeout(() => {
        checkNodeAuthorizationStatus();
      }, 3000); 
    } catch (err) {
      console.error('Error finalizing supply chain:', err);
      setError('Failed to finalize supply chain.');
    }
  }, [chainId, nodes, edges, setNodes, setEdges, checkNodeAuthorizationStatus]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNodesChange = useCallback(
    changes => {
      if (isSupplyChainFinalized) {
        const allowedChanges = changes.filter(
          change => change.type === 'position' || change.type === 'select'
        );
        onNodesChange(allowedChanges);
      } else {
        onNodesChange(changes);
      }
    },
    [isSupplyChainFinalized, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    changes => {
      if (isSupplyChainFinalized) {

        const allowedChanges = changes.filter(
          change => change.type === 'select'
        );
        onEdgesChange(allowedChanges);
      } else {
        onEdgesChange(changes);
      }
    },
    [isSupplyChainFinalized, onEdgesChange]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 flex justify-between items-center bg-white shadow mb-2">
        <div>
          <h1 className="text-2xl font-semibold">
            {supplyChain?.name || 'Supply Chain'}
          </h1>
          {isSupplyChainFinalized && (
            <div className="text-sm text-green-600 font-medium">Finalized</div>
          )}
        </div>
        <div className="flex space-x-2">
          {!isSupplyChainFinalized && (
            <>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  setSelectedNode(null);
                  fetchUsers();
                  setShowNodeModal(true);
                }}
              >
                Add Node
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={finalizeSupplyChain}
              >
                Finalize Chain
              </button>
            </>
          )}
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            onClick={() => navigate('/supply-chains')}
          >
            Back to List
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-2 mx-4 bg-red-100 text-red-800 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button
            className="text-red-600 hover:text-red-800"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {isSupplyChainFinalized && (
        <div className="p-3 mb-2 mx-4 bg-blue-100 text-blue-800 rounded-md">
          This supply chain is finalized. Nodes and connections cannot be added,
          removed, or modified.
        </div>
      )}

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          // Additional properties to control interactivity
          nodesDraggable={!isSupplyChainFinalized}
          nodesConnectable={!isSupplyChainFinalized}
          elementsSelectable={true}
          zoomOnDoubleClick={!isSupplyChainFinalized}
        >
          <Background color="#aaa" gap={16} size={1} variant="dots" />
          <Controls />
        </ReactFlow>
      </div>

      {/* Node Modal for creating/editing nodes */}
      {showNodeModal && !isSupplyChainFinalized && (
        <NodeModal
          node={selectedNode}
          onClose={() => {
            setShowNodeModal(false);
            setSelectedNode(null);
          }}
          onSave={selectedNode ? updateNode : addNode}
          onDelete={handleNodeDelete}
          isSupplyChainFinalized={isSupplyChainFinalized}
          supplyChainId={chainId}
          users={users}
          userLoading={userLoading}
          projectRoles={PROJECT_ROLES}
          currentUser={currentUser}
        />
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && !isSupplyChainFinalized && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600">
              Warning: Dependencies Detected
            </h2>

            <p className="mb-6">{deleteMessage}</p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmDeleteModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteNode(nodeToDelete);
                  setShowConfirmDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Force Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NodeModal = ({
  node,
  onClose,
  onSave,
  onDelete,
  isSupplyChainFinalized,
  supplyChainId,
  users,
  userLoading,
  projectRoles,
  currentUser,
}) => {
  const [formData, setFormData] = useState({
    name: node?.data?.label || '',
    role: node?.data?.role || 'Unassigned',
    status: node?.data?.status || 'pending',
    assignedUserId: node?.data?.assignedUserId || '',
    x: node?.position?.x || Math.random() * 500,
    y: node?.position?.y || Math.random() * 500,
  });

  const [loading, setLoading] = useState(false);

  const filteredUsers = users.filter(user => {
    if (formData.role === 'Unassigned') return true;

    const userRole = user.role.charAt(0) + user.role.slice(1).toLowerCase();
    return userRole === formData.role;
  });

  const handleRoleChange = e => {
    const role = e.target.value;

    setFormData(prev => ({
      ...prev,
      role: role,
      assignedUserId: '',
    }));
  };

  const handleUserChange = e => {
    const userId = e.target.value;

    if (userId) {
      const selectedUser = users.find(
        user => user.id.toString() === userId.toString()
      );

      if (selectedUser) {
        const formattedRole =
          selectedUser.role.charAt(0) +
          selectedUser.role.slice(1).toLowerCase();

        setFormData(prev => ({
          ...prev,
          assignedUserId: userId,
          role: formattedRole,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          assignedUserId: userId,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        assignedUserId: '',
      }));
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;

    if (name !== 'role' && name !== 'assignedUserId') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (isSupplyChainFinalized) {
      alert('Supply chain is finalized. Changes are not allowed.');
      return;
    }

    setLoading(true);

    try {
      if (node) {
        await onSave({
          ...formData,
          id: node.id,
        });
      } else {
        await onSave(formData);
      }
    } catch (err) {
      console.error('Error saving node:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {node ? 'Edit Node' : 'Add New Node'}
          {isSupplyChainFinalized && (
            <span className="text-sm text-red-500 ml-2">(Read Only)</span>
          )}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={isSupplyChainFinalized}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={isSupplyChainFinalized}
            >
              {projectRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Status
            </label>
            <div className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100">
              {node ? node.data.status : 'pending'}{' '}
              {/* Display current status for existing nodes or pending for new */}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Status is managed automatically by the system
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Assign User
            </label>
            <select
              name="assignedUserId"
              value={formData.assignedUserId}
              onChange={handleUserChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={userLoading || isSupplyChainFinalized}
            >
              <option value="">Not Assigned</option>

              {userLoading ? (
                <option disabled>Loading users...</option>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))
              ) : (
                formData.role !== 'Unassigned' && (
                  <option disabled>
                    No {formData.role.toLowerCase()} users available
                  </option>
                )
              )}
            </select>

            {formData.role !== 'Unassigned' &&
              filteredUsers.length === 0 &&
              !userLoading && (
                <p className="mt-1 text-sm text-orange-600">
                  No users with the {formData.role} role are available.
                </p>
              )}
          </div>

          <div className="flex justify-between">
            <div>
              {node && !isSupplyChainFinalized && (
                <button
                  type="button"
                  onClick={() => onDelete(node.id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              {!isSupplyChainFinalized && (
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplyChainView;
