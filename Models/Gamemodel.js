// models/Game.js
const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema(
  {
    gameName: { type: String, required: true, trim: true },
    minInvest: { type: Number, required: true, min: 1 },
    maxInvest: { type: Number, required: true },
    winChance: { type: Number, required: true, min: 0, max: 100 },
    image: { type: String, required: true },
    description: { type: String, required: true },
    slug:{ type: String, required: true },
    status:{ type: String, default: "enabled" }
  },
  { timestamps: true }
);
const Gamemodel=mongoose.model("Game", GameSchema);
module.exports = Gamemodel;
