const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = require("./User");
const Board = require("./Board");

const scx = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  name: {
    type: String,
  },
});

const logSchema = new Schema({
  date: { type: Date, required: true },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Board,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: User,
  },
  list: {
    type: scx,
    required: false,
  },
  sourceList: {
    type: scx,
    required: false,
  },
  destinationList: {
    type: scx,
    required: false,
  },
  item: {
    type: scx,
    required: false,
  },
  action: {
    type: String,
    required: true,
  },
  data: { type: Schema.Types.Mixed, default: null },
});

module.exports = Log = mongoose.model("Log", logSchema);
