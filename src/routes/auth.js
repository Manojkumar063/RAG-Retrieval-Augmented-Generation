import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, findUserByUsername } from "../services/db.js";
import { config } from "../config/env.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields are required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    if (findUserByEmail(email)) return res.status(409).json({ error: "Email already registered" });
    if (findUserByUsername(username)) return res.status(409).json({ error: "Username already taken" });
    createUser(username, email, await bcrypt.hash(password, 10));
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const user = findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      config.jwtSecret,
      { expiresIn: "7d" }
    );
    res.json({ token, username: user.username });
  } catch (err) {
    next(err);
  }
});

export default router;
