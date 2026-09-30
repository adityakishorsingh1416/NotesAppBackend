
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS
app.use(
  cors({
    origin: "https://createnotesadi.netlify.app",
    credentials: true,
  })
);


// ===============================
// EJS
// ===============================

app.set("view engine", "ejs");

app.set(
  "views",
  path.join(__dirname, "views")
);

// ===============================
// ROUTES
// ===============================

app.use("/", authRoutes);

app.use("/api/notes", notesRoutes);

// ===============================
// MONGODB + SERVER
// ===============================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    process.exit(1);
  }
};

startServer();

