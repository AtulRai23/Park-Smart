// ------------------  server/Controllers/payController.js  ------------------
const Razorpay   = require("razorpay");
const crypto     = require("crypto");
const Reservation = require("../Models/Reservation");
const Spot        = require("../Models/Spot");   // only to fetch price (optional)

/* Initialise once (uses sandbox keys if you copied the Test ones) */
const razor = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ------------------------------------------------------------------ */
/* POST /api/pay/order          { reservationId }  (auth required)    */
/* ------------------------------------------------------------------ */
exports.createOrder = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const r = await Reservation.findById(reservationId).populate("spotId");

    // basic guards
    if (!r)              return res.status(404).json({ msg: "Reservation not found" });
    if (r.userId.toString() !== req.user.id)
      return res.status(403).json({ msg: "Not your reservation" });
    if (r.status !== "active")
      return res.status(400).json({ msg: "Reservation is not active" });

    const amount  = (r.pricePerHour ?? r.spotId.pricePerHour) * 100; // ₹ → paise
    const order   = await razor.orders.create({
      amount,
      currency: "INR",
      receipt: reservationId,          // we’ll use this in the webhook
    });

    return res.json({
      orderId : order.id,
      razorKey: process.env.RAZORPAY_KEY_ID, // send to frontend
      amount,
      name    : r.spotId?.name || "Parking spot",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Unable to create order" });
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/pay/webhook   (Razorpay server → your server, no auth)   */
/* ------------------------------------------------------------------ */
exports.webhook = async (req, res) => {
  /* Verify signature */
  const body = JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac("sha256", process.env.PAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSig !== req.headers["x-razorpay-signature"]) {
    console.warn("⚠️  Invalid webhook signature");
    return res.sendStatus(400);
  }

  const ev = req.body;

  if (ev.event === "payment.captured") {
    try {
      /* From payment → order → receipt (reservation id) */
      const orderId       = ev.payload.payment.entity.order_id;
      const razorOrder    = await razor.orders.fetch(orderId);
      const reservationId = razorOrder.receipt;

      /* Mark reservation as paid */
      const r = await Reservation.findByIdAndUpdate(
        reservationId,
        { $set: { paid: true } },
        { new: true }
      );

      /* Broadcast so all clients update instantly */
      const io = req.app.get("io");
      if (io && r) {
        const spot = await Spot.findById(r.spotId);
        io.emit("spotUpdated", spot);
        io.emit("history-refresh");           // clients listening will reload
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
    }
  }

  res.json({ status: "ok" });
};
