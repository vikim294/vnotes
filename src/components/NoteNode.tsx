import { use, useEffect, useLayoutEffect, useRef, useState } from "react";
import PaperContext from "../context/paperContext";

interface NoteNodeProps {
  id: number;
  x: number;
  y: number;
  label: string;
}

const createNodeMenuEvent = (detail: {
  nodeId: number;
  source: "longtap" | "contextmenu";
}) => {
  return new CustomEvent("nodemenu", {
    bubbles: true,
    cancelable: true,
    detail,
  });
};

export default function NoteNode({ id, x, y, label }: NoteNodeProps) {
  const padding = 8;
  const textRef = useRef<SVGTextElement>(null);
  const [rectSize, setRectSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const paperContext = use(PaperContext);
  const editMode = paperContext?.editMode;
  const viewportZoom = paperContext?.viewportZoom;
  const selectedNodeIdRef = paperContext?.selectedNodeIdRef;
  const nodeMenuRef = paperContext?.nodeMenuRef;
  const setFlatTree = paperContext?.setFlatTree;
  const setNodeMenuVisible = paperContext?.setNodeMenuVisible;

  const gRef = useRef<SVGGElement | null>(null);
  const positionRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
  });

  const tapInfoRef = useRef<{
    timer: number | null;
    startX: number;
    startY: number;
  }>({
    timer: null,
    startX: 0,
    startY: 0,
  });

  const showOpenMenu = (e: React.MouseEvent<SVGGElement, MouseEvent>) => {
    e.preventDefault();
    if (!editMode) return;

    gRef.current?.dispatchEvent(
      createNodeMenuEvent({
        nodeId: id,
        source: "contextmenu",
      }),
    );
  };

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (!editMode) return;
    if (e.pointerType === "mouse") return;
    if (!e.isPrimary) return;

    // tap 后开启定时器
    if (tapInfoRef.current.timer) {
      clearTimeout(tapInfoRef.current.timer);
    }

    tapInfoRef.current.startX = e.clientX;
    tapInfoRef.current.startY = e.clientY;
    tapInfoRef.current.timer = setTimeout(() => {
      tapInfoRef.current.timer = null;

      gRef.current?.dispatchEvent(
        createNodeMenuEvent({
          nodeId: id,
          source: "longtap",
        }),
      );
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    // TODO: 验证交互
    // tap 后移动超过10px，则认为是拖拽，而不是 menu
    if (tapInfoRef.current.timer) {
      const deltaX = e.clientX - tapInfoRef.current.startX;
      const deltaY = e.clientY - tapInfoRef.current.startY;
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        clearTimeout(tapInfoRef.current.timer);
        tapInfoRef.current.timer = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (tapInfoRef.current.timer) {
      clearTimeout(tapInfoRef.current.timer);
      tapInfoRef.current.timer = null;
    }
  };

  const handlePointerCancel = () => {
    if (tapInfoRef.current.timer) {
      clearTimeout(tapInfoRef.current.timer);
      tapInfoRef.current.timer = null;
    }
  };

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

  // drag node
  useEffect(() => {
    const gElem = gRef.current;
    const positionData = positionRef.current;

    const onPointerDown = (e: PointerEvent) => {
      if (!editMode) return;
      // console.log("pd");
      positionData.isDragging = true;
      positionData.startX = e.clientX;
      positionData.startY = e.clientY;

      // ⭐ after pointer down, "bind" the current pointer event to the g element.
      gElem?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!positionData.isDragging) return;
      // console.log("pm");

      const deltaX = e.clientX - positionData.startX;
      const deltaY = e.clientY - positionData.startY;

      // update state
      setFlatTree?.((prev) => {
        return prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              x: item.x + deltaX * (viewportZoom ?? 1),
              y: item.y + deltaY * (viewportZoom ?? 1),
            };
          } else {
            return item;
          }
        });
      });

      // update positionRef
      positionData.startX = e.clientX;
      positionData.startY = e.clientY;
    };

    const onPointerUp = () => {
      positionData.isDragging = false;
    };

    gElem?.addEventListener("pointerdown", onPointerDown);
    gElem?.addEventListener("pointermove", onPointerMove);
    gElem?.addEventListener("pointerup", onPointerUp);

    return () => {
      gElem?.removeEventListener("pointerdown", onPointerDown);
      gElem?.removeEventListener("pointermove", onPointerMove);
      gElem?.removeEventListener("pointerup", onPointerUp);
    };
  }, [id, editMode, viewportZoom, setFlatTree]);

  // menu event
  useEffect(() => {
    const gElem = gRef.current;

    const onNodeMenu = (
      e: CustomEvent<{
        nodeId: number;
        source: "longtap" | "contextmenu";
      }>,
    ) => {
      // console.log("node menu", e);
      const { left, top, width } = (
        e.target as SVGGElement
      ).getBoundingClientRect();

      selectedNodeIdRef!.current = e.detail.nodeId;

      nodeMenuRef?.current?.setPosition({
        x: left + width + 12,
        y: top,
      });
      setNodeMenuVisible?.(true);
    };

    gElem?.addEventListener("nodemenu", onNodeMenu as EventListener);

    return () => {
      gElem?.removeEventListener("nodemenu", onNodeMenu as EventListener);
    };
  }, [selectedNodeIdRef, nodeMenuRef, setNodeMenuVisible]);

  useEffect(() => {
    return () => {
      if (tapInfoRef.current.timer) {
        clearTimeout(tapInfoRef.current.timer);
        tapInfoRef.current.timer = null;
      }
    };
  }, []);

  return (
    <g
      key={id}
      className={paperContext?.editMode ? "cursor-pointer" : ""}
      transform={`translate(${x}, ${y})`}
      ref={gRef}
      onContextMenu={showOpenMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
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
        style={{ userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
}
