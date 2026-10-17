import React, { useState, useRef, useMemo } from 'react';
import type { GraphNode, TraceGraphData } from '../types';
import { ShieldAlert, Building2, Layers, GitFork, ZoomIn, ZoomOut, RotateCcw, Download, Sparkles, HelpCircle } from 'lucide-react';

interface InteractiveGraphProps {
  data: TraceGraphData;
  onSelectNode?: (node: GraphNode) => void;
  selectedNodeId?: string | null;
  isSimpleMode?: boolean;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  data,
  onSelectNode,
  selectedNodeId,
  isSimpleMode = false
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [highlightPath, setHighlightPath] = useState(true);
  const [minAmountFilter, setMinAmountFilter] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute node coordinates based on hop levels
  const layoutNodes = useMemo(() => {
    const nodes = data.nodes || [];
    const hopGroups: { [hop: number]: GraphNode[] } = {};

    nodes.forEach(n => {
      const h = n.hop || 0;
      if (!hopGroups[h]) hopGroups[h] = [];
      hopGroups[h].push(n);
    });

    const positioned: (GraphNode & { x: number; y: number })[] = [];
    const xSpacing = 280;
    const ySpacing = 130;

    Object.keys(hopGroups).forEach(hopStr => {
      const hop = parseInt(hopStr, 10);
      const group = hopGroups[hop];
      const startY = 120 - ((group.length - 1) * ySpacing) / 2;

      group.forEach((node, idx) => {
        positioned.push({
          ...node,
          x: 100 + hop * xSpacing,
          y: Math.max(80, startY + idx * ySpacing)
        });
      });
    });

    return positioned;
  }, [data.nodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode & { x: number; y: number }>();
    layoutNodes.forEach(n => map.set(n.id.toLowerCase(), n));
    return map;
  }, [layoutNodes]);

