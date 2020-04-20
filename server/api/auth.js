const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const parseError = require("../util/parseError");
const auth = require("../middleware/auth");

const User = require("../models/User");

// register
router.post("/register", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    // new user, validate
    const newUser = new User({ email, name, password });
    await newUser.validate();
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    newUser.password = hash;
    // save
    await newUser.save();
    // session
    const data = newUser.toObject();
    delete data.password;
    delete data.__v;
    req.session.user = data;
    // responses
    return res.json(data);
  } catch (error) {
    const errData = parseError(error);
    return res.status(errData.statusCode).json(errData);
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    // login
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password))
      throw { statusCode: 401, msg: "Username / Password salah" };
    const data = user.toObject();
    delete data.password;
    delete data.__v;
    req.session.user = data;
    // response
    res.json(data);
  } catch (error) {
    const errData = parseError(error);
    return res.status(errData.statusCode).json(errData);
  }
});

// user data
router.get("/user-data", auth, (req, res) => res.json(req.session.user));

// logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ msg: "logout success" });
});

module.exports = router;
