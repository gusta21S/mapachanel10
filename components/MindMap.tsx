import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { TreeNodeData } from '../types';
import { ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';

interface MindMapProps {
  data: TreeNodeData;
  onNodeClick: (node: TreeNodeData) => void;
}

const MindMap: React.FC<MindMapProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Refs for D3 objects
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const contentGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  // Configuration
  const config = {
    nodeWidth: 260,
    nodeHeight: 80, // Approximate height for spacing
    horizontalGap: 80,
    verticalGap: 30,
    duration: 500
  };

  // Handle Resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    // Call immediately to set initial size
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Main Render Logic
  useEffect(() => {
    if (!svgRef.current || !data || dimensions.width === 0) return;

    const { width, height } = dimensions;

    // 1. Setup SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear all
    svgSelectionRef.current = svg;

    // 2. Setup Zoom Group
    const g = svg.append("g");
    contentGroupRef.current = g;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // 3. Compute Hierarchy
    const root = d3.hierarchy(data);
    
    const treeLayout = d3.tree<TreeNodeData>()
      .nodeSize([config.nodeHeight + config.verticalGap, config.nodeWidth + config.horizontalGap])
      .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.3));

    treeLayout(root);

    // 4. Draw Links (Smooth Bezier)
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1") // Slate-300
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal<d3.HierarchyLink<TreeNodeData>, d3.HierarchyPointNode<TreeNodeData>>()
        .x(d => d.y)
        .y(d => d.x)
      );

    // 5. Draw Nodes
    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node group cursor-pointer")
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data);
      });

    // 6. Node Cards (ForeignObject)
    nodes.append("foreignObject")
      .attr("width", config.nodeWidth)
      .attr("height", 300) // Allow height to expand
      .attr("y", -40) // Vertically center relative to the link connection
      .attr("x", 0) // Padding from the link connection point
      .append("xhtml:div")
      .style("width", `${config.nodeWidth}px`)
      .html(d => {
        // --- Styling Logic ---
        let classes = "relative flex flex-col p-4 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 select-none";
        let header = "";
        
        if (d.data.type === 'root') {
          // Root Style
          classes += " bg-slate-900 border-slate-800 text-white shadow-xl";
          header = `<div class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Central</div>`;
        } else if (d.data.type === 'category') {
          // Category Style
          classes += " bg-white border-slate-200 border-l-4 border-l-indigo-500 shadow-md";
        } else {
          // Item Style
          classes += " bg-white border-slate-200 hover:border-indigo-300";
        }

        const nameClass = d.data.type === 'root' 
          ? "font-bold text-lg leading-tight" 
          : d.data.type === 'category' 
            ? "font-semibold text-slate-800 text-base" 
            : "font-medium text-slate-600 text-sm";

        return `
          <div class="${classes}">
            ${header}
            <span class="${nameClass} break-words">
              ${d.data.name}
            </span>
            ${d.data.children ? `<div class="absolute -right-3 top-1/2 -mt-1.5 w-3 h-3 bg-slate-300 rounded-full border-2 border-white"></div>` : ''}
          </div>
        `;
      });

    // Initial Fit (Delayed to ensure DOM is ready)
    setTimeout(handleFitView, 100);

  }, [data, dimensions, onNodeClick]);


  // --- Controls ---
  const handleZoomIn = () => {
    svgSelectionRef.current?.transition().duration(300).call(zoomBehaviorRef.current!.scaleBy, 1.4);
  };

  const handleZoomOut = () => {
    svgSelectionRef.current?.transition().duration(300).call(zoomBehaviorRef.current!.scaleBy, 0.7);
  };

  const handleFitView = () => {
    if (!svgSelectionRef.current || !zoomBehaviorRef.current || !contentGroupRef.current) return;

    try {
      const bounds = contentGroupRef.current.node()?.getBBox();
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;

      const { width, height } = dimensions;
      const padding = 100;

      const scale = Math.min(
        (width - padding) / bounds.width,
        (height - padding) / bounds.height
      );

      // Clamp scale
      const clampledScale = Math.max(0.1, Math.min(scale, 1.5));

      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;

      const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(clampledScale)
        .translate(-cx, -cy);

      svgSelectionRef.current.transition().duration(800).call(zoomBehaviorRef.current.transform, transform);
    } catch (e) {
      console.error("Error fitting view", e);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      ></div>

      <svg ref={svgRef} className="w-full h-full block touch-none outline-none" />

      {/* Floating Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-10">
        
        {/* Navigation Hint */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur text-slate-500 text-xs font-medium rounded-full shadow-sm border border-slate-200">
          <Move size={12} />
          <span>Arraste para navegar</span>
        </div>

        {/* Buttons */}
        <div className="bg-white/90 backdrop-blur shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 rounded-2xl p-1.5 flex flex-col gap-1">
          <button onClick={handleZoomIn} className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95" title="Aumentar">
            <ZoomIn size={20} strokeWidth={2} />
          </button>
          <button onClick={handleZoomOut} className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95" title="Diminuir">
            <ZoomOut size={20} strokeWidth={2} />
          </button>
          <div className="h-px w-full bg-slate-100 my-0.5"></div>
          <button onClick={handleFitView} className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95" title="Ajustar à tela">
            <Maximize size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MindMap;