import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import useUser from "../../context/hooks/useUser";

import ErrMsg from "../ErrMsg";

export default function () {
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  
  const { user, register, useClearErr } = useUser();

  useClearErr();
  
  if (user._id) return <Redirect to="/" />;

  const sbmt = (e) => {
    e.preventDefault();
    if (password !== password2) return;
    register(name, email, password);
  };

  return (
    <>
      <ErrMsg msg={false} error={user.err} />
      <form onSubmit={(e) => sbmt(e)}>
        <input
          type="text"
          placeholder="nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br />
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
        <input
          type="password"
          placeholder="konfirmasi password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
        <br />
        <button>sbmt</button>
        <Link to="/login">
          <button>Login</button>
        </Link>
      </form>
    </>
  );
}
