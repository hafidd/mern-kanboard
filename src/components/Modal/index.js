import React, { } from "react";
import "./Modal.css";

export default function ({
  title = "",
  visible = true,
  setVisible = null,
  children,
}) {
  return (
    <div className={`overlay ${visible && "visible"}`}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={() => setVisible(!visible)}>
            <span>&times;</span>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
