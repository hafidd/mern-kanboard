const express = require("express");
const app = express();
const mongoose = require("mongoose");

var session = require("express-session");
const MongoStore = require("connect-mongo")(session);

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

// session
app.use(
  session({
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
  })
);

// listen
const server = app.listen(
  PORT,
  console.log(`Server running on port ${PORT} 🔥`)
);

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
