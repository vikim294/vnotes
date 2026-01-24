import {
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PaperContext from "../context/paperContext";
import { findDescendantsByIdInFlatTree } from "../lib";

interface NoteNodeProps {
  id: number;
  x: number;
  y: number;
  label: string;
  expanded?: boolean;
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

export default function NoteNode({ id, x, y, label, expanded }: NoteNodeProps) {
  const padding = 8;
  const textRef = useRef<SVGTextElement>(null);
  const [rectSize, setRectSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // context
  const paperContext = use(PaperContext);
  const flatTree = paperContext?.flatTree;
  const editMode = paperContext?.editMode;
  const viewportZoom = paperContext?.viewportZoom;
  const selectedNodeIdRef = paperContext?.selectedNodeIdRef;
  const nodeMenuRef = paperContext?.nodeMenuRef;
  const isChoosingParent = paperContext?.isChoosingParent;
  const setFlatTree = paperContext?.setFlatTree;
  const setNodeMenuVisible = paperContext?.setNodeMenuVisible;
  const setChosenParentNodeId = paperContext?.setChosenParentNodeId;

  const gRef = useRef<SVGGElement | null>(null);
  const positionRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
  });

  const tapInfoRef = useRef<{
    timerForLongTap: number | null;
    timerForDoubleTap: number | null;
    startX: number;
    startY: number;
  }>({
    timerForLongTap: null,
    timerForDoubleTap: null,
    startX: 0,
    startY: 0,
  });

  const descendantIdsRef = useRef<number[]>([]);
  const hasChildren = useMemo(() => {
    return flatTree?.some((item) => item.pid === id);
  }, [flatTree, id]);

  // used for double tap
  const firstTapRef = useRef(false);

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
    if (e.pointerType === "mouse") return;

    if (firstTapRef.current === false) {
      firstTapRef.current = true;

      // reset double tap after 200ms
      if (tapInfoRef.current.timerForDoubleTap) {
        clearTimeout(tapInfoRef.current.timerForDoubleTap);
      }

      tapInfoRef.current.timerForDoubleTap = setTimeout(() => {
        tapInfoRef.current.timerForDoubleTap = null;

        if (firstTapRef.current) {
          firstTapRef.current = false;
        }
      }, 200);
    } else {
      // handle double tap
      handleDoubleClick();
      firstTapRef.current = false;
      return;
    }

    // allow long tap only in edit mode
    if (!editMode) return;
    if (!e.isPrimary) return;

    // tap 后开启定时器
    if (tapInfoRef.current.timerForLongTap) {
      clearTimeout(tapInfoRef.current.timerForLongTap);
    }

    // triggerlong tap after 500ms
    tapInfoRef.current.startX = e.clientX;
    tapInfoRef.current.startY = e.clientY;
    tapInfoRef.current.timerForLongTap = setTimeout(() => {
      tapInfoRef.current.timerForLongTap = null;

      gRef.current?.dispatchEvent(
        createNodeMenuEvent({
          nodeId: id,
          source: "longtap",
        }),
      );
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    // allow drag only in edit mode
    if (!editMode) return;

    // reset double tap if moved
    if (firstTapRef.current) {
      firstTapRef.current = false;
    }

    // TODO: 验证交互
    // tap 后移动超过10px，则认为是拖拽，而不是 menu
    if (tapInfoRef.current.timerForLongTap) {
      const deltaX = e.clientX - tapInfoRef.current.startX;
      const deltaY = e.clientY - tapInfoRef.current.startY;
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        clearTimeout(tapInfoRef.current.timerForLongTap);
        tapInfoRef.current.timerForLongTap = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (tapInfoRef.current.timerForLongTap) {
      clearTimeout(tapInfoRef.current.timerForLongTap);
      tapInfoRef.current.timerForLongTap = null;
    }
  };

  const handlePointerCancel = () => {
    if (tapInfoRef.current.timerForLongTap) {
      clearTimeout(tapInfoRef.current.timerForLongTap);
      tapInfoRef.current.timerForLongTap = null;
    }
  };

  const handleClick = () => {
    if (isChoosingParent) {
      setChosenParentNodeId?.(id);
    }
  };

  const handleDoubleClick = () => {
    if (!hasChildren) return;
    const newExpanded = expanded === false ? true : false;

    setFlatTree?.((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            expanded: newExpanded || newExpanded === undefined,
          };
        }
        return item;
      });
    });
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
      positionData.isDragging = true;
      positionData.startX = e.clientX;
      positionData.startY = e.clientY;

      // ⭐ after pointer down, "bind" the current pointer event to the g element.
      gElem?.setPointerCapture(e.pointerId);

      // get descendant nodes
      if (flatTree) {
        descendantIdsRef.current = findDescendantsByIdInFlatTree(
          flatTree,
          id,
        ).map((item) => item.id);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!positionData.isDragging) return;
      // console.log("pm");

      const deltaX = e.clientX - positionData.startX;
      const deltaY = e.clientY - positionData.startY;

      // update state
      setFlatTree?.((prev) => {
        return prev.map((item) => {
          if (item.id === id || descendantIdsRef.current.includes(item.id)) {
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
  }, [id, editMode, viewportZoom, flatTree, setFlatTree]);

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
      if (tapInfoRef.current.timerForLongTap) {
        clearTimeout(tapInfoRef.current.timerForLongTap);
        tapInfoRef.current.timerForLongTap = null;
      }

      if (tapInfoRef.current.timerForDoubleTap) {
        clearTimeout(tapInfoRef.current.timerForDoubleTap);
        tapInfoRef.current.timerForDoubleTap = null;
      }
    };
  }, []);

  return (
    // double tap(double click) -> expand/collapse
    // drag -> move node
    // long tap(right click) -> open menu
    <g
      className={"cursor-pointer"}
      key={id}
      transform={`translate(${x}, ${y})`}
      ref={gRef}
      onContextMenu={showOpenMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
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
        className="select-none"
      >
        {label}
      </text>

      {hasChildren && (
        <text
          className="select-none"
          x={0}
          y={-24}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {expanded === false ? "+" : "-"}
        </text>
      )}
    </g>
  );
}
