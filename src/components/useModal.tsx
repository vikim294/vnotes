import { createPortal } from "react-dom";
import Button from "./Button";
import { useCallback, useState } from "react";

interface ModalProps {
  width?: number;
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function useModal() {
  const [visible, setVisible] = useState(false);

  const Modal = ({ width, header, children, footer }: ModalProps = {}) => {
    if (!visible) return null;
    return createPortal(
      <div
        className="fixed top-0 right-0 bottom-0 left-0"
        onPointerDown={closeModal}
      >
        <div
          className={`bg-plain fixed top-1/2 left-1/2 -translate-1/2 text-white`}
          style={{ width: width ?? 400 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div>{header}</div>
          <div>{children}</div>
          <div>{footer}</div>
        </div>
      </div>,
      document.body,
    );
  };

  const openModal = useCallback(() => setVisible(true), []);
  const closeModal = useCallback(() => setVisible(false), []);

  return {
    Modal,
    openModal,
    closeModal,
  };
}
