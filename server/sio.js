const socketio = require("socket.io");

module.exports.listen = (server) => {
  const io = socketio.listen(server);

  io.connectedUsers = {};

  io.on("connection", async (socket) => {
    // console.log(socket.id, "on", socket.request.session.user._id);

    // if logged in
    if (socket.request.session.user) {
      const user = socket.request.session.user;
      // update connectedUsers
      if (io.connectedUsers[user._id])
        io.connectedUsers[user._id].sockets.push(socket);
      else
        io.connectedUsers[user._id] = {
          ...socket.request.session.user,
          sockets: [socket],
        };
    }

    socket.on("join", (id) => {
      console.log("socket", socket.id, "join", id);
      socket.join(id);
    });
    socket.on("leave", (id) => {
      console.log("socket", socket.id, "leave", id);
      socket.leave(id);
    });

    io.to(socket.id).emit("server-reload", null);

    socket.on("disconnect", () => {
      // console.log(socket.id, "off", socket.request.session.user._id);
      if (
        socket.request.session.user &&
        io.connectedUsers[socket.request.session.user._id]
      )
        if (
          io.connectedUsers[socket.request.session.user._id].sockets.length < 2
        )
          delete io.connectedUsers[socket.request.session.user._id];
        else
          io.connectedUsers[
            socket.request.session.user._id
          ].sockets = io.connectedUsers[
            socket.request.session.user._id
          ].sockets.filter((s) => s.id !== socket.id);
    });
  });

  return io;
};
