import React from "react";
import "./Toast.css";

export default function ({ data, delToast }) {
  return (
    <div id="snackbar">
      {data.map((d, i) => (
        <div
          key={d.id}
          className="snackbar-item"
          style={{ opacity: 1 - (data.length - (i + 1)) / 5 }}
        >
          {d.text}
          <button className="btn2 fr bg-red" onClick={() => delToast(d.id)}>
            x
          </button>
        </div>
      ))}
    </div>
  );
}
