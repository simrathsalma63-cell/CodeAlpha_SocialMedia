const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, bio = "" } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing.length) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password_hash, bio) VALUES (?, ?, ?, ?)",
      [username.trim(), email.trim().toLowerCase(), passwordHash, bio.trim()]
    );

    const user = {
      id: result.insertId,
      username: username.trim()
    };

    res.status(201).json({
      message: "Registration successful",
      token: makeToken(user),
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT id, username, email, password_hash, bio FROM users WHERE email = ?",
      [email?.trim().toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    delete user.password_hash;

    res.json({
      message: "Login successful",
      token: makeToken(user),
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, bio, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Could not load user" });
  }
});

module.exports = router;