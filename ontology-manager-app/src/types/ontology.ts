
export type PropertyType = 'text' | 'number' | 'date' | 'boolean';

export interface PropertyDefinition {
    id: string;
    name: string;
    type: PropertyType;
    required: boolean;
    description?: string;
}

export type Cardinality = '1:1' | '1:N' | 'N:1' | 'N:M';

export interface LogicRule {
    id: string;
    type: 'cardinality' | 'disjoint' | 'validation';
    targetId?: string; // For disjoint (with which class?) or validation target
    value?: string; // For validation rule text or cardinality value
    description: string;
}

export interface OntologyNodeData {
    label: string;
    kind: 'class' | 'property';  // QW#1: Required field (was 'type?')
    properties: PropertyDefinition[];
    rules: LogicRule[];
    description?: string;

    // QW#2: Metadata for Graph View property nodes
    _metadata?: {
        originalType?: PropertyType;
        originalRequired?: boolean;
        originalId?: string;
        parentClassId?: string;
    };
}

export interface OntologyEdgeData {
    label: string;
    cardinality: Cardinality;
    description?: string;
    isPropertyEdge?: boolean;
}
