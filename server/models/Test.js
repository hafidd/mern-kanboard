const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const testSchema = new Schema({
  dateString: { type: String, required: true },
  f: { type: Boolean, required: true, default: false },
  app: { type: String, required: true },
});

module.exports = Test = mongoose.model("Test", testSchema);
