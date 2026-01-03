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
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    zoom: 1,
  });
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

    const updateViewport = () => {
      setViewport((prev) => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    window.addEventListener("resize", updatePaperSize);
    updatePaperSize();
    updateViewport();

    return () => {
      window.removeEventListener("resize", updatePaperSize);
    };
  }, []);

  // panning
  useEffect(() => {
    const paperEl = paperRef.current;

    // pc
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
        ...prev,
        x: prev.x + -deltaX,
        y: prev.y + -deltaY,
      }));
    };

    const onMouseup = () => {
      if (panningInfo.current.isPanning) {
        panningInfo.current.isPanning = false;
      }
    };

    // mobile
    const onTouchstart = (e: TouchEvent) => {
      if (e.target !== paperEl) return;
      // 避免拖动时不会出现页面回弹或抖动
      e.preventDefault();
      panningInfo.current.isPanning = true;
      panningInfo.current.startX = e.touches[0].clientX;
      panningInfo.current.startY = e.touches[0].clientY;
    };

    const onTouchmove = (e: TouchEvent) => {
      if (!panningInfo.current.isPanning) return;
      // 避免拖动时不会出现页面回弹或抖动
      e.preventDefault();
      const deltaX = e.touches[0].clientX - panningInfo.current.startX;
      const deltaY = e.touches[0].clientY - panningInfo.current.startY;

      panningInfo.current.startX = e.touches[0].clientX;
      panningInfo.current.startY = e.touches[0].clientY;

      setViewport((prev) => ({
        ...prev,
        x: prev.x + -deltaX,
        y: prev.y + -deltaY,
      }));
    };

    const onTouchend = () => {
      if (panningInfo.current.isPanning) {
        panningInfo.current.isPanning = false;
      }
    };

    // --- pc
    // panning
    paperEl?.addEventListener("mousedown", onMousedown);
    // attach move/up to window so releasing the mouse outside the svg stops panning
    window.addEventListener("mousemove", onMousemove);
    window.addEventListener("mouseup", onMouseup);

    // --- mobile
    // https://javascript.info/default-browser-action#the-passive-handler-option
    // The optional passive: true option of addEventListener signals the browser that the handler is not going to call preventDefault().
    // For some browsers (Firefox, Chrome), passive is true by default for touchstart and touchmove events.
    // passive: false 使得 e.preventDefault() 能够生效
    paperEl?.addEventListener("touchstart", onTouchstart, { passive: false });
    window.addEventListener("touchmove", onTouchmove, { passive: false });
    window.addEventListener("touchend", onTouchend);

    return () => {
      // pc
      paperEl?.removeEventListener("mousedown", onMousedown);
      window.removeEventListener("mousemove", onMousemove);
      window.removeEventListener("mouseup", onMouseup);

      // mobile
      paperEl?.removeEventListener("touchstart", onTouchstart);
      window.removeEventListener("touchmove", onTouchmove);
      window.removeEventListener("touchend", onTouchend);
    };
  }, []);

  // zooming
  useEffect(() => {
    const paperEl = paperRef.current;

    const onWheel = (e: WheelEvent) => {
      // console.log(e);

      let newZoom = viewport.zoom;

      if (e.deltaY < 0) {
        // up -> zoom in
        newZoom /= 1.1;
      } else if (e.deltaY > 0) {
        // down -> zoom out
        newZoom *= 1.1;
      }

      // console.log(newZoom)

      setViewport((prev) => ({
        ...prev,
        width: paperSize.width * newZoom,
        height: paperSize.height * newZoom,
        zoom: newZoom,
      }));
    };

    paperEl?.addEventListener("wheel", onWheel);

    return () => {
      // zooming
      paperEl?.removeEventListener("wheel", onWheel);
    };
  }, [viewport.zoom, paperSize]);

  return (
    <div className="h-screen bg-black">
      <svg
        ref={paperRef}
        width={paperSize.width}
        height={paperSize.height}
        viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
      >
        <NoteTree flatTree={flatTree} />

        {createCircle(100, 100, 5)}
      </svg>
      <div className="fixed right-0 top-0 text-white">
        zoom: {viewport.zoom.toFixed(1)}
      </div>
    </div>
  );
}

export default App;
