const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Board = require("./Board");

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Nama harus diisi"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email harus diisi"],
    trim: true,
    validate: [
      {
        validator: (v) => /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v),
        message: () => `Email tidak valid`,
      },
      {
        validator: async (v) => {
          if (this.isNew) return !(await User.findOne({ email: v }));
          return true;
        },
        message: (props) => `Email: ${props.value} sudah terdaftar!`,
      },
    ],
  },
  boardRoles: [
    {
      board: { type: Schema.Types.ObjectId, ref: "Board" },
      role: { type: String },
    },
  ],
  password: {
    type: String,
    minlength: [8, "Password minimal 8 karakter"],
    required: [true, "Password harus diisi"],
  },
});

module.exports = User = mongoose.model("User", userSchema);
