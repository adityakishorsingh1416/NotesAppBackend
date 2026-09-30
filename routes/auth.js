
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

    // Validate input
    if (!username || !password) {
      return res.render("register", {
        message: "Username and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.render("register", {
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

    // Store user ID in session
    req.session.userId = newUser._id.toString();

    // Explicitly save session
    req.session.save((error) => {
      if (error) {
        console.error("Session save error:", error);

        return res.status(500).render("register", {
          message: "Registration failed",
        });
      }

      // Session successfully saved
      res.render("success", {
        username: newUser.username,
      });
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

    // Validate input
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

    // Compare password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render("login", {
        message: "Incorrect password",
      });
    }

    // Store user ID in session
    req.session.userId = user._id.toString();

    // Explicitly save session
    req.session.save((error) => {
      if (error) {
        console.error("Session save error:", error);

        return res.status(500).render("login", {
          message: "Login failed",
        });
      }

      // Session successfully saved
      res.render("success", {
        username: user.username,
      });
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
    // Check session
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    // Find user
    const user = await User.findById(req.session.userId);

    if (!user) {
      return req.session.destroy(() => {
        res.redirect("/login");
      });
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
// REDIRECT TO REACT APP
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

    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.redirect("/login");
  });
});

// ===============================
// CHECK LOGIN STATUS
// ===============================

router.get("/check", async (req, res) => {
  try {
    // No session
    if (!req.session.userId) {
      return res.json({
        loggedIn: false,
      });
    }

    // Find logged-in user
    const user = await User.findById(req.session.userId).select("username");

    if (!user) {
      return res.json({
        loggedIn: false,
      });
    }

    // User is logged in
    res.json({
      loggedIn: true,
      username: user.username,
    });
  } catch (error) {
    console.error("Session check error:", error);

    res.status(500).json({
      loggedIn: false,
      error: "Failed to check session",
    });
  }
});

module.exports = router;
