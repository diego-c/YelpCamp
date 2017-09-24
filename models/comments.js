const mongoose = require("mongoose"),
  moment = require("moment");

let commentSchema = new mongoose.Schema({
  text: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  date: {
    type: String,
    default: moment(Date.now()).format("l, h:mm:ss a")
  },
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    lastEdited: {
      type: String
    }
  }
});

module.exports = mongoose.model("Comment", commentSchema);
