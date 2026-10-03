const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/post/:postId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.post_id, c.content, c.created_at, c.user_id, u.username
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      [req.params.postId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Could not load comments" });
  }
});

router.post("/post/:postId", auth, async (req, res) => {
  try {
    const content = req.body.content?.trim();
    if (!content) return res.status(400).json({ message: "Comment cannot be empty" });

    const [result] = await db.query(
      "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [req.params.postId, req.user.id, content]
    );

    res.status(201).json({ id: result.insertId, message: "Comment added" });
  } catch (error) {
    res.status(500).json({ message: "Could not add comment" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM comments WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Comment not found or not yours" });

    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete comment" });
  }
});

module.exports = router;