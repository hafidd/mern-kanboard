import React from "react";
//import { useStateValue } from "../context";

export default function ({ msg = true, error }) {
  if (!error) return null;
  return (
    <div className="error-msg">
      {msg ? error.msg ? <p>{error.msg}</p> : "Err" : ""}
      <ul>
        {error.errors && error.errors.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}
