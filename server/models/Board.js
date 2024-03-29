const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = require("./User");

const itemSchema = new Schema({
  name: { type: String, required: true },
  desc: { type: String },
  labels: [
    {
      name: { type: String, required: true },
      color: { type: String },
    },
  ],
  members: [
    { type: mongoose.Schema.Types.ObjectId, required: true, ref: User },
  ],
  checkList: [
    {
      name: { type: String, required: true },
      completed: { type: Boolean, required: true, default: false },
    },
  ],
  dd: { type: Date, default: null },
});

const listSchema = new Schema({
  title: { type: String, required: true },
  index: { type: Number, required: true },
  items: [itemSchema],
});

const boardSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: User,
  },
  desc: {
    type: String,
  },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: User }],
  lists: [listSchema],
});

module.exports = Board = mongoose.model("Board", boardSchema);
