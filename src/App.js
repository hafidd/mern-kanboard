import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import useUser from "./context/hooks/useUser";

import "./App.css";

import Header from "./components/Header";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Kanban from "./components/kanban/Kanban";
import Boards from "./components/Boards";

function App() {
  const { user, useSetUser, savedUser } = useUser();

  useSetUser();

  // protected route
  const Protected = ({ path, children, ...rest }) => {
    const loggedInUser = user._id ? user : savedUser;    
    if (!loggedInUser) return <Redirect to="/login" />;
    return (
      <Route path={path} {...rest}>
        {children}
      </Route>
    );
  };

  return (
    <div className="App">
      <Header />
      <Router>
        <Switch>
          <Route exact={true} path="/login">
            <Login />
          </Route>
          <Route exact={true} path="/register">
            <Register />
          </Route>
          <Protected path="/board/:id">
            <Kanban />
          </Protected>
          <Protected exact={true} path="/">
            <Boards />
          </Protected>
          <Route path="*">
            <h1>Not Found</h1>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
