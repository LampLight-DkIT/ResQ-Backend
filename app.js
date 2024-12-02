const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const profileRoutes = require("./routes/profile");

const { connectToDatabase } = require("./db/mongo");
const { insertEncryptedData } = require("./db/mongoOperations");
const { encryptData, decryptData } = require("./utils/encryption");
const { uploadFile, downloadFile, uploadAllFilesInDirectory } = require("./utils/awsS3");

const fs = require("fs");

const app = express();
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

// Export app for testing
module.exports = app;

// Start the server only when not in test mode
if (process.env.NODE_ENV !== "test") {
    const PORT = 3000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}