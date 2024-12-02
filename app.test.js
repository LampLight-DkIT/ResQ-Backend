const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("./app");
const { connectToDatabase, closeDatabase } = require("./db/mongo");

describe("API Endpoints", () => {
    let db; // Shared database instance
    let token; // To store the JWT token
    let sessionCookie; // To store the session cookie

    beforeAll(async () => {
        db = await connectToDatabase(); // Reuse the database connection
        const usersCollection = db.collection("users");

        // Insert a test user
        await usersCollection.insertOne({
            username: "testuser",
            password: await bcrypt.hash("testpassword", 10), // Hash the password
        });
    });

    afterAll(async () => {
        const usersCollection = db.collection("users");

        // Remove the test user
        await usersCollection.deleteOne({ username: "testuser" });

        // Close the shared database connection
        await closeDatabase();
    });

    it("POST /auth/login - Successful Login", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
                username: "testuser",
                password: "testpassword",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body).toHaveProperty("user");

        token = res.body.token; // Store the JWT token
        sessionCookie = res.headers["set-cookie"]; // Store the session cookie
    });

    it("GET /dashboard - Access with valid JWT token", async () => {
        const res = await request(app)
            .get("/dashboard")
            .set("Authorization", `Bearer ${token}`); // Use the stored JWT token

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toContain("Welcome");
    });

    it("GET /profile - Access with valid session", async () => {
        const res = await request(app)
            .get("/profile")
            .set("Cookie", sessionCookie); // Use the stored session cookie

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toContain("Welcome back");
    });
});
