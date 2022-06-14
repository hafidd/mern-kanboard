import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import useUser from "../../context/hooks/useUser";

import ErrMsg from "../ErrMsg";
import "./Auth.css";

export default function () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { user, login, useClearErr } = useUser();

  useClearErr();

  if (user._id) return <Redirect to="/" />;

  return (
    <div className="auth">
      <h2>Login</h2>
      <ErrMsg error={user.err} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(email, password);
        }}
      >
        <input
          type="text"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button className="btn1">Login</button>
        <Link to="/register" href="">
          Register
        </Link>
      </form>
    </div>
  );
}
