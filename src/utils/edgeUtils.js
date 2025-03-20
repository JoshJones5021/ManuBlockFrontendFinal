// src/utils/edgeUtils.js
// Utility functions for working with edges in the supply chain

/**
 * Check if adding an edge would create a cycle in the graph
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of existing edge objects
 * @param {string} sourceId - ID of the source node
 * @param {string} targetId - ID of the target node
 * @returns {boolean} - True if adding the edge would create a cycle
 */
export const wouldCreateCycle = (nodes, edges, sourceId, targetId) => {
  // Edge case - self-loop
  if (sourceId === targetId) {
    return true;
  }

  // Build adjacency list representation of the graph
  const adjacencyList = {};
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });

  // Add existing edges to the adjacency list
  edges.forEach(edge => {
    if (adjacencyList[edge.source]) {
      adjacencyList[edge.source].push(edge.target);
    }
  });

  // Temporarily add the new edge
  if (adjacencyList[sourceId]) {
    adjacencyList[sourceId].push(targetId);
  }

  // Depth-first search to detect cycles
  const visited = {};
  const recursionStack = {};

  const hasCycle = nodeId => {
    // Mark the current node as visited and add to recursion stack
    visited[nodeId] = true;
    recursionStack[nodeId] = true;

    // Visit all adjacent vertices
    const neighbors = adjacencyList[nodeId] || [];
    for (const neighbor of neighbors) {
      // If not visited, recursively check for cycles
      if (!visited[neighbor]) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }
      // If the node is in the recursion stack, we found a cycle
      else if (recursionStack[neighbor]) {
        return true;
      }
    }

    // Remove the node from recursion stack
    recursionStack[nodeId] = false;
    return false;
  };

  // Check all nodes for cycles
  for (const nodeId in adjacencyList) {
    if (!visited[nodeId]) {
      if (hasCycle(nodeId)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Find orphaned nodes (nodes with no incoming or outgoing edges)
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {Array} - Array of orphaned node IDs
 */
export const findOrphanedNodes = (nodes, edges) => {
  return nodes
    .filter(node => {
      return !edges.some(
        edge => edge.source === node.id || edge.target === node.id
      );
    })
    .map(node => node.id);
};

/**
 * Generate a path from source to target if it exists
 * @param {Array} edges - Array of edge objects
 * @param {string} source - Source node ID
 * @param {string} target - Target node ID
 * @returns {Array|null} - Array of node IDs forming the path, or null if no path exists
 */
export const findPath = (edges, source, target) => {
  // Build adjacency list
  const adjacencyList = {};
  edges.forEach(edge => {
    if (!adjacencyList[edge.source]) {
      adjacencyList[edge.source] = [];
    }
    adjacencyList[edge.source].push(edge.target);
  });

  // Breadth-first search
  const queue = [[source]];
  const visited = new Set();

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === target) {
      return path;
    }

    if (!visited.has(node)) {
      visited.add(node);

      const neighbors = adjacencyList[node] || [];
      for (const neighbor of neighbors) {
        queue.push([...path, neighbor]);
      }
    }
  }

  return null; // No path found
};

/**
 * Calculate the shortest path between two nodes
 * @param {Array} edges - Array of edge objects
 * @param {string} source - Source node ID
 * @param {string} target - Target node ID
 * @returns {Array|null} - Array of node IDs forming the shortest path, or null if no path exists
 */
export const findShortestPath = (edges, source, target) => {
  // Build adjacency list
  const adjacencyList = {};
  edges.forEach(edge => {
    if (!adjacencyList[edge.source]) {
      adjacencyList[edge.source] = [];
    }
    adjacencyList[edge.source].push(edge.target);
  });

  // Breadth-first search (BFS always finds shortest path in unweighted graph)
  const queue = [[source]];
  const visited = new Set();

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === target) {
      return path;
    }

    if (!visited.has(node)) {
      visited.add(node);

      const neighbors = adjacencyList[node] || [];
      for (const neighbor of neighbors) {
        queue.push([...path, neighbor]);
      }
    }
  }

  return null; // No path found
};

/**
 * Get all nodes in a path from source to target
 * @param {Object} nodes - Map of nodes by ID
 * @param {Array} path - Array of node IDs
 * @returns {Array} - Array of node objects in the path
 */
export const getNodesInPath = (nodes, path) => {
  return path.map(id => nodes[id]).filter(Boolean);
};

/**
 * Get all edges in a path from source to target
 * @param {Array} edges - Array of edge objects
 * @param {Array} path - Array of node IDs
 * @returns {Array} - Array of edge objects in the path
 */
export const getEdgesInPath = (edges, path) => {
  const result = [];

  // Go through adjacent pairs in the path
  for (let i = 0; i < path.length - 1; i++) {
    const sourceId = path[i];
    const targetId = path[i + 1];

    // Find the edge connecting these nodes
    const edge = edges.find(
      e => e.source === sourceId && e.target === targetId
    );

    if (edge) {
      result.push(edge);
    }
  }

  return result;
};

const edgeUtils = {
  wouldCreateCycle,
  findOrphanedNodes,
  findPath,
  findShortestPath,
  getNodesInPath,
  getEdgesInPath,
};

export default edgeUtils;
