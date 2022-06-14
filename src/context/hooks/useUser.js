import { useEffect, useContext } from "react";
import { User } from "../user";
import * as userApi from "../../api/user";

export default () => {
  const user = useContext(User.State);
  const dispatch = useContext(User.Dispatch);

  const login = async (email, password) => {
    try {
      dispatch({ type: "LOADING_USER" });
      const res = await userApi.login({ email, password });
      localStorage.setItem("user", JSON.stringify(res.data));
      dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
    } catch (error) {
      if (error.response)
        dispatch({ type: "LOGIN_ERROR", payload: error.response.data });
    }
  };

  const register = async (name, email, password) => {
    try {
      dispatch({ type: "LOADING" });
      const res = await userApi.register({ name, email, password });
      localStorage.setItem("user", JSON.stringify(res.data));
      dispatch({
        type: "REGISTER_SUCCESS",
        payload: res.data,
      });
    } catch (error) {
      if (error.response)
        dispatch({ type: "REGISTER_ERROR", payload: error.response.data });
    }
  };

  const logout = async () => {
    try {
      await userApi.logout();
      localStorage.removeItem("user");
      dispatch({ type: "LOGOUT_SUCCESS" });
    } catch (error) {
      console.error(error);
    }
  };

  const reloadBoardRoles = async () => {
    try {
      const boardRoles = await userApi.reloadBoardRoles();
      const updatedUser = { ...user, boardRoles };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log("boardRoles updated", boardRoles);
      dispatch({ type: "ROLE_UPDATED", payload: boardRoles });
    } catch (error) {
      logout();
    }
  };

  const savedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const clearErr = () => dispatch({ type: "CLEAR_ERR" });
  const useClearErr = () => {
    useEffect(() => {
      dispatch({ type: "CLEAR_ERR" });
    }, []);
  };

  const useSetUser = () => {
    useEffect(() => {
      (async () => {
        try {
          dispatch({ type: "LOADING_USER" });
          const res = await userApi.getData();
          localStorage.setItem("user", JSON.stringify(res.data));
          dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
        } catch (error) {
          // logout
          if (savedUser) {
            localStorage.removeItem("user");
            dispatch({ type: "LOGOUT_SUCCESS" });
          }
        }
      })();
    }, []);
  };

  return {
    user,
    login,
    register,
    logout,
    clearErr,
    useClearErr,
    savedUser,
    useSetUser,
    reloadBoardRoles,
  };
};
