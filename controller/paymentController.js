const { BakongKHQR, khqrData, MerchantInfo } = require("bakong-khqr");
const QRCode = require("qrcode");

const orders = {}; // In-memory order status store

exports.generateBakongQR = async (req, res) => {
  console.log("--- Generating QR ---");
  try {
    // If testing from browser (GET), we use query. If Postman (POST), we use body.
    const amount = req.body?.amount || req.query?.amount || 0.25;
    const orderId =
      req.body?.orderId || req.query?.orderId || "INV" + Date.now();

    const amountNumber = parseFloat(amount) || 0.25;
    orders[orderId] = {
      amount: amountNumber,
      status: "pending",
      createdAt: Date.now(),
    };

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expirationTimestamp = Date.now() + 2 * 60 * 1000; // 2 minutes from now in milliseconds

    // Optional data for the QR
    const optionalData = {
      currency: khqrData.currency.usd,
      amount: amountNumber,
      billNumber: String(orderId) || "TEST-001",
      storeLabel: "Hong Saoleang Shop",
      timestamp: currentTimestamp,
      expirationTimestamp: expirationTimestamp,
    };

    // Create MerchantInfo object with correct constructor
    const bakongId = process.env.BAKONG_ID || "hong_saoleang1@bkrt";
    console.log("Using BAKONG_ID:", bakongId);

    const merchantInfo = new MerchantInfo(
      bakongId,
      "Hong Saoleang",
      "Phnom Penh",
      "123456",
      "BKRTKHPP",
      optionalData,
    );
    const khqr = new BakongKHQR();
    const result = khqr.generateMerchant(merchantInfo); // ✅ Correct!
    console.log("QR Result:", result);

    if (result && result.data && result.data.qr) {
      const qrImageBase64 = await QRCode.toDataURL(result.data.qr);

      // If the user is visiting from a browser, show the image directly
      if (req.method === "GET") {
        return res.send(`
          <div style="text-align:center; font-family:sans-serif;">
            <h1>Bakong Payment</h1>
            <img src="${qrImageBase64}" width="300" />
            <p>Scan to pay <b>$${amountNumber.toFixed(2)}</b></p>
            <p>Order ID: ${orderId}</p>
            <p style="margin-top:10px; font-size:14px; color:#555;">This QR expires in <span id="countdown">02:00</span> and will return automatically.</p>
            <p style="margin-top:20px; font-size:16px; color:#333;">Waiting for payment confirmation…</p>
            <p>
              <a href="/" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#007bff; color:white; text-decoration:none; border-radius:6px;">Choose another amount</a>
            </p>
          </div>
          <script>
            const statusUrl = '/api/pay/status?orderId=${encodeURIComponent(orderId)}';
            let remaining = 120;
            const countdownEl = document.getElementById('countdown');
            function pad(num) { return num.toString().padStart(2,'0'); }
            async function updateCountdown() {
              const minutes = Math.floor(remaining / 60);
              const seconds = remaining % 60;
              countdownEl.textContent = pad(minutes) + ':' + pad(seconds);
              if (remaining <= 0) {
                window.location.href = '/';
                return false;
              }
              remaining -= 1;
              return true;
            }
            async function waitForPayment() {
              while (remaining > 0) {
                try {
                  const response = await fetch(statusUrl);
                  const data = await response.json();
                  if (data.paid) {
                    window.location.href = '/';
                    return;
                  }
                } catch (err) {
                  console.warn('Status check failed', err);
                }
                await new Promise((resolve) => setTimeout(resolve, 3000));
              }
            }
            async function start() {
              updateCountdown();
              const countdownInterval = setInterval(async () => {
                const active = await updateCountdown();
                if (!active) {
                  clearInterval(countdownInterval);
                }
              }, 1000);
              await waitForPayment();
            }
            start();
          </script>
        `);
      }

      // Otherwise, return JSON for Postman/Apps
      return res.status(200).json({
        success: true,
        qrString: result.data.qr,
        qrImage: qrImageBase64,
        md5: result.data.md5,
      });
    } else {
      return res.status(400).json({ success: false, debug: result });
    }
  } catch (error) {
    console.error("Error details:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
};

exports.paymentStatus = (req, res) => {
  const orderId = req.query.orderId;
  if (!orderId || !orders[orderId]) {
    return res.status(404).json({ paid: false, error: "Order not found" });
  }
  return res.json({
    paid: orders[orderId].status === "paid",
    status: orders[orderId].status,
  });
};

exports.paymentWebhook = (req, res) => {
  const orderId = req.body.orderId;
  const status = req.body.status || "paid";
  if (!orderId) {
    return res
      .status(400)
      .json({ success: false, error: "orderId is required" });
  }
  if (!orders[orderId]) {
    orders[orderId] = { amount: 0, status: "pending", createdAt: Date.now() };
  }
  orders[orderId].status = status;
  return res.json({ success: true, orderId, status: orders[orderId].status });
};

exports.confirmPayment = (req, res) => {
  const orderId = req.query.orderId || req.body.orderId;
  if (!orderId || !orders[orderId]) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }
  orders[orderId].status = "paid";
  return res.json({ success: true, orderId, status: orders[orderId].status });
};
