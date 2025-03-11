import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import supplyChainService from '../../services/supplyChain';
import { useAuth } from '../../context/AuthContext';

// Custom node types could be defined here
const nodeTypes = {};

const SupplyChainView = () => {
  const { chainId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [supplyChain, setSupplyChain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeSource, setEdgeSource] = useState(null);

  // Fetch the supply chain data
  const fetchSupplyChain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplyChainService.getSupplyChainById(chainId);
      const supplyChainData = response.data;
      
      setSupplyChain(supplyChainData);
      
      // Transform nodes and edges for ReactFlow
      const formattedNodes = supplyChainData.nodes.map(node => ({
        id: node.id.toString(),
        type: 'default',
        position: { x: node.x, y: node.y },
        data: { 
          label: node.name,
          role: node.role, 
          status: node.status,
          assignedUserId: node.assignedUserId
        },
        className: `node-status-${node.status}`
      }));
      
      const formattedEdges = supplyChainData.edges.map(edge => ({
        id: edge.id.toString(),
        source: edge.source.id.toString(),
        target: edge.target.id.toString(),
        animated: edge.animated,
        style: { 
          stroke: edge.strokeColor || '#666',
          strokeWidth: edge.strokeWidth || 1
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.strokeColor || '#666',
        }
      }));
      
      setNodes(formattedNodes);
      setEdges(formattedEdges);
    } catch (err) {
      console.error('Error fetching supply chain:', err);
      setError('Failed to load supply chain details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    fetchSupplyChain();
  }, [fetchSupplyChain]);

  // Handle node changes (position, selection)
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Save node position after dragging
  const onNodeDragStop = useCallback(
    async (event, node) => {
      // Update node position in the database
      try {
        await supplyChainService.updateNode(chainId, node.id, {
          x: node.position.x,
          y: node.position.y
        });
      } catch (err) {
        console.error('Error updating node position:', err);
      }
    },
    [chainId]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (event, node) => {
      if (isCreatingEdge) {
        // If we're creating an edge, this is the target node
        if (edgeSource && edgeSource !== node.id) {
          // Create edge between source and target
          createEdge(edgeSource, node.id);
          setIsCreatingEdge(false);
          setEdgeSource(null);
        }
      } else {
        // Regular node click - select the node
        setSelectedNode(node);
        setShowNodeModal(true);
      }
    },
    [isCreatingEdge, edgeSource]
  );

  // Create a new edge between nodes
  const createEdge = async (sourceId, targetId) => {
    try {
      const response = await supplyChainService.addEdge(chainId, {
        source: { id: sourceId },
        target: { id: targetId },
        animated: false,
        strokeColor: '#666',
        strokeWidth: 1
      });
      
      // Refresh the supply chain to show the new edge
      fetchSupplyChain();
    } catch (err) {
      console.error('Error creating edge:', err);
      setError('Failed to create connection between nodes.');
    }
  };

  // Handle starting edge creation
  const startEdgeCreation = () => {
    setIsCreatingEdge(true);
    setEdgeSource(null);
  };

  // Add a new node to the supply chain
  const addNode = async (nodeData) => {
    try {
      // Set default position if not provided
      if (!nodeData.x) nodeData.x = Math.random() * 500;
      if (!nodeData.y) nodeData.y = Math.random() * 500;
      
      const response = await supplyChainService.addNode(chainId, nodeData);
      
      // Refresh the supply chain to show the new node
      fetchSupplyChain();
    } catch (err) {
      console.error('Error adding node:', err);
      setError('Failed to add node to the supply chain.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline ml-2">{error}</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <div className="p-4 flex justify-between items-center bg-white shadow mb-4">
        <h1 className="text-2xl font-semibold">{supplyChain?.name || 'Supply Chain'}</h1>
        <div className="flex space-x-2">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowNodeModal(true)}
          >
            Add Node
          </button>
          <button 
            className={`px-4 py-2 ${isCreatingEdge ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded`}
            onClick={startEdgeCreation}
          >
            {isCreatingEdge ? 'Select Source Node' : 'Create Connection'}
          </button>
          <button 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            onClick={() => navigate('/supply-chains')}
          >
            Back to List
          </button>
        </div>
      </div>
      
      {isCreatingEdge && (
        <div className="p-2 mb-4 bg-yellow-100 text-yellow-800 rounded">
          {edgeSource 
            ? 'Now click on the target node to create the connection' 
            : 'Click on the source node to start the connection'
          }
        </div>
      )}
      
      <div style={{ height: 'calc(100vh - 120px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onPaneClick={() => {
            setSelectedNode(null);
            setShowNodeModal(false);
          }}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      
      {/* Node Modal for creating/editing nodes */}
      {showNodeModal && (
        <NodeModal 
          node={selectedNode} 
          onClose={() => {
            setShowNodeModal(false);
            setSelectedNode(null);
          }}
          onSave={addNode}
          onDelete={async (nodeId) => {
            try {
              await supplyChainService.deleteNode(chainId, nodeId);
              fetchSupplyChain();
              setShowNodeModal(false);
              setSelectedNode(null);
            } catch (err) {
              console.error('Error deleting node:', err);
            }
          }}
          supplyChainId={chainId}
        />
      )}
    </div>
  );
};

// Node Modal Component
const NodeModal = ({ node, onClose, onSave, onDelete, supplyChainId }) => {
  const [formData, setFormData] = useState({
    name: node?.data?.label || '',
    role: node?.data?.role || 'Unassigned',
    status: node?.data?.status || 'pending',
    assignedUserId: node?.data?.assignedUserId || '',
    x: node?.position?.x || Math.random() * 500,
    y: node?.position?.y || Math.random() * 500
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (node) {
        // Update existing node
        await onSave({
          ...formData,
          id: node.id
        });
      } else {
        // Create new node
        await onSave(formData);
      }
      onClose();
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
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="Unassigned">Unassigned</option>
              <option value="Supplier">Supplier</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Distributor">Distributor</option>
              <option value="Customer">Customer</option>
              <option value="Warehouse">Warehouse</option>
              <option value="QA">Quality Assurance</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Assign User
            </label>
            <select
              name="assignedUserId"
              value={formData.assignedUserId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Not Assigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-between">
            <div>
              {node && (
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
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplyChainView;