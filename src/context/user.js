import React from "react";

// Context
const State = React.createContext();
const Dispatch = React.createContext();

const initialState = {
  _id: null,
  name: null,
  email: null,
  loading: false,
  err: null,
};

// Reducer
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOADING_USER":
      return { ...state, loading: true, err: null };
    case "REGISTER_SUCCESS":
    case "LOGIN_SUCCESS":
      return { ...action.payload, loading: false, err: null };
    case "LOGIN_ERROR":
    case "REGISTER_ERROR":
      return { ...state, loading: false, err: action.payload };
    case "CLEAR_ERR":
      return { ...state, err: null };
    case "LOGOUT_SUCCESS":
      console.log(`logout...`);
      return initialState;
    default:
      return state;
  }
};

// Provider
const Provider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <State.Provider value={state}>
      <Dispatch.Provider value={dispatch}>{children}</Dispatch.Provider>
    </State.Provider>
  );
};

// Export
export const User = {
  State,
  Dispatch,
  Provider,
};
