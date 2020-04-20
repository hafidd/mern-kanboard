import axios from "axios";

const loadBoards = () => axios.get("/api/boards");
const addBoard = (data) => axios.post("/api/boards", data);

const loadBoard = (id) => axios.get("/api/board/" + id);
const newList = (data) => axios.post("/api/board/lists", data);
const newItem = (data) => axios.post("/api/board/items", data);
const updateItem = (data) => axios.put("/api/board/items", data);
const reorder = (data) => axios.put("/api/board/reorder", data);

export {
  loadBoards,
  addBoard,
  loadBoard,
  newList,
  newItem,
  updateItem,
  reorder,
};
