import React from "react";
import useUser from "../context/hooks/useUser";
import { useHistory } from "react-router-dom";

export default function () {
  const { user, logout } = useUser();
  const history = useHistory();

  return (
    <div className="header">
      <h3 onClick={() => history.push("/")} style={{ color: "white" }}>
        Home
      </h3>
      <div className="header-menu-left" style={{ padding: "0 10px" }}>
        {/* <button className="btn1">New</button> */}
      </div>
      <div className="header-menu-right">
        {/* <button className="btn1">New Board</button> */}
        <button className="btn1">{user._id ? user.name : "Guest"}</button>
        {user._id && (
          <button
            style={{ marginLeft: 2 }}
            className="btn1"
            onClick={() => logout()}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
