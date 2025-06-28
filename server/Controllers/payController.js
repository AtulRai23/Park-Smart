
const Razorpay   = require("razorpay");
const crypto     = require("crypto");
const Reservation = require("../Models/Reservation");
const Spot        = require("../Models/Spot");  


const razor = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


exports.createOrder = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const r = await Reservation.findById(reservationId).populate("spotId");

    
    if (!r)              return res.status(404).json({ msg: "Reservation not found" });
    if (r.userId.toString() !== req.user.id)
      return res.status(403).json({ msg: "Not your reservation" });
    if (r.status !== "active")
      return res.status(400).json({ msg: "Reservation is not active" });

    const amount  = (r.pricePerHour ?? r.spotId.pricePerHour) * 100; 
    const order   = await razor.orders.create({
      amount,
      currency: "INR",
      receipt: reservationId,       
    });

    return res.json({
      orderId : order.id,
      razorKey: process.env.RAZORPAY_KEY_ID, 
      amount,
      name    : r.spotId?.name || "Parking spot",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Unable to create order" });
  }
};


exports.webhook = async (req, res) => {
  
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
      
      const orderId       = ev.payload.payment.entity.order_id;
      const razorOrder    = await razor.orders.fetch(orderId);
      const reservationId = razorOrder.receipt;

      
      const r = await Reservation.findByIdAndUpdate(
        reservationId,
        { $set: { paid: true } },
        { new: true }
      );

      
      const io = req.app.get("io");
      if (io && r) {
        const spot = await Spot.findById(r.spotId);
        io.emit("spotUpdated", spot);
        io.emit("history-refresh");          
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
    }
  }

  res.json({ status: "ok" });
};
