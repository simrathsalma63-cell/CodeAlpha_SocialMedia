const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id || 0;

    const [posts] = await db.query(
      `SELECT p.id, p.user_id, p.content, p.created_at,
        u.username,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS liked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load posts" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const content = req.body.content?.trim();

    if (!content) return res.status(400).json({ message: "Post cannot be empty" });
    if (content.length > 1000) return res.status(400).json({ message: "Post is too long" });

    const [result] = await db.query(
      "INSERT INTO posts (user_id, content) VALUES (?, ?)",
      [req.user.id, content]
    );

    res.status(201).json({
      id: result.insertId,
      message: "Post created"
    });
  } catch (error) {
    res.status(500).json({ message: "Could not create post" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const content = req.body.content?.trim();

    if (!content) return res.status(400).json({ message: "Post cannot be empty" });

    const [result] = await db.query(
      "UPDATE posts SET content = ? WHERE id = ? AND user_id = ?",
      [content, req.params.id, req.user.id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Post not found or not yours" });

    res.json({ message: "Post updated" });
  } catch (error) {
    res.status(500).json({ message: "Could not update post" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM posts WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Post not found or not yours" });

    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete post" });
  }
});

module.exports = router;