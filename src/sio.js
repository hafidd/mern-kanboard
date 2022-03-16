import socketio from "socket.io-client";
export let io = null;
export const connect = () => (io = socketio.connect(`/`));
export const disconnect = () => io.close();
