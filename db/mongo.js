const { MongoClient } = require("mongodb");
require("dotenv").config();

let client; // Reuse client instance
let db; // Reuse database instance

const connectToDatabase = async () => {
    if (db) {
        return db; // Return existing connection if available
    }
    try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log("Connected to MongoDB");
        db = client.db("ResQ"); // Replace with your database name
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};

const closeDatabase = async () => {
    if (client) {
        await client.close();
        console.log("Disconnected from MongoDB");
    }
};

module.exports = { connectToDatabase, closeDatabase };
