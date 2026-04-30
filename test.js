require("dotenv").config();
const express = require("express");
const { BakongKHQR, khqrData, MerchantInfo } = require("bakong-khqr");
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

app.post("/api/pay/generate", async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parseFloat(amount) || 1.0,
            billNumber: orderId || "TEST-001",
            storeLabel: "Hong Saoleang Shop",
            timestamp: Math.round(Date.now() / 1000) 
        };

        const merchantInfo = new MerchantInfo(
            process.env.BAKONG_ID || "hong_saoleang1@bkrt",
            "Hong Saoleang",
            "Phnom Penh",
            "123456",
            "BKRTKHPP",
            optionalData
        );

        const khqr = new BakongKHQR();
        const result = khqr.generateMerchant(merchantInfo);

        if (result && result.data) {
            const qrImage = await QRCode.toDataURL(result.data.qr);
            res.status(200).json({ success: true, qrString: result.data.qr, qrImage });
        } else {
            res.status(400).json({ success: false, debug: result });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("🚀 TEST SERVER RUNNING ON PORT 3000"));