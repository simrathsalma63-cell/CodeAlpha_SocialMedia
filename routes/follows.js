const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/:username", auth, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username FROM users WHERE username = ?",
      [req.params.username]
    );

    if (!users.length) return res.status(404).json({ message: "User not found" });

    const target = users[0];

    if (target.id === req.user.id) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const [existing] = await db.query(
      "SELECT id FROM followers WHERE follower_id = ? AND following_id = ?",
      [req.user.id, target.id]
    );

    if (existing.length) {
      await db.query(
        "DELETE FROM followers WHERE follower_id = ? AND following_id = ?",
        [req.user.id, target.id]
      );
      return res.json({ following: false, message: `Unfollowed ${target.username}` });
    }

    await db.query(
      "INSERT INTO followers (follower_id, following_id) VALUES (?, ?)",
      [req.user.id, target.id]
    );

    res.json({ following: true, message: `Following ${target.username}` });
  } catch (error) {
    res.status(500).json({ message: "Could not update follow status" });
  }
});

router.get("/:username/followers", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.bio
       FROM followers f JOIN users u ON f.follower_id = u.id
       JOIN users target ON f.following_id = target.id
       WHERE target.username = ?`,
      [req.params.username]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Could not load followers" });
  }
});

router.get("/:username/following", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.bio
       FROM followers f JOIN users u ON f.following_id = u.id
       JOIN users target ON f.follower_id = target.id
       WHERE target.username = ?`,
      [req.params.username]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Could not load following" });
  }
});

module.exports = router;