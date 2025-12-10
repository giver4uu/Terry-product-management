import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { OntologyNodeData } from '../types/ontology';
import { cn } from '../lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';

const GraphNode = ({ data, selected }: NodeProps<OntologyNodeData>) => {
    return (
        <Tooltip.Provider>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <div className="group relative flex flex-col items-center justify-center">
                        <div
                            className={cn(
                                "w-4 h-4 rounded-full transition-all duration-300 shadow-lg",
                                // Color logic: Property = Amber/Orange, Class (Default) = Blue
                                data.type === 'property'
                                    ? "bg-amber-500 border-2 border-slate-900"
                                    : "bg-blue-500 border-2 border-slate-900",
                                selected
                                    ? "w-6 h-6 ring-4 z-50 scale-110 " + (data.type === 'property' ? "bg-amber-400 ring-amber-500/30" : "bg-blue-400 ring-blue-500/30")
                                    : "group-hover:scale-125 " + (data.type === 'property' ? "group-hover:bg-amber-400" : "group-hover:bg-blue-400")
                            )}
                        >
                            {/* Handles - invisible but needed for connections */}
                            <Handle type="target" position={Position.Top} className="opacity-0 w-full h-full border-none bg-transparent" />
                            <Handle type="source" position={Position.Bottom} className="opacity-0 w-full h-full border-none bg-transparent" />
                        </div>

                        {/* Label - visible on hover or simplified "Obsidian" style always underneath but faded */}
                        <div className={cn(
                            "absolute top-6 text-[10px] font-medium text-slate-400 whitespace-nowrap transition-all pointer-events-none",
                            selected ? "text-slate-200 font-bold scale-110" : "group-hover:text-slate-300"
                        )}>
                            {data.label}
                        </div>
                    </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className="bg-slate-800 text-slate-200 text-xs px-2 py-1.5 rounded border border-slate-700 shadow-xl select-none z-50 animate-in fade-in zoom-in-95"
                        sideOffset={5}
                    >
                        <div className="font-semibold">{data.label}</div>
                        <div className="text-[10px] text-slate-400">{data.description || 'Class'}</div>
                        <Tooltip.Arrow className="fill-slate-800" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
};

export default memo(GraphNode);
