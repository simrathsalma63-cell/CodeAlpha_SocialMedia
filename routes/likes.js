const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/:postId", auth, async (req, res) => {
  try {
    const [existing] = await db.query(
      "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
      [req.user.id, req.params.postId]
    );

    if (existing.length) {
      await db.query("DELETE FROM likes WHERE user_id = ? AND post_id = ?", [
        req.user.id, req.params.postId
      ]);
      return res.json({ liked: false, message: "Post unliked" });
    }

    await db.query(
      "INSERT INTO likes (user_id, post_id) VALUES (?, ?)",
      [req.user.id, req.params.postId]
    );

    res.json({ liked: true, message: "Post liked" });
  } catch (error) {
    res.status(500).json({ message: "Could not update like" });
  }
});

module.exports = router;