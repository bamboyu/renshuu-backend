const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY || "09052005";

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token found" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });

    req.user = decoded; // attach user data (_id/email)
    next();
  });
}

module.exports = authMiddleware;
