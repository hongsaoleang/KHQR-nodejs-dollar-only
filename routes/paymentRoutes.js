const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

// Now you can use POST (Postman) OR GET (Browser)
router.all("/generate", paymentController.generateBakongQR);
router.get("/status", paymentController.paymentStatus);
router.post("/webhook", paymentController.paymentWebhook);
router.post("/confirm", paymentController.confirmPayment);

module.exports = router;
