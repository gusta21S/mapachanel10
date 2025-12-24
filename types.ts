export interface TreeNodeData {
  id: string;
  name: string;
  children?: TreeNodeData[];
  type?: 'root' | 'category' | 'item';
  isExpanded?: boolean;
}

export interface TreeContextType {
  data: TreeNodeData;
  updateNode: (id: string, newName: string) => void;
}