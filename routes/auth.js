const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ===============================
// CREATE JWT
// ===============================

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
}

// ===============================
// ROOT
// ===============================

router.get("/", (req, res) => {
  res.redirect("/login");
});

// ===============================
// LOGIN PAGE
// ===============================

router.get("/login", (req, res) => {
  res.render("login", {
    message: null,
  });
});

// ===============================
// REGISTER PAGE
// ===============================

router.get("/register", (req, res) => {
  res.render("register", {
    message: null,
  });
});

// ===============================
// REGISTER
// ===============================

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render("register", {
        message: "Username and password are required",
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.render("register", {
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    const token = createToken(newUser);

    // Send token to frontend
    res.render("success", {
      username: newUser.username,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).render("register", {
      message: "Something went wrong during registration",
    });
  }
});

// ===============================
// LOGIN
// ===============================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render("login", {
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.render("login", {
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render("login", {
        message: "Incorrect password",
      });
    }

    const token = createToken(user);

    res.render("success", {
      username: user.username,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).render("login", {
      message: "Something went wrong during login",
    });
  }
});

// ===============================
// CHECK LOGIN
// ===============================

router.get("/check", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({
        loggedIn: false,
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("username");

    if (!user) {
      return res.json({
        loggedIn: false,
      });
    }

    res.json({
      loggedIn: true,
      username: user.username,
    });
  } catch (error) {
    console.error("JWT check error:", error);

    res.json({
      loggedIn: false,
    });
  }
});

// ===============================
// LOGOUT
// ===============================

router.get("/logout", (req, res) => {
  // JWT is stored on the frontend,
  // so the frontend will remove it.

  res.redirect("/login");
});

module.exports = router;

