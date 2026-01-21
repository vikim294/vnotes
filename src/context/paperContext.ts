import { createContext } from "react";
import type { NodeMenuExpose } from "../components/NodeMenu";
import type { NodeData } from "../types";

const PaperContext = createContext<{
  flatTree: NodeData[];
  editMode: boolean;
  viewportZoom: number;
  selectedNodeIdRef: React.RefObject<number | null>;
  nodeMenuRef: React.RefObject<NodeMenuExpose | null>;
  isChoosingParent: boolean;
  setFlatTree: React.Dispatch<React.SetStateAction<NodeData[]>>;
  setNodeMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setChosenParentNodeId: React.Dispatch<React.SetStateAction<number | null>>;
} | null>(null);

export default PaperContext;
