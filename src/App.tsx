import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { createCircle, flattenTree, getDistanceBetweenTwoPoints } from "./lib";
import Button from "./components/Button";
import NodeMenu, { type NodeMenuExpose } from "./components/NodeMenu";
import { tree } from "./mock/nodeData";
import NoteTree from "./components/NoteTree";
import PaperContext from "./context/PaperContext";
import useModal from "./components/useModal";

interface GestureInfo {
  type: "none" | "panning" | "pinchAndZoom";
  startX1: number;
  startY1: number;
  startX2: number;
  startY2: number;
  startD: number;
  centerPointX: number;
  centerPointY: number;
  viewportStartX: number;
  viewportStartY: number;
  viewportStartZoom: number;
}

function App() {
  const [flatTree, setFlatTree] = useState(flattenTree(tree));
  const [paperSize, setPaperSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    zoom: 1,
  });
  const viewportRef = useRef(viewport);
  const paperRef = useRef<SVGSVGElement>(null);
  const gestureInfo = useRef<GestureInfo>({
    type: "none",
    startX1: 0,
    startY1: 0,
    startX2: 0,
    startY2: 0,
    startD: 0,
    centerPointX: 0,
    centerPointY: 0,
    viewportStartX: 0,
    viewportStartY: 0,
    viewportStartZoom: 1,
  });

  // edit mode
  const [editMode, setEditMode] = useState(false);
  const [nodeMenuVisible, setNodeMenuVisible] = useState(false);
  const nodeMenuRef = useRef<NodeMenuExpose | null>(null);
  const selectedNodeIdRef = useRef<number | null>(null);
  const {
    Modal: NodeDeleteConfirmModal,
    openModal: openNodeDeleteConfirmModal,
    closeModal: closeNodeDeleteConfirmModal,
  } = useModal();

  // context
  const paperContext = useMemo(
    () => ({
      editMode,
      selectedNodeIdRef,
      nodeMenuRef,
      setFlatTree,
      setNodeMenuVisible,
    }),
    [editMode],
  );

  const handleSaveEdit = () => {
    //
    setEditMode(false);
  };

  const resetZoom = () => {
    setViewport((prev) => ({
      ...prev,
      width: paperSize.width,
      height: paperSize.height,
      zoom: 1,
    }));
  };

  const handleNodeEdit = () => {
    //
  };
  const handleNodeAddChild = () => {
    //
  };
  const handleNodeDelete = () => {
    console.log("handleNodeDelete");
    openNodeDeleteConfirmModal();
  };

  const handleNodeMenuClose = () => {
    selectedNodeIdRef.current = null;
    setNodeMenuVisible(false);
  };

  const handleNodeDeleteConfirm = () => {
    console.log("handleNodeDeleteConfirm", selectedNodeIdRef.current);

    // TODO: also need to delete its children nodes
    const newData = flatTree.filter(
      (node) => node.id !== selectedNodeIdRef.current,
    );
    console.log("newData", newData);
    setFlatTree(newData);

    closeNodeDeleteConfirmModal();
    handleNodeMenuClose();
  };

  useLayoutEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

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

  // TODO: zoom 后，panning 的比例
  // panning and pinch & zoom
  useEffect(() => {
    const paperEl = paperRef.current;
    const gestureData = gestureInfo.current;

    const onPointerDown = (e: PointerEvent) => {
      // return if it's not paper in edit mode
      if (editMode && e.target !== paperEl) return;
      // return if it's not left click when clicking
      if (e.pointerType === "mouse" && e.button !== 0) return;

      paperEl?.setPointerCapture(e.pointerId);

      if (e.isPrimary) {
        gestureData.type = "panning";
        gestureData.startX1 = e.clientX;
        gestureData.startY1 = e.clientY;
      } else {
        gestureData.type = "pinchAndZoom";
        gestureData.startX2 = e.clientX;
        gestureData.startY2 = e.clientY;

        const v = viewportRef.current;
        const p1 = { x: gestureData.startX1, y: gestureData.startY1 };
        const p2 = { x: gestureData.startX2, y: gestureData.startY2 };

        gestureData.startD = getDistanceBetweenTwoPoints(p1, p2);
        gestureData.centerPointX = (p1.x + p2.x) / 2;
        gestureData.centerPointY = (p1.y + p2.y) / 2;
        gestureData.viewportStartX = v.x;
        gestureData.viewportStartY = v.y;
        gestureData.viewportStartZoom = v.zoom;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (gestureData.type === "panning") {
        const deltaX = e.clientX - gestureData.startX1;
        const deltaY = e.clientY - gestureData.startY1;

        gestureData.startX1 = e.clientX;
        gestureData.startY1 = e.clientY;

        setViewport((prev) => ({
          ...prev,
          x: prev.x + -deltaX,
          y: prev.y + -deltaY,
        }));
      } else if (gestureData.type === "pinchAndZoom") {
        let newD = 0;
        let p1 = { x: e.clientX, y: e.clientY };
        let p2 = { x: e.clientX, y: e.clientY };

        if (e.isPrimary) {
          p2 = { x: gestureData.startX2, y: gestureData.startY2 };
          // 更新 gestureData
          gestureData.startX1 = e.clientX;
          gestureData.startY1 = e.clientY;
        } else {
          p1 = { x: gestureData.startX1, y: gestureData.startY1 };
          // 更新 gestureData
          gestureData.startX2 = e.clientX;
          gestureData.startY2 = e.clientY;
        }

        newD = getDistanceBetweenTwoPoints(p1, p2);

        let newZoom = 0;

        // startD: newD = startZoom: newZoom
        const ratio = newD / gestureData.startD;
        if (ratio !== 1) {
          // zoom in or zoom out
          newZoom = (1 / ratio) * gestureData.viewportStartZoom;
        }

        // the position ratio of pointer in the paper
        const ratioX = gestureData.centerPointX / paperSize.width;
        const ratioY = gestureData.centerPointY / paperSize.height;
        const deltaX =
          paperSize.width * -(newZoom - gestureData.viewportStartZoom) * ratioX;
        const deltaY =
          paperSize.height *
          -(newZoom - gestureData.viewportStartZoom) *
          ratioY;

        setViewport({
          x: gestureData.viewportStartX + deltaX,
          y: gestureData.viewportStartY + deltaY,
          width: paperSize.width * newZoom,
          height: paperSize.height * newZoom,
          zoom: newZoom,
        });
      }
    };

    const onPointerUp = () => {
      gestureData.type = "none";
    };

    const touchHandler = (e: TouchEvent) => {
      e.preventDefault();
    };

    // https://javascript.info/default-browser-action#the-passive-handler-option
    // The optional passive: true option of addEventListener signals the browser that the handler is not going to call preventDefault().
    // For some browsers (Firefox, Chrome), passive is true by default for touchstart and touchmove events.
    // passive: false 使得 e.preventDefault() 能够生效
    paperEl?.addEventListener("touchstart", touchHandler, {
      passive: false,
    });
    paperEl?.addEventListener("touchmove", touchHandler, {
      passive: false,
    });

    paperEl?.addEventListener("pointerdown", onPointerDown);
    paperEl?.addEventListener("pointermove", onPointerMove);
    paperEl?.addEventListener("pointerup", onPointerUp);

    return () => {
      paperEl?.removeEventListener("touchstart", touchHandler);
      paperEl?.removeEventListener("touchmove", touchHandler);

      paperEl?.removeEventListener("pointerdown", onPointerDown);
      paperEl?.removeEventListener("pointermove", onPointerMove);
      paperEl?.removeEventListener("pointerup", onPointerUp);
    };
  }, [paperSize, editMode]);

  // zooming
  useEffect(() => {
    const paperEl = paperRef.current;

    const onWheel = (e: WheelEvent) => {
      // console.log(e);

      setViewport((prev) => {
        const zoom = prev.zoom;
        let newZoom = prev.zoom;

        if (e.deltaY < 0) {
          // up -> zoom in
          newZoom /= 1.1;
        } else if (e.deltaY > 0) {
          // down -> zoom out
          newZoom *= 1.1;
        }

        // console.log(newZoom)

        // the position ratio of pointer in the paper
        const ratioX = e.clientX / paperSize.width;
        const ratioY = e.clientY / paperSize.height;
        const deltaX = paperSize.width * -(newZoom - zoom) * ratioX;
        const deltaY = paperSize.height * -(newZoom - zoom) * ratioY;

        return {
          x: prev.x + deltaX,
          y: prev.y + deltaY,
          width: paperSize.width * newZoom,
          height: paperSize.height * newZoom,
          zoom: newZoom,
        };
      });
    };

    paperEl?.addEventListener("wheel", onWheel);

    return () => {
      paperEl?.removeEventListener("wheel", onWheel);
    };
  }, [paperSize]);

  return (
    <PaperContext value={paperContext}>
      <div className="h-screen bg-black">
        <svg
          ref={paperRef}
          width={paperSize.width}
          height={paperSize.height}
          // ⭐ viewBox 会先应用 x 和 y，然后才应用 width 和 height
          // viewBox 的效果：以 (x, y) 为左上角，显示 width × height 区域，并投影到 svg 画布上
          viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
          onContextMenu={(e) => e.preventDefault()}
        >
          <NoteTree flatTree={flatTree} />

          {/* {createCircle(100, 100, 5)} */}
        </svg>
        <div className="fixed top-0 right-0 text-white">
          {viewport.zoom !== 1 && (
            <button onClick={resetZoom} className="cursor-pointer">
              reset zoom
            </button>
          )}
        </div>

        <div className="fixed top-25 right-0">
          {!editMode && (
            <Button type="primary" onClick={() => setEditMode(true)}>
              edit mode
            </Button>
          )}

          {editMode && (
            <>
              <div>
                <Button type="primary" onClick={handleSaveEdit}>
                  save
                </Button>
              </div>
              <div>
                <Button onClick={() => setEditMode(false)}>exit</Button>
              </div>
            </>
          )}
        </div>

        <NodeMenu
          ref={nodeMenuRef}
          visible={nodeMenuVisible}
          onEdit={handleNodeEdit}
          onAddChild={handleNodeAddChild}
          onDelete={handleNodeDelete}
          onClose={handleNodeMenuClose}
        />

        <NodeDeleteConfirmModal
          header="确认要删除该结点吗？"
          footer={
            <div>
              <Button onClick={closeNodeDeleteConfirmModal}>取消</Button>
              <Button type="primary" onClick={handleNodeDeleteConfirm}>
                确认
              </Button>
            </div>
          }
        ></NodeDeleteConfirmModal>
      </div>
    </PaperContext>
  );
}

export default App;
