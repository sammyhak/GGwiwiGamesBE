const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema(
  {
    paymentMethod: {
      type: String,
      required: true,
    },
    depositAmount: {
      type: Number,
      required: true,
    },
    userWalletNumber: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,  // Ensuring each transaction has a unique ID
    },
    customer_name:{
      type: String,
      default:"",
    },
    customer_email:{
      type: String,
      required: true,
    },
    merchant_name: {
      type: String,
      required: true,
    },
    agent_number: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,  // You can generate order IDs on the backend side
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',  // Default status is 'pending'
    },
    type:{
      type: String,
      default:"Deposit"
    }
  },
  {
    timestamps: true,  // Adds createdAt and updatedAt fields automatically
  }
);

const Deposit_model = mongoose.model('Deposit', depositSchema);

module.exports = Deposit_model;
