import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const isAuth = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token      = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ status: "failure", message: "Authentication header missing" });
    }

    jwt.verify(token, config.SECRET.jwt_key, (err, decoded) => {
      if (err) {
        const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
        return res.status(401).json({ status: "failure", message });
      }

      if (!decoded?.role || decoded.role !== "admin") {
        return res.status(403).json({ status: "failure", message: "Insufficient permissions" });
      }

      req.role      = decoded.role;
      req.initiator = decoded.initiator;
      next();
    });
  } catch (error) {
    console.error(`[isAuth] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};
