const express = require("express");
const { authenticateSession } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protected Route (Session Authentication)
router.get("/", authenticateSession, (req, res) => {
    res.status(200).json({ message: `Welcome back, ${req.session.user.username}` });
});

module.exports = router;
