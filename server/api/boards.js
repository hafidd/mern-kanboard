const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const parseError = require("../util/parseError");

const Board = require("../models/Board");

router.get("/", auth, async ({ userId }, res) => {
  try {
    const data = await Board.find({
      $or: [{ team: userId }, { user: userId }],
    }).sort({ _id: -1 });
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json("err");
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { name, desc } = req.body;
    const newBoard = new Board({ name, desc, user: req.userId });
    newBoard.validateSync();
    await newBoard.save();
    res.json(newBoard);
  } catch (error) {
    const errData = parseError(error);
    return res.status(errData.statusCode).json(errData);
  }
});

module.exports = router;
