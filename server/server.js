// --------------------------  server/server.js  --------------------------
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const connectDB    = require("./Config/db");
const http         = require("http");
const { Server }   = require("socket.io");

const app = express();

/* ─── 1.  CORS (exact origin + credentials) ─── */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

/* ─── 2.  Essential middleware ─── */
app.use(cookieParser());
app.use(express.json());

/* ─── 3.  Database connection ─── */
connectDB();

/* ─── 4.  Routes ─── */
app.use("/api/spots",        require("./Routes/spot"));
app.use("/api/reservations", require("./Routes/reservation"));
app.use("/auth",             require("./Routes/auth"));
app.use("/api/pay", require("./Routes/pay"));

/* ─── 5.  Socket.IO setup ─── */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});
app.set("io", io);                //  ← expose instance for controllers / cron

io.on("connection", (sock) =>
  console.log("Socket connected:", sock.id)
);

app.get("/", (_req, res) => res.send("Park Smart APIiii"));

/* ─── 6.  Background job (auto-expiry) ─── */
require("./cron/expireReservations")(app);   // pass app so job can `app.get("io")`

/* ─── 7.  Start server ─── */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("MONGO_URI:", process.env.MONGO_URI);
});
