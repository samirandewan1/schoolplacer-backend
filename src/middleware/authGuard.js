import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const isAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ status: "failure", message: "authentication header missing" });

  jwt.verify(token, config.SECRET.jwt_key, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ status: "failure", message: "token expired" });
      } else {
         return res.status(401).json({ status: "failure", message: "invalid token" });
      }
    }
    if (!decoded.role || decoded.role !== "admin")
      return res.status(403).json({ status: "failure", message: "not an admin user" });
    next();
  });
};
