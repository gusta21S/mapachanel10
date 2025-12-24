import React, { useState, useCallback } from 'react';
import { Layout } from 'lucide-react';
import MindMap from './components/MindMap';
import EditModal from './components/EditModal';
import { INITIAL_TREE_DATA } from './constants';
import { TreeNodeData } from './types';

export default function App() {
  const [treeData, setTreeData] = useState<TreeNodeData>(INITIAL_TREE_DATA);
  const [editingNode, setEditingNode] = useState<{ id: string; name: string; type: string } | null>(null);

  // Recursive function to update a node's name in the immutable tree structure
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
    <div className="h-screen w-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="flex-none h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Layout className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Mapa Estratégico Interativo</h1>
            <p className="text-xs text-slate-500">Visualização de Árvore de Decisão</p>
          </div>
        </div>
        <div className="text-sm text-slate-500 hidden sm:block">
           Simulação: <span className="font-semibold text-indigo-600">Out of Time</span>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-grow relative overflow-hidden">
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