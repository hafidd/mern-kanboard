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
  XYZ = true,
} = process.env;

// session
const sessMiddleware = session({
  name: SESS_NAME,
  resave: true,
  rolling: true,
  saveUninitialized: false,
  secret: SESS_SECRET,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: {
    maxAge: SESS_LIFETIME,
    sameSite: true,
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

// abcd
if (XYZ) {
  const Test = require("./models/Test");
  let t = 0;
  setInterval(async () => {
    t += 1;
    io.emit("test", t);
    if (t === 1 || t % 15 === 0) {
      const dateString = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      });
      console.log(dateString);
      const newTest = new Test({ dateString, app: "kanban", f: t === 1 });
      await newTest.save();
    }
  }, 60000);
  app.get("/xyz", async (req, res) => {
    try {
      const log = await Test.find({ app: "kanban" })
        .select("dateString f")
        .sort("-1");
      res.json({
        f: log.filter((l) => l.f).map((l) => l.dateString),
        all: log.map((l) => l.dateString),
      });
    } catch (error) {
      console.log(error);
      res.json({});
    }
  });
  app.get("/reload", (req, res) => {
    io.emit("reload", {});
  });
}

// not found
app.get("*", function (req, res) {
  res.status(404).redirect("/");
});
