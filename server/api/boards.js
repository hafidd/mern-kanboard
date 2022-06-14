const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const boardRoles = require("../middleware/boardRoles");
const parseError = require("../util/parseError");

const Board = require("../models/Board");
const Log = require("../models/Log");
const User = require("../models/User");

// data boards dari user
// all
router.get("/", auth, async ({ userId }, res) => {
  try {
    const data = await Board.find({
      $or: [{ team: userId }, { user: userId }],
    }).sort({ _id: -1 });
    console.log(
      `- menampilkan data boards dari user : ${userId}, ditemukan (${data.length}) data!`
    );
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json("err");
  }
});

// board baru
// all
router.post("/", auth, async (req, res) => {
  try {
    const { name, desc } = req.body;
    // create board
    const newBoard = new Board({ name, desc, user: req.userId });
    newBoard.validateSync();
    await newBoard.save();
    // add user boardRoles
    const role = { board: newBoard._id, role: "owner" };
    await User.findByIdAndUpdate(req.userId, {
      $push: { boardRoles: role },
    });
    if (req.session.user.boardRoles) req.session.user.boardRoles.push(role);
    req.session.save();
    // create log
    const newLog = new Log({
      user: req.session.user._id,
      date: new Date(),
      board: newBoard._id,
      action: "new-board",
      data: name,
    });
    newLog.validateSync();
    await newLog.save();
    console.log(`- user : ${req.userId} membuat board "${name}"`);
    res.json(newBoard);
  } catch (error) {
    const errData = parseError(error);
    return res.status(errData.statusCode).json(errData);
  }
});

module.exports = router;
