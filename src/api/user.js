import axios from "axios";

const register = (data) => axios.post("/api/auth/register", data);
const login = (data) => axios.post("/api/auth/login", data);
const logout = () => axios.post("/api/auth/logout");
const getData = () => axios.get("/api/auth/user-data");
const reloadBoardRoles = () => axios.put("/api/auth/update-boardRoles");

export { register, login, getData, logout, reloadBoardRoles };
