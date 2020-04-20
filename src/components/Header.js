import React from "react";
import useUser from "../context/hooks/useUser";

export default function () {
  const { user, logout } = useUser();  

  return (
    <div className="header">
      <h3>Header</h3>
      <div className="header-menu-left">
        <button>Home</button>
      </div>
      <div className="header-menu-right">
        <button>New</button>
        <button>{user._id ? user.name : "Guest"}</button>
        {user && <button onClick={() => logout()}>Logout</button>}
      </div>
    </div>
  );
}
