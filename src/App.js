import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import useUser from "./context/hooks/useUser";

import "./App.css";

import Header from "./components/Header";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Kanban from "./components/kanban";
import Boards from "./components/boards";

import Toast from "./components/toast";

import { io, connect, disconnect } from "./sio";

function App() {
  const { user, useSetUser, savedUser } = useUser();
  const [toast, setToast] = useState([]);

  useEffect(() => {
    if (!user._id) return;
    if (io) disconnect();
    connect();
    io.on("test", (t) => console.log(t));
    io.on("reload", () => window.location.reload());
  }, [user._id]);

  useSetUser();

  // protected route
  // const Protected = ({ path, children, ...rest }) => {
  //   const loggedInUser = user._id ? user : savedUser;
  //   if (!loggedInUser) return <Redirect to="/login" />;
  //   return (
  //     <Route path={path} {...rest}>
  //       {children}
  //     </Route>
  //   );
  // };
  //
  const ProtectedV2 = () => {
    const loggedInUser = user._id ? user : savedUser;
    if (!loggedInUser) return <Redirect to="/login" />;
    else return null;
  };

  const addToast = (text = "asfsa") =>
    setToast((prev) => {
      const id = Math.random();
      setTimeout(() => delToast(id), 5000);
      return [...(prev.length < 5 ? prev : prev.slice(1)), { id, text }];
    });

  const delToast = (id) =>
    setToast((prev) => [...prev.filter((t) => t.id !== id)]);

  return (
    <Router>
      <div className="App">
        <Header />        
          <Switch>
            <Route exact={true} path="/login">
              <Login />
            </Route>
            <Route exact={true} path="/register">
              <Register />
            </Route>
            <Route path="/board/:id">
              <ProtectedV2 />
              <Kanban addToast={addToast} />
            </Route>
            <Route exact={true} path="/">
              <ProtectedV2 />
              <Boards addToast={addToast} />
            </Route>
            <Route path="*">
              <h1>Not Found</h1>
            </Route>
          </Switch>         
        <Toast data={toast} delToast={delToast} />
      </div>
    </Router>
  );
}

export default App;
