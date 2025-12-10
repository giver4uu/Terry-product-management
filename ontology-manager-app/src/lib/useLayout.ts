
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

        // Find Candidate position to use as center offset
        const candidatePosition = dagreGraph.node('candidate');
        const offsetX = candidatePosition ? candidatePosition.x : 0;
        const offsetY = candidatePosition ? candidatePosition.y : 0;

        // Map layouted positions back to nodes, shifting so Candidate is at center
        const layoutedNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - offsetX - NODE_WIDTH / 2,
                    y: nodeWithPosition.y - offsetY - NODE_HEIGHT / 2,
                },
            };
        });

        // Trigger update
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
        const simNodes = nodes.map(node => ({
            ...node,
            x: node.position.x,
            y: node.position.y,
            // Fix Candidate at center
            fx: node.id === 'candidate' ? 0 : undefined,
            fy: node.id === 'candidate' ? 0 : undefined
        }));
        const simEdges = edges.map(edge => ({ ...edge, source: edge.source, target: edge.target }));

        const simulation = forceSimulation(simNodes as any)
            .force("link", forceLink(simEdges).id((d: any) => d.id).distance(180)) // Increased distance for better spread
            .force("charge", forceManyBody().strength(-600)) // Slightly less repulsion
            .force("center", forceCenter(0, 0))
            .force("collide", forceCollide().radius(60)); // Larger collision radius

        // Run simulation manually for a few ticks to settle (static layout)
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
