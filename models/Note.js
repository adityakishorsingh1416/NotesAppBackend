const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  heading: String,
  content: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

module.exports = mongoose.model("Note", noteSchema);
