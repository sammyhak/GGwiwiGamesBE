const mongoose=require('mongoose');

const withdrawSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    walletNumber: {
      type: String,
      required: true,
    },
    customer_name: {
      type: String,
      default:"",
    },
    customer_email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    type:{
      type: String,
      default:"Withdraw"
    }
  },
  { timestamps: true }
);

const Withdraw_model = mongoose.model('Withdraw', withdrawSchema);

module.exports= Withdraw_model;
