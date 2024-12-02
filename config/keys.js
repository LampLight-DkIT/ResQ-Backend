require("dotenv").config();

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    MONGO_URI: process.env.MONGO_URI,
    DB_NAME: process.env.DB_NAME,
};
