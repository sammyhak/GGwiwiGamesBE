const express = require("express");
const user_model = require("../Models/User");
const admin_route = express();
const { v4: uuidv4 } = require("uuid");
const depositModel = require("../Models/Depositmodel");
const Deposit_model = require("../Models/Depositmodel");
const Withdraw_model = require("../Models/Withdrawmodel");
const multer = require("multer");
const carousel_model = require("../Models/Carouselmodel");
const path = require("path");
const fs = require("fs");
const LogoFavicon = require("../Models/LogoFaviconmodel");
const moment = require("moment"); // Make sure you have moment.js installed
const Gamemodel = require("../Models/Gamemodel");
// ------------file-upload----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const uploadimage = multer({ storage: storage });
// ------------------all-information---------------------
admin_route.get("/all-coutation", async (req, res) => {
  try {
    const pending_withdraw = await Withdraw_model.find({
      status: "pending",
    }).countDocuments();
    const approved_withdraw = await Withdraw_model.find({
      status: "approved",
    }).countDocuments();
    const all_withdraw = await Withdraw_model.find().countDocuments();
    const all_withdraw_info = await Withdraw_model.find();
    const active_user = await user_model
      .find({ status: "active" })
      .countDocuments();
    const deactive_user = await user_model
      .find({ status: "inactive" })
      .countDocuments();
    const total_user = await user_model.find().countDocuments();
    //  -------------------------deposit------------------------------
    const pending_deposit = await Deposit_model.find({
      status: "pending",
    }).countDocuments();
    const success_deposit = await Deposit_model.find({
      status: "approved",
    }).countDocuments();
    const total_deposit = await Deposit_model.find();
    const totalWithdrawAmount = all_withdraw_info.reduce(
      (total, withdraw) => total + withdraw.withdrawAmount,
      0
    );
    // Filter withdrawals created today
    // Get today's date in YYYY-MM-DD format
    const today = moment().startOf("day");
    const todays_withdraw = all_withdraw_info.filter((withdraw) => {
      const createdAt = moment(withdraw.createdAt);
      return createdAt.isSame(today, "day");
    });

    // Calculate the total withdraw amount for today
    const totalTodayWithdrawAmount = todays_withdraw.reduce(
      (total, withdraw) => total + withdraw.withdrawAmount,
      0
    );

    // Calculate the total amount of money
    const totalDepositAmount = total_deposit.reduce(
      (total, deposit) => total + deposit.depositAmount,
      0
    );

    // Filter deposits created today
    const todays_deposit = total_deposit.filter((deposit) => {
      const createdAt = moment(deposit.createdAt);
      return createdAt.isSame(today, "day");
    });

    // Calculate the total amount for today
    const totalTodayAmount = todays_deposit.reduce(
      (total, deposit) => total + deposit.depositAmount,
      0
    );

    const all_deposit = await Deposit_model.find().countDocuments();
    res.send({
      success: true,
      pending_withdraw,
      approved_withdraw,
      all_withdraw,
      totalWithdrawAmount,
      totalTodayAmount,
      pending_deposit,
      totalDepositAmount,
      success_deposit,
      all_deposit,
      active_user,
      deactive_user,
      total_user,
    });
  } catch (error) {
    console.log(error);
  }
});
admin_route.get("/all-users", async (req, res) => {
  try {
    const all_users = await user_model.find();
    if (!all_users) {
      return res.send({ success: false, message: "Users Not found!" });
    }
    res.send({ success: true, message: "Active users", data: all_users });
  } catch (error) {
    console.log(error);
  }
});
admin_route.get("/active-users", async (req, res) => {
  try {
    const active_user = await user_model.find({ status: "active" });
    if (!active_user) {
      return res.send({ success: false, message: "Active Users Not found!" });
    }
    res.send({ success: true, message: "Active users", data: active_user });
  } catch (error) {
    console.log(error);
  }
});
admin_route.get("/banned-users", async (req, res) => {
  try {
    const banned_user = await user_model.find({ status: "banned" });
    if (!banned_user) {
      return res.send({ success: false, message: "Banned Users Not found!" });
    }
    res.send({ success: true, message: "Active users", data: banned_user });
  } catch (error) {
    console.log(error);
  }
});
admin_route.get("/single-user-details/:id", async (req, res) => {
  try {
    const user_detail = await user_model.findOne({ _id: req.params.id });
    if (!user_detail) {
      return res.send({ success: false, message: "User Not found!" });
    }
    res.send({ success: true, message: "Ok", data: user_detail });
  } catch (error) {
    console.log(error);
  }
});

