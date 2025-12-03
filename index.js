import express from "express";
import pkg from "pg";
import operatorRegistrationRoute from "./operators/operator_registration.js";
import spotterRegistrationRoute from "./spotter/spotter_registration.js";
import operatorLoginRoute from "./operators/operatorLoginRoute.js";
import spotterLoginRoute from "./spotter/spotterLoginRoute.js";
const { Pool } = pkg;

const app = express();
const PORT = 3000;

// ---------------------------
// POSTGRES CONFIG MOVED HERE
// ---------------------------
const pool = new Pool({
  user: "postgres",          // 🔁 change as needed
  host: "localhost",
  database: "catstorage",  // 🔁 change
  password: "postgres", // 🔁 change
  port: 5432
});

// Middleware
app.use(express.json());

// Health
app.get("/", (req, res) => {
  res.send("Operator API Running");
});

//spotter
// Initialize spotter routes with pool
app.use("/api/spotter", spotterRegistrationRoute(pool));
// Login spotter routes with pool
app.use("/api/login/spotter", spotterLoginRoute(pool));

//operator
// Initialize operator routes with pool
app.use("/api/operators", operatorRegistrationRoute(pool));
// login operator routes with pool
app.use("/api/login/operator", operatorLoginRoute(pool));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
