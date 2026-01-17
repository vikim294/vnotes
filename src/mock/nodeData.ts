import type { NodeData } from "../types";

const tree: NodeData = {
  id: 1,
  label: "today",
  x: 100,
  y: 100,
  children: [
    {
      id: 2,
      label: "study",
      x: 300,
      y: 40,
    },
    {
      id: 3,
      label: "game",
      x: 300,
      y: 100,
    },
    {
      id: 4,
      label: "code",
      x: 300,
      y: 200,
    },
  ],
};

export { tree };
