const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("../db/mongo");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Login Endpoint
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
        req.session.user = { id: user._id, username: user.username };
        res.status(200).json({ message: "Login successful", token, user: { id: user._id, username: user.username } });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Logout Endpoint
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out" });
        }
        res.status(200).json({ message: "Logout successful" });
    });
});

module.exports = router;
