const { User } = require("../models/User");
const { sendMail } = require("../utils/mailer");

async function getProfile(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

async function updateProfile(req, res) {
  const { username, email, password } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!user) return res.status(404).json({ message: "User not found" });

  if (email && email !== user.email) {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already in use" });
    user.email = email;
  }
  if (username) user.username = username;
  if (password) user.password = password;

  await user.save();

  // Optional email notification
  sendMail({
    to: user.email,
    subject: "Profile updated",
    text: `Hi ${user.username}, your profile was updated successfully.`,
    html: `<p>Hi <b>${user.username}</b>,</p><p>Your profile was updated successfully.</p>`,
  }).catch(() => {});

  const fresh = await User.findById(req.user._id).select("-password");
  return res.json({ user: fresh.toSafeJSON() });
}

// Admin / moderator utilities (Advanced Feature: RBAC)
async function listUsers(req, res) {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return res.json({ users: users.map((u) => u.toSafeJSON()) });
}

async function setUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findById(id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = role;
  await user.save();

  return res.json({ user: user.toSafeJSON() });
}

module.exports = { getProfile, updateProfile, listUsers, setUserRole };
