import React, { useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

const ItemGraph = ({ item, parentItems, childItems }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const getStatusColor = status => {
    if (!status) return '#999';
    const statusStr = status.toString().toUpperCase();

    switch (statusStr) {
      case 'CREATED':
        return '#10B981';
      case 'IN_TRANSIT':
        return '#3B82F6';
      case 'PROCESSING':
        return '#F59E0B';
      case 'COMPLETED':
        return '#8B5CF6';
      case 'REJECTED':
        return '#EF4444';
      case 'CHURNED':
        return '#F97316';
      case 'RECYCLED':
        return '#059669';
      default:
        return '#999';
    }
  };

  const getItemTypeIcon = type => {
    if (!type) return '❓';
    const typeStr = type.toString().toLowerCase();

    switch (typeStr) {
      case 'raw-material':
        return '🧱';
      case 'allocated-material':
        return '📦';
      case 'recycled-material':
        return '♻️';
      case 'manufactured-product':
        return '🛠️';
      case 'order':
        return '📝';
      case 'material-request':
        return '📋';
      default:
        return '❓';
    }
  };

  useEffect(() => {
    if (!item) return;

    const newNodes = [];
    const newEdges = [];

    newNodes.push({
      id: `item-${item.id}`,
      data: {
        label: (
          <div>
            <div className="font-bold">
              {getItemTypeIcon(item.itemType)} {item.name || `Item #${item.id}`}
            </div>
            <div className="text-xs">ID: {item.id}</div>
            <div className="text-xs">Qty: {item.quantity}</div>
          </div>
        ),
      },
      style: {
        background: '#fff',
        color: '#000',
        border: `2px solid ${getStatusColor(item.status)}`,
        borderRadius: '8px',
        width: 150,
        padding: 10,
        fontSize: '12px',
      },
      position: { x: 300, y: 200 },
    });

    if (parentItems && parentItems.length > 0) {
      parentItems.forEach((parent, index) => {
        const xPos = 100;
        const yPos = 100 + index * 100;

        newNodes.push({
          id: `parent-${parent.id}`,
          data: {
            label: (
              <div>
                <div>
                  {getItemTypeIcon(parent.type)}{' '}
                  {parent.name || `Item #${parent.id}`}
                </div>
                <div className="text-xs">ID: {parent.id}</div>
              </div>
            ),
          },
          style: {
            background: '#f0f9ff',
            color: '#000',
            border: `2px solid ${getStatusColor(parent.status)}`,
            borderRadius: '8px',
            width: 150,
            padding: 10,
            fontSize: '12px',
          },
          position: { x: xPos, y: yPos },
        });

        newEdges.push({
          id: `edge-parent-${parent.id}-to-item-${item.id}`,
          source: `parent-${parent.id}`,
          target: `item-${item.id}`,
          animated: true,
          style: { stroke: '#888' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          label: 'input',
        });
      });
    }

    if (childItems && childItems.length > 0) {
      childItems
        .filter(child => child && child.id)
        .forEach((child, index) => {
          const xPos = 500;
          const yPos = 100 + index * 100;

          newNodes.push({
            id: `child-${child.id}`,
            data: {
              label: (
                <div>
                  <div>
                    {getItemTypeIcon(child.type)}{' '}
                    {child.name || `Item #${child.id}`}
                  </div>
                  <div className="text-xs">ID: {child.id}</div>
                </div>
              ),
            },
            style: {
              background: '#f0fff4',
              color: '#000',
              border: `2px solid ${getStatusColor(child.status)}`,
              borderRadius: '8px',
              width: 150,
              padding: 10,
              fontSize: '12px',
            },
            position: { x: xPos, y: yPos },
          });

          newEdges.push({
            id: `edge-item-${item.id}-to-child-${child.id}`,
            source: `item-${item.id}`,
            target: `child-${child.id}`,
            animated: true,
            style: { stroke: '#888' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            label: 'output',
          });
        });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [item, parentItems, childItems]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-96 mt-4">
      <h4 className="text-md font-medium mb-2">Item Relationships Graph</h4>
      <div style={{ height: '300px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default ItemGraph;