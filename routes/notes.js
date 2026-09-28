
const express = require("express");
const mongoose = require("mongoose");
const Note = require("../models/Note");

const router = express.Router();

// ===============================
// MIDDLEWARE - REQUIRE LOGIN
// ===============================

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Not logged in",
    });
  }

  next();
}

// ===============================
// GET ALL NOTES FOR LOGGED-IN USER
// ===============================

router.get("/", requireLogin, async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.session.userId,
    }).sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    console.error("Fetch notes error:", error);

    res.status(500).json({
      message: "Failed to fetch notes",
    });
  }
});

// ===============================
// CREATE NOTE
// ===============================

router.post("/", requireLogin, async (req, res) => {
  try {
    const { heading, content } = req.body;

    if (!heading || !content) {
      return res.status(400).json({
        message: "Heading and content are required",
      });
    }

    const newNote = new Note({
      heading,
      content,
      userId: req.session.userId,
    });

    await newNote.save();

    res.status(201).json({
      newNote,
    });
  } catch (error) {
    console.error("Create note error:", error);

    res.status(500).json({
      message: "Failed to create note",
    });
  }
});

// ===============================
// UPDATE NOTE
// ===============================

router.put("/:id", requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, content } = req.body;

    // Check whether ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    if (!heading || !content) {
      return res.status(400).json({
        message: "Heading and content are required",
      });
    }

    const updatedNote = await Note.findOneAndUpdate(
      {
        _id: id,
        userId: req.session.userId,
      },
      {
        heading,
        content,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedNote) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json({
      updatedNote,
    });
  } catch (error) {
    console.error("Update note error:", error);

    res.status(500).json({
      message: "Failed to update note",
    });
  }
});

// ===============================
// DELETE NOTE
// ===============================

router.delete("/:id", requireLogin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    const deletedNote = await Note.findOneAndDelete({
      _id: id,
      userId: req.session.userId,
    });

    if (!deletedNote) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    res.status(500).json({
      message: "Failed to delete note",
    });
  }
});

module.exports = router;

