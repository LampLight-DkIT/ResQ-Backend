const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Token Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized access" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }
        req.user = user;
        next();
    });
}

// Session Authentication Middleware
function authenticateSession(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized access" });
    }
    next();
}

module.exports = { authenticateToken, authenticateSession };
