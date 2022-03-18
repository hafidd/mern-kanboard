const express = require("express");
const app = express();
const mongoose = require("mongoose");

var session = require("express-session");
const MongoStore = require("connect-mongo")(session);

require("dotenv").config();

app.use(express.json());

// config
const {
  PORT = 5001,
  SESS_NAME = "sid",
  SESS_SECRET = "r@hasia",
  SESS_LIFETIME = 1000 * 60 * 30, // 30 mnt
  NODE_ENV = "development",
  MONGO_URI = "mongodb://localhost/mern-kanboard",
} = process.env;

// heroku
app.set("trust proxy", 1);

// session
const sessMiddleware = session({
  name: SESS_NAME,
  resave: false,
  rolling: true,
  saveUninitialized: true,
  secret: SESS_SECRET,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: {
    maxAge: Number(SESS_LIFETIME),
    sameSite: "none",
    secure: NODE_ENV === "production",
  },
});
app.use(sessMiddleware);

// listen
const server = app.listen(
  PORT,
  console.log(`Server running on port ${PORT} 🔥`)
);

// socketio
const io = require("./sio").listen(server);
//io.use(sharedsession(sessMiddleware, { autoSave: true }));

io.use((socket, next) => {
  sessMiddleware(socket.request, socket.request.res, next);
});

app.use((req, res, next) => {
  req.io = io;
  return next();
});

// connect db
mongoose
  .connect(MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("mongodb connected..."))
  .catch((err) => console.log("db error", err));

// routes
app.use("/api/boards", require("./api/boards"));
app.use("/api/board", require("./api/board"));
app.use("/api/auth", require("./api/auth"));

// static
app.use(express.static(require("path").join(__dirname, "./../build")));

// not found
app.get("*", function (req, res) {
  res.status(404).redirect("/");
});

// app.get("/favicon.ico", function (req, res) {
//   res.send(require("path").join(__dirname, "./../build")));
// });
