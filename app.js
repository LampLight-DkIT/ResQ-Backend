const express = require("express");
const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/fileManager");

const app = express();
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
// app.use("/files", fileRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
