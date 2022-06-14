import React from "react";
import "./Modal.css";

export default function ({
  title = "",
  visible = true,
  setVisible = null,
  closeModal,
  c = null,
  children,
}) {
  console.log()
  return (
    <div className={`overlay ${visible && "visible"} ${c && c}`}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button
            className="modal-close"
            onClick={() => {
              if (closeModal) closeModal();
              else setVisible(false);
            }}
          >
            <span>&times;</span>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
