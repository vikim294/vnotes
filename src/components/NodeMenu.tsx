import { createPortal } from "react-dom";
import Button from "./Button";
import {
  useImperativeHandle,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface NodeMenuExpose {
  setPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
}

interface NodeMenuProps {
  ref: React.RefObject<NodeMenuExpose | null>;
  visible: boolean;
  onEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function NodeMenu({
  ref,
  visible,
  onEdit,
  onAddChild,
  onDelete,
  onClose,
}: NodeMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useImperativeHandle(
    ref,
    () => ({
      setPosition,
    }),
    [],
  );

  if (!visible) return null;

  return createPortal(
    <div className="fixed top-0 right-0 bottom-0 left-0" onPointerDown={onClose}>
      <div
        className={`bg-plain fixed`}
        style={{ top: position.y, left: position.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <Button className="block w-full" onClick={onEdit}>
            edit content
          </Button>
        </div>
        <div>
          <Button
            type="secondary"
            className="block w-full"
            onClick={onAddChild}
          >
            add child node
          </Button>
        </div>
        <div>
          <Button type="danger" className="block w-full" onClick={onDelete}>
            delete
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
