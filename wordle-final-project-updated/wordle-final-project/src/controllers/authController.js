const { User } = require("../models/User");
const { signToken } = require("../utils/jwt");
const { sendMail } = require("../utils/mailer");

async function register(req, res) {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already registered" });

  const user = await User.create({ username, email, password });

  // Optional email notification
  sendMail({
    to: user.email,
    subject: "Welcome to Wordle!",
    text: `Hi ${user.username}, welcome to Wordle! Your account is ready.`,
    html: `<p>Hi <b>${user.username}</b>,</p><p>Welcome to Wordle! Your account is ready.</p>`,
  }).catch(() => {});

  const token = signToken({ sub: user._id, role: user.role });
  return res.status(201).json({ token, user: user.toSafeJSON() });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(401).json({ message: "Invalid email or password" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: "Invalid email or password" });

  const token = signToken({ sub: user._id, role: user.role });
  // return safe user info
  const safe = await User.findById(user._id).select("-password");
  return res.json({ token, user: safe.toSafeJSON() });
}

module.exports = { register, login };
