const mongoose = require("mongoose");
const uuid = require('node-uuid');

const TubeTypeScheme = new mongoose.Schema({
  name: {
    type: String,
    required: [true],
    unique: false,
  },
  min: {
    type: Number,
    required: [true],
    unique: false,
  },
  max: {
    type: Number,
    required: [true],
    unique: false,
  }
})

module.exports = mongoose.model.TubeTypes || mongoose.model("TubeTypes", TubeTypeScheme);

