import { createContext } from "react";
import type { NodeMenuExpose } from "../components/NodeMenu";
import type { NodeData } from "../types";

const PaperContext = createContext<{
  editMode: boolean;
  viewportZoom: number;
  selectedNodeIdRef: React.RefObject<number | null>;
  nodeMenuRef: React.RefObject<NodeMenuExpose | null>;
  setFlatTree: React.Dispatch<React.SetStateAction<NodeData[]>>;
  setNodeMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export default PaperContext;
