const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { signToken } = require("../utils/jwt");

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) return res.status(400).json({ message: "User already exists" });

        const newUser = new User({ username, email, password });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const token = signToken({ id: user._id, role: user.role || 'user' });

        res.json({
            message: "Success",
            token: token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;