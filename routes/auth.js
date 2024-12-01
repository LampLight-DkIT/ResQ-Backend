const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { connectToDatabase } = require("../db/mongo");
require("dotenv").config();

const router = express.Router();

// Login endpoint
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection("users"); // Replace with your collection name

        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
