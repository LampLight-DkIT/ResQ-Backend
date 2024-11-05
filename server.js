const { addOrUpdatePhrase, translatePhrase } = require('./phraseManager');

addOrUpdatePhrase("Can we have coffee tomorrow", "I need guard's help");
addOrUpdatePhrase("Let's watch a movie", "I need information");

const codedPhrases = [
    "can we have coffee tomorrow",
    "let's watch a movie",
    "how about a walk later"
];

codedPhrases.forEach(phrase => {
    const translatedMessage = translatePhrase(phrase);
    console.log(`Coded phrase: "${phrase}" => Translated message: "${translatedMessage}"`);
});

const { MongoClient } = require("mongodb");
const crypto = require("crypto");
const fs = require("fs");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Encryption settings
const algorithm = "aes-256-cbc";
const encryptionKey = crypto.randomBytes(32); // Securely generate this key and store it securely
const iv = crypto.randomBytes(16);

// Function to encrypt data
function encryptData(data) {
    const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
    let encrypted = cipher.update(data, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return { iv: iv.toString("hex"), encryptedData: encrypted };
}

// Function to decrypt data
function decryptData(encryptedData, iv) {
    const decipher = crypto.createDecipheriv(algorithm, encryptionKey, Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encryptedData, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
}

async function main() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("ResQ");
        const locationsCollection = db.collection("location");

        // Read and parse the JSON data from locations.json
        const data = JSON.parse(fs.readFileSync("locations.json", "utf-8"));

        // Encrypt each document in the data array
        const encryptedData = data.map(doc => {
            const encryptedDoc = encryptData(JSON.stringify(doc));
            return {
                encryptedData: encryptedDoc.encryptedData,
                iv: encryptedDoc.iv
            };
        });

        // Clear previous documents
        await locationsCollection.deleteMany({});

        // Insert encrypted documents into collection
        const result = await locationsCollection.insertMany(encryptedData);
        console.log(`${result.insertedCount} encrypted location documents inserted`);

        const specificDate = new Date("2023-11-03");
        const nextDay = new Date(specificDate);
        nextDay.setDate(specificDate.getDate() + 1);

        // Retrieve all encrypted documents
        const encryptedDocuments = await locationsCollection.find(
            {},
            {
                projection: { encryptedData: 1, iv: 1, _id: 0 }
            }
        ).toArray();

        // Decrypt each document and filter by the specified date range
        const filteredDocuments = encryptedDocuments
            .map(doc => {
                const decryptedDoc = decryptData(doc.encryptedData, doc.iv);
                return JSON.parse(decryptedDoc);
            })
            .filter(doc => doc.timestamp >= specificDate.getTime() && doc.timestamp < nextDay.getTime());

        if (filteredDocuments.length > 0) {
            console.log("Filtered Decrypted Documents:", filteredDocuments);
        } else {
            console.log("No documents found for the specified date range.");
        }

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    } finally {
        await client.close();
    }
}

// Run the main function
main().catch(console.error);
