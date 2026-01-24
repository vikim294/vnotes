import { createLine, findAncestorsByIdInFlatTreeMap } from "../lib";
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

  const edges = [];
  const nodes = [];

  for (const node of flatTree) {
    const ancestorNodes = findAncestorsByIdInFlatTreeMap(nodesMap, node.id);
    const areAllAncestorsExpanded = ancestorNodes.every(
      (item) => item.expanded !== false,
    );

    const edgeVisible = node.pid && areAllAncestorsExpanded;
    const nodeVisible = !node.pid || areAllAncestorsExpanded;

    if (edgeVisible) {
      const parent = ancestorNodes[0];
      if (parent) {
        const e = createLine(
          `line-${parent.id}-${node.id}`,
          parent.x,
          parent.y,
          node.x,
          node.y,
        );

        edges.push(e);
      }
    }

    if (nodeVisible) {
      const n = (
        <NoteNode
          key={node.id}
          id={node.id}
          x={node.x}
          y={node.y}
          label={node.label}
          expanded={node.expanded}
        />
      );
      nodes.push(n);
    }
  }

  return (
    <g>
      {edges}
      {nodes}
    </g>
  );
};

export default NoteTree;
