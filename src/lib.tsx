import type { NodeData, Point } from "./types";

export const createCircle = (cx: number, cy: number, r: number = 1) => {
  return <circle cx={cx} cy={cy} r={r} fill="red" />;
};

export const createLine = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
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

export const findDescendentsByIdInTree = (
  node: NodeData,
  id: number,
  result: NodeData[] = [],
) => {
  if (node.id === id) {
    node.children?.forEach((item) => {
      // collect all node's kids
      result.push(item);
      // collect kids' kids
      findDescendentsByIdInTree(item, item.id, result);
    });

    return result;
  } else {
    if (node.children) {
      for (const item of node.children) {
        if (item.id === id) {
          findDescendentsByIdInTree(item, item.id, result);
          return result;
        }
      }
      return [];
    } else {
      return [];
    }
  }
};

export const findDescendentsByIdInFlatTree = (
  flatTree: NodeData[],
  id: number,
  result: NodeData[] = [],
) => {
  for (const item of flatTree) {
    if (item.pid === id) {
      result.push(item);
      findDescendentsByIdInFlatTree(flatTree, item.id, result);
    }
  }
  return result;
};

export const getDistanceBetweenTwoPoints = (p1: Point, p2: Point) => {
  return Math.sqrt(
    (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y),
  );
};
