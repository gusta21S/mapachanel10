import React, { useState, useCallback } from 'react';
import { Target } from 'lucide-react';
import MindMap from './components/MindMap';
import EditModal from './components/EditModal';
import { INITIAL_TREE_DATA } from './constants';
import { TreeNodeData } from './types';

export default function App() {
  const [treeData, setTreeData] = useState<TreeNodeData>(INITIAL_TREE_DATA);
  const [editingNode, setEditingNode] = useState<{ id: string; name: string; type: string } | null>(null);

  const updateNodeName = (nodes: TreeNodeData, id: string, newName: string): TreeNodeData => {
    if (nodes.id === id) {
      return { ...nodes, name: newName };
    }
    if (nodes.children) {
      return {
        ...nodes,
        children: nodes.children.map(child => updateNodeName(child, id, newName)),
      };
    }
    return nodes;
  };

  const handleNodeClick = useCallback((node: TreeNodeData) => {
    setEditingNode({ id: node.id, name: node.name, type: node.type || 'item' });
  }, []);

  const handleSaveNode = (newName: string) => {
    if (editingNode) {
      const updatedTree = updateNodeName(treeData, editingNode.id, newName);
      setTreeData(updatedTree);
      setEditingNode(null);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Navbar */}
      <nav className="flex-none h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Target className="text-indigo-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Mapa Estratégico</h1>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Modo de Planejamento</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-4">
           <div className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
             <span className="text-xs font-medium text-slate-500">Projeto:</span>
             <span className="text-xs font-bold text-slate-800 ml-1">Out of Time</span>
           </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-grow relative w-full h-full">
        <MindMap 
          data={treeData} 
          onNodeClick={handleNodeClick} 
        />
      </main>

      {/* Edit Modal */}
      <EditModal
        isOpen={!!editingNode}
        initialValue={editingNode?.name || ''}
        nodeType={editingNode?.type || 'item'}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNode}
      />
    </div>
  );
}