require("dotenv").config();
const express = require("express");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
app.use(express.json());

app.use("/api/pay", paymentRoutes);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bakong Payment</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        form { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        input, button { padding: 10px; margin: 10px; width: 80%; }
        button { background: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <h1>Bakong Payment System</h1>
      <form action="/api/pay/generate" method="GET">
        <label for="amount">Amount ($):</label><br>
        <input type="number" id="amount" name="amount" step="0.01" min="0.01" placeholder="Enter amount (e.g., 2.50)" required><br>
        
        <label for="orderId">Order ID:</label><br>
        <input type="text" id="orderId" name="orderId" placeholder="Enter order ID (optional)"><br>
        
        <button type="submit">Generate QR Code</button>
      </form>
      <p>Or <a href="/api/pay/generate?amount=0.25&orderId=TEST123">use default test values</a></p>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ✅ Server is running!
  
  👉 Click this link to test in your browser:
     http://localhost:${PORT}/api/pay/generate?amount=2.0&orderId=TEST123
  `);
});
