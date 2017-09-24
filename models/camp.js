const mongoose = require("mongoose");

let campSchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String,
  price: {
    type: String,
    default: "0.00",
    trim: true,
    minlength: 1,
    maxlength: 7,
    match: /^\d{1,4}\.?\d{0,2}$/
  },
  location: {
    name: {
      type: String,
      maxlength: 60,
      trim: true
    },
    coords: {
      lat: {
        type: Number
      },
      long: {
        type: Number
      }
    }
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ],
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  }
});

module.exports = mongoose.model("Campground", campSchema);
