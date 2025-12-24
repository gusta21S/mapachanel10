import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { TreeNodeData } from '../types';
import { ZoomIn, ZoomOut, Maximize, MousePointer2 } from 'lucide-react';

interface MindMapProps {
  data: TreeNodeData;
  onNodeClick: (node: TreeNodeData) => void;
}

const MindMap: React.FC<MindMapProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Refs to store D3 objects for programmatic access
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const contentGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  // Styling constants
  const nodeWidth = 240;
  const nodeHeight = 60;
  const horizontalGap = 100;
  const verticalGap = 20;

  // Handle window resize
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
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Main D3 Rendering Logic
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || dimensions.width === 0) return;

    const { width, height } = dimensions;
    
    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svgSelectionRef.current = svg;

    // Create container group for zoom
    const g = svg.append("g");
    contentGroupRef.current = g;

    // Define Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 3]) // Increased range for better "infinite" feel
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // --- Layout Calculation ---
    const root = d3.hierarchy(data);
    
    const treeLayout = d3.tree<TreeNodeData>()
      .nodeSize([nodeHeight + verticalGap, nodeWidth + horizontalGap])
      .separation((a, b) => {
        return a.parent === b.parent ? 1.2 : 1.4;
      });

    treeLayout(root);

    // --- Drawing ---

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#bfdbfe")
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal<d3.HierarchyLink<TreeNodeData>, d3.HierarchyPointNode<TreeNodeData>>()
        .x(d => d.y)
        .y(d => d.x)
      );

    // Nodes
    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node cursor-pointer transition-opacity hover:opacity-90")
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data);
      });

    // Node Content (HTML via foreignObject)
    nodes.append("foreignObject")
      .attr("width", nodeWidth)
      .attr("height", 200) // Ample height for overflow
      .attr("y", -30)
      .append("xhtml:div")
      .style("width", `${nodeWidth}px`)
      .html(d => {
        let bgClass = "bg-white border-gray-200";
        let textClass = "text-gray-700";

        if (d.data.type === 'root') {
          bgClass = "bg-indigo-200 border-indigo-400 shadow-md";
          textClass = "text-indigo-900 font-bold text-center text-base";
        } else if (d.data.type === 'category') {
          bgClass = "bg-indigo-50 border-indigo-200 shadow-sm";
          textClass = "text-indigo-800 font-semibold";
        } else {
          bgClass = "bg-emerald-50 border-emerald-200";
          textClass = "text-emerald-900 font-medium text-sm";
        }

        return `
          <div class="flex items-center justify-center p-3 min-h-[60px] rounded-xl border-2 ${bgClass} transition-all duration-200 select-none box-border">
            <span class="leading-tight text-center ${textClass} break-words w-full block">
              ${d.data.name}
            </span>
          </div>
        `;
      });

    // Initial Center Strategy
    // We calculate the bounding box of the tree to center it perfectly
    // Use a timeout to ensure DOM is rendered for BBox calculation
    setTimeout(() => {
        handleFitView();
    }, 50);

  }, [data, dimensions, onNodeClick]); // Re-render on data or dimension change

  // --- Controls Handlers ---

  const handleZoomIn = () => {
    if (svgSelectionRef.current && zoomBehaviorRef.current) {
      svgSelectionRef.current.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgSelectionRef.current && zoomBehaviorRef.current) {
      svgSelectionRef.current.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1 / 1.3);
    }
  };

  const handleFitView = () => {
    if (!svgSelectionRef.current || !zoomBehaviorRef.current || !contentGroupRef.current) return;

    // Get the bounding box of the content
    // Note: getBBox acts on the SVG elements
    const bounds = contentGroupRef.current.node()?.getBBox();
    if (!bounds) return;

    const { width, height } = dimensions;
    const padding = 80;

    // Calculate scale to fit
    const scaleX = (width - padding * 2) / bounds.width;
    const scaleY = (height - padding * 2) / bounds.height;
    let scale = Math.min(scaleX, scaleY);

    // Limit max scale to avoid zooming in too much on small trees
    if (scale > 1.2) scale = 1.2;
    if (scale < 0.1) scale = 0.1;

    // Calculate translation to center
    // Center of the bounding box
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    const t = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-cx, -cy);

    svgSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, t);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 relative overflow-hidden group">
        {/* Grid pattern background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.4]" 
             style={{ 
               backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
               backgroundSize: '24px 24px' 
             }}>
        </div>
        
        <svg ref={svgRef} className="w-full h-full block touch-none" />
        
        {/* Interactive Controls Overlay */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-200 flex flex-col gap-2 items-center">
                <button 
                    onClick={handleZoomIn}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Aumentar Zoom"
                >
                    <ZoomIn size={20} />
                </button>
                <button 
                    onClick={handleZoomOut}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Diminuir Zoom"
                >
                    <ZoomOut size={20} />
                </button>
                <div className="w-full h-px bg-gray-100 my-0.5"></div>
                 <button 
                    onClick={handleFitView}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Centralizar e Ajustar"
                >
                    <Maximize size={20} />
                </button>
            </div>
            
             <div className="hidden sm:flex bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500 items-center gap-2">
                <MousePointer2 size={12} />
                <span>Arraste para mover • Scroll para zoom</span>
             </div>
        </div>
    </div>
  );
};

export default MindMap;