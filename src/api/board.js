import axios from "axios";

const loadBoards = () => axios.get("/api/boards");
const addBoard = (data) => axios.post("/api/boards", data);
const updateBoard = (data) => axios.put("/api/board", data);

const loadBoard = (id) => axios.get("/api/board/" + id);
const loadLogs = (id, item = null) =>
  axios.get(`/api/board/${id}/log/${item !== null ? item : ""}`);
const newList = (data) => axios.post("/api/board/lists", data);
const newItem = (data) => axios.post("/api/board/items", data);
const updateItem = (data) => axios.put("/api/board/items", data);
const reorder = (data) => axios.put("/api/board/reorder", data);
const setBoardRole = (data) => axios.put("/api/board/set-role", data);
const deleteItem = (data) => axios.delete("/api/board/item", { data });
const deleteList = (data) => axios.delete("/api/board/list", { data });
const deleteBoard = (data) => axios.delete("/api/board/", { data });

export {
  loadBoards,
  addBoard,
  updateBoard,
  loadBoard,
  loadLogs,
  newList,
  newItem,
  updateItem,
  reorder,
  setBoardRole,
  deleteBoard,
  deleteList,
  deleteItem,
};
