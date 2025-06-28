
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const connectDB    = require("./Config/db");
const http         = require("http");
const { Server }   = require("socket.io");

const app = express();


app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);


app.use(cookieParser());
app.use(express.json());


connectDB();


app.use("/api/spots",        require("./Routes/spot"));
app.use("/api/reservations", require("./Routes/reservation"));
app.use("/auth",             require("./Routes/auth"));
app.use("/api/pay", require("./Routes/pay"));


const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});
app.set("io", io);                

io.on("connection", (sock) =>
  console.log("Socket connected:", sock.id)
);

app.get("/", (_req, res) => res.send("Park Smart APIiii"));


require("./cron/expireReservations")(app);   


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("MONGO_URI:", process.env.MONGO_URI);
});
