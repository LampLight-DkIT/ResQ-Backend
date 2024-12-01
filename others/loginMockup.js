// Import dependencies
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const app = express();
app.use(bodyParser.json());

// Generate a hashed password (for testing purposes)
async function generateHashedPassword() {
    const plainPassword = "password123"; // Password to hash
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log("Generated Hashed Password:", hashedPassword);
    return hashedPassword;
}

// Mock user database (hashed password will be added dynamically)
const users = [
    {
        id: 1,
        username: "testuser",
        password: "", // This will be updated with the hashed password
    },
];

// Generate the hash for the mock database on server startup
(async () => {
    users[0].password = await generateHashedPassword(); // Set hashed password
})();

// Utility function to find user by username
const findUserByUsername = (username) =>
    users.find((user) => user.username === username);

// Login endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    console.log("Received Username:", username);
    console.log("Received Password:", password);

    // Find the user in the mock database
    const user = findUserByUsername(username);
    if (!user) {
        console.log("User not found");
        return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare the user input password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("Stored Hashed Password:", user.password);
    console.log("Password Match Result:", passwordMatch);

    if (!passwordMatch) {
        console.log("Password mismatch!");
        return res.status(401).json({ message: "Invalid username or password" });
    }

    // Login successful
    res.status(200).json({
        message: "Login successful",
        user: { id: user.id, username: user.username },
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
