import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../config/mongo.js";
import config from "../config/env.js";

export const authAdmin = async (req, res) => {
  try {
    const loginname = req.body?.data?.form?.loginname?.trim();
    const password  = req.body?.data?.form?.password;

    if (!loginname || !password) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const db = getDb();
    const adminUsers = db.collection("admin_users");
    const adminUser  = await adminUsers.findOne({ loginname, status: "active" });

    if (!adminUser) {
      // Use a generic message to avoid username enumeration
      return res.status(401).json({ status: "failure", message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return res.status(401).json({ status: "failure", message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { initiator: adminUser._id, role: "admin" },
      config.SECRET.jwt_key,
      { expiresIn: "1d" }
    );

    return res.status(200).json({ status: "success", token });
  } catch (error) {
    console.error(`[authAdmin] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};
