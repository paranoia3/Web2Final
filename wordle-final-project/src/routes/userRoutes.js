const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const { updateProfileSchema, setRoleSchema } = require("../validation/schemas");
const { getProfile, updateProfile, listUsers, setUserRole } = require("../controllers/userController");

const router = express.Router();

// Private endpoints
router.get("/profile", authRequired, asyncHandler(getProfile));
router.put("/profile", authRequired, validate(updateProfileSchema), asyncHandler(updateProfile));

// Advanced Feature (RBAC): admin/moderator endpoints
router.get("/", authRequired, requireRole("admin", "moderator"), asyncHandler(listUsers));
router.put("/:id/role", authRequired, requireRole("admin"), validate(setRoleSchema), asyncHandler(setUserRole));

module.exports = router;