// -------------------deposit---------------------
// Route to get all deposits with an optional status filter
admin_route.get("/deposits", async (req, res) => {
  try {
    const { status } = req.query; // Optional query parameter for status

    let filter = {};

    if (status) {
      // Validate status value
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      filter.status = status;
    }

    // Get all deposits based on filter
    const deposits = await Deposit_model.find();

    res.status(200).json(deposits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
admin_route.get("/pending-deposits", async (req, res) => {
  try {
    const { status } = req.query; // Optional query parameter for status

    let filter = {};

    if (status) {
      // Validate status value
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      filter.status = status;
    }

    // Get all deposits based on filter
    const deposits = await Deposit_model.find({ status: "pending" });

    res.status(200).json(deposits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Route to update the deposit status (approved, rejected)
admin_route.put("/deposit/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find deposit by ID
    const deposit = await Deposit_model.findById(id);
    console.log(deposit);
    if (!deposit) {
      return res.status(404).json({ message: "Deposit not found" });
    }

    // If status is already approved, prevent double crediting
    if (deposit.status === "approved" && status === "approved") {
      return res.status(400).json({ message: "Deposit is already approved" });
    }

    // Update deposit status
    deposit.status = status;
    await deposit.save();

    // If approved, update user's balance
    if (status === "approved") {
      const user = await user_model.findOne({ email: deposit.customer_email });
      console.log(user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.balance += deposit.depositAmount; // Add deposit amount to user's balance
      await user.save();
    }

    res.status(200).json({
      message: "Deposit status updated successfully",
      deposit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// ----------------------withdrawal-----------------------
// --------------------------withdrawal--------------------------
admin_route.get("/pending-withdrawal", async (req, res) => {
  try {
    const pending_deposit = await Withdraw_model.find({
      status: "pending",
    }).sort({ createdAt: -1 });
    if (!pending_deposit) {
      return res.send({ success: false, message: "Transaction not found!" });
    }
    res.send({ success: true, data: pending_deposit });
  } catch (error) {
    console.log(error);
  }
});
admin_route.get("/approved-withdrawal", async (req, res) => {
  try {
    const success_deposit = await Withdraw_model.find({
      status: "approved",
    }).sort({ createdAt: -1 });
    if (!success_deposit) {
      return res.send({ success: false, message: "Transaction not found!" });
    }
    res.send({ success: true, data: success_deposit });
  } catch (error) {
    console.log(error);
  }
});
admin_route.get("/rejected-withdrawal", async (req, res) => {
  try {
    const rejected_withdraw = await Withdraw_model.find({
      status: "rejected",
    }).sort({ createdAt: -1 });
    if (!rejected_withdraw) {
      return res.send({ success: false, message: "Transaction not found!" });
    }
    res.send({ success: true, data: rejected_withdraw });
  } catch (error) {
    console.log(error);
  }
});
admin_route.get("/all-withdrawals", async (req, res) => {
  try {
    const all_deposit = await Withdraw_model.find().sort({ createdAt: -1 });
    if (!all_deposit) {
      return res.send({ success: false, message: "Transaction not found!" });
    }
    res.send({ success: true, data: all_deposit });
  } catch (error) {
    console.log(error);
  }
});
admin_route.get("/single-withdraw/:id", async (req, res) => {
  try {
    const single_withdraw = await Withdraw_model.findById({
      _id: req.params.id,
    });
    if (!single_withdraw) {
      return res.send({ success: false, message: "Transaction not found!" });
    }
    res.send({ success: true, data: single_withdraw });
  } catch (error) {
    console.log(error);
  }
});
admin_route.put("/withdrawals/:withdrawalId/status", async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status } = req.body;

    // Allowed status values
    const validStatuses = ["pending", "approved", "rejected"];

    // Validate the new status
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Find and update the withdrawal status
    const updatedWithdrawal = await Withdraw_model.findByIdAndUpdate(
      withdrawalId,
      { status },
      { new: true }
    );

    if (!updatedWithdrawal) {
      return res.status(404).json({ message: "Withdrawal not found." });
    }

    res.json({
      message: "Withdrawal status updated successfully.",
      withdrawal: updatedWithdrawal,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});
// ------------carousel-uplaod----------------

// Route to upload multiple images
admin_route.post(
  "/upload",
  uploadimage.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Extract filenames and paths from uploaded files
      const filenames = req.files.map((file) => file.filename);
      const paths = req.files.map((file) => `${file.filename}`);

      // Find the existing document (if any)
      let existingImageSet = await carousel_model.findOne();

      // If no document exists, create a new one
      if (!existingImageSet) {
        existingImageSet = new carousel_model({ filenames, paths });
        await existingImageSet.save();
      } else {
        // Add the new images to the existing arrays
        existingImageSet.filenames.push(...filenames);
        existingImageSet.paths.push(...paths);
        await existingImageSet.save();
      }

      res.json({
        message: "Images uploaded successfully",
        images: existingImageSet,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error uploading images", error });
    }
  }
);

// Route to get all uploaded images (for slider)
// GET route to fetch images
admin_route.get("/banners", async (req, res) => {
  try {
    // Find the image document in the database
    const imageSet = await carousel_model.findOne();

    // Check if the imageSet exists
    if (!imageSet) {
      return res.status(404).json({ message: "No images found" });
    }

    // Send the filenames in the response
    res.json({ filenames: imageSet.filenames });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ message: "Error fetching banners", error });
  }
});
// Delete a single image
admin_route.delete("/banners/:imageName", async (req, res) => {
  const { imageName } = req.params;

  try {
    // Find the carousel entry
    const carousel = await carousel_model.findOne({});

    if (!carousel) {
      return res.status(404).json({ message: "Carousel not found" });
    }

    // Find the index of the image to delete
    const imageIndex = carousel.filenames.indexOf(imageName);
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Remove the image from the filenames and paths arrays
    carousel.filenames.splice(imageIndex, 1);
    carousel.paths.splice(imageIndex, 1);

    // Delete the actual image file from the server
    const filePath = path.join(__dirname, "public", "images", imageName); // Adjust the path if necessary
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Delete the file from the server
    }

    // Save the updated carousel record
    await carousel.save();

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Error deleting image", error });
  }
});
// -----------------logo-adnd-favicon-------------------------
// Route to upload and update logo and favicon
admin_route.post(
  "/upload-logo-favicon",
  uploadimage.fields([{ name: "logo" }, { name: "favicon" }]),
  async (req, res) => {
    try {
      const { logo, favicon } = req.files;
      console.log(req.files);
      const logoFilename = logo ? logo[0].filename : "";
      const faviconFilename = favicon ? favicon[0].filename : "";

      // Find if a logo/favicon entry already exists
      let logoFavicon = await LogoFavicon.findOne({});
      if (!logoFavicon) {
        // If no entry, create a new one
        logoFavicon = new LogoFavicon({
          logo: logoFilename,
          favicon: faviconFilename,
        });
      } else {
        // Update the existing entry
        logoFavicon.logo = logoFilename || logoFavicon.logo;
        logoFavicon.favicon = faviconFilename || logoFavicon.favicon;
        logoFavicon.updatedAt = Date.now();
      }

      // Save the updated logo/favicon
      await logoFavicon.save();

      res.json({
        message: "Logo and favicon uploaded successfully",
        logo: logoFilename,
        favicon: faviconFilename,
      });
    } catch (error) {
      console.error("Error uploading logo/favicon:", error);
      res.status(500).json({ message: "Error uploading logo/favicon", error });
    }
  }
);

// admin_route to get the current logo and favicon
admin_route.get("/get-logo-favicon", async (req, res) => {
  try {
    const logoFavicon = await LogoFavicon.findOne({});
    if (!logoFavicon) {
      return res.status(404).json({ message: "Logo and favicon not found" });
    }
    res.json({ logo: logoFavicon.logo, favicon: logoFavicon.favicon });
  } catch (error) {
    console.error("Error fetching logo/favicon:", error);
    res.status(500).json({ message: "Error fetching logo/favicon", error });
  }
});

// Route to delete logo and favicon
admin_route.delete("/delete-logo-favicon", async (req, res) => {
  try {
    const logoFavicon = await LogoFavicon.findOne({});
    if (!logoFavicon) {
      return res.status(404).json({ message: "Logo and favicon not found" });
    }

    // Remove the image files
    if (logoFavicon.logo) {
      fs.unlinkSync(
        path.join(__dirname, "../public", "uploads", logoFavicon.logo)
      );
    }
    if (logoFavicon.favicon) {
      fs.unlinkSync(
        path.join(__dirname, "../public", "uploads", logoFavicon.favicon)
      );
    }

    // Delete from the database
    await logoFavicon.deleteOne();
    res.json({ message: "Logo and favicon deleted successfully" });
  } catch (error) {
    console.error("Error deleting logo/favicon:", error);
    res.status(500).json({ message: "Error deleting logo/favicon", error });
  }
});
// ---------------add-games---------------------
// Add or Update Game
const slugify = (text) => {
  return text.toLowerCase().replace(/\s+/g, "_");
};

admin_route.post(
  "/create-game",
  uploadimage.single("image"),
  async (req, res) => {
    try {
      const { gameName, minInvest, maxInvest, winChance, description } =
        req.body;
      const image = req.file ? req.file.filename : null;

      if (
        !gameName ||
        !minInvest ||
        !maxInvest ||
        !winChance ||
        !description ||
        !image
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const slug = slugify(gameName); // Generate slug from gameName

      let game = await Gamemodel.findOne({ gameName });
      if (game) {
        game.minInvest = minInvest;
        game.maxInvest = maxInvest;
        game.winChance = winChance;
        game.description = description;
        game.image = image;
        game.slug = slug; // Update slug if gameName changes
        await game.save();
        return res.json({ message: "Game updated successfully", game });
      }

      game = new Gamemodel({
        gameName,
        slug,
        minInvest,
        maxInvest,
        winChance,
        description,
        image,
      });
      await game.save();
      res.status(201).json({ message: "Game added successfully", game });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Get all games
admin_route.get("/games", async (req, res) => {
  try {
    const games = await Gamemodel.find();
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});
// Get single game by ID
admin_route.get("/game/id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid game ID format" });
    }

    const game = await Gamemodel.findById(id);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});
admin_route.put(
  "/update-game/:id",
  uploadimage.single("image"),
  async (req, res) => {
    try {
      const { gameName, minInvest, maxInvest, winChance, description } =
        req.body;
      let updateData = {
        gameName,
        minInvest,
        maxInvest,
        winChance,
        description,
      };

      if (req.file) {
        updateData.image = req.file.filename; // If a new image is uploaded
      }

      const game = await Gamemodel.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json({ message: "Game updated successfully", game });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Delete game
admin_route.delete("/delete-game/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Gamemodel.findByIdAndDelete(id);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    res.json({ message: "Game deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = admin_route;
