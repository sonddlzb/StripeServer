const express = require("express");
const app = express();

app.use(express.json());

// Thay đổi giá trị này thành khóa bí mật API của bạn
const stripe = require("stripe")("sk_test_51MpNF2KkURD5t8wjINNC64H1D8KbEzTzKob7fgizoZeaGbGX3elUrwTWvsZKctZoIU7NWbO9QlWjYUdgNzuGjULC00ErVWX1Ws");

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
      payment_method_types: ["card"],
      description: req.body.description,
      payment_method_data : {
        type: "card",
        card: {
            token: req.body.token
        }
      }
    });
    res.json({ client_secret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create PaymentIntent" });
  }
});

app.listen(3020, () => {
  console.log("Server listening on port 3020");
});

