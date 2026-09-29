// backend/routes/auth.js

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// ===============================
// ROOT
// ===============================

router.get("/", (req, res) => {
  res.redirect("/login");
});

// ===============================
// RENDER LOGIN PAGE
// ===============================

router.get("/login", (req, res) => {
  res.render("login", {
    message: null,
  });
});

// ===============================
// RENDER REGISTER PAGE
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

    // Basic validation
    if (!username || !password) {
      return res.render("register", {
        message: "Username and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.render("login", {
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    // Store only user ID in session
    req.session.userId = newUser._id.toString();

    // Show success page
    res.render("success", {
      username: newUser.username,
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

    // Basic validation
    if (!username || !password) {
      return res.render("login", {
        message: "Username and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.render("login", {
        message: "User not found",
      });
    }

    // Compare password with hashed password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render("login", {
        message: "Incorrect password",
      });
    }

    // Store only user ID in session
    req.session.userId = user._id.toString();

    // Show success page
    res.render("success", {
      username: user.username,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).render("login", {
      message: "Something went wrong during login",
    });
  }
});

// ===============================
// SUCCESS PAGE
// ===============================

router.get("/success", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy(() => {
        res.redirect("/login");
      });
      return;
    }

    res.render("success", {
      username: user.username,
    });
  } catch (error) {
    console.error("Success page error:", error);
    res.redirect("/login");
  }
});

// ===============================
// REDIRECT
// ===============================

router.get("/redirect", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.redirect("https://createnotesadi.netlify.app");
});

// ===============================
// LOGOUT
// ===============================

router.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).send("Logout failed");
    }

    res.clearCookie("connect.sid");

    res.redirect("/login");
  });
});

// ===============================
// CHECK LOGIN STATUS
// ===============================

router.get("/check", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({
        loggedIn: false,
      });
    }

    const user = await User.findById(req.session.userId).select("username");
    if (!user) {
      return res.json({ loggedIn: false });
    }
    res.json({ loggedIn: true, username: user.username });
  } catch (error) {
    console.error("Session check error:", error);
    res.status(500).json({ loggedIn: false, error: "Failed to check session" });
  }
});
module.exports = router;
