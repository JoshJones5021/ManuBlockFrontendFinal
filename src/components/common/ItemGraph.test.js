// Mock the ReactFlow module before imports
jest.mock('reactflow', () => ({
    MiniMap: () => <div data-testid="mini-map">MiniMap</div>,
    Controls: () => <div data-testid="controls">Controls</div>,
    Background: () => <div data-testid="background">Background</div>,
    useNodesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
    useEdgesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
    MarkerType: {
      ArrowClosed: 'arrowclosed',
    },
    __esModule: true,
    default: ({ children }) => (
      <div data-testid="react-flow">
        {children}
      </div>
    ),
  }));
  
  import React from 'react';
  import { render, screen } from '@testing-library/react';
  import ItemGraph from './ItemGraph';
  import { useNodesState, useEdgesState } from 'reactflow';
  
  describe('ItemGraph Component', () => {
    const mockNodesState = [];
    const mockSetNodes = jest.fn();
    const mockOnNodesChange = jest.fn();
    
    const mockEdgesState = [];
    const mockSetEdges = jest.fn();
    const mockOnEdgesChange = jest.fn();
  
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock the hook return values
      useNodesState.mockReturnValue([mockNodesState, mockSetNodes, mockOnNodesChange]);
      useEdgesState.mockReturnValue([mockEdgesState, mockSetEdges, mockOnEdgesChange]);
    });
  
    test('renders the component with title', () => {
      render(<ItemGraph item={{ id: 1 }} />);
      
      expect(screen.getByText('Item Relationships Graph')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('mini-map')).toBeInTheDocument();
      expect(screen.getByTestId('controls')).toBeInTheDocument();
      expect(screen.getByTestId('background')).toBeInTheDocument();
    });
  
    test('creates nodes and edges for item', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        itemType: 'manufactured-product',
        status: 'CREATED',
        quantity: 10
      };
  
      render(<ItemGraph item={mockItem} parentItems={[]} childItems={[]} />);
  
      // Verify nodes were created for the item
      expect(mockSetNodes).toHaveBeenCalled();
      
      // Check the structure of the node passed to setNodes
      const nodesArg = mockSetNodes.mock.calls[0][0];
      expect(nodesArg).toHaveLength(1);
      expect(nodesArg[0].id).toBe(`item-${mockItem.id}`);
      expect(nodesArg[0].style.border).toContain('#10B981'); // Color for CREATED status
    });
  
    test('creates nodes and edges for item with parents', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        itemType: 'manufactured-product',
        status: 'CREATED',
        quantity: 10
      };
  
      const mockParent = {
        id: 2,
        name: 'Parent Item',
        type: 'raw-material',
        status: 'COMPLETED'
      };
  
      render(<ItemGraph item={mockItem} parentItems={[mockParent]} childItems={[]} />);
  
      // Verify nodes and edges were created
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
      
      const nodesArg = mockSetNodes.mock.calls[0][0];
      const edgesArg = mockSetEdges.mock.calls[0][0];
      
      // Should have 2 nodes: item and parent
      expect(nodesArg).toHaveLength(2);
      
      // Check parent node
      const parentNode = nodesArg.find(node => node.id === `parent-${mockParent.id}`);
      expect(parentNode).toBeDefined();
      expect(parentNode.style.border).toContain('#8B5CF6'); // Color for COMPLETED status
      
      // Should have 1 edge: parent -> item
      expect(edgesArg).toHaveLength(1);
      expect(edgesArg[0].source).toBe(`parent-${mockParent.id}`);
      expect(edgesArg[0].target).toBe(`item-${mockItem.id}`);
    });
  
    test('creates nodes and edges for item with children', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        itemType: 'raw-material',
        status: 'IN_TRANSIT',
        quantity: 10
      };
  
      const mockChild = {
        id: 3,
        name: 'Child Item',
        type: 'manufactured-product',
        status: 'PROCESSING'
      };
  
      render(<ItemGraph item={mockItem} parentItems={[]} childItems={[mockChild]} />);
  
      // Verify nodes and edges were created
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
      
      const nodesArg = mockSetNodes.mock.calls[0][0];
      const edgesArg = mockSetEdges.mock.calls[0][0];
      
      // Should have 2 nodes: item and child
      expect(nodesArg).toHaveLength(2);
      
      // Check child node
      const childNode = nodesArg.find(node => node.id === `child-${mockChild.id}`);
      expect(childNode).toBeDefined();
      expect(childNode.style.border).toContain('#F59E0B'); // Color for PROCESSING status
      
      // Should have 1 edge: item -> child
      expect(edgesArg).toHaveLength(1);
      expect(edgesArg[0].source).toBe(`item-${mockItem.id}`);
      expect(edgesArg[0].target).toBe(`child-${mockChild.id}`);
    });
  
    test('handles complex graph with multiple parents and children', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        itemType: 'manufactured-product',
        status: 'CREATED',
        quantity: 10
      };
  
      const mockParents = [
        {
          id: 2,
          name: 'Parent Item 1',
          type: 'raw-material',
          status: 'COMPLETED'
        },
        {
          id: 3,
          name: 'Parent Item 2',
          type: 'allocated-material',
          status: 'PROCESSING'
        }
      ];
  
      const mockChildren = [
        {
          id: 4,
          name: 'Child Item 1',
          type: 'order',
          status: 'IN_TRANSIT'
        },
        {
          id: 5,
          name: 'Child Item 2',
          type: 'manufactured-product',
          status: 'REJECTED'
        }
      ];
  
      render(
        <ItemGraph 
          item={mockItem} 
          parentItems={mockParents} 
          childItems={mockChildren} 
        />
      );
  
      // Verify nodes and edges were created
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
      
      const nodesArg = mockSetNodes.mock.calls[0][0];
      const edgesArg = mockSetEdges.mock.calls[0][0];
      
      // Should have 5 nodes: 1 item, 2 parents, 2 children
      expect(nodesArg).toHaveLength(5);
      
      // Should have 4 edges: 2 from parents to item, 2 from item to children
      expect(edgesArg).toHaveLength(4);
      
      // Check parent edges
      expect(edgesArg.some(edge => edge.source === `parent-2` && edge.target === `item-1`)).toBeTruthy();
      expect(edgesArg.some(edge => edge.source === `parent-3` && edge.target === `item-1`)).toBeTruthy();
      
      // Check child edges
      expect(edgesArg.some(edge => edge.source === `item-1` && edge.target === `child-4`)).toBeTruthy();
      expect(edgesArg.some(edge => edge.source === `item-1` && edge.target === `child-5`)).toBeTruthy();
    });
  
    test('handles null or undefined item gracefully', () => {
      render(<ItemGraph item={null} />);
      
      // Component should render but not call setNodes
      expect(screen.getByText('Item Relationships Graph')).toBeInTheDocument();
      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockSetEdges).not.toHaveBeenCalled();
    });
  
    test('handles empty arrays of parents and children', () => {
      const mockItem = {
        id: 1,
        name: 'Lonely Item',
        itemType: 'manufactured-product',
        status: 'CREATED',
        quantity: 10
      };
  
      render(<ItemGraph item={mockItem} parentItems={[]} childItems={[]} />);
      
      // Should only create a node for the item
      expect(mockSetNodes).toHaveBeenCalled();
      const nodesArg = mockSetNodes.mock.calls[0][0];
      expect(nodesArg).toHaveLength(1);
      
      // Should not create any edges
      expect(mockSetEdges).toHaveBeenCalled();
      const edgesArg = mockSetEdges.mock.calls[0][0];
      expect(edgesArg).toHaveLength(0);
    });
  
    test('handles different item types with correct icons', () => {
      const itemTypes = [
        { type: 'raw-material', expectedIcon: '🧱' },
        { type: 'allocated-material', expectedIcon: '📦' },
        { type: 'recycled-material', expectedIcon: '♻️' },
        { type: 'manufactured-product', expectedIcon: '🛠️' },
        { type: 'order', expectedIcon: '📝' },
        { type: 'material-request', expectedIcon: '📋' },
        { type: 'unknown-type', expectedIcon: '❓' }
      ];
  
      itemTypes.forEach(({ type, expectedIcon }) => {
        mockSetNodes.mockClear();
        
        const mockItem = {
          id: 1,
          name: `Test ${type}`,
          itemType: type,
          status: 'CREATED',
          quantity: 10
        };
  
        render(<ItemGraph item={mockItem} />);
        
        // Check if the node data contains the correct icon
        const nodesArg = mockSetNodes.mock.calls[0][0];
        const nodeData = nodesArg[0].data.label.props.children[0].props.children;
        expect(nodeData[0]).toBe(expectedIcon);
      });
    });
  
    test('handles different item statuses with correct colors', () => {
      const statusColors = [
        { status: 'CREATED', expectedColor: '#10B981' },
        { status: 'IN_TRANSIT', expectedColor: '#3B82F6' },
        { status: 'PROCESSING', expectedColor: '#F59E0B' },
        { status: 'COMPLETED', expectedColor: '#8B5CF6' },
        { status: 'REJECTED', expectedColor: '#EF4444' },
        { status: 'CHURNED', expectedColor: '#F97316' },
        { status: 'RECYCLED', expectedColor: '#059669' },
        { status: 'UNKNOWN', expectedColor: '#999' }
      ];
  
      statusColors.forEach(({ status, expectedColor }) => {
        mockSetNodes.mockClear();
        
        const mockItem = {
          id: 1,
          name: `Test Item with ${status}`,
          itemType: 'manufactured-product',
          status: status,
          quantity: 10
        };
  
        render(<ItemGraph item={mockItem} />);
        
        // Check if the node style contains the correct border color
        const nodesArg = mockSetNodes.mock.calls[0][0];
        expect(nodesArg[0].style.border).toContain(expectedColor);
      });
    });
  });