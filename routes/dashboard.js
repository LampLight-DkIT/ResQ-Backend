const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protected Route (Token Authentication)
router.get("/", authenticateToken, (req, res) => {
    res.status(200).json({ message: `Welcome, ${req.user.username}` });
});

module.exports = router;
