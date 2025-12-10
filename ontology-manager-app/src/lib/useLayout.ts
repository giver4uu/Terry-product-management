
import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import dagre from 'dagre';
import { useOntologyStore } from '../stores/useOntologyStore';
import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide
} from 'd3-force';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Node dimensions for layout calculation
const NODE_WIDTH = 250;
const NODE_HEIGHT = 150;

export const useLayout = () => {
    // We use store actions to persist the layout changes
    // But for layout animation we might want to use reactflow state, 
    // however for a "Snap to Graph" action, updating the store is correct.
    const { onNodesChange } = useOntologyStore();
    const { getNodes, getEdges } = useReactFlow();

    const onLayout = useCallback((direction = 'TB') => {
        const nodes = getNodes();
        const edges = getEdges();

        dagreGraph.setGraph({ rankdir: direction });

        nodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
        });

        edges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        // Map layouted positions back to nodes
        const layoutedNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            // Dagre gives center point, ReactFlow expects top-left
            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - NODE_WIDTH / 2,
                    y: nodeWithPosition.y - NODE_HEIGHT / 2,
                },
            };
        });

        // Trigger update
        // We trigger an explicit change event for all nodes
        onNodesChange(
            layoutedNodes.map(node => ({
                id: node.id,
                type: 'position',
                position: node.position
            } as any))
        );
    }, [getNodes, getEdges, onNodesChange]);

    const onForceLayout = useCallback(() => {
        const nodes = getNodes();
        const edges = getEdges();

        // Create a simulation
        // D3 modifies objects in place, so we create clones to avoid state mutation issues initially
        const simNodes = nodes.map(node => ({ ...node, x: node.position.x, y: node.position.y }));
        const simEdges = edges.map(edge => ({ ...edge, source: edge.source, target: edge.target }));

        const simulation = forceSimulation(simNodes as any)
            .force("link", forceLink(simEdges).id((d: any) => d.id).distance(150)) // 150 distance as per user code
            .force("charge", forceManyBody().strength(-800)) // -800 strength as per user code
            .force("center", forceCenter(0, 0))
            .force("collide", forceCollide().radius(40)); // 40 radius collision

        // Run simulation manually for a few ticks to settle (static layout)
        // Alternatively we can run it on tick, but for "Snap to Layout" static is fine
        simulation.stop();
        for (let i = 0; i < 300; ++i) simulation.tick();

        // Map positions back
        const layoutedNodes = simNodes.map((node: any) => ({
            id: node.id,
            type: 'position',
            position: {
                x: node.x - NODE_WIDTH / 2, // Adjust center to top-left
                y: node.y - NODE_HEIGHT / 2
            }
        }));

        onNodesChange(layoutedNodes as any);

    }, [getNodes, getEdges, onNodesChange]);

    return { onLayout, onForceLayout };
};
