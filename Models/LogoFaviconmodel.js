// models/logoFaviconModel.js
const mongoose = require("mongoose");

const logoFaviconSchema = new mongoose.Schema({
  logo: { type: String, default: "" }, // Store the logo filename
  favicon: { type: String, default: "" }, // Store the favicon filename
  updatedAt: { type: Date, default: Date.now }
});

const LogoFavicon = mongoose.model("LogoFavicon", logoFaviconSchema);

module.exports = LogoFavicon;
