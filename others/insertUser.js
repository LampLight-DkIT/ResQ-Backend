const bcrypt = require("bcryptjs");
const { connectToDatabase, disconnectDatabase } = require("../db/mongo");

(async () => {
    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        // Hash the password
        const hashedPassword = await bcrypt.hash("password123", 10);

        // Insert a user
        await usersCollection.insertOne({
            username: "testuser",
            password: hashedPassword,
        });

        console.log("User inserted successfully");
    } catch (error) {
        console.error("Error inserting user:", error);
    } finally {
        await disconnectDatabase();
    }
})();
