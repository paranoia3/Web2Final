const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { authRequired } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createGameSchema, submitGuessSchema } = require("../validation/schemas");
const {
    createGame,
    listGames,
    getGame,
    submitGuess,
    deleteGame
} = require("../controllers/gameController");

const router = express.Router();

router.post("/", authRequired, asyncHandler(createGame));
router.get("/", authRequired, asyncHandler(listGames));
router.get("/:id", authRequired, asyncHandler(getGame));

router.put("/:id", authRequired, asyncHandler(submitGuess));

router.delete("/:id", authRequired, asyncHandler(deleteGame));

module.exports = router;