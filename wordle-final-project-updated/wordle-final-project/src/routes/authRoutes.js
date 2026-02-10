const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { register, login } = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validation/schemas");

const router = express.Router();

// Public endpoints
router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));

module.exports = router;
