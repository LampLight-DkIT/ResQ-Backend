const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const profileRoutes = require("./routes/profile");

const { connectToDatabase } = require("./db/mongo");
const { insertEncryptedData } = require("./db/mongoOperations");
const { encryptData, decryptData } = require("./utils/encryption");
const { uploadFile, downloadFile, uploadAllFilesInDirectory } = require("./utils/awsS3");
const { authenticateToken, authenticateSession } = require("./middlewares/authMiddleware");

const app = express();
const server = http.createServer(app); // HTTP server
const wss = new WebSocket.Server({ server }); // WebSocket server attached to HTTP

app.use(bodyParser.json());
app.use(express.json());

// Session Middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true when using HTTPS
    })
);

// Routes for authentication, dashboard, and profile
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/profile", profileRoutes);

// Additional variables for MongoDB and file operations
const demoFilePath = "./json/locations.json";
const demoDirectory = "./uploads";
const collectionName = "location";

// MongoDB Demo
app.get("/mongo", async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(collectionName);

        // Insert Encrypted Data
        await insertEncryptedData(demoFilePath, collectionName);

        // Retrieve and Decrypt Data
        const encryptedDocuments = await collection.find({}).toArray();
        const decryptedDocuments = encryptedDocuments.map(doc =>
            JSON.parse(decryptData(doc.encryptedData, doc.iv))
        );

        res.status(200).json({ message: "MongoDB demo complete", data: decryptedDocuments });
    } catch (error) {
        console.error("MongoDB demo error:", error);
        res.status(500).json({ message: "MongoDB demo failed", error });
    }
});

// Encryption Demo
app.get("/encryption", (req, res) => {
    try {
        const testData = { message: "This is a test" };
        const encrypted = encryptData(JSON.stringify(testData));
        const decrypted = JSON.parse(decryptData(encrypted.encryptedData, encrypted.iv));

        res.status(200).json({ encrypted, decrypted });
    } catch (error) {
        console.error("Encryption demo error:", error);
        res.status(500).json({ message: "Encryption demo failed", error });
    }
});

// Single File Upload Route
app.post("/s3/upload/single", async (req, res) => {
    try {
        await uploadFile("./uploads/text.txt", "text.txt"); // Update with your file path and name
        res.status(200).json({ message: "File uploaded successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error uploading file.", error });
    }
});

// Directory Upload Route
app.post("/s3/upload/all", async (req, res) => {
    try {
        await uploadAllFilesInDirectory("./uploads");
        res.status(200).json({ message: "All files uploaded successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error uploading files.", error });
    }
});

// AWS S3 File Download Demo
app.get("/s3/download", async (req, res) => {
    try {
        await downloadFile();
        res.status(200).json({ message: "S3 file download demo complete" });
    } catch (error) {
        console.error("S3 download error:", error);
        res.status(500).json({ message: "S3 download demo failed", error });
    }
});

// In-memory storage for user locations
const userLocations = {};
// WebSocket: Handle connections
wss.on("connection", (ws) => {
    console.log("New WebSocket client connected");

    // Handle incoming messages
    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            // Update user location
            if (data.type === "updateLocation" && data.userId && data.location) {
                userLocations[data.userId] = data.location;
                console.log(`Updated location for user ${data.userId}:`, data.location);

                const db = await connectToDatabase();
                const locationHistoryCollection = db.collection("location_history");

                const locationUpdate = {
                    userId: data.userId,
                    location: data.location,
                    timestamp: new Date(), // Add a timestamp
                };

                await locationHistoryCollection.insertOne(locationUpdate); // Insert into MongoDB
                // console.log(`Saved location for user ${data.userId}:`, locationUpdate);

                // Broadcast updated location to all clients
                broadcast({
                    type: "locationUpdate",
                    userId: data.userId,
                    location: data.location,
                });
            }
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
        }
    });

    // Handle client disconnection
    ws.on("close", () => {
        console.log("WebSocket client disconnected");
    });

    // Send an initial welcome message
    ws.send(JSON.stringify({ message: "Welcome to the Real-Time Location WebSocket Server!" }));
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

app.get("/location/history/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const db = await connectToDatabase();
        const locationHistoryCollection = db.collection("location_history");

        // Query the location history for the given userId
        const history = await locationHistoryCollection
            .find({ userId })
            .sort({ timestamp: 1 })
            .toArray();

        res.status(200).json({ userId, history });
    } catch (error) {
        console.error("Error fetching location history:", error);
        res.status(500).json({ message: "Failed to retrieve location history" });
    }
});

app.get("/location/history", async (req, res) => {
    try {
        const db = await connectToDatabase();
        const locationHistoryCollection = db.collection("location_history");

        // Query all location history
        const allHistory = await locationHistoryCollection
            .find({})
            .sort({ timestamp: 1 })
            .toArray();

        res.status(200).json({ allHistory });
    } catch (error) {
        console.error("Error fetching all location history:", error);
        res.status(500).json({ message: "Failed to retrieve all location history" });
    }
});

// Apply token authentication middleware to protected routes
app.get('/protected-route', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});
  
  // Apply session authentication middleware to session-protected routes
app.get('/session-protected-route', authenticateSession, (req, res) => {
    res.json({ message: 'This is a session-protected route' });
});



// Export app for testing
module.exports = app;

// Start the server only when not in test mode
if (process.env.NODE_ENV !== "test") {
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`)
        console.log("WebSocket server running");
    }
    );
}