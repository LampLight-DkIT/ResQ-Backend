const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        return client.db("ResQ"); 
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

async function disconnectDatabase() {
    await client.close();
    console.log("Disconnected from MongoDB");
}

module.exports = {
    connectToDatabase,
    disconnectDatabase,
};
