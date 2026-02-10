const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string().min(2).max(32).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
});

const updateProfileSchema = Joi.object({
  username: Joi.string().min(2).max(32).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(8).max(72).optional(),
}).min(1);

const createGameSchema = Joi.object({
  mode: Joi.string().valid("random", "daily").default("random"),
});

const submitGuessSchema = Joi.object({
  guess: Joi.string().length(5).pattern(/^[a-zA-Z]{5}$/).required(),
});

const setRoleSchema = Joi.object({
  role: Joi.string().valid("admin", "moderator", "premium", "user").required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createGameSchema,
  submitGuessSchema,
  setRoleSchema,
};
