const express = require("express");
const Deposit_model = require("../Models/Depositmodel");
const user_route = express();
const { v4: uuidv4 } = require("uuid"); // Importing uuid
const user_model = require("../Models/User");
const Withdraw_model = require("../Models/Withdrawmodel");
// Route to create a new deposit

user_route.post("/create-deposit", async (req, res) => {
  try {
    console.log(req.body);
    const {
      paymentMethod,
      depositAmount,
      userWalletNumber,
      transactionId,
      merchant_name,
      agent_number,
      customer_name,
      customer_email,
    } = req.body;

    // Check if transactionId already exists
    const existingTransaction = await Deposit_model.findOne({ transactionId });
    if (existingTransaction) {
      return res.send({
        success: false,
        message: "Transaction ID already exists",
      });
    }

    // Generate a unique orderId using uuid
    const orderId = uuidv4();

    // Create new deposit entry
    const deposit = new Deposit_model({
      paymentMethod,
      depositAmount,
      userWalletNumber,
      transactionId,
      merchant_name,
      agent_number,
      orderId,
      customer_name,
      customer_email,
    });

    // Save deposit to the database
    await deposit.save();

    res.status(201).json({
      success: true,
      message: "Deposit created successfully",
      deposit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

user_route.get("/user-info/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user by ID
    const user = await user_model.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to get a single deposit by ID
user_route.get("/deposit/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the deposit by ID
    const deposit = await Deposit_model.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: "Deposit not found" });
    }

    res.status(200).json(deposit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// --------------withdraw---------------------
// Route to create a new withdrawal request
// Route to create a new withdrawal request
user_route.post("/withdraw", async (req, res) => {
  const { paymentMethod, amount, walletNumber, customer_name, customer_email } =
    req.body;

  try {
    // Check if the user has sufficient balance
    const user = await user_model.findOne({ email: customer_email });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Check if the user has enough balance to withdraw
    if (user.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance.",
      });
    }

    // Generate a unique order ID
    const orderId = uuidv4().replace(/-/g, "").substring(0, 8);

    // Create a new withdrawal entry
    const newWithdraw = new Withdraw_model({
      orderId,
      paymentMethod,
      amount,
      walletNumber,
      customer_name,
      customer_email,
    });

    // Save the withdrawal request to the database
    await newWithdraw.save();

    // Deduct the withdrawal amount from the user's balance
    user.balance -= amount;
    await user.save();

    // Send success response
    res.status(201).json({
      message: "Withdrawal request created successfully!",
      data: newWithdraw,
      updatedBalance: user.balance, // Send the updated balance in the response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create withdrawal request.",
      error: error.message,
    });
  }
});

// Route to update withdrawal status
user_route.put("/withdraw/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  // Ensure status is one of 'pending', 'approved', or 'rejected'
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message:
        'Invalid status. Please provide one of "pending", "approved", or "rejected".',
    });
  }

  try {
    const withdraw = await Withdraw_model.findOne({ orderId });

    if (!withdraw) {
      return res.status(404).json({
        message: "Withdrawal request not found.",
      });
    }

    // Update the status
    withdraw.status = status;
    await withdraw.save();

    // Send success response
    res.status(200).json({
      message: "Withdrawal status updated successfully!",
      data: withdraw,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update withdrawal status.",
      error: error.message,
    });
  }
});

// Route to get all withdrawal requests
user_route.get("/withdraw", async (req, res) => {
  try {
    // Fetch all withdrawals
    const withdrawals = await Withdraw_model.find();

    // Send response
    res.status(200).json({
      message: "Withdrawals fetched successfully!",
      data: withdrawals,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch withdrawals.",
      error: error.message,
    });
  }
});
// ----------transaction-hsotory------------
// Route to get mixed withdraw and deposit data for a user
// Route to get combined withdraw and deposit transactions for a user
user_route.get("/transactions/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch Withdraw transactions for the user
    const withdraws = await Withdraw_model.find({
      customer_email: userId,
    }).select(
      "orderId paymentMethod amount walletNumber customer_name customer_email status type createdAt"
    );

    // Fetch Deposit transactions for the user
    const deposits = await Deposit_model.find({
      customer_email: userId,
    }).select(
      "orderId paymentMethod depositAmount userWalletNumber customer_name customer_email status type createdAt"
    );

    // Combine both arrays of transactions
    const combinedTransactions = [
      ...withdraws.map((w) => ({
        ...w.toObject(),
        amount: w.amount,
        type: w.type,
        date: w.createdAt,
      })),
      ...deposits.map((d) => ({
        ...d.toObject(),
        amount: d.depositAmount,
        type: d.type,
        date: d.createdAt,
      })),
    ];

    // Sort the combined transactions by date (most recent first)
    combinedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Send the combined transactions as a response
    res.json(combinedTransactions);
  } catch (error) {
    console.error("Error fetching transactions", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------after-play-------------------------------
user_route.put("/after-play-minus-balance", async (req, res) => {
  try {
    const { betAmount, player_id } = req.body;
    console.log(req.body);
    const find_user = await user_model.findOne({ player_id: player_id });
    if (!find_user) {
      return res.send({ success: false, message: "User did not find!" });
    }
    // const update_user_balance=await UserModel.findByIdAndUpdate({_id:find_user._id});
    find_user.balance -= betAmount;
    res.send({ success: true, message: "Ok" });
    find_user.save();
  } catch (err) {
    console.log(err);
  }
});
// ------------------after-win--------------------------
user_route.put("/after-win-add-balance", async (req, res) => {
  try {
    const { winAmount, player_id } = req.body;
    console.log(req.body);
    const find_user = await user_model.findOne({ player_id: player_id });
    if (!find_user) {
      return res.send({ success: false, message: "User did not find!" });
    }
    // const update_user_balance=await UserModel.findByIdAndUpdate({_id:find_user._id});
    find_user.balance += winAmount;
    res.send({ success: true, message: "Ok" });
    find_user.save();
  } catch (err) {
    console.log(err);
  }
});
// -------------------------after-withdraw-------------------------------
user_route.put("/after-withdraw-minus-balance", async (req, res) => {
  try {
    const { amount, player_id } = req.body;
    console.log(req.body);
    const find_user = await user_model.findOne({ player_id: player_id });
    if (!find_user) {
      return res.send({ success: false, message: "User did not find!" });
    }
    // const update_user_balance=await UserModel.findByIdAndUpdate({_id:find_user._id});
    find_user.balance -= amount;
    res.send({ success: true, message: "Ok" });
    find_user.save();
  } catch (err) {
    console.log(err);
  }
});

module.exports = user_route;
