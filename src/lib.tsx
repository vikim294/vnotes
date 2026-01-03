import type { NodeData } from "./types";

export const createCircle = (cx: number, cy: number, r: number = 1) => {
  return <circle cx={cx} cy={cy} r={r} fill="red" />;
};

export const createLine = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  return <line key={id} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" />;
};

export const flattenTree = (node: NodeData, result: NodeData[] = []) => {
  const cur = { ...node };
  delete cur.children;
  result.push(cur);

  if (node.children) {
    node.children.forEach((child) => {
      const newChild = { ...child, pid: node.id };
      flattenTree(newChild, result);
    });
  }
  return result;
};
