import { CircuitComponent, Connection } from './types';

export function simulateCircuit(components: CircuitComponent[], connections: Connection[]) {
  const batteries = components.filter(c => c.type === 'battery');
  if (batteries.length === 0) return components.map(c => ({ ...c, state: false }));

  // Build adjacency list of pins
  const adj = new Map<string, string[]>();
  const addEdge = (u: string, v: string) => {
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u)!.push(v);
    adj.get(v)!.push(u);
  };

  // Internal connections
  components.forEach(c => {
    if (c.type === 'switch' && !c.state) return;
    addEdge(`${c.id}:0`, `${c.id}:1`);
  });

  // External connections
  connections.forEach(conn => {
    addEdge(`${conn.fromId}:${conn.fromPin}`, `${conn.toId}:${conn.toPin}`);
  });

  const activeNodes = new Set<string>();

  // For each battery, find if it's part of a loop
  batteries.forEach(battery => {
    const startNode = `${battery.id}:0`;
    const endNode = `${battery.id}:1`;

    // Find all paths from start to end
    // For simplicity in a game, we just check if they are connected
    const visited = new Set<string>();
    const queue = [startNode];
    visited.add(startNode);

    let connected = false;
    const pathNodes = new Set<string>();
    
    // Simple BFS to check connectivity
    const bfsVisited = new Set<string>();
    const bfsQueue = [startNode];
    bfsVisited.add(startNode);
    
    while(bfsQueue.length > 0) {
      const node = bfsQueue.shift()!;
      if (node === endNode) connected = true;
      (adj.get(node) || []).forEach(next => {
        if (!bfsVisited.has(next)) {
          bfsVisited.add(next);
          bfsQueue.push(next);
        }
      });
    }

    if (connected) {
      // If connected, all nodes reachable from this battery are potentially active
      // In a real simulator we'd use Kirchhoff's laws, but here we'll just light up
      // everything that is part of the connected component of a closed battery
      bfsVisited.forEach(node => activeNodes.add(node));
    }
  });

  return components.map(c => {
    if (c.type === 'led') {
      const isActive = activeNodes.has(`${c.id}:0`) && activeNodes.has(`${c.id}:1`);
      return { ...c, state: isActive };
    }
    return c;
  });
}