  const shortestPathSet = useMemo(() => {
    const set = new Set<string>();
    if (data.summary?.shortest_path_to_vasp) {
      data.summary.shortest_path_to_vasp.forEach(addr => set.add(addr.toLowerCase()));
    }
    return set;
  }, [data.summary]);

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fund_flow_graph_trace_${data.job_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="relative w-full h-[600px] bg-cyber-bg border border-cyber-border rounded-xl overflow-hidden select-none">
      {/* Beginner Mode Helper Banner */}
      {isSimpleMode && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-cyan-950/90 border border-cyan-500/40 p-2.5 rounded-lg text-xs text-cyan-200 flex items-center justify-between shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              <strong>How to read this chart:</strong> Follow the glowing line from left to right. Money starts at the <strong>Red (Scammer's Wallet)</strong>, passes through <strong>Yellow (Middlemen helpers)</strong>, and reaches the <strong>Green (Binance / Crypto Exchange)</strong> where police can freeze the funds!
            </span>
          </div>
          <span className="hidden md:inline px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
            BEGINNER FRIENDLY VIEW
          </span>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-cyber-card/90 backdrop-blur-md px-3 py-2 rounded-lg border border-cyber-border text-xs text-cyber-muted">
        <button
          onClick={() => setZoom(z => Math.min(2, z + 0.15))}
          className="p-1.5 hover:text-cyber-accent hover:bg-slate-800 rounded transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
          className="p-1.5 hover:text-cyber-accent hover:bg-slate-800 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 60, y: 40 }); }}
          className="p-1.5 hover:text-cyber-accent hover:bg-slate-800 rounded transition"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-cyber-border mx-1" />
        
        <button
          onClick={() => setHighlightPath(p => !p)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition font-medium ${
            highlightPath ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          {isSimpleMode ? 'Highlight Stolen Money Path' : 'Shortest Path to VASP'}
        </button>

        <div className="h-4 w-[1px] bg-cyber-border mx-1" />

        <div className="flex items-center gap-2">
          <span>{isSimpleMode ? 'Hide Small Amounts:' : 'Min Amount:'}</span>
          <select
            value={minAmountFilter}
            onChange={(e) => setMinAmountFilter(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value={0}>All Amounts</option>
            <option value={5000}>&gt; 5,000</option>
            <option value={15000}>&gt; 15,000</option>
            <option value={20000}>&gt; 20,000</option>
          </select>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-800 text-slate-300 rounded transition"
          title="Export Graph Snapshot"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          {isSimpleMode ? 'Save Graph' : 'Export JSON'}
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-cyber-card/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyber-border text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
          <span>{isSimpleMode ? "1. Scammer's Wallet" : "Suspect Wallet"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>{isSimpleMode ? "2. Middleman / Mule" : "Intermediary / Splitter"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span>{isSimpleMode ? "3. Real Exchange (FREEZE HERE)" : "VASP Exchange Deposit"}</span>
        </div>
      </div>

      {/* Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
            <marker
              id="arrow-highlight"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#06B6D4" />
            </marker>
          </defs>

          {/* Render Graph Edges */}
          {data.edges?.map((edge) => {
            const sourceNode = nodeMap.get(edge.source.toLowerCase());
            const targetNode = nodeMap.get(edge.target.toLowerCase());
            if (!sourceNode || !targetNode) return null;

            if (minAmountFilter > 0 && edge.amount < minAmountFilter) {
              return null;
            }

            const isPathEdge =
              highlightPath &&
              shortestPathSet.has(edge.source.toLowerCase()) &&
              shortestPathSet.has(edge.target.toLowerCase());

            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            // Curved cubic bezier path for smooth flow
            const dx = targetNode.x - sourceNode.x;
            const curveOffset = dx * 0.4;
            const d = `M ${sourceNode.x} ${sourceNode.y} C ${sourceNode.x + curveOffset} ${sourceNode.y}, ${targetNode.x - curveOffset} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`;

            return (
              <g key={edge.id} className="transition-opacity duration-300">
                <path
                  d={d}
                  fill="none"
                  stroke={isPathEdge ? '#06B6D4' : '#334155'}
                  strokeWidth={isPathEdge ? 3 : 1.5}
                  strokeDasharray={isPathEdge ? 'none' : '4,2'}
                  markerEnd={isPathEdge ? 'url(#arrow-highlight)' : 'url(#arrow-default)'}
                />
                {/* Edge transfer amount pill */}
                <rect
                  x={midX - 44}
                  y={midY - 12}
                  width="88"
                  height="22"
                  rx="11"
                  fill="#0B132B"
                  stroke={isPathEdge ? '#06B6D4' : '#1E293B'}
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill={isPathEdge ? '#38BDF8' : '#94A3B8'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {edge.amount.toLocaleString()} {edge.asset}
                </text>
              </g>
            );
          })}

          {/* Render Graph Nodes */}
          {layoutNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isRoot = node.is_root;
            const isVasp = Boolean(node.vasp_name);

            let borderColor = '#334155';
            let bgColor = '#0F172A';
            let Icon = Layers;

            if (isRoot) {
              borderColor = '#EF4444';
              bgColor = '#1F1218';
              Icon = ShieldAlert;
            } else if (isVasp) {
              borderColor = '#10B981';
              bgColor = '#0B221B';
              Icon = Building2;
            } else if (node.entity_type === 'Intermediary') {
              borderColor = '#F59E0B';
              bgColor = '#1F1A12';
              Icon = GitFork;
            }

            if (isSelected) {
              borderColor = '#38BDF8';
            }

            // User-friendly plain english label
            let displayLabel = node.label;
            if (isSimpleMode) {
              if (isRoot) {
                displayLabel = "🛑 Scammer's Wallet";
              } else if (isVasp) {
                displayLabel = `🏦 ${node.vasp_name} (Freeze Here!)`;
              } else {
                displayLabel = `🔄 Middleman Mule #${node.hop}`;
              }
            } else if (node.vasp_name) {
              displayLabel = `${node.vasp_name} CEX`;
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode?.(node);
                }}
              >
                {/* Outer Glow Halo for active or VASP nodes */}
                {(isRoot || isVasp || isSelected) && (
                  <circle
                    r="34"
                    fill={isRoot ? 'rgba(239,68,68,0.15)' : isVasp ? 'rgba(16,185,129,0.15)' : 'rgba(56,189,248,0.2)'}
                    className="animate-pulse"
                  />
                )}

                {/* Node Main Circle */}
                <circle
                  r="26"
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-transform group-hover:scale-110"
                />

                {/* Center Icon */}
                <foreignObject x="-12" y="-12" width="24" height="24">
                  <div className="w-full h-full flex items-center justify-center pointer-events-none">
                    <Icon
                      className={`w-4 h-4 ${
                        isRoot ? 'text-red-400' : isVasp ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    />
                  </div>
                </foreignObject>

                {/* Primary Node Label */}
                <text
                  x="0"
                  y="42"
                  textAnchor="middle"
                  fill="#F1F5F9"
                  fontSize="11"
                  fontWeight="600"
                  className="font-sans"
                >
                  {displayLabel}
                </text>

                {/* Short Address / Network */}
                <text
                  x="0"
                  y="55"
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {node.address.slice(0, 6)}...{node.address.slice(-4)} ({node.network})
                </text>

                {/* Risk Score Pill */}
                <rect
                  x="-18"
                  y="-38"
                  width="36"
                  height="16"
                  rx="8"
                  fill={node.risk_score >= 75 ? '#7F1D1D' : node.risk_score >= 50 ? '#78350F' : '#064E3B'}
                  stroke={node.risk_score >= 75 ? '#EF4444' : node.risk_score >= 50 ? '#F59E0B' : '#10B981'}
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="-27"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {Math.round(node.risk_score)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
