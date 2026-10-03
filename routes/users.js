const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/:username", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.email, u.bio, u.created_at,
        (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM followers f WHERE f.following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM followers f WHERE f.follower_id = u.id) AS following_count
       FROM users u WHERE u.username = ?`,
      [req.params.username]
    );

    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const profile = rows[0];

    if (req.user?.id) {
      const [follow] = await db.query(
        "SELECT id FROM followers WHERE follower_id = ? AND following_id = ?",
        [req.user.id, profile.id]
      );
      profile.is_following = follow.length > 0;
    } else {
      profile.is_following = false;
    }

    delete profile.email;
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Could not load profile" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const { bio, username } = req.body;

    if (username) {
      const [taken] = await db.query(
        "SELECT id FROM users WHERE username = ? AND id <> ?",
        [username.trim(), req.user.id]
      );
      if (taken.length) return res.status(409).json({ message: "Username already taken" });
    }

    await db.query(
      "UPDATE users SET username = COALESCE(NULLIF(?, ''), username), bio = COALESCE(?, bio) WHERE id = ?",
      [username?.trim() || "", bio ?? null, req.user.id]
    );

    const [rows] = await db.query(
      "SELECT id, username, email, bio, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Could not update profile" });
  }
});

router.get("/:username/posts", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.content, p.created_at, u.username,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE u.username = ? ORDER BY p.created_at DESC`,
      [req.params.username]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Could not load user posts" });
  }
});

module.exports = router;