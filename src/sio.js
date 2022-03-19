import socketio from "socket.io-client";
export let io = null;
export const connect = (boardId = "") =>
  (io = socketio.connect(`/?board=${boardId}`));
export const disconnect = () => io.close();
