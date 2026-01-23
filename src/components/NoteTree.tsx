import { createLine } from "../lib";
import type { NodeData } from "../types";
import NoteNode from "./NoteNode";

interface NoteTreeProps {
  flatTree: NodeData[];
}

const NoteTree = ({ flatTree }: NoteTreeProps) => {
  const nodesMap = new Map<number, NodeData>();
  flatTree.forEach((node) => {
    nodesMap.set(node.id, node);
  });

  const edges = flatTree.map((node) => {
    if (node.pid && node.visible !== false) {
      const parent = nodesMap.get(node.pid);
      if (parent) {
        return createLine(
          `line-${parent.id}-${node.id}`,
          parent.x,
          parent.y,
          node.x,
          node.y,
        );
      }
    }
    return null;
  });

  return (
    <g>
      {/* edges */}
      {edges}

      {/* nodes */}
      {flatTree.filter(node => node.visible !== false || !node.pid).map((node) => (
        <NoteNode
          key={node.id}
          id={node.id}
          x={node.x}
          y={node.y}
          label={node.label}
          expanded={node.expanded}
        />
      ))}
    </g>
  );
};

export default NoteTree;