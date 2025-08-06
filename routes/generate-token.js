require("dotenv").config();
const express = require("express");
const router = express.Router();
const midtransClient = require("midtrans-client");

let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.SERVER_KEY,
});

router.post("/token", async (req, res) => {
  const { order_id, gross_amount, first_name } = req.body;
  console.log("BODY DARI FRONTEND:", req.body);
  let parameter = {
    transaction_details: {
      order_id,
      gross_amount,
    },
    credit_card: {
      secure: true,
    },
    customer_details: {
      first_name,
    },
  };

  try {
    const reqToken = await snap.createTransaction(parameter);
    res.json({
      token: reqToken.token,
      redirect_url: reqToken.redirect_url,
    });
  } catch (err) {
    console.log("Error create token:", err);
    res.status(500).send("failed to create token");
  }
});

module.exports = router;
