import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./App.css";
import type { NodeData } from "./types";
import { createCircle, createLine, flattenTree } from "./lib";

const tree: NodeData = {
  id: 1,
  label: "今天",
  x: 100,
  y: 100,
  children: [
    {
      id: 2,
      label: "学习",
      x: 300,
      y: 40,
    },
    {
      id: 3,
      label: "游戏",
      x: 300,
      y: 100,
    },
    {
      id: 4,
      label: "打电话",
      x: 300,
      y: 200,
    },
  ],
};

const flatTree = flattenTree(tree);

interface NoteNodeProps {
  id: number;
  x: number;
  y: number;
  label: string;
}

function NoteNode({ id, x, y, label }: NoteNodeProps) {
  const padding = 8;
  const textRef = useRef<SVGTextElement>(null);
  const [rectSize, setRectSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      // console.log("Text bounding box:", bbox);
      setRectSize({
        width: bbox.width + padding,
        height: bbox.height + padding,
      });
    }
  }, [label]);

  return (
    <g key={id} transform={`translate(${x}, ${y})`}>
      <rect
        x={rectSize.width / -2}
        y={rectSize.height / -2}
        width={rectSize.width}
        height={rectSize.height}
        fill="black"
        stroke="white"
      />
      <text
        ref={textRef}
        x={0}
        y={0}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

interface NoteTreeProps {
  flatTree: NodeData[];
}

const NoteTree = ({ flatTree }: NoteTreeProps) => {
  const nodesMap = new Map<number, NodeData>();
  flatTree.forEach((node) => {
    nodesMap.set(node.id, node);
  });

  const edges = flatTree.map((node) => {
    if (node.pid) {
      const parent = nodesMap.get(node.pid);
      if (parent) {
        return createLine(
          `line-${parent.id}-${node.id}`,
          parent.x,
          parent.y,
          node.x,
          node.y
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
      {flatTree.map((node) => (
        <NoteNode
          key={node.id}
          id={node.id}
          x={node.x}
          y={node.y}
          label={node.label}
        />
      ))}
    </g>
  );
};

function App() {
  const [paperSize, setPaperSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const paperRef = useRef<SVGSVGElement>(null);
  const panningInfo = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
  });

  useLayoutEffect(() => {
    const updatePaperSize = () => {
      setPaperSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", updatePaperSize);
    updatePaperSize();

    return () => {
      window.removeEventListener("resize", updatePaperSize);
    };
  }, []);

  useEffect(() => {
    const paperEl = paperRef.current;
    const onMousedown = (e: MouseEvent) => {
      // only start panning with left mouse button
      if (e.button !== 0) return;
      if (e.target !== paperEl) return;

      panningInfo.current.isPanning = true;
      panningInfo.current.startX = e.clientX;
      panningInfo.current.startY = e.clientY;
    };

    const onMousemove = (e: MouseEvent) => {
      if (!panningInfo.current.isPanning) return;
      const deltaX = e.clientX - panningInfo.current.startX;
      const deltaY = e.clientY - panningInfo.current.startY;

      panningInfo.current.startX = e.clientX;
      panningInfo.current.startY = e.clientY;

      setViewport((prev) => ({
        x: prev.x + -deltaX,
        y: prev.y + -deltaY,
        zoom: prev.zoom,
      }));
    };

    const onMouseup = () => {
      if (panningInfo.current.isPanning) {
        panningInfo.current.isPanning = false;
      }
    };

    if (paperEl) {
      paperEl.addEventListener("mousedown", onMousedown);
      // attach move/up to window so releasing the mouse outside the svg stops panning
      window.addEventListener("mousemove", onMousemove);
      window.addEventListener("mouseup", onMouseup);
    }

    return () => {
      paperEl?.removeEventListener("mousedown", onMousedown);
      window.removeEventListener("mousemove", onMousemove);
      window.removeEventListener("mouseup", onMouseup);
    };
  }, []);

  return (
    <div className="h-screen bg-black">
      <svg
        ref={paperRef}
        width={paperSize.width}
        height={paperSize.height}
        viewBox={`${viewport.x} ${viewport.y} ${paperSize.width} ${paperSize.height}`}
      >
        <NoteTree flatTree={flatTree} />

        {createCircle(100, 100, 5)}
      </svg>
    </div>
  );
}

export default App;
