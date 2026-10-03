'use client';
import {Background,Controls,Handle,Position,ReactFlow,type Edge,type Node,type NodeProps} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {AnalysisResult} from '@/lib/types';
type GraphData={label:string;kind:string;shared?:boolean};
function CardNode({data}:NodeProps<Node<GraphData>>){return <div className={`graphnode ${data.kind} ${data.shared?'shared':''}`}><Handle type="target" position={Position.Left}/><span>{data.kind.replace('_',' ')}</span><b>{data.label}</b><Handle type="source" position={Position.Right}/></div>}
const nodeTypes={evidenceNode:CardNode};
export function EvidenceGraph({result,selectedFindingId}:{result:AnalysisResult;selectedFindingId:string|null}){const active=new Set(result.findings.find(f=>f.id===selectedFindingId)?.graphNodeIds??[]);const nodes=result.graph.nodes as Node<GraphData>[];const edges=result.graph.edges as Edge[];return <div className="graphwrap" aria-label="Evidence chain graph"><ReactFlow nodes={nodes.map(n=>({...n,style:{opacity:!selectedFindingId||active.has(n.id)?1:.23}}))} edges={edges.map(e=>{const hot=!selectedFindingId||active.has(e.source)&&active.has(e.target);return{...e,type:'smoothstep',animated:!!selectedFindingId&&hot,style:{stroke:hot?'#146b60':'#cad8d3',strokeWidth:hot?2.5:1.2,opacity:hot?1:.22}};})} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.2}} nodesConnectable={false} nodesDraggable={false} elementsSelectable proOptions={{hideAttribution:true}}><Background color="#d8e4df" gap={22}/><Controls/></ReactFlow></div>}
