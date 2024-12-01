// Import dependencies
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const { connectToDatabase } = require("../db/mongo"); // Your mongo.js file
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Use session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true in production with HTTPS
    })
);

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Login Endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Connect to the database
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        // Find the user by username
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Compare the input password with the hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
            expiresIn: "1h",
        });

        // Store session details
        req.session.user = { id: user._id, username: user.username };

        // Return success response
        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, username: user.username },
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Token Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "Unauthorized access" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }
        req.user = user; // Attach user details to the request object
        next();
    });
}

// Session Authentication Middleware
function authenticateSession(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized access" });
    }
    next();
}

// Protected Route (Token Authentication)
app.get("/dashboard", authenticateToken, (req, res) => {
    res.status(200).json({ message: `Welcome, ${req.user.username}` });
});

// Protected Route (Session Authentication)
app.get("/profile", authenticateSession, (req, res) => {
    res.status(200).json({ message: `Welcome back, ${req.session.user.username}` });
});

// Logout Endpoint
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out" });
        }
        res.status(200).json({ message: "Logout successful" });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
